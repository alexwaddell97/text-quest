'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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

const getStatIcon = (key: string): LucideIcon =>
    STAT_ICON_MAP[key.toLowerCase()] ?? Gauge;

const formatStatLabel = (label: string) =>
    label.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

interface Props {
    newLevel: number;
    stats: Record<string, number>;
    onConfirm: (chosenStat: string) => void;
}

const LevelUpModal: React.FC<Props> = ({ newLevel, stats, onConfirm }) => {
    const [chosen, setChosen] = useState<string | null>(null);
    const [confirming, setConfirming] = useState(false);

    const handleConfirm = () => {
        if (!chosen || confirming) return;
        setConfirming(true);
        onConfirm(chosen);
    };

    const statEntries = Object.entries(stats);

    const modal = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            {/* Glow */}
            <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-72 w-[60vw] rounded-[40%] bg-gradient-to-r from-rose-500/15 via-amber-300/10 to-red-800/15 blur-[140px]" />

            <div className="relative w-full max-w-md rounded-[28px] border border-white/10 bg-[rgba(22,22,24,0.97)] p-7 shadow-[0_40px_140px_rgba(5,6,12,0.65)]">
                {/* Header */}
                <div className="mb-6 text-center">
                    <div className="mb-3 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-rose-400/20 to-amber-400/10 p-4 ring-1 ring-rose-400/30">
                        <Star className="h-8 w-8 text-amber-300" />
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-rose-400/70">Level Up</p>
                    <h2 className="mt-1 text-3xl font-bold tracking-tight text-white">
                        Level <span className="text-amber-300">{newLevel}</span>
                    </h2>
                    <p className="mt-2 text-sm text-white/50">
                        Your journey grows stronger. Choose one attribute to improve by +1.
                    </p>
                </div>

                {/* Stat grid */}
                <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
                    {statEntries.map(([key, value]) => {
                        const Icon = getStatIcon(key);
                        const isChosen = chosen === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setChosen(key)}
                                className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-150 ${
                                    isChosen
                                        ? 'border-rose-500/50 bg-gradient-to-br from-rose-600/15 via-amber-600/10 to-red-800/15 ring-1 ring-rose-500/25'
                                        : 'border-white/10 bg-white/3 hover:border-white/25 hover:bg-white/6'
                                }`}
                            >
                                <span
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
                                        isChosen ? 'bg-rose-400/20 text-amber-300' : 'bg-white/8 text-white/50 group-hover:text-white/80'
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                </span>
                                <div className="min-w-0">
                                    <p className={`text-[10px] uppercase tracking-[0.25em] ${isChosen ? 'text-rose-300/70' : 'text-white/35'}`}>
                                        {formatStatLabel(key)}
                                    </p>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className={`text-xl font-bold ${isChosen ? 'text-amber-200' : 'text-white/80'}`}>
                                            {value}
                                        </span>
                                        {isChosen && (
                                            <span className="text-xs font-semibold text-amber-400">→ {value + 1}</span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Confirm */}
                <button
                    onClick={handleConfirm}
                    disabled={!chosen || confirming}
                    className={`mt-5 w-full rounded-2xl py-3.5 text-sm font-semibold transition-all duration-150 ${
                        chosen && !confirming
                            ? 'bg-gradient-to-r from-rose-400 via-amber-600 to-red-800 text-white shadow-lg hover:opacity-95 active:scale-[0.98]'
                            : 'cursor-not-allowed bg-white/8 text-white/30'
                    }`}
                >
                    {confirming ? 'Applying…' : chosen ? `Upgrade ${formatStatLabel(chosen)}` : 'Select an attribute'}
                </button>
            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modal, document.body) : null;
};

export default LevelUpModal;
