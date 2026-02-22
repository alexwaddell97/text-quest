import { motion, AnimatePresence } from "framer-motion";
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useSession } from "next-auth/react";
import { Setting } from '@/types';

interface SettingCardProps {
    setting: Setting;
    onClick?: () => void;
}

export default function SettingCard({ setting, onClick }: SettingCardProps) {
    const [liked, setLiked] = useState(false);
    const [voteCount, setVoteCount] = useState<number>(setting?.votes ?? 0);
    const [isVoting, setIsVoting] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [burstKey, setBurstKey] = useState(0);
    const [showBurst, setShowBurst] = useState(false);
    const { data: session } = useSession();

    const BURST_PARTICLES = [
        { angle: 0,   distance: 22 },
        { angle: 45,  distance: 20 },
        { angle: 90,  distance: 22 },
        { angle: 135, distance: 20 },
        { angle: 180, distance: 22 },
        { angle: 225, distance: 20 },
        { angle: 270, distance: 22 },
        { angle: 315, distance: 20 },
    ];

    // Define variants
    const parentVariants = {
        initial: { opacity: 0, y: 0 },
        animate: { opacity: 1, y: 0 },
    };

    useEffect(() => {
        if (session?.user && session.user.votes) {
            const hasVoted = session.user.votes.some((vote: string) => vote === setting._id);
            setLiked(hasVoted);
        }
    }, [session, setting._id]);

    useEffect(() => {
        setVoteCount(setting?.votes ?? 0);
    }, [setting?.votes]);

    const handleLikeClick = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!session || isVoting) {
            return;
        }

        const nextLiked = !liked;
        const delta = nextLiked ? 1 : -1;
        setLiked(nextLiked);
        setVoteCount((prev) => prev + delta);
        if (nextLiked) {
            setBurstKey(k => k + 1);
            setShowBurst(true);
            setTimeout(() => setShowBurst(false), 600);
        }
        setIsVoting(true);

        try {
            const response = await fetch('/api/vote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: session?.user?.id,
                    setting_id: setting._id,
                    voteType: nextLiked ? 'up' : 'down',
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit vote');
            }
        } catch (error) {
            console.error('Error voting:', error);
            setLiked(!nextLiked);
            setVoteCount((prev) => prev - delta);
        } finally {
            setIsVoting(false);
        }
    };

    return (
        <>
        <motion.div
            id="parent"
            className="relative overflow-hidden rounded-2xl h-56 shadow-xl border border-white/12 bg-gradient-to-br from-rose-400/20 via-amber-600/14 to-red-900/18 flex items-center justify-center"
            style={{
                backgroundImage: `url(${setting.cover_image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
            variants={parentVariants}
            initial="initial"
            animate="animate"
            whileHover={{ scale: 1.02, rotate: 0.15 }}
            transition={{ duration: 0.25 }}
            onClick={onClick}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/60 to-black/70 z-0" />

            {/* Like button — top left */}
            <div className={`absolute top-3 left-3 z-[11] flex items-center gap-1.5 ${session ? 'cursor-pointer' : ''}`}>
                <div className="relative">
                    <motion.button
                        type="button"
                        whileHover={{ scale: session ? 1.1 : 1 }}
                        animate={liked ? { scale: [1, 1.35, 0.9, 1.1, 1] } : { scale: 1 }}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                        className={`relative flex h-7 w-7 items-center justify-center rounded-full border bg-black/40 backdrop-blur-sm transition ${
                            liked
                                ? 'border-red-500/50 text-red-500'
                                : 'border-white/20 text-white/70 hover:border-white/50 hover:text-white'
                        } ${isVoting ? 'opacity-60' : ''} ${!session ? 'pointer-events-none' : ''}`}
                        onClick={session ? (e) => { e.stopPropagation(); handleLikeClick(e as React.MouseEvent<HTMLButtonElement>); } : undefined}
                        disabled={isVoting}
                        aria-label="Like"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5"
                            viewBox="0 0 20 20"
                            fill={liked ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path
                                fillRule="evenodd"
                                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656l-6.364 6.364a.5.5 0 01-.708 0l-6.364-6.364a4 4 0 010-5.656z"
                                clipRule="evenodd"
                            />
                        </svg>
                        {isVoting && (
                            <span className="absolute inset-0 rounded-full animate-ping border border-white/30" />
                        )}
                    </motion.button>

                    {/* Burst particles */}
                    <AnimatePresence>
                        {showBurst && BURST_PARTICLES.map((p, i) => {
                            const rad = (p.angle * Math.PI) / 180;
                            const tx = Math.cos(rad) * p.distance;
                            const ty = Math.sin(rad) * p.distance;
                            return (
                                <motion.span
                                    key={`${burstKey}-${i}`}
                                    className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-400"
                                    initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                                    animate={{ opacity: 0, x: tx, y: ty, scale: 0.3 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                />
                            );
                        })}
                    </AnimatePresence>
                </div>
                <motion.span
                    key={voteCount}
                    initial={{ y: -6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs font-medium text-white/70 drop-shadow-sm"
                >
                    {voteCount}
                </motion.span>
            </div>

            {/* Info button — top right */}
            <button
                type="button"
                className="absolute top-3 right-3 z-[11] flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/70 backdrop-blur-sm transition hover:border-white/50 hover:text-white"
                onClick={(e) => { e.stopPropagation(); setIsInfoOpen(true); }}
                aria-label="Setting info"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
            </button>
            <motion.div
                className="flex flex-col justify-center items-center text-center h-full w-full pointer-events-auto z-10 px-4"
                transition={{ duration: 0.3 }}
            >
                <h2 className="text-white font-semibold text-lg relative drop-shadow-md">{setting.name}</h2>
                <Link href={`/play/${setting._id}`}>
                    <button className="mt-3 px-5 py-2 cursor-pointer rounded-full flex items-center space-x-2 bg-gradient-to-r from-rose-400 via-amber-600 to-red-800 text-white shadow-lg shadow-red-900/30 hover:shadow-red-800/40 transition">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5 translate-x-px"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 0 1 0 1.971l-11.54 6.347a1.125 1.125 0 0 1-1.667-.985V5.653z" />
                        </svg>
                        <span className="text-sm font-semibold">Play</span>
                    </button>
                </Link>
            </motion.div>
        </motion.div>

        {/* Setting info modal */}
        {isInfoOpen && typeof window !== 'undefined' && createPortal(
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                onClick={() => setIsInfoOpen(false)}
            >
                <div
                    className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-3xl border border-white/12 bg-[#111114] text-white shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Cover image header */}
                    {setting.cover_image && (
                        <div className="relative h-36 w-full overflow-hidden rounded-t-3xl">
                            <Image src={setting.cover_image} alt={setting.name} fill className="object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#111114] via-black/30 to-transparent" />
                        </div>
                    )}

                    <button
                        onClick={() => setIsInfoOpen(false)}
                        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/70 hover:text-white"
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="space-y-5 px-6 pb-6 pt-4">
                        <div>
                            <div className="flex flex-wrap gap-1.5 mb-1">{(setting.genres ?? (setting.genre ? [setting.genre] : [])).map((g: string) => (<span key={g} className="rounded-full border border-white/15 bg-white/8 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.3em] text-white/50">{g}</span>))}</div>
                            <h2 className="mt-0.5 text-xl font-semibold">{setting.name}</h2>
                            {setting.description && (
                                <p className="mt-2 text-sm leading-relaxed text-white/65">{setting.description}</p>
                            )}
                        </div>

                        {setting.key_themes?.length > 0 && (
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.35em] text-white/40">Key Themes</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {setting.key_themes.map((t, i: number) => (
                                        <span key={i} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70">
                                            {t.theme ?? t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {setting.major_locations?.length > 0 && (
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.35em] text-white/40">Locations</p>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    {setting.major_locations.map((loc, i: number) => (
                                        <div key={i} className="rounded-2xl border border-white/8 bg-white/3 px-3 py-2">
                                            <p className="text-xs font-semibold text-white leading-snug">{loc.name}</p>
                                            {loc.description && <p className="mt-0.5 text-[10px] leading-snug text-white/45 line-clamp-2">{loc.description}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {setting.factions?.length > 0 && (
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.35em] text-white/40">Factions</p>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    {setting.factions.map((f, i: number) => (
                                        <div key={i} className="rounded-2xl border border-white/8 bg-white/3 px-3 py-2">
                                            <p className="text-xs font-semibold text-white leading-snug">{f.name}</p>
                                            {f.description && <p className="mt-0.5 text-[10px] leading-snug text-white/45 line-clamp-2">{f.description}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {setting.rules?.length > 0 && (
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.35em] text-white/40">World Rules</p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {setting.rules.map((r, i: number) => (
                                        <span key={i} title={r.description} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/65 cursor-default">
                                            {r.rule ?? r}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>,
            document.body
        )}
        </>
    );
}
