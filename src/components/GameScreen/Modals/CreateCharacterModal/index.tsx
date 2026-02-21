import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useGameContext } from '@/context/gameContext';
import { useSession } from 'next-auth/react';
import { Brain, Dumbbell, Feather, Gauge, LucideIcon, Package, Sparkles, X } from 'lucide-react';
import { saveGuestCharacter, buildGuestCharacter, applyGuestInventoryChanges } from '@/utils/guestCharacters';

type StatKey = 'strength' | 'agility' | 'intelligence' | 'charisma';
type StatMap = Record<StatKey, number>;
type RightTab = 'attributes' | 'inventory';

interface StartingItem {
    name: string;
    description: string;
    rarity: 'common' | 'uncommon';
    quantity: number;
}

const STAT_DETAILS: Record<StatKey, { label: string; description: string; Icon: LucideIcon }> = {
    strength: { label: 'Strength', description: 'Brute force, resilience, and martial presence.', Icon: Dumbbell },
    agility: { label: 'Agility', description: 'Speed, finesse, and the way you move through chaos.', Icon: Feather },
    intelligence: { label: 'Intelligence', description: 'Problem-solving instincts and arcane insight.', Icon: Brain },
    charisma: { label: 'Charisma', description: 'Social gravity, charm, and leadership energy.', Icon: Sparkles },
};

const createInitialStats = (): StatMap => ({ strength: 10, agility: 10, intelligence: 10, charisma: 10 });

/** Derives the four stat values from the chosen focus (12) and flaw (8) selections. */
function computeStats(primary: StatKey | null, weak: StatKey | null): StatMap {
    const base = createInitialStats();
    if (primary) base[primary] = 12;
    if (weak && weak !== primary) base[weak] = 8;
    return base;
}

interface CreateCharacterModalProps {
    onClose: () => void;
}

const CreateCharacterModal: React.FC<CreateCharacterModalProps> = ({ onClose }) => {
    const { setting } = useGameContext();
    const [characterName, setCharacterName] = useState('');
    const [characterRace, setCharacterRace] = useState('');
    const [characterGender, setCharacterGender] = useState<'male' | 'female' | 'non-specific' | ''>('');
    const [characterDescription, setCharacterDescription] = useState('');
    const [characterBackstory, setCharacterBackstory] = useState('');
    const [primaryStat, setPrimaryStat] = useState<StatKey | null>(null);
    const [weakStat, setWeakStat] = useState<StatKey | null>(null);
    const [rightTab, setRightTab] = useState<RightTab>('attributes');
    const [startingInventory, setStartingInventory] = useState<StartingItem[]>([]);
    const [newItemName, setNewItemName] = useState('');
    const [newItemRarity, setNewItemRarity] = useState<'common' | 'uncommon'>('common');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [characterImageUrl, setCharacterImageUrl] = useState('');
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isImageExpanded, setIsImageExpanded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const { data: session } = useSession();
    const panelBase = 'border border-white/10 bg-[var(--panel)] text-white';
    const inputBase = 'border border-white/10 bg-white/5 text-white placeholder-white/40 focus-visible:ring-[var(--accent)]/60';
    const subtleText = 'text-white/70';
    const badgeBase = 'bg-white/10 text-white/80';
    const ghostButtonBase = 'border border-white/20 text-white/80 hover:border-white hover:text-white';
    const canGeneratePortrait = characterName.trim().length > 0 && characterRace.trim().length > 0 && characterDescription.trim().length > 0 && characterBackstory.trim().length > 0;



    const generatePortrait = async () => {
        if (isGeneratingImage) {
            return;
        }

        setIsGeneratingImage(true);
        setImageError(false);
        try {
            const response = await fetch('/api/generate/character-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: characterName,
                    race: characterRace,
                    description: characterDescription,
                    backstory: characterBackstory,
                    setting,
                }),
            });
            const data = await response.json();
            if (data.imageUrl) {
                setCharacterImageUrl(data.imageUrl);
                setImageError(false);
            } else {
                setImageError(true);
            }
        } catch (error) {
            console.error('Error generating portrait:', error);
            setImageError(true);
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const generateCharacter = async () => {
        if (isGenerating) {
            return;
        }

        setIsGenerating(true);
        try {
            const hints: Record<string, string> = {};
            if (characterName.trim())        hints.name        = characterName.trim();
            if (characterRace.trim())        hints.race        = characterRace.trim();
            if (characterGender)             hints.gender      = characterGender;
            if (characterDescription.trim()) hints.description = characterDescription.trim();
            if (characterBackstory.trim())   hints.backstory   = characterBackstory.trim();

            const response = await fetch('/api/generate/character', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ setting: setting, hints }),
            });
            const data = await response.json();
            const { name, race, description, backstory, gender } = data.character;
            if (!characterBackstory.trim())   setCharacterBackstory(backstory);
            if (!characterName.trim())        setCharacterName(name);
            if (!characterRace.trim())        setCharacterRace(race);
            if (!characterDescription.trim()) setCharacterDescription(description);
            if (!characterGender && gender && ['male', 'female', 'non-specific'].includes(gender)) {
                setCharacterGender(gender as 'male' | 'female' | 'non-specific');
            }
            const aiStats = data.character.stats ?? {};
            const statEntries: [StatKey, number][] = [
                ['strength', aiStats.Strength ?? aiStats.strength ?? 10],
                ['agility', aiStats.Agility ?? aiStats.agility ?? 10],
                ['intelligence', aiStats.Intelligence ?? aiStats.intelligence ?? 10],
                ['charisma', aiStats.Charisma ?? aiStats.charisma ?? 10],
            ];
            const sortedStats = [...statEntries].sort((a, b) => b[1] - a[1]);
            setPrimaryStat(sortedStats[0][0]);
            setWeakStat(sortedStats[sortedStats.length - 1][0]);
            const aiInventory: StartingItem[] = (data.character.starting_inventory ?? []).map((item: any) => ({
                name: item.name ?? '',
                description: item.description ?? '',
                rarity: item.rarity === 'uncommon' ? 'uncommon' : 'common',
                quantity: Math.max(1, item.quantity ?? 1),
            }));
            if (aiInventory.length > 0) {
                setStartingInventory(aiInventory);
                setRightTab('inventory');
            }
        } catch (error) {
            console.error('Error generating character:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCreateCharacter = async () => {
        if (isSubmitting) return;
        const stats = computeStats(primaryStat, weakStat);
        const inventoryChanges = startingInventory.map(item => ({
            action: 'add' as const,
            name: item.name,
            description: item.description,
            rarity: item.rarity,
            quantity: item.quantity,
            location_context: 'Starting equipment',
            usable_at: 'anywhere',
        }));

        setIsSubmitting(true);
        try {
            if (!session?.user?.id) {
                const guestChar = buildGuestCharacter(
                    {
                        name: characterName,
                        race: characterRace,
                        description: characterDescription,
                        backstory: characterBackstory,
                        stats,
                        image_url: characterImageUrl || undefined,
                        gender: characterGender || undefined,
                    },
                    setting?._id ?? '',
                );
                saveGuestCharacter(guestChar);
                if (inventoryChanges.length > 0) {
                    applyGuestInventoryChanges(String(guestChar._id), inventoryChanges, 0);
                }
                onClose();
                return;
            }

            const characterData = {
                name: characterName,
                race: characterRace,
                description: characterDescription,
                backstory: characterBackstory,
                stats,
                image_url: characterImageUrl || undefined,
                gender: characterGender || undefined,
            };
            const response = await fetch('/api/characters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ character: characterData, settingId: setting?._id, userId: session?.user?.id }),
            });
            if (!response.ok) throw new Error('Failed to submit character');
            const created = await response.json();

            if (inventoryChanges.length > 0 && created.characterId) {
                await fetch('/api/characters/inventory', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ characterId: created.characterId, changes: inventoryChanges }),
                });
            }

            onClose();
        } catch (error) {
            console.error('Error submitting character:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const lightbox = isImageExpanded && characterImageUrl
        ? createPortal(
            <div
                className="fixed inset-0 z-[2147483648] flex items-center justify-center bg-black/85 backdrop-blur-md p-6"
                onClick={() => setIsImageExpanded(false)}
                onKeyDown={(e) => e.key === 'Escape' && setIsImageExpanded(false)}
                role="dialog"
                aria-modal="true"
                aria-label="Character portrait"
                tabIndex={-1}
            >
                <div className="relative max-h-[80vh] max-w-[80vh] w-full">
                    <Image
                        unoptimized
                        src={characterImageUrl}
                        alt={characterName || 'Character portrait'}
                        width={1024}
                        height={1024}
                        className="rounded-3xl border border-white/15 object-cover shadow-2xl"
                    />
                    <button
                        onClick={() => setIsImageExpanded(false)}
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
        <Modal isOpen={true} onClose={onClose} width='max-w-[1200px]'>
            <div className="flex flex-col gap-5 p-4 text-sm">
                {/* <div className={`relative rounded-3xl px-5 py-4 ${panelBase}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className={`text-[11px] font-semibold uppercase tracking-[0.35em] ${subtleText}`}>Session Prep</p>
                            <h2 className="text-xl font-semibold">Create your character</h2>
                        </div>
                        <span className={`rounded-full px-4 py-1 text-[11px] uppercase tracking-[0.3em] ${badgeBase}`}>
                            {setting?.genre ?? 'Story Seed'}
                        </span>
                    </div>
                    <p className="mt-2 text-xs text-white/70">
                        Tune the core snapshot of your hero so they can drop straight into <span className="font-semibold text-white">{setting?.name ?? 'this setting'}</span> without extra prompts.
                    </p>
                </div> */}

                <div className="grid gap-5 lg:grid-cols-2">
                    <div className={`rounded-3xl px-5 py-5 ${panelBase}`}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className={`text-[11px] font-semibold uppercase tracking-[0.35em] ${subtleText}`}>Identity</p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={generateCharacter}
                                    disabled={isGenerating}
                                    className={`rounded-full border px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] transition ${
                                        isGenerating ? 'cursor-not-allowed border-white/10 text-white/40' : 'border-white/25 text-white/80 hover:border-white hover:text-white'
                                    }`}
                                >
                                    {isGenerating ? (
                                        <span className="flex items-center gap-2">
                                            <LoadingSpinner size={12} className="text-white" />
                                            <span>Auto-filling</span>
                                        </span>
                                    ) : (
                                        'Auto-fill'
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-4">
                            <div
                                className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-black/30 ${characterImageUrl && !isGeneratingImage ? 'cursor-zoom-in' : ''}`}
                                onClick={() => characterImageUrl && !isGeneratingImage && setIsImageExpanded(true)}
                                title={characterImageUrl ? 'Click to expand' : undefined}
                            >
                                {isGeneratingImage ? (
                                    <div className="flex h-full w-full items-center justify-center" style={{ color: 'var(--accent)' }}>
                                        <LoadingSpinner size={20} />
                                    </div>
                                ) : characterImageUrl ? (
                                    <>
                                        <Image
                                            unoptimized
                                            src={characterImageUrl}
                                            alt={characterName || 'Character portrait'}
                                            width={64}
                                            height={64}
                                            className="h-full w-full object-cover object-top"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition hover:bg-black/30 hover:opacity-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0zm0 0l4 4" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 8v6M8 11h6" />
                                            </svg>
                                        </div>
                                    </>
                                ) : imageError ? (
                                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                        </svg>
                                        <span className="text-[9px] leading-tight text-rose-400/80">Rejected</span>
                                    </div>
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-white/20">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="group relative">
                                <button
                                    type="button"
                                    onClick={generatePortrait}
                                    disabled={isGeneratingImage || !canGeneratePortrait}
                                    className={`rounded-full border px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] transition ${
                                        isGeneratingImage || !canGeneratePortrait
                                            ? 'cursor-not-allowed border-white/10 text-white/40'
                                            : 'border-white/25 text-white/80 hover:border-white hover:text-white'
                                    }`}
                                >
                                    {isGeneratingImage ? (
                                        <span className="flex items-center gap-2">
                                            <LoadingSpinner size={12} className="text-white" />
                                            <span>Generating</span>
                                        </span>
                                    ) : (
                                        characterImageUrl ? 'Regenerate portrait' : imageError ? 'Retry portrait' : 'Generate portrait'
                                    )}
                                </button>
                                {!canGeneratePortrait && !isGeneratingImage && (
                                    <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-[var(--elevated)] px-3 py-2 text-[10px] text-white/70 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                        Fill in name, lineage, description &amp; backstory first
                                        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[var(--elevated)]" />
                                    </div>
                                )}
                            </div>
                            <div className="ml-auto flex items-center gap-1.5">
                                {/* Male */}
                                <div className="group relative">
                                    <button
                                        type="button"
                                        onClick={() => setCharacterGender(characterGender === 'male' ? '' : 'male')}
                                        className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
                                            characterGender === 'male'
                                                ? 'border-blue-400/60 bg-blue-400/15 text-blue-400'
                                                : 'border-white/15 text-white/30 hover:border-blue-400/40 hover:text-blue-400/70'
                                        }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <circle cx="10" cy="14" r="5"/>
                                            <line x1="14" y1="10" x2="21" y2="3"/>
                                            <polyline points="17 3 21 3 21 7"/>
                                        </svg>
                                    </button>
                                    <div className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[var(--elevated)] px-2 py-1 text-[10px] font-semibold text-white/70 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                        Male
                                        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[var(--elevated)]" />
                                    </div>
                                </div>
                                {/* Female */}
                                <div className="group relative">
                                    <button
                                        type="button"
                                        onClick={() => setCharacterGender(characterGender === 'female' ? '' : 'female')}
                                        className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
                                            characterGender === 'female'
                                                ? 'border-pink-400/60 bg-pink-400/15 text-pink-400'
                                                : 'border-white/15 text-white/30 hover:border-pink-400/40 hover:text-pink-400/70'
                                        }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <circle cx="12" cy="8" r="5"/>
                                            <line x1="12" y1="13" x2="12" y2="21"/>
                                            <line x1="9" y1="18" x2="15" y2="18"/>
                                        </svg>
                                    </button>
                                    <div className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[var(--elevated)] px-2 py-1 text-[10px] font-semibold text-white/70 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                        Female
                                        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[var(--elevated)]" />
                                    </div>
                                </div>
                                {/* Nonbinary */}
                                <div className="group relative">
                                    <button
                                        type="button"
                                        onClick={() => setCharacterGender(characterGender === 'non-specific' ? '' : 'non-specific')}
                                        className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
                                            characterGender === 'non-specific'
                                                ? 'border-white/50 bg-white/10 text-white/80'
                                                : 'border-white/15 text-white/30 hover:border-white/35 hover:text-white/60'
                                        }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <circle cx="12" cy="12" r="5"/>
                                            <line x1="12" y1="3" x2="12" y2="7"/>
                                            <line x1="12" y1="17" x2="12" y2="21"/>
                                            <line x1="3" y1="12" x2="7" y2="12"/>
                                            <line x1="17" y1="12" x2="21" y2="12"/>
                                        </svg>
                                    </button>
                                    <div className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[var(--elevated)] px-2 py-1 text-[10px] font-semibold text-white/70 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                        Nonbinary
                                        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[var(--elevated)]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-[12px] font-semibold text-white/80">Name</label>
                                <input
                                    type="text"
                                    value={characterName}
                                    onChange={(e) => setCharacterName(e.target.value)}
                                    className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm font-medium text-white placeholder-white/40 shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60"
                                />
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-white/80">Lineage / Race</label>
                                <input
                                    type="text"
                                    value={characterRace}
                                    onChange={(e) => setCharacterRace(e.target.value)}
                                    className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm font-medium text-white placeholder-white/40 shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60"
                                />
                            </div>
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2 md:[grid-auto-rows:minmax(0,1fr)]">
                            <div className="flex h-full flex-col gap-2">
                                <label className="text-[12px] font-semibold text-white/80">Short Description</label>
                                <textarea
                                    rows={3}
                                    value={characterDescription}
                                    onChange={(e) => setCharacterDescription(e.target.value)}
                                    className="flex-1 min-h-[140px] w-full resize-none rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/40 shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60"
                                />
                                <p className="text-[11px] text-white/55">A crisp snapshot keeps tone and abilities aligned with the setting.</p>
                            </div>
                            <div className="flex h-full flex-col gap-2">
                                <label className="text-[12px] font-semibold text-white/80">Backstory</label>
                                <textarea
                                    rows={4}
                                    value={characterBackstory}
                                    onChange={(e) => setCharacterBackstory(e.target.value)}
                                    className="flex-1 min-h-[180px] w-full resize-none rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/40 shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60"
                                />
                                <p className="text-[11px] text-white/55">Give just enough lore to prime motivations without boxing the AI in.</p>
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-white/55">Concise, high-signal details keep the AI in sync without extra exposition mid-session.</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* Tabs */}
                        <div className="flex gap-1 rounded-2xl border border-white/10 bg-white/3 p-1">
                            {(['attributes', 'inventory'] as RightTab[]).map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setRightTab(tab)}
                                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] transition ${
                                        rightTab === tab
                                            ? 'bg-white/10 text-white shadow-inner'
                                            : 'text-white/40 hover:text-white/60'
                                    }`}
                                >
                                    {tab === 'inventory' && <Package className="h-3 w-3" />}
                                    {tab}
                                    {tab === 'inventory' && startingInventory.length > 0 && (
                                        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/30 font-mono text-[9px] font-bold leading-none text-amber-400">
                                            {startingInventory.length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className={`rounded-3xl px-5 py-5 ${panelBase}`}>
                            {rightTab === 'attributes' ? (
                                <>
                                    <p className={`text-[11px] font-semibold uppercase tracking-[0.35em] mb-0.5 ${subtleText}`}>Attributes</p>
                                    <p className="text-base font-semibold mb-5">Define your character</p>

                                    <div className="flex flex-col gap-5">
                                        {/* Focus */}
                                        <div>
                                            <div className="mb-2.5 flex items-center gap-2">
                                                <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-400/80">Focus</span>
                                                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">12</span>
                                                <span className="text-[10px] text-white/30">What defines you</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {(Object.entries(STAT_DETAILS) as [StatKey, (typeof STAT_DETAILS)[StatKey]][]).map(([stat, detail]) => {
                                                    const Icon = detail.Icon;
                                                    const selected = primaryStat === stat;
                                                    return (
                                                        <button
                                                            key={stat}
                                                            type="button"
                                                            onClick={() => {
                                                                setPrimaryStat(stat);
                                                                if (weakStat === stat) setWeakStat(null);
                                                            }}
                                                            style={selected ? { background: 'var(--theme-btn)' } : undefined}
                                                            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                                                                selected
                                                                    ? 'text-white shadow'
                                                                    : 'border border-white/12 bg-white/3 text-white/55 hover:border-white/25 hover:text-white/80'
                                                            }`}
                                                        >
                                                            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                                            {detail.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Flaw */}
                                        <div>
                                            <div className="mb-2.5 flex items-center gap-2">
                                                <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/45">Flaw</span>
                                                <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-bold text-white/45">8</span>
                                                <span className="text-[10px] text-white/30">Where you fall short</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {(Object.entries(STAT_DETAILS) as [StatKey, (typeof STAT_DETAILS)[StatKey]][]).map(([stat, detail]) => {
                                                    const Icon = detail.Icon;
                                                    const selected = weakStat === stat;
                                                    const disabled = stat === primaryStat;
                                                    return (
                                                        <button
                                                            key={stat}
                                                            type="button"
                                                            onClick={() => { if (!disabled) setWeakStat(stat); }}
                                                            disabled={disabled}
                                                            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                                                                selected
                                                                    ? 'border border-white/20 bg-white/8 text-white shadow-inner'
                                                                    : disabled
                                                                    ? 'cursor-not-allowed border border-white/5 bg-white/2 text-white/20'
                                                                    : 'border border-white/12 bg-white/3 text-white/55 hover:border-white/25 hover:text-white/80'
                                                            }`}
                                                        >
                                                            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                                            {detail.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stat preview cards */}
                                    <div className="mt-5 grid grid-cols-2 gap-2">
                                        {(Object.entries(STAT_DETAILS) as [StatKey, (typeof STAT_DETAILS)[StatKey]][]).map(([stat, detail]) => {
                                            const value = computeStats(primaryStat, weakStat)[stat];
                                            const isFocus = stat === primaryStat;
                                            const isFlaw = stat === weakStat;
                                            const Icon = detail.Icon ?? Gauge;
                                            return (
                                                <div
                                                    key={stat}
                                                    className={`rounded-xl border px-3 py-2.5 transition ${
                                                        isFocus ? 'border-amber-500/25 bg-amber-500/5'
                                                        : isFlaw ? 'border-white/10 bg-white/3'
                                                        : 'border-white/6 bg-black/10'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`rounded-lg p-1.5 ${
                                                                isFocus ? 'bg-amber-500/15 text-amber-400'
                                                                : isFlaw ? 'bg-white/8 text-white/40'
                                                                : 'bg-white/5 text-white/30'
                                                            }`}>
                                                                <Icon className="h-3 w-3" aria-hidden />
                                                            </span>
                                                            <div>
                                                                <p className={`text-[9px] font-semibold uppercase tracking-[0.3em] ${
                                                                    isFocus ? 'text-amber-400/70' : isFlaw ? 'text-white/30' : 'text-white/25'
                                                                }`}>
                                                                    {isFocus ? 'Focus' : isFlaw ? 'Flaw' : 'Base'}
                                                                </p>
                                                                <p className="text-xs font-semibold text-white/70">{detail.label}</p>
                                                            </div>
                                                        </div>
                                                        <span className={`text-xl font-bold ${
                                                            isFocus ? 'text-amber-400' : isFlaw ? 'text-white/35' : 'text-white/40'
                                                        }`}>{value}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className={`text-[11px] font-semibold uppercase tracking-[0.35em] mb-0.5 ${subtleText}`}>Starting Inventory</p>
                                    <p className="text-base font-semibold mb-4">What you carry in</p>

                                    {/* Item list */}
                                    <div className="flex flex-col gap-2 mb-4">
                                        {startingInventory.length === 0 ? (
                                            <p className="text-center text-xs text-white/30 py-6">No items yet. Auto-fill or add below.</p>
                                        ) : (
                                            startingInventory.map((item, i) => (
                                                <div key={i} className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5">
                                                    <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-semibold text-white/85 truncate">{item.name}</span>
                                                            <span className={`shrink-0 rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wide ${
                                                                item.rarity === 'uncommon' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/8 text-white/40'
                                                            }`}>{item.rarity}</span>
                                                            {item.quantity > 1 && <span className="shrink-0 text-[10px] text-white/35">×{item.quantity}</span>}
                                                        </div>
                                                        {item.description && <p className="mt-0.5 text-[11px] text-white/40 truncate">{item.description}</p>}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setStartingInventory(prev => prev.filter((_, idx) => idx !== i))}
                                                        className="shrink-0 rounded-lg p-1 text-white/25 hover:bg-white/8 hover:text-white/60 transition"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Add item row */}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newItemName}
                                            onChange={e => setNewItemName(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && newItemName.trim()) {
                                                    setStartingInventory(prev => [...prev, { name: newItemName.trim(), description: '', rarity: newItemRarity, quantity: 1 }]);
                                                    setNewItemName('');
                                                }
                                            }}
                                            placeholder="Add an item..."
                                            className="flex-1 rounded-xl border border-white/12 bg-black/30 px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]/50"
                                        />
                                        <select
                                            value={newItemRarity}
                                            onChange={e => setNewItemRarity(e.target.value as 'common' | 'uncommon')}
                                            className="rounded-xl border border-white/12 bg-black/30 px-2 py-2 text-[11px] text-white/60 focus:outline-none"
                                        >
                                            <option value="common">Common</option>
                                            <option value="uncommon">Uncommon</option>
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!newItemName.trim()) return;
                                                setStartingInventory(prev => [...prev, { name: newItemName.trim(), description: '', rarity: newItemRarity, quantity: 1 }]);
                                                setNewItemName('');
                                            }}
                                            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[11px] font-semibold text-white/60 hover:border-white/30 hover:text-white/80 transition"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className={`flex flex-wrap items-center justify-between gap-3 rounded-3xl`}>
                    <p className="text-xs text-white/65">
                        Finalize now and jump straight into the story with synced context.
                    </p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${ghostButtonBase}`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateCharacter}
                            disabled={isSubmitting}
                            style={!isSubmitting ? { background: 'var(--theme-btn)' } : undefined}
                            className={`rounded-full px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-xl transition ${isSubmitting ? 'cursor-not-allowed bg-gradient-to-r from-white/20 via-white/10 to-white/5 text-white/70' : 'hover:opacity-90'}`}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <LoadingSpinner size={14} className="text-white" />
                                    <span>Creating...</span>
                                </span>
                            ) : (
                                'Create character'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
        </>
    );
};

export default CreateCharacterModal;
