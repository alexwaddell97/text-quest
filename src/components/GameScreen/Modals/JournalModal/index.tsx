"use client";

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChronicleEntry, WorldFact } from '@/types';
import { BookOpen, MapPin, Shield, X } from 'lucide-react';

interface JournalModalProps {
    isOpen: boolean;
    onClose: () => void;
    chronicle: ChronicleEntry[];
    worldFacts: WorldFact[];
}

const JournalModal: React.FC<JournalModalProps> = ({ isOpen, onClose, chronicle, worldFacts }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom (latest entry) when opened or new entries arrive
    useEffect(() => {
        if (isOpen && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [isOpen, chronicle.length]);

    // Close on Escape 
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    const formatTimestamp = (iso: string) => {
        try {
            return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="journal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        key="journal-panel"
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                        className="fixed right-0 top-0 bottom-0 z-[9991] flex w-full max-w-md flex-col border-l border-white/10 bg-[rgba(14,14,16,0.98)] shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                                    <BookOpen size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.4em] text-white/40">Adventure Log</p>
                                    <p className="text-sm font-semibold text-white/85">Journal</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Body */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin scrollbar-thumb-white/15 scrollbar-track-transparent space-y-5">

                            {/* World Facts section */}
                            {worldFacts.length > 0 && (
                                <section>
                                    <div className="mb-3 flex items-center gap-2">
                                        <Shield size={11} className="text-rose-400/70" />
                                        <p className="text-[9px] font-bold uppercase tracking-[0.45em] text-rose-400/60">Established Facts</p>
                                    </div>
                                    <div className="rounded-2xl border border-rose-500/15 bg-rose-950/20 px-4 py-3 space-y-2">
                                        {worldFacts.map((wf) => (
                                            <div key={wf.id} className="flex gap-2.5 text-xs text-white/65 leading-relaxed">
                                                <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-400/50" />
                                                <span>{wf.fact}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Chronicle entries */}
                            {chronicle.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <BookOpen size={32} className="mb-3 text-white/15" />
                                    <p className="text-sm text-white/30">Your adventure hasn&apos;t been recorded yet.</p>
                                    <p className="mt-1 text-xs text-white/20">The journal fills as your story unfolds.</p>
                                </div>
                            ) : (
                                <section>
                                    <div className="mb-3 flex items-center gap-2">
                                        <span className="h-px flex-1 bg-white/8" />
                                        <p className="text-[9px] font-bold uppercase tracking-[0.45em] text-white/30">Chronicle</p>
                                        <span className="h-px flex-1 bg-white/8" />
                                    </div>

                                    <div className="relative pl-5">
                                        {/* Vertical timeline line */}
                                        <div className="absolute left-[7px] top-3 bottom-3 w-px bg-white/8" />

                                        <div className="space-y-4">
                                            {chronicle.map((entry, idx) => (
                                                <motion.div
                                                    key={entry.turn}
                                                    initial={{ opacity: 0, x: 8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                    className="relative"
                                                >
                                                    {/* Timeline dot */}
                                                    <div className={`absolute -left-5 top-[5px] h-2.5 w-2.5 rounded-full border-2 ${
                                                        idx === chronicle.length - 1
                                                            ? 'border-amber-400 bg-amber-400/30 shadow-[0_0_6px_rgba(251,191,36,0.4)]'
                                                            : 'border-white/20 bg-white/5'
                                                    }`} />

                                                    <div className={`rounded-xl border px-3.5 py-3 ${
                                                        idx === chronicle.length - 1
                                                            ? 'border-amber-400/20 bg-amber-400/5'
                                                            : 'border-white/6 bg-white/3'
                                                    }`}>
                                                        {/* Turn number + location */}
                                                        <div className="mb-1.5 flex items-center gap-2 flex-wrap">
                                                            <span className="rounded-md bg-white/8 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/40">
                                                                Turn {entry.turn}
                                                            </span>
                                                            <div className="flex items-center gap-1 text-[10px] text-amber-300/60">
                                                                <MapPin size={9} />
                                                                <span className="truncate max-w-[200px]">{entry.location}</span>
                                                            </div>
                                                            {entry.timestamp && (
                                                                <span className="ml-auto text-[9px] text-white/25">
                                                                    {formatTimestamp(entry.timestamp)}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Entry text */}
                                                        <p className="text-xs leading-[1.65] text-white/70">{entry.entry}</p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Footer stat */}
                        {chronicle.length > 0 && (
                            <div className="border-t border-white/5 px-6 py-3">
                                <p className="text-center text-[10px] text-white/25">
                                    {chronicle.length} {chronicle.length === 1 ? 'entry' : 'entries'} recorded
                                    {worldFacts.length > 0 && ` · ${worldFacts.length} world ${worldFacts.length === 1 ? 'fact' : 'facts'}`}
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default JournalModal;
