"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import CharacterPanel from "@/components/GameScreen/Panels/CharacterPanel";
import ChatPanel from "@/components/GameScreen/Panels/ChatPanel";
import SettingPanel from "@/components/GameScreen/Panels/SettingPanel";
import StartModal from "@/components/GameScreen/Modals/StartModal";
import { Message, InventoryChange, QuestChange } from "@/types";
import { useGameContext } from "@/context/gameContext";
import { applyGuestInventoryChanges, applyGuestQuestChanges, applyGuestXpAndLevelUp } from "@/utils/guestCharacters";
import { getSettingTheme, themeToCssVars } from "@/utils/settingTheme";
import LevelUpModal from "@/components/GameScreen/Modals/LevelUpModal"
import GMAdminPanel from "@/components/GameScreen/Modals/GMAdminPanel"
import { Maximize2, Minimize2 } from "lucide-react"

export default function Play() {
    const [messages, setMessages] = useState<Message[]>([]);
    const { character, gameId, setGameId, setting, setSetting, setCharacter, setChronicle, setWorldFacts } = useGameContext();
    const [input, setInput] = useState<string>("");
    const [pendingLevelUp, setPendingLevelUp] = useState<{ xpGain: number; newLevel: number; stats: Record<string, number> } | null>(null);
    const [isAdminOpen, setIsAdminOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const bootstrapSignatureRef = useRef<string | null>(null);
    const searchParams = useSearchParams();
    const gameIdParam = searchParams.get("gameId");
    const characterIdParam = searchParams.get("characterId");
    const { data: session } = useSession();
    const params = useParams();
    const settingId = params.setting as string;

    // Keyboard shortcut: Ctrl+Shift+G toggles admin panel
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'G') {
                e.preventDefault();
                setIsAdminOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    useEffect(() => {
        if (gameIdParam) {
            setGameId(gameIdParam);
        }

        return () => {
            setGameId(null);
        };
    }, [gameIdParam, setGameId]);

    // Auto-select character when arriving from account page with characterId param
    useEffect(() => {
        if (!characterIdParam || character?._id === characterIdParam) return;
        let active = true;
        fetch(`/api/characters?characterId=${characterIdParam}`)
            .then((r) => r.json())
            .then((data) => { if (active && data?._id) setCharacter(data); })
            .catch(() => {});
        return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [characterIdParam]);

    useEffect(() => {
        if (!settingId) {
            return;
        }

        let isActive = true;

        const fetchSetting = async () => {
            try {
                const response = await fetch(`/api/settings?settingId=${settingId}`);
                const data = await response.json();
                if (!isActive) {
                    return;
                }
                setSetting(data);
            } catch (error) {
                console.error("Error fetching setting:", error);
            }
        };

        fetchSetting();

        return () => {
            isActive = false;
        };
    }, [settingId, setSetting]);

    // Reset chat whenever the active character changes (switch / new / delete)
    useEffect(() => {
        setMessages([]);
        setGameId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [character?._id]);

    useEffect(() => {
        if (!character || !setting) {
            bootstrapSignatureRef.current = null;
            return;
        }

        const resumeGameId = gameId ?? gameIdParam ?? null;
        const signature = `${character._id}-${setting._id}-${resumeGameId ?? "bootstrap"}`;

        if (bootstrapSignatureRef.current === signature) {
            return;
        }

        bootstrapSignatureRef.current = signature;
        let isMounted = true;

        const connectToGame = async () => {
            try {
                const response = await fetch("/api/game", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        character,
                        setting,
                        gameId: resumeGameId,
                    }),
                });
                const gameData = await response.json();
                if (!isMounted) {
                    return;
                }

                if (gameData.gameId) {
                    setGameId(gameData.gameId);
                }

                if (Array.isArray(gameData.messages) && gameData.messages.length) {
                    const lastStructured = gameData.lastStructuredResponse ?? null;
                    const formattedMessages = gameData.messages.map((msg: { role: string; content: string }, idx: number) => {
                        let text = msg.content;
                        if (msg.role === 'assistant') {
                            // Robustly extract narrative from stored JSON, even if malformed
                            // (literal newlines, unescaped quotes, etc.)
                            const tryExtractNarrative = (raw: string): string | null => {
                                if (!raw.trim().startsWith('{')) return null;
                                // 1. Direct parse
                                try { const p = JSON.parse(raw); if (p?.narrative) return p.narrative; } catch { /* */ }
                                // 2. Literal-newline sanitise then parse
                                try {
                                    let inStr = false; let fixed = '';
                                    for (let i = 0; i < raw.length; i++) {
                                        const c = raw[i];
                                        if (c === '\\' && inStr) { fixed += c + (raw[i + 1] ?? ''); i++; }
                                        else if (c === '"') { inStr = !inStr; fixed += c; }
                                        else if (inStr && c === '\n') { fixed += '\\n'; }
                                        else if (inStr && c === '\r') { fixed += '\\r'; }
                                        else { fixed += c; }
                                    }
                                    const p = JSON.parse(fixed); if (p?.narrative) return p.narrative;
                                } catch { /* */ }
                                // 3. Regex slice — handles unescaped " inside narrative value
                                try {
                                    const ki = raw.indexOf('"narrative"');
                                    if (ki !== -1) {
                                        const ci = raw.indexOf(':', ki);
                                        const oq = raw.indexOf('"', ci + 1);
                                        if (oq !== -1) {
                                            const ends = [
                                                '\", \"options\"', '\",\"options\"',
                                                '\", \"skill_options\"', '\",\"skill_options\"',
                                                '\", \"item_options\"', '\",\"item_options\"',
                                            ].map(m => raw.lastIndexOf(m)).filter(i => i > oq);
                                            let eq = ends.length ? Math.min(...ends) : raw.lastIndexOf('"}');
                                            if (eq > oq) { const n = raw.slice(oq + 1, eq); if (n.length > 5) return n; }
                                        }
                                    }
                                } catch { /* */ }
                                return null;
                            };
                            const extracted = tryExtractNarrative(text);
                            if (extracted) text = extracted;
                        }
                        const isLastAssistant = msg.role === 'assistant' &&
                            idx === [...gameData.messages].map((m: { role: string }, i: number) => ({ m, i })).filter(({ m }) => m.role === 'assistant').at(-1)?.i;
                        const base = { text, sender: msg.role === 'user' ? 'You' : 'Gamemaster' } as Message;
                        if (isLastAssistant && lastStructured) {
                            return {
                                ...base,
                                options: lastStructured.options,
                                skill_options: lastStructured.skill_options,
                                item_options: lastStructured.item_options,
                            };
                        }
                        return base;
                    });
                    setMessages(formattedMessages);
                } else if (!resumeGameId) {
                    setMessages([]);
                }

                // Sync chronicle and world facts from bootstrap response
                if (Array.isArray(gameData.chronicleEntries)) setChronicle(gameData.chronicleEntries);
                if (Array.isArray(gameData.worldFacts)) setWorldFacts(gameData.worldFacts);

                const nextSignature = `${character._id}-${setting._id}-${gameData.gameId ?? resumeGameId ?? "bootstrap"}`;
                bootstrapSignatureRef.current = nextSignature;
            } catch (error) {
                console.error("Error connecting to game client:", error);
            }
        };

        connectToGame();

        return () => {
            isMounted = false;
        };
    }, [character, gameId, gameIdParam, setGameId, setting]);

    const handleSendMessage = (message: string, isOption: boolean = false, role?: string) => {
        if (!message.trim() || !character || !setting) {
            return;
        }

        const newMessage = { text: message.trim(), sender: "You" as const };

        if (role !== "system") {
            setMessages((prev) => [...prev, newMessage]);
        }
        if (!isOption) {
            setInput("");
        }
        inputRef.current?.focus();

        fetch("/api/game", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                setting,
                character,
                gameId,
                message: newMessage.text,
                role,
            }),
        })
            .then((response) => response.json())
            .then(async (gameData) => {
                let messageText: string =
                    gameData?.assistantMessage ||
                    gameData?.completion?.choices?.[0]?.message?.content ||
                    '';
                // Safety net: if the raw JSON blob was returned instead of the extracted narrative, parse it out.
                // Handles: (1) valid JSON, (2) literal unescaped newlines, (3) unescaped " inside strings.
                const parseMessageText = (text: string): string => {
                    if (!text.trim().startsWith('{')) return text;
                    // 1. Direct parse
                    try {
                        const parsed = JSON.parse(text);
                        if (parsed?.narrative) return parsed.narrative;
                    } catch { /* fall through */ }
                    // 2. Sanitise literal newlines/carriage-returns inside strings then retry
                    try {
                        let inStr = false;
                        let fixed = '';
                        for (let i = 0; i < text.length; i++) {
                            const c = text[i];
                            if (c === '\\' && inStr) { fixed += c + (text[i + 1] ?? ''); i++; }
                            else if (c === '"') { inStr = !inStr; fixed += c; }
                            else if (inStr && c === '\n') { fixed += '\\n'; }
                            else if (inStr && c === '\r') { fixed += '\\r'; }
                            else { fixed += c; }
                        }
                        const parsed = JSON.parse(fixed);
                        if (parsed?.narrative) return parsed.narrative;
                    } catch { /* fall through */ }
                    // 3. Last resort: regex slice — handles unescaped " inside the narrative value.
                    // Find content between the opening quote after "narrative": and the nearest
                    // top-level field boundary ("options", "skill_options", "item_options", or "}).
                    try {
                        const narrativeKeyIdx = text.indexOf('"narrative"');
                        if (narrativeKeyIdx !== -1) {
                            const colonIdx = text.indexOf(':', narrativeKeyIdx);
                            const openQuote = text.indexOf('"', colonIdx + 1);
                            if (openQuote !== -1) {
                                const endMarkers = [
                                    '", "options"', '","options"',
                                    '", "skill_options"', '","skill_options"',
                                    '", "item_options"', '","item_options"',
                                ]
                                    .map(m => text.lastIndexOf(m))
                                    .filter(i => i > openQuote);
                                let narrativeEnd = endMarkers.length ? Math.min(...endMarkers) : -1;
                                if (narrativeEnd === -1) {
                                    // Fallback: closing `"}`
                                    const closeQuote = text.lastIndexOf('"}');
                                    if (closeQuote > openQuote) narrativeEnd = closeQuote;
                                }
                                if (narrativeEnd > openQuote) {
                                    const extracted = text.slice(openQuote + 1, narrativeEnd);
                                    if (extracted.length > 5) return extracted;
                                }
                            }
                        }
                    } catch { /* give up */ }
                    return text;
                };
                messageText = parseMessageText(messageText);
                if (messageText) {
                    const changes: InventoryChange[] = gameData.inventoryChanges ?? [];
                    const structured = gameData.structuredResponse ?? null;
                    const gmMessage: Message = {
                        text: messageText,
                        sender: "Gamemaster",
                        inventoryChanges: changes.length > 0 ? changes : undefined,
                        options: structured?.options,
                        skill_options: structured?.skill_options,
                        item_options: structured?.item_options,
                    };
                    setMessages((prevMessages) => [...prevMessages, gmMessage]);

                    // Persist and sync inventory + currency changes
                    const currencyDelta: number = gameData.currencyDelta ?? 0;
                    const questChanges: QuestChange[] = gameData.questChanges ?? [];
                    if ((changes.length > 0 || currencyDelta !== 0) && character._id) {
                        try {
                            if (!session?.user?.id) {
                                // Guest: apply changes to localStorage
                                const updated = applyGuestInventoryChanges(character._id, changes, currencyDelta);
                                if (updated) {
                                    setCharacter((prev) => {
                                        if (!prev) return prev;
                                        return { ...prev, inventory: updated.inventory, currency: updated.currency };
                                    });
                                }
                            } else {
                                const res = await fetch("/api/characters/inventory", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ characterId: character._id, changes, currencyDelta }),
                                });
                                const data = await res.json();
                                setCharacter((prev) => {
                                    if (!prev) return prev;
                                    return {
                                        ...prev,
                                        ...(data.inventory ? { inventory: data.inventory } : {}),
                                        ...(typeof data.currency === 'number' ? { currency: data.currency } : {}),
                                    };
                                });
                            }
                        } catch (err) {
                            console.error("Error syncing inventory/currency:", err);
                        }
                    }

                    // Persist and sync quest changes
                    if (questChanges.length > 0 && character._id) {
                        try {
                            if (!session?.user?.id) {
                                const updated = applyGuestQuestChanges(character._id, questChanges);
                                if (updated) {
                                    setCharacter((prev) => prev ? { ...prev, quests: updated.quests } : prev);
                                }
                            } else {
                                const res = await fetch("/api/characters/quests", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ characterId: character._id, changes: questChanges }),
                                });
                                const data = await res.json();
                                if (data.quests) {
                                    setCharacter((prev) => prev ? { ...prev, quests: data.quests } : prev);
                                }
                            }
                        } catch (err) {
                            console.error("Error syncing quests:", err);
                        }
                    }

                    // Sync chronicle and world facts
                    if (Array.isArray(gameData.chronicleEntries)) setChronicle(gameData.chronicleEntries);
                    if (Array.isArray(gameData.worldFacts)) setWorldFacts(gameData.worldFacts);

                    // XP gain from completed quests
                    // Count both explicit complete_quest actions AND quests that
                    // auto-completed because all their objectives were ticked off.
                    const explicitCompletes = questChanges.filter((c) => c.action === 'complete_quest').map((c) => c.quest_id);
                    const autoCompletedQuestIds = new Set<string>();
                    for (const change of questChanges) {
                        if (change.action === 'complete_objective' && change.quest_id && !explicitCompletes.includes(change.quest_id)) {
                            const quest = character.quests?.find((q) => q.id === change.quest_id);
                            if (quest && quest.status === 'active') {
                                const updatedObjectives = quest.objectives.map((o) =>
                                    o.id === change.objective_id ? { ...o, completed: true } : o
                                );
                                if (updatedObjectives.length > 0 && updatedObjectives.every((o) => o.completed)) {
                                    autoCompletedQuestIds.add(change.quest_id);
                                }
                            }
                        }
                    }
                    const completedQuestCount = explicitCompletes.length + autoCompletedQuestIds.size;
                    if (completedQuestCount > 0 && character._id) {
                        const xpGain = completedQuestCount * 50 * (character.level ?? 1);
                        const projectedXp = (character.xp?.current ?? 0) + xpGain;
                        const wouldLevelUp = projectedXp >= (character.xp?.max ?? 100);

                        if (!session?.user?.id) {
                            // Guest: check without persisting first
                            const projectedXpGuest = (character.xp?.current ?? 0) + xpGain;
                            const wouldLevelUpGuest = projectedXpGuest >= (character.xp?.max ?? 100);
                            if (wouldLevelUpGuest) {
                                // Defer — show modal, apply with stat on confirm
                                setPendingLevelUp({
                                    xpGain,
                                    newLevel: (character.level ?? 1) + 1,
                                    stats: character.stats as Record<string, number>,
                                });
                            } else {
                                const result = applyGuestXpAndLevelUp(character._id, xpGain);
                                if (result) {
                                    setCharacter((prev) => prev ? { ...prev, xp: result.character.xp, level: result.character.level } : prev);
                                }
                            }
                        } else {
                            if (wouldLevelUp) {
                                // Defer to modal — we need the stat choice before persisting
                                setPendingLevelUp({
                                    xpGain,
                                    newLevel: (character.level ?? 1) + 1,
                                    stats: character.stats as Record<string, number>,
                                });
                            } else {
                                // No level-up: persist XP gain immediately
                                try {
                                    const res = await fetch('/api/characters/levelup', {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ characterId: character._id, xpGain }),
                                    });
                                    const data = await res.json();
                                    if (data.xp) {
                                        setCharacter((prev) => prev ? { ...prev, xp: data.xp, level: data.level } : prev);
                                    }
                                } catch (err) {
                                    console.error('Error syncing XP:', err);
                                }
                            }
                        }
                    }
                }
            })
            .catch((error) => console.error("Error sending message to game client:", error));
    };

    const handleSend = () => handleSendMessage(input);
    const handleSendOption = (option: string, role?: string) => handleSendMessage(option, true, role);

    const handleLevelUpConfirm = async (chosenStat: string) => {
        if (!character?._id || !pendingLevelUp) return;
        const { xpGain } = pendingLevelUp;
        try {
            if (!session?.user?.id) {
                const result = applyGuestXpAndLevelUp(character._id, xpGain, chosenStat);
                if (result) {
                    setCharacter((prev) => prev ? { ...prev, xp: result.character.xp, level: result.character.level, stats: result.character.stats } : prev);
                }
            } else {
                const res = await fetch('/api/characters/levelup', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ characterId: character._id, xpGain, statUpgrade: chosenStat }),
                });
                const data = await res.json();
                if (data.xp) {
                    setCharacter((prev) => prev ? { ...prev, xp: data.xp, level: data.level, stats: data.stats } : prev);
                }
            }
        } catch (err) {
            console.error('Error applying level-up:', err);
        } finally {
            setPendingLevelUp(null);
        }
    };

    const settingTheme = setting ? getSettingTheme(setting) : null;
    const themeVars = settingTheme ? (themeToCssVars(settingTheme) as React.CSSProperties) : undefined;

    // Sync theme CSS vars to :root so portals (modals rendered via document.body) inherit them
    useEffect(() => {
        if (!themeVars) return;
        const root = document.documentElement;
        const entries = Object.entries(themeVars) as [string, string][];
        entries.forEach(([prop, val]) => root.style.setProperty(prop, val));
        return () => { entries.forEach(([prop]) => root.style.removeProperty(prop)); };
    }, [themeVars]);

    // Track browser fullscreen state — read current state on mount too so
    // navigating between settings while already fullscreen works correctly
    useEffect(() => {
        setIsFullscreen(!!document.fullscreenElement);
        const onChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    const toggleFullscreen = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    };

    // Inject / clean up the Google Font <link> for this setting's display font
    useEffect(() => {
        const fontUrl = settingTheme?.fontUrl;
        if (!fontUrl) return;
        const existing = document.getElementById('play-theme-font');
        if (existing) existing.remove();
        const link = document.createElement('link');
        link.id = 'play-theme-font';
        link.rel = 'stylesheet';
        link.href = fontUrl;
        document.head.appendChild(link);
        return () => { link.remove(); };
    }, [settingTheme?.fontUrl]);

    return (
        <div
            data-play-screen="true"
            data-full-width="true"
            data-lock-shell="true"
            className={`relative box-border flex h-full w-full flex-col items-center overflow-hidden bg-[var(--bg)] text-[var(--text)] transition-[padding] duration-300 ${
                isFullscreen ? 'px-2 py-2 lg:px-4 lg:py-3' : 'px-4 py-6 lg:px-8 lg:py-10'
            }`}
            style={themeVars}
        >
            <div
                className="pointer-events-none absolute inset-x-0 top-[-160px] mx-auto h-96 w-[80vw] rounded-[40%] blur-[140px]"
                style={settingTheme ? {
                    background: `linear-gradient(to right, ${settingTheme.ambientA}, ${settingTheme.ambientB}, ${settingTheme.ambientA})`,
                } : {
                    background: 'linear-gradient(to right, rgba(244,63,94,0.15), rgba(253,230,138,0.10), rgba(153,27,27,0.15))',
                }}
                aria-hidden
            />
            {setting && !session && <StartModal />}

            {/* GM Admin Panel — dev tool, toggle with Ctrl+Shift+G */}
            <GMAdminPanel
                isOpen={isAdminOpen}
                onClose={() => setIsAdminOpen(false)}
                onCharacterUpdate={setCharacter}
                onLevelUp={setPendingLevelUp}
            />

            {/* Fullscreen toggle */}
            <button
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit fullscreen (F11)' : 'Fullscreen mode'}
                className="fixed bottom-6 left-6 z-[9997] flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[rgba(18,18,20,0.85)] text-white/40 shadow-lg backdrop-blur transition hover:border-white/25 hover:text-white/70"
            >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            {/* Floating GM button */}
            {isAdminOpen ? null : (
                <button
                    onClick={() => setIsAdminOpen(true)}
                    title="GM Admin Panel (Ctrl+Shift+G)"
                    className="fixed bottom-6 right-6 z-[9997] flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-[rgba(18,18,20,0.92)] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-rose-400/70 shadow-lg backdrop-blur transition hover:border-rose-400/50 hover:text-rose-300"
                >
                    <span className="text-sm">⚙</span>
                    GM
                </button>
            )}

            {pendingLevelUp && (
                <LevelUpModal
                    newLevel={pendingLevelUp.newLevel}
                    stats={pendingLevelUp.stats}
                    onConfirm={handleLevelUpConfirm}
                />
            )}
            <div className={`relative z-10 flex h-full w-full flex-1 flex-col min-h-0 transition-[max-width] duration-300 ${
                isFullscreen ? 'max-w-[1800px]' : 'max-w-6xl'
            }`}>
                <section className={`grid h-full w-full flex-1 min-h-0 overflow-hidden transition-[gap,grid-template-columns] duration-300 ${
                    isFullscreen ? 'gap-2 xl:grid-cols-[300px,minmax(0,1fr),260px]' : 'gap-4 xl:grid-cols-[320px,minmax(0,1fr),280px]'
                }`}>
                    <div className={`flex min-h-0 flex-col overflow-hidden ${isFullscreen ? 'h-full' : 'h-[calc(100vh-10rem)]'}`}>
                        <CharacterPanel />
                    </div>
                    <div className={`flex min-h-0 flex-col overflow-hidden ${isFullscreen ? 'h-full' : 'h-[calc(100vh-10rem)]'}`}>
                        <ChatPanel
                            messages={messages}
                            handleSendOption={handleSendOption}
                            input={input}
                            setInput={setInput}
                            inputRef={inputRef}
                            handleSend={handleSend}
                        />
                    </div>
                    <div className={`flex min-h-0 flex-col overflow-hidden ${isFullscreen ? 'h-full' : 'h-[calc(100vh-10rem)]'}`}>
                        <SettingPanel />
                    </div>
                </section>
            </div>
        </div>
    );
}
