"use client";

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { data: session } = useSession();

    const pathname = usePathname();

    const navLinks = useMemo(
        () => [
            { label: 'Worlds', href: '/' },
            { label: 'How it Works', href: '/how-it-works' },
        ],
        []
    );

    const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

    return (
        <motion.header
            className="relative sticky top-0 z-40 w-full border-b border-white/10 bg-[rgba(6,7,13,0.92)]/80 backdrop-blur-2xl shadow-[0_12px_40px_rgba(4,5,8,0.55)]"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 22 }}
        >
            <div className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-28 w-2/3 rounded-full bg-gradient-to-r from-rose-500/25 via-amber-200/15 to-red-800/20 blur-3xl" aria-hidden />

            <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4">
                <Link href="/">
                    <motion.div className="flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Image src="/logo.svg" alt="Roleplaying Realm logo" width={40} height={40} />
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">Interactive GM</p>
                            <h1 className="text-lg font-semibold text-white">Roleplaying Realm</h1>
                        </div>
                    </motion.div>
                </Link>

                <div className="hidden md:flex items-center gap-6">
                    <nav className="relative flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1 backdrop-blur">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`relative px-4 py-2 text-sm font-medium transition ${isActive ? 'text-white' : 'text-white/60 hover:text-white'}`}
                                >
                                    {isActive && (
                                        <motion.span
                                            layoutId="navActiveBg"
                                            className="absolute inset-[2px] rounded-full bg-gradient-to-r from-rose-400 via-amber-500 to-red-700 shadow-[0_10px_35px_rgba(255,82,82,0.35)]"
                                            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-[1]">{link.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/play/default"
                            className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/40 hover:text-white"
                        >
                            Explore Worlds
                        </Link>
                        {session ? (
                            <button
                                onClick={() => signOut()}
                                className="rounded-full bg-gradient-to-r from-rose-400 via-amber-600 to-red-800 px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(233,76,76,0.35)]"
                            >
                                Logout
                            </button>
                        ) : (
                            <Link
                                href="/login"
                                className="rounded-full bg-gradient-to-r from-rose-400 via-amber-600 to-red-800 px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(233,76,76,0.35)]"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 md:hidden">
                    <button
                        className="rounded-full border border-white/20 bg-white/10 p-2"
                        onClick={toggleMobileMenu}
                        aria-label="Toggle navigation"
                    >
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                    </button>
                </div>
            </div>

            <nav
                className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[rgba(4,5,10,0.96)] px-6 py-10 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} md:hidden`}
            >
                <div className="pointer-events-none absolute inset-x-0 top-12 mx-auto h-40 w-40 rounded-full bg-gradient-to-r from-rose-500/30 via-amber-400/20 to-red-800/25 blur-[120px]" aria-hidden />
                <button className="absolute top-5 right-5 text-white/80" onClick={toggleMobileMenu} aria-label="Close navigation">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <ul className="flex flex-col items-center gap-6 text-lg">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                        return (
                            <motion.li key={link.href} whileHover={{ scale: 1.05 }}>
                                <Link
                                    href={link.href}
                                    onClick={() => toggleMobileMenu()}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`px-6 py-2 rounded-full border ${isActive ? 'border-transparent bg-gradient-to-r from-rose-400/70 via-amber-500/70 to-red-700/70 text-white shadow-[0_12px_40px_rgba(233,76,76,0.25)]' : 'border-white/15 text-white/85'}`}
                                >
                                    {link.label}
                                </Link>
                            </motion.li>
                        );
                    })}
                </ul>
                <div className="mt-10 flex w-full max-w-sm flex-col gap-3">
                    <Link
                        href="/play/default"
                        onClick={() => toggleMobileMenu()}
                        className="w-full rounded-full border border-white/20 px-5 py-3 text-center text-white/85"
                    >
                        Explore Worlds
                    </Link>
                    {session ? (
                        <button
                            onClick={() => {
                                signOut();
                                toggleMobileMenu();
                            }}
                            className="w-full rounded-full bg-gradient-to-r from-rose-400 via-amber-600 to-red-800 px-5 py-3 text-white font-semibold"
                        >
                            Logout
                        </button>
                    ) : (
                        <Link
                            href="/login"
                            onClick={() => toggleMobileMenu()}
                            className="w-full rounded-full bg-gradient-to-r from-rose-400 via-amber-600 to-red-800 px-5 py-3 text-center text-white font-semibold"
                        >
                            Login
                        </Link>
                    )}
                </div>
            </nav>

            <div className="hidden" />
        </motion.header>
    );
}