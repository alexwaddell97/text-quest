import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useGameContext } from '@/context/gameContext';
import { Quest, QuestChange } from '@/types';
import { applyGuestQuestChanges } from '@/utils/guestCharacters';
import { motion, AnimatePresence } from 'framer-motion';

// ── Quest tree helpers ──────────────────────────────────────────────────────
type QuestNode = Quest & { children: QuestNode[] };

function buildQuestTree(quests: Quest[]): QuestNode[] {
    const map = new Map<string, QuestNode>(quests.map((q) => [q.id, { ...q, children: [] }]));
    const roots: QuestNode[] = [];
    quests.forEach((q) => {
        const node = map.get(q.id)!;
        if (q.parent_quest_id && map.has(q.parent_quest_id)) {
            map.get(q.parent_quest_id)!.children.push(node);
        } else {
            roots.push(node);
        }
    });
    return roots;
}

function chainHasActive(node: QuestNode): boolean {
    return node.status === 'active' || node.children.some(chainHasActive);
}

function flattenChain(node: QuestNode): QuestNode[] {
    return [node, ...node.children.flatMap(flattenChain)];
}

// ── Single quest card ───────────────────────────────────────────────────────
const QuestCard: React.FC<{ quest: QuestNode; stageIndex?: number; totalStages?: number; onCancel?: () => void }> = ({
    quest,
    stageIndex,
    totalStages,
    onCancel,
}) => {
    const completedCount = quest.objectives.filter((o) => o.completed).length;
    const totalCount = quest.objectives.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const isChained = totalStages !== undefined && totalStages > 1;

    const borderClass =
        quest.status === 'active'
            ? 'border-amber-400/15 bg-gradient-to-br from-amber-950/20 via-white/2 to-transparent'
            : quest.status === 'completed'
            ? 'border-emerald-400/10 bg-white/2 opacity-55'
            : 'border-rose-400/10 bg-rose-950/10 opacity-55';

    return (
        <li className={`rounded-2xl border p-3 ${borderClass}`}>
            {/* Stage pip track */}
            {isChained && (
                <div className="mb-2 flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                        {Array.from({ length: totalStages! }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-1 w-4 rounded-full transition-colors ${
                                    i < stageIndex!
                                        ? 'bg-emerald-400/40'
                                        : i === stageIndex!
                                        ? quest.status === 'active'
                                            ? 'bg-amber-400/70'
                                            : quest.status === 'completed'
                                            ? 'bg-emerald-400/40'
                                            : 'bg-rose-400/40'
                                        : 'bg-white/10'
                                }`}
                            />
                        ))}
                    </div>
                    <span className="text-[9px] uppercase tracking-widest text-white/30">
                        Stage {stageIndex! + 1}
                        {quest.status !== 'active' && (
                            <span className={quest.status === 'completed' ? ' · ✓ done' : ' · ✗ failed'} />
                        )}
                    </span>
                </div>
            )}

            <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-white/90 leading-snug">{quest.title}</p>
                <div className="flex shrink-0 items-center gap-1.5">
                    {!isChained && quest.status === 'active' && (
                        <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-300">
                            Active
                        </span>
                    )}
                    {quest.status === 'active' && onCancel && (
                        <button
                            onClick={onCancel}
                            title="Abandon quest"
                            className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 text-white/25 transition hover:border-rose-400/40 hover:text-rose-400/70"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
            {quest.given_by && (
                <p className="mt-0.5 text-[10px] text-white/35">From: {quest.given_by}</p>
            )}
            <p className="mt-1 text-[11px] text-white/50 leading-relaxed">{quest.description}</p>

            {totalCount > 0 && (
                <div className="mt-2.5">
                    <div className="mb-1 flex items-center justify-between">
                        <span className="text-[9px] uppercase tracking-widest text-white/30">Objectives</span>
                        <span className="text-[9px] text-white/30">{completedCount}/{totalCount}</span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-white/8">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400/70 to-amber-300/50 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {quest.objectives.length > 0 && (
                <ul className="mt-2.5 space-y-1.5">
                    {quest.objectives.map((obj) => (
                        <li key={obj.id} className="flex items-start gap-2 text-xs">
                            <span
                                className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors ${
                                    obj.completed
                                        ? 'border-emerald-400/50 bg-emerald-400/20'
                                        : 'border-white/20 bg-white/4'
                                }`}
                            >
                                {obj.completed && (
                                    <span className="text-[8px] leading-none text-emerald-300">✓</span>
                                )}
                            </span>
                            <span
                                className={`leading-relaxed ${obj.completed ? 'text-white/25 line-through' : 'text-white/60'}`}
                            >
                                {obj.description}
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            {quest.reward_hint && (
                <p className="mt-2.5 border-t border-white/5 pt-2 text-[10px] text-amber-300/45">
                    ✦ {quest.reward_hint}
                </p>
            )}
        </li>
    );
};

// ── Quest chain group (single quest or multi-stage chain) ───────────────────
const QuestChainGroup: React.FC<{ root: QuestNode; onCancel: (questId: string) => void }> = ({ root, onCancel }) => {
    const stages = flattenChain(root);
    if (stages.length === 1) {
        return <QuestCard quest={stages[0]} onCancel={() => onCancel(stages[0].id)} />;
    }
    return (
        <li className="space-y-1.5">
            <div className="flex items-center gap-2 px-1">
                <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-amber-300/50">
                    Quest Chain
                </span>
                <div className="h-px flex-1 bg-amber-400/10" />
                <span className="text-[9px] text-white/20">{stages.length} stages</span>
            </div>
            <ul className="space-y-1.5">
                {stages.map((stage, i) => (
                    <QuestCard key={stage.id} quest={stage} stageIndex={i} totalStages={stages.length} onCancel={() => onCancel(stage.id)} />
                ))}
            </ul>
        </li>
    );
};

const SettingPanel: React.FC = () => {
    const { setting, character, setCharacter, gameId } = useGameContext();
    const { data: authSession } = useSession();
    const [showDoneChains, setShowDoneChains] = useState(false);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const prevQuestStatusesRef = useRef<Map<string, string>>(new Map());
    const [recentlyCompletedIds, setRecentlyCompletedIds] = useState<Set<string>>(new Set());

    // Detect quests that just moved from active → completed
    useEffect(() => {
        const currentQuests = character?.quests ?? [];
        const prevStatuses = prevQuestStatusesRef.current;
        const newlyCompleted: string[] = [];
        for (const q of currentQuests) {
            if (prevStatuses.get(q.id) === 'active' && q.status === 'completed') {
                newlyCompleted.push(q.id);
            }
        }
        if (newlyCompleted.length > 0) {
            setRecentlyCompletedIds((prev) => {
                const next = new Set(prev);
                newlyCompleted.forEach((id) => next.add(id));
                return next;
            });
            newlyCompleted.forEach((id) => {
                setTimeout(() => {
                    setRecentlyCompletedIds((prev) => {
                        const next = new Set(prev);
                        next.delete(id);
                        return next;
                    });
                }, 6000);
            });
        }
        prevQuestStatusesRef.current = new Map(currentQuests.map((q) => [q.id, q.status]));
    }, [character?.quests]);

    const cancelQuest = async (questId: string) => {
        if (!character || cancellingId) return;
        const quest = character.quests?.find(q => q.id === questId);
        if (!quest) return;
        setCancellingId(questId);
        const change: QuestChange = {
            action: 'fail_quest',
            quest_id: questId,
            title: null, description: null, objectives: null,
            given_by: null, reward_hint: null, objective_id: null,
            objective_description: null, parent_quest_id: null,
        };
        try {
            const isGuest = !authSession?.user?.id;
            if (isGuest) {
                const updated = applyGuestQuestChanges(character._id, [change]);
                if (updated) setCharacter(updated);
            } else {
                const res = await fetch('/api/characters/quests', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ characterId: character._id, changes: [change] }),
                });
                if (res.ok) {
                    const data = await res.json();
                    setCharacter({ ...character, quests: data.quests });
                }
            }
            // Silently inform the GM so it can absorb the narrative implications
            fetch('/api/game/inject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameId,
                    characterId: character._id,
                    isGuest: !authSession?.user?.id,
                    content: `[Quest Abandoned] The player has chosen to abandon the quest "${quest.title}". Weave this into the story naturally if relevant — the quest giver may react, the objective may fade into unresolved background, or the world may shift subtly. Do not explicitly announce this to the player unless it arises organically.`,
                }),
            }).catch(() => {}); // fire-and-forget, non-critical
        } finally {
            setCancellingId(null);
        }
    };

    const allQuests = character?.quests ?? [];
    const questTree = buildQuestTree(allQuests);
    const activeChains = questTree.filter(chainHasActive);
    const doneChains = questTree.filter((r) => !chainHasActive(r));
    const recentlyCompletedRoots = doneChains.filter((root) =>
        flattenChain(root).some((s) => recentlyCompletedIds.has(s.id))
    );
    const totalActive = allQuests.filter((q) => q.status === 'active').length;

    return (
        <div className="flex h-full min-h-0 flex-col rounded-[28px] border border-white/10 bg-[var(--panel)] p-5 text-white shadow-[0_35px_120px_rgba(5,6,12,0.65)]">
            {setting ? (
                <>
                    <div className="relative mb-5 h-40 overflow-hidden rounded-2xl border border-white/10">
                        <Image
                            src={setting.cover_image}
                            alt={`${setting.name} cover image`}
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4">
                            <p className="text-xs uppercase tracking-[0.35em] text-white/60">World</p>
                            <h2 className="text-lg font-semibold">{setting.name}</h2>
                            <p className="text-xs text-white/70">{(setting.genres ?? (setting.genre ? [setting.genre] : [])).join(' · ')}</p>
                        </div>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto pr-1 text-sm text-white/70">

                        {/* ── Objective tracker ── */}
                        <div>
                            <div className="flex items-center justify-between">
                                <p className="text-xs uppercase tracking-[0.35em] text-white/45">Objectives</p>
                                {totalActive > 0 && (
                                    <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent-strong)' }}>
                                        {totalActive} active
                                    </span>
                                )}
                            </div>

                            {activeChains.length === 0 && doneChains.length === 0 ? (
                                <div className="mt-3 rounded-2xl border border-dashed border-white/10 px-4 py-5 text-center">
                                    <p className="text-[11px] text-white/25">No active objectives</p>
                                    <p className="mt-0.5 text-[10px] text-white/15">Objectives will appear as you explore the world</p>
                                </div>
                            ) : (
                                <>
                                    {/* Recently completed quest flash banners */}
                                    <AnimatePresence>
                                        {recentlyCompletedRoots.map((root) => {
                                            const stages = flattenChain(root);
                                            const lastStage = stages[stages.length - 1];
                                            return (
                                                <motion.div
                                                    key={root.id}
                                                    initial={{ opacity: 0, y: -10, scale: 0.97 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                                    transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                                                    className="mt-3 rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-950/50 via-emerald-900/10 to-transparent p-3 shadow-[0_0_24px_rgba(52,211,153,0.1)]"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-sm text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.35)]">
                                                            ✓
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-emerald-400/70">Quest Complete</p>
                                                            <p className="truncate text-sm font-semibold text-white/90">{lastStage.title}</p>
                                                        </div>
                                                    </div>
                                                    {lastStage.reward_hint && (
                                                        <p className="mt-1.5 border-t border-emerald-400/10 pt-1.5 text-[10px] text-amber-300/60">
                                                            ❖ {lastStage.reward_hint}
                                                        </p>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                    <ul className="mt-3 space-y-2">
                                        {activeChains.map((root) => (
                                            <QuestChainGroup key={root.id} root={root} onCancel={cancelQuest} />
                                        ))}
                                    </ul>
                                    {doneChains.length > 0 && (
                                        <div className="mt-2">
                                            <button
                                                onClick={() => setShowDoneChains((v) => !v)}
                                                className="flex items-center gap-1.5 text-[10px] text-white/35 transition hover:text-white/55"
                                            >
                                                <span className={`transition-transform ${showDoneChains ? 'rotate-90' : ''}`}>▶</span>
                                                {showDoneChains ? 'Hide' : 'Show'} {doneChains.length} completed / failed
                                            </button>
                                            {showDoneChains && (
                                                <ul className="mt-2 space-y-1.5">
                                                    {doneChains.map((root) => {
                                                        const stages = flattenChain(root);
                                                        const isChain = stages.length > 1;
                                                        return (
                                                            <li key={root.id} className="rounded-xl border border-white/6 bg-white/2 px-3 py-2">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <p className="text-xs text-white/35 line-through">{root.title}</p>
                                                                    <div className="flex shrink-0 items-center gap-1.5">
                                                                        {isChain && (
                                                                            <span className="text-[9px] text-white/20">{stages.length} stages</span>
                                                                        )}
                                                                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                                                                            root.status === 'completed'
                                                                                ? 'bg-emerald-400/10 text-emerald-400/60'
                                                                                : 'bg-rose-400/10 text-rose-400/60'
                                                                        }`}>{root.status}</span>
                                                                    </div>
                                                                </div>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                    </div>
                </>
            ) : (
                <div className="flex flex-1 flex-col gap-4 animate-pulse">
                    <div className="h-40 rounded-2xl border border-white/10 bg-white/5" />
                    <div className="flex-1 space-y-3">
                        {[...Array(4)].map((_, idx) => (
                            <div key={idx} className="h-20 rounded-2xl border border-white/10 bg-white/5" />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingPanel;