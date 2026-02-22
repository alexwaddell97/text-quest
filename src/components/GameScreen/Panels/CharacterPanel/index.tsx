import React, { useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Character, InventoryItem } from '@/types';
import { getRarityColor } from '@/utils';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameContext } from '@/context/gameContext';
import CreateCharacterModal from '@/components/GameScreen/Modals/CreateCharacterModal';
import { useSession } from 'next-auth/react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getGuestCharacters, deleteGuestCharacter } from '@/utils/guestCharacters';
import {
    Brain,
    Dumbbell,
    Feather,
    Gauge,
    HeartPulse,
    LucideIcon,
    Shield,
    Sparkles,
    Star,
    Eye,
} from 'lucide-react';

const STAT_ICON_MAP: Record<string, LucideIcon> = {
    strength: Dumbbell,
    might: Dumbbell,
    power: Dumbbell,
    agility: Feather,
    dexterity: Feather,
    finesse: Feather,
    intelligence: Brain,
    knowledge: Brain,
    wisdom: Eye,
    intuition: Eye,
    charisma: Sparkles,
    presence: Sparkles,
    spirit: Star,
    resolve: Shield,
    constitution: Shield,
    vitality: HeartPulse,
};

const getStatIcon = (key: string): LucideIcon => {
    const normalized = key.toLowerCase();
    return STAT_ICON_MAP[normalized] ?? Gauge;
};

const formatStatLabel = (label: string) =>
    label
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());

const CharacterPanel: React.FC = () => {

    const { setting, character, setCharacter } = useGameContext();
    const activeCharacterId = character?._id;
    const [characters, setCharacters] = useState<Character[]>([]);
    const [showCreateCharacterModal, setShowCreateCharacterModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const { data: session } = useSession();
    const hasSelectedSetting = Boolean(setting?._id);
    const [deletingCharacterId, setDeletingCharacterId] = useState<string | null>(null);
    const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
    const [expandedImageName, setExpandedImageName] = useState<string>('');
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const prevXpRef = useRef<number | null>(null);
    const [xpToast, setXpToast] = useState<{ amount: number; key: number } | null>(null);

    // Reset XP tracking when character changes
    useEffect(() => {
        prevXpRef.current = null;
        setXpToast(null);
    }, [character?._id]);

    // Detect XP gains and show a toast
    useEffect(() => {
        const currentXp = character?.xp?.current;
        if (currentXp === undefined || currentXp === null) return;
        if (prevXpRef.current !== null && currentXp > prevXpRef.current) {
            const gained = currentXp - prevXpRef.current;
            prevXpRef.current = currentXp;
            setXpToast({ amount: gained, key: Date.now() });
            const timer = setTimeout(() => setXpToast(null), 2800);
            return () => clearTimeout(timer);
        }
        prevXpRef.current = currentXp;
    }, [character?.xp?.current]);

    const closeExpanded = useCallback(() => setExpandedImageUrl(null), []);

    useEffect(() => {
        const settingId = setting?._id;
        const userId = session?.user?.id;

        if (!settingId) {
            setLoading(false);
            return;
        }

        if (!userId) {
            // Guest: load from localStorage filtered by setting
            setCharacters(getGuestCharacters().filter((c) => c.setting_id === settingId));
            setLoading(false);
            return;
        }

        setLoading(true);
        fetchCharacters(settingId, userId);
    }, [setting?._id, session?.user?.id]);

    const fetchCharacters = async (settingId: string, userId: string) => {
        try {
            const response = await fetch(`/api/characters?settingId=${settingId}&userId=${userId}`);
            const data = await response.json();
            setCharacters(data);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.error('Error fetching characters:', error);
        }
    };

    const handleModalClose = () => {
        setShowCreateCharacterModal(false);
        const settingId = setting?._id;
        if (settingId && session?.user?.id) {
            fetchCharacters(settingId, session.user.id);
        } else if (settingId) {
            // Guest: reload from localStorage
            setCharacters(getGuestCharacters().filter((c) => c.setting_id === settingId));
        }
    };

    const renderPanelSkeleton = () => (
        <div className="flex h-full flex-col gap-5 animate-pulse">
            <div className="space-y-3">
                <div className="h-3 w-24 rounded-full bg-white/10" />
                <div className="h-6 w-3/4 rounded-full bg-white/15" />
                <div className="h-4 w-1/2 rounded-full bg-white/10" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                {[1, 2].map((key) => (
                    <div key={key} className="h-20 rounded-2xl border border-white/10 bg-white/5" />
                ))}
            </div>
            <div className="space-y-3">
                {[...Array(4)].map((_, idx) => (
                    <div key={idx} className="h-24 rounded-2xl border border-white/10 bg-white/5" />
                ))}
            </div>
        </div>
    );

    const lightbox = expandedImageUrl
        ? createPortal(
            <div
                className="fixed inset-0 z-[2147483648] flex items-center justify-center bg-black/85 backdrop-blur-md p-6"
                onClick={closeExpanded}
                onKeyDown={(e) => e.key === 'Escape' && closeExpanded()}
                role="dialog"
                aria-modal="true"
                aria-label="Character portrait"
                tabIndex={-1}
            >
                <div className="relative max-h-[80vh] max-w-[80vh] w-full">
                    <Image
                        unoptimized
                        src={expandedImageUrl}
                        alt={expandedImageName || 'Character portrait'}
                        width={1024}
                        height={1024}
                        className="rounded-3xl border border-white/15 object-cover shadow-2xl"
                    />
                    <button
                        onClick={closeExpanded}
                        className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white/80 hover:text-white"
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>,
            document.body
        )
        : null;

    return (
        <>
            {lightbox}
            {showCreateCharacterModal && <CreateCharacterModal onClose={handleModalClose} />}
            <div className="flex h-full min-h-0 flex-col rounded-[28px] border border-white/10 bg-[var(--panel)] p-5 text-white shadow-[0_30px_90px_rgba(5,7,14,0.6)]">
                {!setting ? (
                    renderPanelSkeleton()
                ) : character ? (
                    <div className="flex flex-1 min-h-0 flex-col gap-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                {character.image_url && (
                                    <div
                                        className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-white/15 cursor-zoom-in"
                                        onClick={() => { setExpandedImageUrl(character.image_url!); setExpandedImageName(character.name); }}
                                        title="Click to expand"
                                    >
                                        <Image
                                            unoptimized
                                            src={character.image_url}
                                            alt={`${character.name} portrait`}
                                            width={48}
                                            height={48}
                                            className="h-full w-full object-cover object-top"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition hover:bg-black/30 hover:opacity-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0zm0 0l4 4" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 8v6M8 11h6" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs uppercase tracking-[0.35em] text-white/45">Character Sheet</p>
                                    <h2 className="text-xl font-semibold">{character.name}</h2>
                                    <div className="flex items-center gap-1 text-sm text-white/65">
                                        <span>{character.race}</span>
                                        {character.gender && (
                                            <>
                                                <span>·</span>
                                                <div className="group relative flex items-center">
                                                    {character.gender === 'male' && (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <circle cx="10" cy="14" r="5"/>
                                                            <line x1="14" y1="10" x2="21" y2="3"/>
                                                            <polyline points="17 3 21 3 21 7"/>
                                                        </svg>
                                                    )}
                                                    {character.gender === 'female' && (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-pink-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <circle cx="12" cy="8" r="5"/>
                                                            <line x1="12" y1="13" x2="12" y2="21"/>
                                                            <line x1="9" y1="18" x2="15" y2="18"/>
                                                        </svg>
                                                    )}
                                                    {character.gender === 'non-specific' && (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <circle cx="12" cy="12" r="5"/>
                                                            <line x1="12" y1="3" x2="12" y2="7"/>
                                                            <line x1="12" y1="17" x2="12" y2="21"/>
                                                            <line x1="3" y1="12" x2="7" y2="12"/>
                                                            <line x1="17" y1="12" x2="21" y2="12"/>
                                                        </svg>
                                                    )}
                                                    <div className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[var(--elevated)] px-2 py-1 text-[10px] font-semibold text-white/70 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                                        {character.gender === 'non-specific' ? 'Nonbinary' : character.gender.charAt(0).toUpperCase() + character.gender.slice(1)}
                                                        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[var(--elevated)]" />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        <span>· Level {character.level}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCharacter(null)}
                                    className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-medium text-white/80 transition hover:border-white/40 hover:text-white"
                                >
                                    Switch
                                </button>
                                <button
                                    onClick={() => setShowCreateCharacterModal(true)}
                                    className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-medium text-white/80 transition hover:border-white/40 hover:text-white"
                                >
                                    New
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="rounded-xl border border-white/10 bg-white/3 px-3 py-2.5">
                                <div className="flex items-center justify-between text-xs text-white/60">
                                    <span>Experience</span>
                                    <span>
                                        {character.xp.current} XP · {character.xp.max - character.xp.current} to next level
                                    </span>
                                </div>
                                <div className="mt-2 h-3 rounded-full bg-white/10">
                                    <motion.div
                                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500"
                                        initial={{ width: '0%' }}
                                        animate={{ width: `${Math.min(100, Math.round((character.xp.current / Math.max(character.xp.max, 1)) * 100))}%` }}
                                        transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
                                    />
                                </div>
                                <AnimatePresence>
                                    {xpToast && (
                                        <motion.div
                                            key={xpToast.key}
                                            initial={{ opacity: 0, y: -4, scale: 0.85 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.9 }}
                                            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                                            className="mt-2 flex items-center gap-1.5"
                                        >
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
                                            <span className="text-[10px] font-bold text-emerald-400">+{xpToast.amount} XP</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/3 px-3 py-2.5">
                                <div className="flex items-center justify-between text-xs text-white/60">
                                    <span>Health</span>
                                    <span>
                                        {character.health.current} / {character.health.max}
                                    </span>
                                </div>
                                <div className="mt-2 h-3 rounded-full bg-white/10">
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            background: 'var(--theme-btn)',
                                            width: `${Math.min(100, Math.round((character.health.current / Math.max(character.health.max, 1)) * 100))}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        {/* Compact stats strip */}
                        {character?.stats && Object.keys(character.stats).length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {Object.entries(character.stats).map(([key, value]) => {
                                    const Icon = getStatIcon(key);
                                    return (
                                        <div
                                            key={key}
                                            title={formatStatLabel(key)}
                                            className="group relative flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5"
                                        >
                                            <Icon className="h-3 w-3 text-white/40" aria-hidden />
                                            <span className="text-xs font-bold text-white/80">{typeof value === 'number' ? value : '--'}</span>
                                            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[var(--elevated)] px-2 py-1 text-[10px] font-semibold text-white/70 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                                {formatStatLabel(key)}
                                                <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[var(--elevated)]" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {/* Inventory — fills remaining space */}
                        <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-white/10 bg-white/3 overflow-hidden">
                            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/5">
                                <p className="text-xs uppercase tracking-[0.35em] text-white/45">Inventory</p>
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10.5c0-1.1.9-2 2.5-2s2.5.9 2.5 2c0 1-.7 1.7-1.5 2l-1 .5c-.8.4-1.5 1.1-1.5 2 0 1.1.9 2 2.5 2s2.5-.9 2.5-2"/></svg>
                                        {character.currency ?? 0}
                                    </span>
                                    <span className="text-[10px] text-white/30">{character.inventory.length} items</span>
                                </div>
                            </div>
                            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-white/5">
                                {character.inventory.length === 0 ? (
                                    <p className="text-xs text-white/40 italic">Empty pack. Loot awaits.</p>
                                ) : (
                                    <ul className="space-y-1.5">
                                        {character.inventory.map((item: InventoryItem, index: number) => {
                                            const rarityDot: Record<string, string> = {
                                                unique: 'bg-gradient-to-br from-purple-400 to-pink-500',
                                                legendary: 'bg-orange-400',
                                                rare: 'bg-blue-400',
                                                uncommon: 'bg-emerald-400',
                                                common: 'bg-white/40',
                                            };
                                            const isSelected = selectedItem?.name === item.name;
                                            return (
                                                <li key={`${item.name}-${index}`}>
                                                    <button
                                                        onClick={() => setSelectedItem(isSelected ? null : item)}
                                                        className={`group w-full flex items-center gap-2.5 rounded-xl border px-3 py-2 transition text-left ${
                                                            isSelected
                                                                ? 'border-white/20 bg-white/8'
                                                                : 'border-white/8 bg-black/20 hover:border-white/15 hover:bg-white/5'
                                                        }`}
                                                    >
                                                        <span className={`h-2 w-2 flex-shrink-0 rounded-full ${rarityDot[item.rarity] ?? 'bg-white/30'}`} />
                                                        <span className={`flex-1 truncate text-xs font-semibold ${getRarityColor(item.rarity)}`}>
                                                            {item.name}
                                                        </span>
                                                        {item.quantity > 1 && (
                                                            <span className="flex-shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white/60">×{item.quantity}</span>
                                                        )}
                                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 flex-shrink-0 text-white/25 transition-transform ${ isSelected ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>
                                                    {isSelected && (
                                                        <div className="mt-1 rounded-xl border border-white/10 bg-black/30 px-3 py-3 space-y-2.5">
                                                            {item.description && (
                                                                <p className="text-xs text-white/70 leading-relaxed">{item.description}</p>
                                                            )}
                                                            {item.location_context && (
                                                                <div className="flex items-start gap-2">
                                                                    <span className="mt-0.5 flex-shrink-0 text-white/30">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                                                    </span>
                                                                    <p className="text-[11px] text-white/50 leading-snug">{item.location_context}</p>
                                                                </div>
                                                            )}
                                                            {item.usable_at && (
                                                                <div className="flex items-start gap-2">
                                                                    <span className="mt-0.5 flex-shrink-0 text-amber-400/50">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                                                    </span>
                                                                    <p className="text-[11px] text-amber-300/60 leading-snug">{item.usable_at}</p>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-1.5 pt-0.5">
                                                                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                                                    item.rarity === 'unique' ? 'bg-purple-400/15 text-purple-300' :
                                                                    item.rarity === 'legendary' ? 'bg-orange-400/15 text-orange-300' :
                                                                    item.rarity === 'rare' ? 'bg-blue-400/15 text-blue-300' :
                                                                    item.rarity === 'uncommon' ? 'bg-emerald-400/15 text-emerald-300' :
                                                                    'bg-white/10 text-white/40'
                                                                }`}>{item.rarity}</span>
                                                                {item.quantity > 1 && (
                                                                    <span className="text-[9px] text-white/30">×{item.quantity} in pack</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex h-full flex-col">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.35em] text-white/45">Characters</p>
                                <h2 className="text-xl font-semibold">Choose your hero</h2>
                            </div>
                            <motion.button
                                onClick={() => setShowCreateCharacterModal(true)}
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                +
                            </motion.button>
                        </div>
                        <div className="mt-5 flex-1 overflow-y-auto px-1 py-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-white/5">
                            {!hasSelectedSetting ? (
                                <p className="text-sm text-white/60">Choose a world to load relevant characters.</p>
                            ) : loading ? (
                                <div className="flex h-full items-center justify-center">
                                    <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/20" style={{ borderTopColor: 'var(--accent)' }} />
                                </div>
                            ) : characters.length === 0 ? (
                                <p className="text-sm text-white/60">No characters yet. Create one to get tailored prompts.</p>
                            ) : (
                                characters.map((char, index) => (
                                    <motion.div
                                        key={index}
                                        onClick={() => setCharacter(char)}
                                        className="group relative mb-4 rounded-2xl border border-white/10 bg-white/3 p-4 text-left text-white transition hover:border-white/40"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (deletingCharacterId) {
                                                    return;
                                                }
                                                const charId = char._id;
                                                const wasActive = activeCharacterId === charId;
                                                setDeletingCharacterId(charId);
                                                let wasActiveChar = false;
                                                try {
                                                    if (!session?.user?.id) {
                                                        // Guest: delete from localStorage
                                                        deleteGuestCharacter(charId);
                                                        const settingId = setting?._id;
                                                        if (settingId) {
                                                            setCharacters(getGuestCharacters().filter((c) => c.setting_id === settingId));
                                                        }
                                                    } else {
                                                        const response = await fetch(`/api/characters/delete`, {
                                                            method: 'POST',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                            },
                                                            body: JSON.stringify({ characterId: charId }),
                                                        });
                                                        if (!response.ok) {
                                                            throw new Error('Failed to delete character');
                                                        }
                                                        if (setting?._id && session?.user?.id) {
                                                            fetchCharacters(setting._id, session.user.id);
                                                        }
                                                    }
                                                    wasActiveChar = wasActive;
                                                } catch (error) {
                                                    console.error('Error deleting character:', error);
                                                } finally {
                                                    setDeletingCharacterId(null);
                                                    if (wasActiveChar) {
                                                        setCharacter(null);
                                                    }
                                                }
                                            }}
                                            disabled={deletingCharacterId === char._id}
                                            className={`absolute right-3 top-3 rounded-full border p-1 transition ${
                                                deletingCharacterId === char._id
                                                    ? 'cursor-wait border-white/15 bg-white/5 text-white/50'
                                                    : 'border-white/20 bg-white/10 text-white/70 hover:border-red-400/60 hover:text-red-200'
                                            }`}
                                            aria-label="Delete character"
                                        >
                                            {deletingCharacterId === char._id ? (
                                                <LoadingSpinner size={12} className="text-white" label="Deleting character" />
                                            ) : (
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-3.5 w-3.5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                    <line x1="6" y1="18" x2="18" y2="6" />
                                                </svg>
                                            )}
                                        </button>
                                        <div className="flex items-center gap-3 mb-1 min-w-0 pr-8">
                                            {char.image_url && (
                                                <div
                                                    className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg border border-white/15 cursor-zoom-in"
                                                    onClick={(e) => { e.stopPropagation(); setExpandedImageUrl(char.image_url!); setExpandedImageName(char.name); }}
                                                    title="Click to expand"
                                                >
                                                    <Image
                                                        unoptimized
                                                        src={char.image_url}
                                                        alt={`${char.name} portrait`}
                                                        width={36}
                                                        height={36}
                                                        className="h-full w-full object-cover object-top"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition hover:bg-black/30 hover:opacity-100">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0zm0 0l4 4" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 8v6M8 11h6" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}
                                            <h3 className="text-lg font-semibold truncate">{char.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm text-white/70">
                                            <span>{char.race}</span>
                                            {char.gender && (
                                                <>
                                                    <span>·</span>
                                                    <div className="group/gender relative flex items-center">
                                                        {char.gender === 'male' && (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <circle cx="10" cy="14" r="5"/>
                                                                <line x1="14" y1="10" x2="21" y2="3"/>
                                                                <polyline points="17 3 21 3 21 7"/>
                                                            </svg>
                                                        )}
                                                        {char.gender === 'female' && (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-pink-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <circle cx="12" cy="8" r="5"/>
                                                                <line x1="12" y1="13" x2="12" y2="21"/>
                                                                <line x1="9" y1="18" x2="15" y2="18"/>
                                                            </svg>
                                                        )}
                                                        {char.gender === 'non-specific' && (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <circle cx="12" cy="12" r="5"/>
                                                                <line x1="12" y1="3" x2="12" y2="7"/>
                                                                <line x1="12" y1="17" x2="12" y2="21"/>
                                                                <line x1="3" y1="12" x2="7" y2="12"/>
                                                                <line x1="17" y1="12" x2="21" y2="12"/>
                                                            </svg>
                                                        )}
                                                        <div className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[var(--elevated)] px-2 py-1 text-[10px] font-semibold text-white/70 opacity-0 shadow-lg transition-opacity group-hover/gender:opacity-100">
                                                            {char.gender === 'non-specific' ? 'Nonbinary' : char.gender.charAt(0).toUpperCase() + char.gender.slice(1)}
                                                            <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[var(--elevated)]" />
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            <span>· Level {char.level}</span>
                                        </div>
                                        <div className="mt-3 h-2 rounded-full bg-white/10">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                                                style={{ width: `${Math.min(100, Math.round((char.xp.current / Math.max(char.xp.max, 1)) * 100))}%` }}
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-white/60">{char.xp.current} XP · {char.xp.max - char.xp.current} to next</p>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default CharacterPanel;