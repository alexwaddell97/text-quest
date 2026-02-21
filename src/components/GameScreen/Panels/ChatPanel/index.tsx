import React, { useState, useEffect, useRef } from 'react';
import { Message, InventoryChange } from '@/types';
import Markdown from 'marked-react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { useGameContext } from '@/context/gameContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import JournalModal from '@/components/GameScreen/Modals/JournalModal';

// Custom renderer for GM narrative — breaks the wall of text into readable chunks
const gmRenderer = {
    paragraph(children: React.ReactNode) {
        return <p className="mb-3 last:mb-0 leading-[1.75] text-white/80">{children}</p>;
    },
    strong(children: React.ReactNode) {
        return <strong className="font-semibold text-amber-200/90">{children}</strong>;
    },
    em(children: React.ReactNode) {
        return <em className="italic text-white/60">{children}</em>;
    },
    heading(children: React.ReactNode, level: number) {
        return <p className={`font-semibold mb-2 ${level === 1 ? 'text-base text-white' : 'text-sm text-white/80'}`}>{children}</p>;
    },
    list(children: React.ReactNode, ordered: boolean) {
        return ordered
            ? <ol className="mb-3 ml-4 list-decimal space-y-1 text-white/75">{children}</ol>
            : <ul className="mb-3 ml-4 list-disc space-y-1 text-white/75">{children}</ul>;
    },
    listItem(children: React.ReactNode) {
        return <li className="leading-relaxed">{children}</li>;
    },
    code(children: React.ReactNode) {
        return (
            <pre className="my-2 overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                <code>{children}</code>
            </pre>
        );
    },
    codespan(children: React.ReactNode) {
        return <code className="rounded bg-white/10 px-1 py-0.5 text-xs text-amber-200/80">{children}</code>;
    },
};

interface ChatPanelProps {
    messages: Message[];
    handleSendOption: (option: string, role?: string) => void;
    input: string;
    setInput: (input: string) => void;
    handleSend: () => void;
    inputRef: React.RefObject<HTMLInputElement>;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, handleSendOption, input, setInput, handleSend, inputRef}) => {
    const { character, gameId, setting, chronicle, worldFacts } = useGameContext();
    const [latestGamemasterIndex, setLatestGamemasterIndex] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isJournalOpen, setIsJournalOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const latestGMRef = useRef<HTMLDivElement>(null);
    const prevMessageCountRef = useRef<number>(0);

    useEffect(() => {
        const lastIndex = messages.map((message, index) => ({ message, index }))
            .filter(({ message }) => message.sender === 'Gamemaster')
            .map(({ index }) => index)
            .pop();
        setLatestGamemasterIndex(lastIndex ?? null);
        if (lastIndex !== null) {
            setIsLoading(false);
        }
    }, [messages]);

    useEffect(() => {
        if (messages.length && messages[messages.length - 1].sender === 'You') {
            setIsLoading(true);
        }
    }, [messages]);

    // Scroll to bottom while loading (show spinner)
    useEffect(() => {
        if (!isLoading) return;
        const container = messagesContainerRef.current;
        if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }, [isLoading]);

    // Scroll so the latest GM message sits at the top — unless this is a bulk
    // session load (messages jumped by more than 1), in which case scroll to bottom.
    useEffect(() => {
        if (latestGamemasterIndex === null) return;
        const prev = prevMessageCountRef.current;
        prevMessageCountRef.current = messages.length;
        const isBulkLoad = messages.length - prev > 1;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const container = messagesContainerRef.current;
                if (!container) return;

                if (isBulkLoad) {
                    container.scrollTo({ top: container.scrollHeight, behavior: 'instant' });
                    return;
                }

                const gmMsg = latestGMRef.current;
                if (gmMsg) {
                    const gmRect = gmMsg.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    const offset = gmRect.top - containerRect.top + container.scrollTop;
                    container.scrollTo({ top: offset - 16, behavior: 'smooth' });
                }
            });
        });
    }, [latestGamemasterIndex]);

    const handleSendWithStart = () => {
        if (!messages.length && gameId) {
            handleSendOption('start game', 'system');
            setIsLoading(true);
        } else {
            handleSend();
        }
    };

    const sessionCode = gameId ? gameId.slice(-6).toUpperCase() : null;
    const panelClassName = "flex h-full min-h-0 flex-col rounded-[32px] border border-white/10 bg-[var(--panel)] text-white shadow-[0_35px_120px_rgba(5,6,12,0.65)]";

    const renderSkeleton = () => (
        <>
            <div className="border-b border-white/5 px-6 py-5">
                <div className="flex flex-col gap-3 animate-pulse">
                    <div className="h-3 w-32 rounded-full bg-white/10" />
                    <div className="h-5 w-40 rounded-full bg-white/15" />
                    <div className="h-4 w-24 rounded-full bg-white/10" />
                </div>
            </div>
            <div className="flex-1 space-y-3 overflow-hidden px-6 py-5">
                {[...Array(4)].map((_, idx) => (
                    <div key={idx} className="h-20 w-3/4 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
                ))}
            </div>
            <div className="border-t border-white/5 px-6 py-5">
                <div className="h-12 rounded-2xl bg-white/5 animate-pulse" />
            </div>
        </>
    );

    if (!setting) {
        return (
            <div className={panelClassName}>
                {renderSkeleton()}
            </div>
        );
    }

    return (
        <div className={panelClassName}>
            <JournalModal
                isOpen={isJournalOpen}
                onClose={() => setIsJournalOpen(false)}
                chronicle={chronicle}
                worldFacts={worldFacts}
            />
            <div className="border-b border-white/5 px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.4em] text-white/45">Gamemaster Feed</p>
                        <p className="mt-1 text-sm text-white/70">
                            {setting ? setting.name : 'Waiting for world selection'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Journal button */}
                        <button
                            onClick={() => setIsJournalOpen(true)}
                            title="Open Adventure Journal"
                            className="flex items-center gap-1.5 rounded-xl border border-amber-400/20 bg-amber-400/8 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300/70 transition hover:border-amber-400/40 hover:bg-amber-400/15 hover:text-amber-200"
                        >
                            <BookOpen size={11} />
                            <span>Journal</span>
                            {chronicle.length > 0 && (
                                <span className="rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[8px] font-bold text-amber-300/80">
                                    {chronicle.length}
                                </span>
                            )}
                        </button>
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-white/60">
                            <span className={`h-2 w-2 rounded-full ${gameId ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`} />
                            {gameId ? 'Live' : 'Standby'}
                        </div>
                    </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/55">
                    <span className="rounded-full border border-white/10 px-3 py-1">
                        Character: {character ? character.name : '—'}
                    </span>
                    <span className="rounded-full border border-white/10 px-3 py-1">
                        Session: {sessionCode ? `#${sessionCode}` : 'Not started'}
                    </span>
                </div>
            </div>
            <div ref={messagesContainerRef} className="messages flex-1 space-y-3 overflow-y-auto px-6 py-5 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-white/5">
                {messages.map((message, index) => (
                    <motion.div
                        key={index}
                        ref={message.sender !== 'You' && index === latestGamemasterIndex ? latestGMRef : undefined}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`message relative mb-3 max-w-[90%] text-sm leading-relaxed ${
                            message.sender === 'You'
                                ? 'ml-auto'
                                : 'mr-auto rounded-2xl border border-white/10 bg-gradient-to-br from-white/8 via-white/4 to-transparent px-4 py-3 shadow'
                        }`}
                    >
                        {message.sender === 'You' && (() => {
                            const skillMatch = message.text.match(/^\[SKILL:\s*([^\]]+)\]\s*(.+)/i);
                            const itemMatch  = message.text.match(/^\[ITEM:\s*([^\]]+)\]\s*(.+)/i);

                            const bubbleClass = 'rounded-2xl border border-[var(--accent)]/20 px-4 py-2.5 shadow shadow-[var(--glow)]/10';
                            const bubbleStyle: React.CSSProperties = { background: 'var(--theme-player-bubble)' };

                            if (skillMatch) {
                                const [, stat, label] = skillMatch;
                                return (
                                    <div className="flex flex-col items-end gap-1.5">
                                        <div className="flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                                            <span>🎲</span>
                                            <span>{stat} check</span>
                                        </div>
                                        <div className={bubbleClass} style={bubbleStyle}>
                                            <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: 'var(--accent)', opacity: 0.6 }}>You</div>
                                            <p className="text-xs font-semibold text-white/85">{label}</p>
                                        </div>
                                    </div>
                                );
                            }

                            if (itemMatch) {
                                const [, item, label] = itemMatch;
                                return (
                                    <div className="flex flex-col items-end gap-1.5">
                                        <div className="flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-300">
                                            <span>✦</span>
                                            <span>{item}</span>
                                        </div>
                                        <div className={bubbleClass} style={bubbleStyle}>
                                            <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: 'var(--accent)', opacity: 0.6 }}>You</div>
                                            <p className="text-xs font-semibold text-white/85">{label}</p>
                                        </div>
                                    </div>
                                );
                            }

                            // Plain "You" message
                            return (
                                <div className={bubbleClass} style={bubbleStyle}>
                                    <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: 'var(--accent)', opacity: 0.6 }}>You</div>
                                    <div className="text-sm leading-relaxed text-white/85">
                                        <Markdown>{message.text.replace(/\*\*\*\*([^*]+)\*\*\*\*/g, '').replace(/\n/g, '\n\n')}</Markdown>
                                    </div>
                                </div>
                            );
                        })()}
                        {message.sender !== 'You' && (
                            <>
                                <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/35">Gamemaster</div>
                                <div className="text-sm">
                                    <Markdown renderer={gmRenderer as any}>{message.text.replace(/\*\*\*\*([^*]+)\*\*\*\*/g, '').trim()}</Markdown>
                                </div>
                                {(() => {
                                    // Use structured options when available (new sessions);
                                    // fall back to ****marker**** parsing for backward compat.
                                    const hasStructured = message.options !== undefined ||
                                        message.skill_options !== undefined ||
                                        message.item_options !== undefined;

                                    type ParsedOption =
                                        | { type: 'skill'; stat: string; label: string; raw: string }
                                        | { type: 'item'; item: string; label: string; raw: string }
                                        | { type: 'normal'; label: string; raw: string };

                                    let parsed: ParsedOption[];

                                    if (hasStructured) {
                                        parsed = [
                                            ...(Array.isArray(message.options) ? message.options : []).map(label => ({
                                                type: 'normal' as const,
                                                label,
                                                raw: label,
                                            })),
                                            ...(Array.isArray(message.skill_options) ? message.skill_options : []).map(o => ({
                                                type: 'skill' as const,
                                                stat: o.stat,
                                                label: o.label,
                                                raw: `[SKILL: ${o.stat}] ${o.label}`,
                                            })),
                                            ...(Array.isArray(message.item_options) ? message.item_options : []).map(o => ({
                                                type: 'item' as const,
                                                item: o.item,
                                                label: o.label,
                                                raw: `[ITEM: ${o.item}] ${o.label}`,
                                            })),
                                        ];
                                    } else {
                                        // Legacy: parse ****text**** markers
                                        const optionLines = message.text.split('\n').filter(line =>
                                            line.match(/\*\*\*\*([^*]+)\*\*\*\*/)
                                        );
                                        parsed = optionLines.map(line => {
                                            const raw = line.match(/\*\*\*\*([^*]+)\*\*\*\*/)![1];
                                            const skillMatch = raw.match(/^\[SKILL:\s*([^\]]+)\]\s*(.+)/);
                                            const itemMatch  = raw.match(/^\[ITEM:\s*([^\]]+)\]\s*(.+)/);
                                            if (skillMatch) return { type: 'skill' as const, stat: skillMatch[1], label: skillMatch[2], raw };
                                            if (itemMatch)  return { type: 'item'  as const, item: itemMatch[1],  label: itemMatch[2],  raw };
                                            return { type: 'normal' as const, label: raw, raw };
                                        });
                                    }

                                    if (!parsed.length) return null;

                                    const active = index === latestGamemasterIndex;
                                    return (
                                        <div className="mt-4 border-t border-white/8 pt-3">
                                            <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.4em] text-white/30">Choose an action</p>
                                            <div className="grid gap-2 items-stretch" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                                                {parsed.map((opt, i) => {
                                                    if (opt.type === 'skill') {
                                                        const statKey = opt.stat.toLowerCase();
                                                        const statValue = (character?.stats as Record<string, number> | undefined)?.[statKey] ?? 0;
                                                        const hasStatMet = statValue >= 10;
                                                        const isDisabled = !active || !hasStatMet;
                                                        const tooltipText = !active ? null : !hasStatMet ? `Requires ${opt.stat} 10+ (yours: ${statValue})` : null;
                                                        return (
                                                            <div key={i} className="group relative h-full">
                                                                <button
                                                                    onClick={() => handleSendOption(opt.raw)}
                                                                    disabled={isDisabled}
                                                                    className={`h-full w-full flex flex-col items-center justify-center gap-1 rounded-xl border px-3 py-2.5 text-center text-xs font-semibold leading-snug transition ${
                                                                        isDisabled
                                                                            ? 'cursor-not-allowed border-white/10 bg-white/3 text-white/35'
                                                                            : 'border-[var(--accent)]/30 bg-[var(--accent)]/8 text-white/90 hover:border-[var(--accent)]/60 hover:bg-[var(--accent)]/15 hover:text-white'
                                                                    }`}
                                                                >
                                                                    <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                                                                        isDisabled ? 'bg-white/10 text-white/30' : 'bg-[var(--accent)]/20 text-[var(--accent-strong)]'
                                                                    }`}>
                                                                        🎲 {opt.stat} check
                                                                    </span>
                                                                    <span>{opt.label}</span>
                                                                </button>
                                                                {tooltipText && (
                                                                    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[200px] -translate-x-1/2 rounded-lg bg-[var(--elevated)] px-3 py-1.5 text-center text-[10px] font-medium text-white/80 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                                                                        {tooltipText}
                                                                        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[var(--elevated)]" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                    if (opt.type === 'item') {
                                                        const hasItem = character?.inventory?.some(
                                                            (inv) => inv.name.toLowerCase() === opt.item.toLowerCase()
                                                        ) ?? false;
                                                        const isDisabled = !active || !hasItem;
                                                        const tooltipText = !active ? null : !hasItem ? `You don't have ${opt.item}` : null;
                                                        return (
                                                            <div key={i} className="group relative h-full">
                                                                <button
                                                                    onClick={() => handleSendOption(opt.raw)}
                                                                    disabled={isDisabled}
                                                                    className={`h-full w-full flex flex-col items-center justify-center gap-1 rounded-xl border px-3 py-2.5 text-center text-xs font-semibold leading-snug transition ${
                                                                        isDisabled
                                                                            ? 'cursor-not-allowed border-white/10 bg-white/3 text-white/35'
                                                                            : 'border-[var(--accent)]/30 bg-[var(--accent)]/8 text-white/90 hover:border-[var(--accent)]/60 hover:bg-[var(--accent)]/15 hover:text-white'
                                                                    }`}
                                                                >
                                                                    <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                                                                        isDisabled ? 'bg-white/10 text-white/30' : 'bg-[var(--accent)]/20 text-[var(--accent-strong)]'
                                                                    }`}>
                                                                        ✦ {opt.item}
                                                                    </span>
                                                                    <span>{opt.label}</span>
                                                                </button>
                                                                {tooltipText && (
                                                                    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[200px] -translate-x-1/2 rounded-lg bg-[var(--elevated)] px-3 py-1.5 text-center text-[10px] font-medium text-white/80 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                                                                        {tooltipText}
                                                                        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[var(--elevated)]" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <button
                                                            key={i}
                                                            onClick={() => handleSendOption(opt.raw)}
                                                            disabled={!active}
                                                            className={`rounded-xl border px-4 py-2.5 text-center text-xs font-semibold leading-snug transition ${
                                                                !active
                                                                    ? 'cursor-not-allowed border-white/10 bg-white/3 text-white/35'
                                                                    : 'border-[var(--accent)]/30 text-white/90 shadow shadow-black/20 hover:brightness-110 hover:text-white'
                                                            }`}
                                                            style={active ? { background: 'var(--theme-btn)' } : undefined}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}
                                {message.inventoryChanges && message.inventoryChanges.length > 0 && (
                                    <div className="mt-3 rounded-xl border border-white/8 bg-black/20 px-3 py-2.5">
                                        <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.4em] text-white/30">Inventory</p>
                                        <div className="flex flex-col gap-1.5">
                                            {message.inventoryChanges.map((change: InventoryChange, i: number) => (
                                                <div
                                                    key={i}
                                                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs ${
                                                        change.action === 'add'
                                                            ? 'bg-emerald-400/8 text-emerald-200'
                                                            : 'bg-rose-400/8 text-rose-200'
                                                    }`}
                                                >
                                                    <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
                                                        change.action === 'add' ? 'bg-emerald-400/20 text-emerald-300' : 'bg-rose-400/20 text-rose-300'
                                                    }`}>
                                                        {change.action === 'add' ? '+' : '−'}
                                                    </span>
                                                    <span className="font-semibold">{change.quantity > 1 ? `${change.quantity}× ` : ''}{change.name}</span>
                                                    {change.description && (
                                                        <span className="ml-auto text-[10px] text-white/35 truncate max-w-[120px]">{change.description}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                ))}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mr-auto max-w-[90%]"
                    >
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/35">Gamemaster</div>
                        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/8 via-white/4 to-transparent px-4 py-3 shadow">
                            <div className="flex items-center gap-1.5 py-0.5">
                                {[0, 0.2, 0.4].map((delay) => (
                                    <motion.span
                                        key={delay}
                                        className="h-2 w-2 rounded-full bg-white/40"
                                        animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                                        transition={{
                                            duration: 0.9,
                                            repeat: Infinity,
                                            ease: 'easeInOut',
                                            delay,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>
            {!messages.length ? (
                <div className="border-t border-white/5 px-6 py-5">
                    <button
                        onClick={handleSendWithStart}
                        disabled={!character || !character._id || isLoading}
                        style={(!character || !character._id || isLoading) ? undefined : { background: 'var(--theme-btn)' }}
                        className={`w-full rounded-2xl px-6 py-4 text-sm font-semibold transition ${
                            !character || !character._id
                                ? 'cursor-not-allowed border border-white/10 bg-white/5 text-white/40'
                                : isLoading
                                    ? 'cursor-wait border border-white/15 bg-white/5 text-white/70'
                                    : 'text-white shadow-lg'
                        }`}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <LoadingSpinner size={16} className="text-white" label="Starting session" />
                                <span>Starting...</span>
                            </span>
                        ) : (
                            'Start session'
                        )}
                    </button>
                </div>
            ) : (
                <div className="border-t border-white/5 px-6 py-4">
                    <div className="flex gap-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSend()}
                            placeholder={isLoading ? "Waiting for response..." : "Type a message..."}
                            disabled={isLoading}
                            className={`flex-1 rounded-2xl border px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 transition ${
                                isLoading
                                    ? 'cursor-not-allowed border-white/5 bg-white/3 text-white/30'
                                    : 'border-white/10 bg-white/5'
                            }`}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            style={(!isLoading && input.trim()) ? { background: 'var(--theme-btn)' } : undefined}
                            className={`rounded-2xl px-5 py-3 text-sm font-semibold shadow transition ${
                                isLoading || !input.trim()
                                    ? 'cursor-not-allowed border border-white/10 bg-white/5 text-white/50'
                                    : 'text-white hover:opacity-95'
                            }`}
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatPanel;