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
import LevelUpModal from "@/components/GameScreen/Modals/LevelUpModal"

export default function Play() {
    const [messages, setMessages] = useState<Message[]>([]);
    const { character, gameId, setGameId, setting, setSetting, setCharacter } = useGameContext();
    const [input, setInput] = useState<string>("");
    const [pendingLevelUp, setPendingLevelUp] = useState<{ xpGain: number; newLevel: number; stats: Record<string, number> } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const bootstrapSignatureRef = useRef<string | null>(null);
    const searchParams = useSearchParams();
    const gameIdParam = searchParams.get("gameId");
    const { data: session } = useSession();
    const params = useParams();
    const settingId = params.setting as string;

    useEffect(() => {
        if (gameIdParam) {
            setGameId(gameIdParam);
        }

        return () => {
            setGameId(null);
        };
    }, [gameIdParam, setGameId]);

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
                    const formattedMessages = gameData.messages.map((msg: { role: string; content: string }) => {
                        let text = msg.content;
                        if (msg.role === 'assistant') {
                            try {
                                const parsed = JSON.parse(text);
                                if (parsed?.narrative) text = parsed.narrative;
                            } catch {}
                        }
                        return { text, sender: msg.role === 'user' ? 'You' : 'Gamemaster' } as Message;
                    });
                    setMessages(formattedMessages);
                } else if (!resumeGameId) {
                    setMessages([]);
                }

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
                // Safety net: if the raw JSON blob was returned instead of the extracted narrative, parse it out
                try {
                    const parsed = JSON.parse(messageText);
                    if (parsed?.narrative) messageText = parsed.narrative;
                } catch {}
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

                    // XP gain from completed quests
                    const completedQuestCount = questChanges.filter((c) => c.action === 'complete_quest').length;
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

    return (
        <div
            data-full-width="true"
            data-lock-shell="true"
            className="relative box-border flex h-full w-full flex-col items-center overflow-hidden bg-[var(--bg)] px-4 py-6 text-[var(--text)] lg:px-8 lg:py-10"
        >
            <div className="pointer-events-none absolute inset-x-0 top-[-160px] mx-auto h-96 w-[80vw] rounded-[40%] bg-gradient-to-r from-rose-500/15 via-amber-300/10 to-red-800/15 blur-[140px]" aria-hidden />
            {setting && !session && <StartModal />}
            {pendingLevelUp && (
                <LevelUpModal
                    newLevel={pendingLevelUp.newLevel}
                    stats={pendingLevelUp.stats}
                    onConfirm={handleLevelUpConfirm}
                />
            )}
            <div className="relative z-10 flex h-full w-full max-w-6xl flex-1 flex-col min-h-0">
                <section className="grid h-full w-full flex-1 min-h-0 gap-4 overflow-hidden xl:grid-cols-[320px,minmax(0,1fr),280px]">
                    <div className="flex h-full min-h-0 flex-col overflow-hidden">
                        <CharacterPanel />
                    </div>
                    <div className="flex h-full min-h-0 flex-col overflow-hidden">
                        <ChatPanel
                            messages={messages}
                            handleSendOption={handleSendOption}
                            input={input}
                            setInput={setInput}
                            inputRef={inputRef}
                            handleSend={handleSend}
                        />
                    </div>
                    <div className="flex h-full min-h-0 flex-col overflow-hidden">
                        <SettingPanel />
                    </div>
                </section>
            </div>
        </div>
    );
}
