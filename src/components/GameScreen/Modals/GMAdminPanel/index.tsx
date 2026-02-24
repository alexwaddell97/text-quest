'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSession } from 'next-auth/react';
import { useGameContext } from '@/context/gameContext';
import { applyGuestInventoryChanges, applyGuestQuestChanges, applyGuestXpAndLevelUp } from '@/utils/guestCharacters';
import { getSettingTheme, deriveThemeFromSetting } from '@/utils/settingTheme';
import { Character, InventoryChange, QuestChange, SettingTheme } from '@/types';
import { X, Package, Coins, Zap, ScrollText, Plus, Trash2, Palette } from 'lucide-react';

type Tab = 'items' | 'currency' | 'xp' | 'quests' | 'theme';

interface GMAdminPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onCharacterUpdate: (updater: (prev: Character) => Character) => void;
    onLevelUp: (data: { xpGain: number; newLevel: number; stats: Record<string, number> }) => void;
}

const RARITIES = ['common', 'uncommon', 'rare', 'legendary', 'unique'] as const;

const RARITY_STYLES: Record<string, { border: string; bg: string; text: string; badge: string }> = {
    common:    { border: 'border-white/8',       bg: 'bg-white/3',         text: 'text-white/70',    badge: 'bg-white/10 text-white/50' },
    uncommon:  { border: 'border-emerald-500/25', bg: 'bg-emerald-500/5',   text: 'text-emerald-200', badge: 'bg-emerald-500/20 text-emerald-300' },
    rare:      { border: 'border-blue-400/30',    bg: 'bg-blue-400/8',      text: 'text-blue-200',    badge: 'bg-blue-400/20 text-blue-300' },
    legendary: { border: 'border-amber-400/35',   bg: 'bg-amber-400/8',     text: 'text-amber-200',   badge: 'bg-amber-400/20 text-amber-300' },
    unique:    { border: 'border-rose-400/35',    bg: 'bg-rose-400/8',      text: 'text-rose-200',    badge: 'bg-rose-400/20 text-rose-300' },
};

const getRarityStyle = (rarity?: string) => RARITY_STYLES[rarity ?? 'common'] ?? RARITY_STYLES.common;

const FONT_OPTIONS: { label: string; fontUrl: string; fontDisplay: string }[] = [
    { label: 'Space Grotesk',      fontUrl: '',                                                                                              fontDisplay: "'Space Grotesk', sans-serif" },
    { label: 'Cinzel',             fontUrl: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap',                   fontDisplay: "'Cinzel', 'Space Grotesk', serif" },
    { label: 'Orbitron',           fontUrl: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700&display=swap',                 fontDisplay: "'Orbitron', 'Space Grotesk', monospace" },
    { label: 'Uncial Antiqua',     fontUrl: 'https://fonts.googleapis.com/css2?family=Uncial+Antiqua&display=swap',                           fontDisplay: "'Uncial Antiqua', 'Space Grotesk', serif" },
    { label: 'Cormorant Garamond', fontUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap',       fontDisplay: "'Cormorant Garamond', 'Space Grotesk', serif" },
    { label: 'Special Elite',      fontUrl: 'https://fonts.googleapis.com/css2?family=Special+Elite&display=swap',                            fontDisplay: "'Special Elite', 'Space Grotesk', serif" },
    { label: 'Pirata One',         fontUrl: 'https://fonts.googleapis.com/css2?family=Pirata+One&display=swap',                               fontDisplay: "'Pirata One', 'Space Grotesk', serif" },
    { label: 'Josefin Sans',       fontUrl: 'https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700&display=swap',             fontDisplay: "'Josefin Sans', 'Space Grotesk', sans-serif" },
    { label: 'Rye',                fontUrl: 'https://fonts.googleapis.com/css2?family=Rye&display=swap',                                      fontDisplay: "'Rye', 'Space Grotesk', serif" },
    { label: 'Almendra',           fontUrl: 'https://fonts.googleapis.com/css2?family=Almendra:wght@400;700&display=swap',                    fontDisplay: "'Almendra', 'Space Grotesk', serif" },
    { label: 'IM Fell English',    fontUrl: 'https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&display=swap',                 fontDisplay: "'IM Fell English', 'Space Grotesk', serif" },
];

const tabConfig: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'items',    label: 'Items',    icon: <Package className="h-3.5 w-3.5" /> },
    { id: 'currency', label: 'Currency', icon: <Coins    className="h-3.5 w-3.5" /> },
    { id: 'xp',       label: 'XP',       icon: <Zap      className="h-3.5 w-3.5" /> },
    { id: 'quests',   label: 'Quests',   icon: <ScrollText className="h-3.5 w-3.5" /> },
    { id: 'theme',    label: 'Theme',    icon: <Palette className="h-3.5 w-3.5" /> },
];

const inputClass = 'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-rose-400/50 focus:outline-none focus:ring-1 focus:ring-rose-400/30';
const labelClass = 'mb-1 block text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40';

export const GMAdminPanel: React.FC<GMAdminPanelProps> = ({ isOpen, onClose, onCharacterUpdate, onLevelUp }) => {
    const { character, setting } = useGameContext();
    const { data: session } = useSession();
    const [tab, setTab] = useState<Tab>('items');
    const [status, setStatus] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    // ── Items state ────────────────────────────────────────────────────────
    const [itemName, setItemName]           = useState('');
    const [itemDesc, setItemDesc]           = useState('');
    const [itemRarity, setItemRarity]       = useState<typeof RARITIES[number]>('common');
    const [itemQty, setItemQty]             = useState(1);
    const [removeItemName, setRemoveItemName] = useState('');

    // ── Currency state ─────────────────────────────────────────────────────
    const [currencyAmount, setCurrencyAmount] = useState(0);

    // ── XP state ──────────────────────────────────────────────────────────
    const [xpAmount, setXpAmount] = useState(50);

    // ── Quest state ────────────────────────────────────────────────────────
    const [questId, setQuestId]       = useState('');
    const [questTitle, setQuestTitle] = useState('');
    const [questDesc, setQuestDesc]   = useState('');
    const [questGiver, setQuestGiver] = useState('');
    const [questReward, setQuestReward] = useState('');
    const [objectives, setObjectives] = useState([{ id: '', description: '' }]);

    // ── Theme state ────────────────────────────────────────────────────────
    const [previewTheme, setPreviewTheme] = useState<SettingTheme | null>(null);
    const [themeSaving, setThemeSaving] = useState(false);

    // Sync preview theme when setting or tab changes
    useEffect(() => {
        if (tab === 'theme' && setting) {
            setPreviewTheme(getSettingTheme(setting));
        }
    }, [tab, setting]);

    const flash = (msg: string) => { setStatus(msg); setTimeout(() => setStatus(null), 3000); };

    const handleSaveTheme = async () => {
        if (!setting?._id || !previewTheme) return;
        setThemeSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settingId: setting._id, theme: previewTheme }),
            });
            if (!res.ok) throw new Error('Failed');
            flash('✓ Theme saved to this setting');
        } catch {
            flash('✗ Failed to save theme');
        } finally {
            setThemeSaving(false);
        }
    };

    const handleResetTheme = () => {
        if (setting) setPreviewTheme(deriveThemeFromSetting(setting));
    };

    const isGuest = !session?.user?.id;

    // ── Helpers ────────────────────────────────────────────────────────────
    const applyInventory = async (changes: InventoryChange[], currencyDelta = 0) => {
        if (!character?._id) return;
        if (isGuest) {
            const updated = applyGuestInventoryChanges(character._id, changes, currencyDelta);
            if (updated) onCharacterUpdate(() => ({ ...character, inventory: updated.inventory, currency: updated.currency }));
        } else {
            const res = await fetch('/api/characters/inventory', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ characterId: character._id, changes, currencyDelta }),
            });
            const data = await res.json();
            onCharacterUpdate((prev: Character) => ({
                ...prev,
                ...(data.inventory ? { inventory: data.inventory } : {}),
                ...(typeof data.currency === 'number' ? { currency: data.currency } : {}),
            }));
        }
    };

    const applyXp = async (xpGain: number) => {
        if (!character?._id) return;
        const projectedXp = (character.xp?.current ?? 0) + xpGain;
        const wouldLevelUp = projectedXp >= (character.xp?.max ?? 100);

        if (wouldLevelUp) {
            // Defer to the level-up modal so the player can choose a stat
            onLevelUp({
                xpGain,
                newLevel: (character.level ?? 1) + 1,
                stats: character.stats as Record<string, number>,
            });
            return;
        }

        if (isGuest) {
            const result = applyGuestXpAndLevelUp(character._id, xpGain);
            if (result) onCharacterUpdate(() => ({ ...character, xp: result.character.xp, level: result.character.level }));
        } else {
            const res = await fetch('/api/characters/levelup', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ characterId: character._id, xpGain }),
            });
            const data = await res.json();
            onCharacterUpdate((prev: Character) => ({ ...prev, xp: data.xp, level: data.level, stats: data.stats }));
        }
    };

    const applyQuests = async (changes: QuestChange[]) => {
        if (!character?._id) return;
        if (isGuest) {
            const updated = applyGuestQuestChanges(character._id, changes);
            if (updated) onCharacterUpdate((prev: Character) => ({ ...prev, quests: updated.quests }));
        } else {
            const res = await fetch('/api/characters/quests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ characterId: character._id, changes }),
            });
            const data = await res.json();
            if (data.quests) onCharacterUpdate((prev: Character) => ({ ...prev, quests: data.quests }));
        }
    };

    // ── Actions ────────────────────────────────────────────────────────────
    const handleAddItem = async () => {
        if (!itemName.trim()) return;
        setBusy(true);
        try {
            await applyInventory([{ action: 'add', name: itemName.trim(), description: itemDesc.trim(), rarity: itemRarity, quantity: itemQty, location_context: 'GM grant', usable_at: 'anywhere' }]);
            flash(`✓ Added ${itemQty}× ${itemName}`);
            setItemName(''); setItemDesc(''); setItemQty(1); setItemRarity('common');
        } catch { flash('✗ Failed to add item'); }
        setBusy(false);
    };

    const handleRemoveItem = async () => {
        if (!removeItemName.trim()) return;
        setBusy(true);
        try {
            await applyInventory([{ action: 'remove', name: removeItemName.trim(), quantity: 99, description: '', rarity: 'common', location_context: '', usable_at: '' }]);
            flash(`✓ Removed ${removeItemName}`);
            setRemoveItemName('');
        } catch { flash('✗ Failed to remove item'); }
        setBusy(false);
    };

    const handleCurrency = async () => {
        if (currencyAmount === 0) return;
        setBusy(true);
        try {
            await applyInventory([], currencyAmount);
            flash(`✓ ${currencyAmount > 0 ? '+' : ''}${currencyAmount} currency`);
            setCurrencyAmount(0);
        } catch { flash('✗ Failed'); }
        setBusy(false);
    };

    const handleXp = async () => {
        if (xpAmount <= 0) return;
        setBusy(true);
        try {
            await applyXp(xpAmount);
            flash(`✓ +${xpAmount} XP`);
        } catch { flash('✗ Failed'); }
        setBusy(false);
    };

    const handleAddQuest = async () => {
        if (!questId.trim() || !questTitle.trim()) return;
        const validObjectives = objectives.filter(o => o.id.trim() && o.description.trim());
        setBusy(true);
        try {
            await applyQuests([{
                action: 'add_quest',
                quest_id: questId.trim().toLowerCase().replace(/\s+/g, '_'),
                title: questTitle.trim(),
                description: questDesc.trim(),
                objectives: validObjectives,
                given_by: questGiver.trim() || null,
                reward_hint: questReward.trim() || null,
                objective_id: null,
                objective_description: null,
                parent_quest_id: null,
            }]);
            flash(`✓ Quest "${questTitle}" added`);
            setQuestId(''); setQuestTitle(''); setQuestDesc(''); setQuestGiver(''); setQuestReward('');
            setObjectives([{ id: '', description: '' }]);
        } catch { flash('✗ Failed to add quest'); }
        setBusy(false);
    };

    if (!isOpen || typeof document === 'undefined') return null;

    const modal = (
        <div className="fixed inset-0 z-[9998] flex items-start justify-end bg-black/60 backdrop-blur-sm p-4 pt-20">
            <div
                className="relative flex h-[calc(100vh-6rem)] w-full max-w-sm flex-col rounded-[24px] border border-rose-500/20 bg-[rgba(18,18,20,0.98)] shadow-[0_40px_120px_rgba(5,6,12,0.8)]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.45em] text-rose-400/60">Developer</p>
                        <p className="text-sm font-semibold text-white">GM Admin Panel</p>
                    </div>
                    <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 p-1.5 text-white/50 transition hover:text-white">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b border-white/8 px-4 py-2 overflow-x-auto scrollbar-none">
                    {tabConfig.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition ${
                                tab === t.id
                                    ? 'bg-gradient-to-r from-rose-600/60 via-amber-600/50 to-red-800/60 text-white'
                                    : 'text-white/40 hover:text-white/70'
                            }`}
                        >
                            {t.icon}
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

                    {/* ── Items ── */}
                    {tab === 'items' && (
                        <>
                            <div>
                                <p className="mb-3 text-xs font-semibold text-white/60">Add Item</p>
                                <div className="space-y-2.5">
                                    <div>
                                        <label className={labelClass}>Name *</label>
                                        <input className={inputClass} value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g. Iron Sword" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Description</label>
                                        <input className={inputClass} value={itemDesc} onChange={e => setItemDesc(e.target.value)} placeholder="Short description" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className={labelClass}>Rarity</label>
                                            <select className={inputClass} value={itemRarity} onChange={e => setItemRarity(e.target.value as typeof RARITIES[number])}>
                                                {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Quantity</label>
                                            <input className={inputClass} type="number" min={1} value={itemQty} onChange={e => setItemQty(Number(e.target.value))} />
                                        </div>
                                    </div>
                                    <button onClick={handleAddItem} disabled={busy || !itemName.trim()} className="w-full rounded-xl bg-gradient-to-r from-rose-400 via-amber-600 to-red-800 py-2.5 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-40">
                                        Add to Inventory
                                    </button>
                                </div>
                            </div>

                            <div className="border-t border-white/8 pt-4">
                                <p className="mb-3 text-xs font-semibold text-white/60">Remove Item</p>
                                <div className="flex gap-2">
                                    <input className={`${inputClass} flex-1`} value={removeItemName} onChange={e => setRemoveItemName(e.target.value)} placeholder="Exact item name" />
                                    <button onClick={handleRemoveItem} disabled={busy || !removeItemName.trim()} className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-40">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Current inventory */}
                            {character?.inventory && character.inventory.length > 0 && (
                                <div className="border-t border-white/8 pt-4">
                                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">Current Inventory</p>
                                    <div className="space-y-1">
                                        {character.inventory.map((item, i) => {
                                            const rs = getRarityStyle(item.rarity);
                                            return (
                                                <div key={i} className={`flex items-center justify-between rounded-lg border ${rs.border} ${rs.bg} px-3 py-1.5`}>
                                                    <span className={`text-xs font-medium ${rs.text}`}>{item.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold capitalize ${rs.badge}`}>{item.rarity}</span>
                                                        <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white/60">×{item.quantity}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── Currency ── */}
                    {tab === 'currency' && (
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-white/8 bg-white/3 px-4 py-3 text-center">
                                <p className="text-[10px] uppercase tracking-widest text-white/35">Current Balance</p>
                                <p className="mt-1 text-3xl font-bold text-amber-300">{character?.currency ?? 0}</p>
                            </div>
                            <div>
                                <label className={labelClass}>Amount (negative to subtract)</label>
                                <input className={inputClass} type="number" value={currencyAmount} onChange={e => setCurrencyAmount(Number(e.target.value))} placeholder="e.g. 100 or -50" />
                            </div>
                            <div className="grid grid-cols-4 gap-1.5">
                                {[10, 50, 100, 500].map(amt => (
                                    <button key={amt} onClick={() => setCurrencyAmount(amt)} className="rounded-lg border border-white/10 bg-white/5 py-1.5 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white">
                                        +{amt}
                                    </button>
                                ))}
                            </div>
                            <button onClick={handleCurrency} disabled={busy || currencyAmount === 0} className="w-full rounded-xl bg-gradient-to-r from-rose-400 via-amber-600 to-red-800 py-2.5 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-40">
                                {currencyAmount >= 0 ? `Add ${currencyAmount}` : `Remove ${Math.abs(currencyAmount)}`}
                            </button>
                        </div>
                    )}

                    {/* ── XP ── */}
                    {tab === 'xp' && (
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-white/8 bg-white/3 px-4 py-3 text-center">
                                <p className="text-[10px] uppercase tracking-widest text-white/35">Current XP</p>
                                <p className="mt-1 text-3xl font-bold text-amber-300">
                                    {character?.xp?.current ?? 0} <span className="text-lg text-white/30">/ {character?.xp?.max ?? 100}</span>
                                </p>
                                <p className="mt-0.5 text-xs text-white/40">Level {character?.level ?? 1}</p>
                            </div>
                            <div>
                                <label className={labelClass}>XP to Grant</label>
                                <input className={inputClass} type="number" min={1} value={xpAmount} onChange={e => setXpAmount(Number(e.target.value))} />
                            </div>
                            <div className="grid grid-cols-4 gap-1.5">
                                {[25, 50, 100].map(amt => (
                                    <button key={amt} onClick={() => setXpAmount(amt)} className="rounded-lg border border-white/10 bg-white/5 py-1.5 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white">
                                        +{amt}
                                    </button>
                                ))}
                                {(() => {
                                    const needed = (character?.xp?.max ?? 100) - (character?.xp?.current ?? 0);
                                    return (
                                        <button
                                            onClick={() => setXpAmount(needed > 0 ? needed : 1)}
                                            className="rounded-lg border border-amber-400/30 bg-amber-400/10 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-400/20"
                                            title={`+${needed > 0 ? needed : 1} XP — enough to level up`}
                                        >
                                            LvUp
                                        </button>
                                    );
                                })()}
                            </div>
                            <button onClick={handleXp} disabled={busy || xpAmount <= 0} className="w-full rounded-xl bg-gradient-to-r from-rose-400 via-amber-600 to-red-800 py-2.5 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-40">
                                Grant {xpAmount} XP
                            </button>
                        </div>
                    )}

                    {/* ── Quests ── */}
                    {tab === 'quests' && (
                        <>
                            <div className="space-y-2.5">
                                <p className="text-xs font-semibold text-white/60">Add Quest</p>
                                <div>
                                    <label className={labelClass}>Quest ID * (auto snake_cased)</label>
                                    <input className={inputClass} value={questId} onChange={e => setQuestId(e.target.value)} placeholder="e.g. find_the_artifact" />
                                </div>
                                <div>
                                    <label className={labelClass}>Title *</label>
                                    <input className={inputClass} value={questTitle} onChange={e => setQuestTitle(e.target.value)} placeholder="e.g. Find the Artifact" />
                                </div>
                                <div>
                                    <label className={labelClass}>Description</label>
                                    <input className={inputClass} value={questDesc} onChange={e => setQuestDesc(e.target.value)} placeholder="One-line quest summary" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className={labelClass}>Given by</label>
                                        <input className={inputClass} value={questGiver} onChange={e => setQuestGiver(e.target.value)} placeholder="NPC name" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Reward hint</label>
                                        <input className={inputClass} value={questReward} onChange={e => setQuestReward(e.target.value)} placeholder="e.g. Gold coins" />
                                    </div>
                                </div>

                                {/* Objectives */}
                                <div>
                                    <label className={labelClass}>Objectives</label>
                                    <div className="space-y-1.5">
                                        {objectives.map((obj, i) => (
                                            <div key={i} className="flex gap-1.5">
                                                <input
                                                    className={`${inputClass} w-28 shrink-0`}
                                                    value={obj.id}
                                                    onChange={e => setObjectives(prev => prev.map((o, j) => j === i ? { ...o, id: e.target.value } : o))}
                                                    placeholder="obj_id"
                                                />
                                                <input
                                                    className={`${inputClass} flex-1`}
                                                    value={obj.description}
                                                    onChange={e => setObjectives(prev => prev.map((o, j) => j === i ? { ...o, description: e.target.value } : o))}
                                                    placeholder="Objective description"
                                                />
                                                <button onClick={() => setObjectives(prev => prev.filter((_, j) => j !== i))} className="rounded-lg border border-white/10 bg-white/5 px-2 text-white/30 hover:text-rose-300">
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => setObjectives(prev => [...prev, { id: '', description: '' }])} className="mt-2 flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70">
                                        <Plus className="h-3 w-3" /> Add objective
                                    </button>
                                </div>

                                <button onClick={handleAddQuest} disabled={busy || !questId.trim() || !questTitle.trim()} className="w-full rounded-xl bg-gradient-to-r from-rose-400 via-amber-600 to-red-800 py-2.5 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-40">
                                    Add Quest
                                </button>
                            </div>

                            {/* Active quests */}
                            {character?.quests && character.quests.filter(q => q.status === 'active').length > 0 && (
                                <div className="border-t border-white/8 pt-4">
                                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">Active Quests</p>
                                    <div className="space-y-1.5">
                                        {character.quests.filter(q => q.status === 'active').map((q, i) => (
                                            <div key={i} className="rounded-lg border border-white/6 bg-white/3 px-3 py-2">
                                                <p className="text-xs font-semibold text-white/80">{q.title}</p>
                                                <p className="mt-0.5 text-[10px] text-white/35">{q.objectives.filter(o => !o.completed).length} pending objectives</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    {/* ── Theme ── */}
                    {tab === 'theme' && (
                        <div className="space-y-4">
                            {!setting ? (
                                <p className="text-xs text-white/40">No setting loaded.</p>
                            ) : (
                                <>
                                    <div className="rounded-2xl border border-white/8 bg-white/3 px-4 py-3">
                                        <p className="text-[10px] uppercase tracking-widest text-white/35">Setting</p>
                                        <p className="mt-0.5 text-sm font-semibold text-white/80">{setting.name}</p>
                                        <p className="mt-0.5 text-xs text-white/40 capitalize">{(setting.genres ?? []).join(' · ')}</p>
                                    </div>

                                    {previewTheme && (
                                        <>
                                            {/* Colour swatches */}
                                            <div>
                                                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">Palette preview</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {([
                                                        ['bg',          'Background',   previewTheme.bg],
                                                        ['panel',       'Panel',        previewTheme.panel],
                                                        ['elevated',    'Elevated',     previewTheme.elevated],
                                                        ['accent',      'Accent',       previewTheme.accent],
                                                        ['accentStrong','Acc. Strong',  previewTheme.accentStrong],
                                                        ['muted',       'Muted text',   previewTheme.muted],
                                                    ] as [keyof SettingTheme, string, string][]).map(([key, label, val]) => (
                                                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="color"
                                                                value={val}
                                                                onChange={e => setPreviewTheme(prev => prev ? { ...prev, [key]: e.target.value } : prev)}
                                                                className="h-7 w-7 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                                                            />
                                                            <span className="text-[11px] text-white/50">{label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Font picker */}
                                            <div>
                                                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">Display font</p>
                                                <div className="grid grid-cols-2 gap-1.5">
                                                    {FONT_OPTIONS.map(f => {
                                                        const isActive = previewTheme.fontDisplay === f.fontDisplay;
                                                        return (
                                                            <button
                                                                key={f.label}
                                                                onClick={() => setPreviewTheme(prev => prev ? { ...prev, fontUrl: f.fontUrl, fontDisplay: f.fontDisplay } : prev)}
                                                                className={`rounded-lg border px-2 py-1.5 text-left text-[11px] transition ${
                                                                    isActive
                                                                        ? 'border-rose-400/50 bg-rose-500/15 text-white'
                                                                        : 'border-white/8 bg-white/3 text-white/50 hover:border-white/20 hover:text-white/80'
                                                                }`}
                                                                style={{ fontFamily: f.fontDisplay }}
                                                            >
                                                                {f.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Live preview strip */}
                                            <div
                                                className="overflow-hidden rounded-xl p-3 space-y-1"
                                                style={{ background: previewTheme.bg, border: `1px solid ${previewTheme.border}` }}
                                            >
                                                <p style={{ color: previewTheme.text, fontFamily: previewTheme.fontDisplay }} className="text-sm font-semibold">Preview</p>
                                                <p style={{ color: previewTheme.textWeak }} className="text-xs">Narrative text colour</p>
                                                <div
                                                    className="mt-2 inline-flex rounded-lg px-3 py-1 text-xs font-bold"
                                                    style={{ background: previewTheme.elevated, color: previewTheme.accentStrong, border: `1px solid ${previewTheme.border}` }}
                                                >
                                                    Accent button
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleResetTheme}
                                                    className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-semibold text-white/50 transition hover:text-white"
                                                >
                                                    Reset to default
                                                </button>
                                                <button
                                                    onClick={handleSaveTheme}
                                                    disabled={themeSaving}
                                                    className="flex-1 rounded-xl bg-gradient-to-r from-rose-400 via-amber-600 to-red-800 py-2 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-40"
                                                >
                                                    {themeSaving ? 'Saving…' : 'Save theme'}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Status toast */}
                {status && (
                    <div className="mx-4 mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-xs font-semibold text-white/80">
                        {status}
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modal, document.body);
};

export default GMAdminPanel;
