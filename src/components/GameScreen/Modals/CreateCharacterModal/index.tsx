import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useGameContext } from '@/context/gameContext';
import { useSession } from 'next-auth/react';
import { Brain, Dumbbell, Feather, Gauge, LucideIcon, Sparkles } from 'lucide-react';
import { saveGuestCharacter, buildGuestCharacter } from '@/utils/guestCharacters';

type StatKey = 'strength' | 'agility' | 'intelligence' | 'charisma';
type StatMap = Record<StatKey, number>;

const STAT_DETAILS: Record<StatKey, { label: string; description: string; Icon: LucideIcon }> = {
    strength: { label: 'Strength', description: 'Brute force, resilience, and martial presence.', Icon: Dumbbell },
    agility: { label: 'Agility', description: 'Speed, finesse, and the way you move through chaos.', Icon: Feather },
    intelligence: { label: 'Intelligence', description: 'Problem-solving instincts and arcane insight.', Icon: Brain },
    charisma: { label: 'Charisma', description: 'Social gravity, charm, and leadership energy.', Icon: Sparkles },
};

const createInitialStats = (): StatMap => ({ strength: 0, agility: 0, intelligence: 0, charisma: 0 });
const createInitialRollCounts = (): Record<StatKey, number> => ({ strength: 0, agility: 0, intelligence: 0, charisma: 0 });

interface CreateCharacterModalProps {
    onClose: () => void;
}

const CreateCharacterModal: React.FC<CreateCharacterModalProps> = ({ onClose }) => {
    const { setting } = useGameContext();
    const [characterName, setCharacterName] = useState('');
    const [characterRace, setCharacterRace] = useState('');
    const [characterDescription, setCharacterDescription] = useState('');
    const [characterBackstory, setCharacterBackstory] = useState('');
    const [characterStats, setCharacterStats] = useState<StatMap>(createInitialStats());
    const [rollCounts, setRollCounts] = useState<Record<StatKey, number>>(createInitialRollCounts());
    const [startingLoot, setStartingLoot] = useState('');
    const [usePointAssign, setUsePointAssign] = useState(false);
    const [pointsLeft, setPointsLeft] = useState(50);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [characterImageUrl, setCharacterImageUrl] = useState('');
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isImageExpanded, setIsImageExpanded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const { data: session } = useSession();
    const panelBase = 'border border-white/10 bg-white/5 text-white';
    const inputBase = 'border border-white/10 bg-white/5 text-white placeholder-white/40 focus-visible:ring-rose-400/60';
    const subtleText = 'text-white/70';
    const badgeBase = 'bg-white/10 text-white/80';
    const ghostButtonBase = 'border border-white/20 text-white/80 hover:border-white hover:text-white';
    const frostedButtonGroup = 'border border-white/15 bg-white/5';
    const disabledRollClass = 'cursor-not-allowed bg-white/5 text-white/40';
    const canGeneratePortrait = characterName.trim().length > 0 && characterRace.trim().length > 0 && characterDescription.trim().length > 0 && characterBackstory.trim().length > 0;

    const roll4d6DropLowest = () => {
        const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
        rolls.sort((a, b) => a - b);
        return rolls.slice(1).reduce((sum, roll) => sum + roll, 0);
    };

    const rollStat = (stat: keyof typeof characterStats) => {
        if (rollCounts[stat] < 2) {
            setCharacterStats(prevStats => ({
                ...prevStats,
                [stat]: roll4d6DropLowest(),
            }));
            setRollCounts(prevCounts => ({
                ...prevCounts,
                [stat]: prevCounts[stat] + 1,
            }));
        }
    };

    const rollLoot = () => {
        const lootOptions = ['Sword', 'Shield', 'Potion', 'Gold'];
        setStartingLoot(lootOptions[Math.floor(Math.random() * lootOptions.length)]);
    };

    const handleStatChange = (stat: keyof typeof characterStats, value: number) => {
        const safeValue = Number.isNaN(value) ? 0 : value;

        if (safeValue <= 18 && pointsLeft - safeValue + characterStats[stat] >= 0) {
            setCharacterStats(prevStats => ({
                ...prevStats,
                [stat]: safeValue,
            }));
            setPointsLeft(prevPoints => prevPoints - safeValue + characterStats[stat]);
        }
    };

    const handleModeChange = (nextMode: boolean) => {
        if (nextMode === usePointAssign) {
            return;
        }

        if (nextMode) {
            setCharacterStats(createInitialStats());
            setRollCounts(createInitialRollCounts());
            setPointsLeft(50);
        }

        setUsePointAssign(nextMode);
    };

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
            const response = await fetch('/api/generate/character', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ setting: setting }),
            });
            const data = await response.json();
            const { name, race, description, backstory } = data.character;
            setCharacterBackstory(backstory);
            setCharacterName(name);
            setCharacterRace(race);
            setCharacterDescription(description);
            setCharacterStats({
                strength: roll4d6DropLowest(),
                agility: roll4d6DropLowest(),
                intelligence: roll4d6DropLowest(),
                charisma: roll4d6DropLowest(),
            });
        } catch (error) {
            console.error('Error generating character:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCreateCharacter = async () => {
        if (isSubmitting) {
            return;
        }

        const characterData = {
            name: characterName,
            race: characterRace,
            description: characterDescription,
            backstory: characterBackstory,
            stats: characterStats,
            image_url: characterImageUrl || undefined,
        };

        setIsSubmitting(true);
        try {
            if (!session?.user?.id) {
                // Guest: build and save to localStorage
                const guestChar = buildGuestCharacter(
                    {
                        name: characterName,
                        race: characterRace,
                        description: characterDescription,
                        backstory: characterBackstory,
                        stats: characterStats,
                        image_url: characterImageUrl || undefined,
                    },
                    setting?._id ?? '',
                );
                saveGuestCharacter(guestChar);
                onClose();
                return;
            }

            const response = await fetch('/api/characters', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ character: characterData, settingId: setting?._id, userId: session?.user?.id }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit character');
            }

            await response.json();
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
                                    <div className="flex h-full w-full items-center justify-center">
                                        <LoadingSpinner size={20} className="text-rose-400" />
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
                                    <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-[#1a1a1e] px-3 py-2 text-[10px] text-white/70 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                        Fill in name, lineage, description &amp; backstory first
                                        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#1a1a1e]" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-[12px] font-semibold text-white/80">Name</label>
                                <input
                                    type="text"
                                    value={characterName}
                                    onChange={(e) => setCharacterName(e.target.value)}
                                    className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm font-medium text-white placeholder-white/40 shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60"
                                />
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-white/80">Lineage / Race</label>
                                <input
                                    type="text"
                                    value={characterRace}
                                    onChange={(e) => setCharacterRace(e.target.value)}
                                    className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm font-medium text-white placeholder-white/40 shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60"
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
                                    className="flex-1 min-h-[140px] w-full resize-none rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/40 shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60"
                                />
                                <p className="text-[11px] text-white/55">A crisp snapshot keeps tone and abilities aligned with the setting.</p>
                            </div>
                            <div className="flex h-full flex-col gap-2">
                                <label className="text-[12px] font-semibold text-white/80">Backstory</label>
                                <textarea
                                    rows={4}
                                    value={characterBackstory}
                                    onChange={(e) => setCharacterBackstory(e.target.value)}
                                    className="flex-1 min-h-[180px] w-full resize-none rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/40 shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60"
                                />
                                <p className="text-[11px] text-white/55">Give just enough lore to prime motivations without boxing the AI in.</p>
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-white/55">Concise, high-signal details keep the AI in sync without extra exposition mid-session.</p>
                    </div>

                    <div className="flex flex-col gap-5">
                        <div className={`rounded-3xl px-5 py-5 ${panelBase}`}>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className={`text-[11px] font-semibold uppercase tracking-[0.35em] ${subtleText}`}>Stat approach</p>
                                    <p className="text-base font-semibold">{usePointAssign ? `Assign points [${pointsLeft}]` : 'Roll for stats'}</p>
                                </div>
                                <div className={`inline-flex rounded-full p-1 text-xs font-semibold uppercase tracking-[0.25em] ${frostedButtonGroup}`}>
                                    <button
                                        type="button"
                                        onClick={() => handleModeChange(false)}
                                        className={`rounded-full px-3 py-1 ${!usePointAssign ? 'bg-gradient-to-r from-rose-400 to-amber-500 text-white shadow-lg shadow-rose-900/20' : subtleText}`}
                                    >
                                        Roll
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleModeChange(true)}
                                        className={`rounded-full px-3 py-1 ${usePointAssign ? 'bg-gradient-to-r from-rose-400 to-amber-500 text-white shadow-lg shadow-rose-900/20' : subtleText}`}
                                    >
                                        Assign
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                {(Object.entries(STAT_DETAILS) as [StatKey, (typeof STAT_DETAILS)[StatKey]][]).map(([stat, detail]) => {
                                    const value = characterStats[stat];
                                    const rollsLeft = Math.max(0, 2 - rollCounts[stat]);
                                    const Icon = detail.Icon ?? Gauge;

                                    return (
                                        <div
                                            key={stat}
                                            className="rounded-2xl border border-white/12 bg-black/25 px-4 py-4 text-white"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="rounded-2xl bg-white/10 p-2 text-white">
                                                        <Icon className="h-4 w-4" aria-hidden />
                                                    </span>
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-[0.35em] text-white/45">Attribute</p>
                                                        <p className="text-sm font-semibold">{detail.label}</p>
                                                    </div>
                                                </div>
                                                <span className="text-2xl font-bold">{value || 0}</span>
                                            </div>
                                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-white/55">
                                                <span>{detail.description}</span>
                                                {!usePointAssign && <span>{rollsLeft} roll{rollsLeft !== 1 ? 's' : ''} left</span>}
                                            </div>
                                            <div className="mt-3">
                                                {usePointAssign ? (
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={18}
                                                        value={value}
                                                        onChange={(e) => handleStatChange(stat, parseInt(e.target.value, 10))}
                                                        className="w-full rounded-2xl border border-white/15 bg-black/40 px-3 py-2 text-center text-base font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
                                                    />
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => rollStat(stat)}
                                                        disabled={rollCounts[stat] >= 2}
                                                        className={`w-full rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${rollCounts[stat] >= 2 ? disabledRollClass : 'bg-gradient-to-r from-rose-400 via-amber-500 to-red-700 text-white shadow-lg shadow-rose-900/30 hover:opacity-90'}`}
                                                    >
                                                        Roll
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* {usePointAssign && (
                                <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/60">
                                    <span>Points remaining</span>
                                    <span className="text-lg font-semibold text-white">{pointsLeft}</span>
                                </div>
                            )} */}
                        </div>

                        {/* <div className={`rounded-3xl px-5 py-4 ${panelBase}`}>
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className={`text-[11px] font-semibold uppercase tracking-[0.35em] ${subtleText}`}>Starting kit</p>
                                    <p className="text-sm text-white/70">Prime the AI with a signature item.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={rollLoot}
                                    className={`rounded-full px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] transition ${ghostButtonBase}`}
                                >
                                    Generate
                                </button>
                            </div>
                            <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-medium">
                                {startingLoot || 'Roll to receive a signature item or resource.'}
                            </div>
                        </div> */}
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
                            className={`rounded-full px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-xl shadow-rose-900/40 transition ${isSubmitting ? 'cursor-not-allowed bg-gradient-to-r from-white/20 via-white/10 to-white/5 text-white/70' : 'bg-gradient-to-r from-rose-400 via-amber-500 to-red-700 hover:opacity-90'}`}
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
