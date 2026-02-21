"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import LogoIcon from '@/components/Logo';

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { data: session } = useSession();

    useEffect(() => {
        if (!isDropdownOpen) return;
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isDropdownOpen]);

    const pathname = usePathname();
    const isPlayPage = pathname.startsWith('/play');

    useEffect(() => {
        const onChange = () => {
            const inFs = !!document.fullscreenElement;
            setIsFullscreen(inFs);
            if (!inFs) setIsHovered(false);
        };
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    const navLinks = useMemo(
        () => [
            { label: 'Worlds', href: '/' },
            { label: 'How it Works', href: '/how-it-works' },
        ],
        []
    );

    const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

    const headerHidden = isFullscreen && !isHovered;

    return (
        <>
        {/* Fullscreen hover trigger — a thin invisible strip at the very top edge.
            Only active when fullscreen + header is hidden, so it can't interfere
            with any panel content below. */}
        {isFullscreen && !isHovered && (
            <div
                className="fixed inset-x-0 top-0 z-[9999] h-2 cursor-default"
                onMouseEnter={() => setIsHovered(true)}
            />
        )}
        <motion.header
            className="relative sticky top-0 z-40 w-full border-b border-white/10 bg-[rgba(6,7,13,0.92)]/80 backdrop-blur-2xl shadow-[0_12px_40px_rgba(4,5,8,0.55)]"
            style={{
                ...(isFullscreen ? { position: 'fixed', width: '100%' } : {}),
                ...(isPlayPage ? { backgroundColor: 'var(--panel)', borderColor: 'var(--border)' } : {}),
            }}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: headerHidden ? '-100%' : 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 22 }}
            onMouseLeave={() => isFullscreen && setIsHovered(false)}
        >
            <div
                className={`pointer-events-none absolute inset-x-0 -top-24 mx-auto h-28 w-2/3 rounded-full blur-3xl ${isPlayPage ? '' : 'bg-gradient-to-r from-rose-500/25 via-amber-200/15 to-red-800/20'}`}
                style={isPlayPage ? { background: `linear-gradient(to right, var(--ambient-a), var(--ambient-b), var(--ambient-a))` } : undefined}
                aria-hidden
            />

            <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4">
                <Link href="/">
                    <motion.div className="flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <LogoIcon width={40} height={40} themed={isPlayPage} />
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">Interactive GM</p>
                            <h1 className="text-lg font-semibold text-white">Roleplaying Realm</h1>
                        </div>
                    </motion.div>
                </Link>

                <div className="hidden md:flex items-center gap-6">
                    <nav className="relative flex items-center gap-1">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`relative px-4 py-2 text-sm font-medium transition ${isActive ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
                                >
                                    <span className="relative z-[1]">{link.label}</span>
                                    {isActive && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.15 }}
                                            className={`absolute bottom-0 left-4 right-4 h-[2px] rounded-full ${isPlayPage ? '' : 'bg-gradient-to-r from-rose-400 via-amber-500 to-red-600'}`}
                                            style={isPlayPage ? { background: 'var(--theme-btn)' } : undefined}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="flex items-center gap-3">
                        {session ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen((p) => !p)}
                                    className="group flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 pl-1 pr-3 py-1 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white"
                                    aria-label="Account menu"
                                    aria-expanded={isDropdownOpen}
                                >
                                    {session.user?.image && !avatarError ? (
                                        <img
                                            src={session.user.image}
                                            alt={session.user.name ?? 'Account'}
                                            className="h-7 w-7 rounded-full object-cover ring-1 ring-white/10"
                                            onError={() => setAvatarError(true)}
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1a0a0e] ring-1 ring-white/10">
                                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white/60" aria-hidden>
                                                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                                                <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                        </span>
                                    )}
                                    <span className="hidden lg:inline">{session.user?.name?.split(' ')[0]}</span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={`text-white/40 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>
                                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                {isDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-2xl border border-white/10 bg-[#0f1118] shadow-2xl">
                                        <Link
                                            href="/account"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 text-sm text-white/75 transition hover:bg-white/5 hover:text-white"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" aria-hidden>
                                                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                                                <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                            My Account
                                        </Link>
                                        <div className="mx-3 h-px bg-white/8" />
                                        <button
                                            onClick={() => { setIsDropdownOpen(false); signOut({ callbackUrl: '/' }); }}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white/55 transition hover:bg-white/5 hover:text-white"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" aria-hidden>
                                                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className={`rounded-full px-5 py-2 text-sm font-semibold text-white ${isPlayPage ? '' : 'bg-gradient-to-r from-rose-400 via-amber-600 to-red-800 shadow-[0_10px_30px_rgba(233,76,76,0.35)]'}`}
                                style={isPlayPage ? { background: 'var(--theme-btn)' } : undefined}
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
                <div
                    className={`pointer-events-none absolute inset-x-0 top-12 mx-auto h-40 w-40 rounded-full blur-[120px] ${isPlayPage ? '' : 'bg-gradient-to-r from-rose-500/30 via-amber-400/20 to-red-800/25'}`}
                    style={isPlayPage ? { background: `linear-gradient(to right, var(--ambient-a), var(--ambient-b), var(--ambient-a))` } : undefined}
                    aria-hidden
                />
                <button className="absolute top-5 right-5 text-white/80" onClick={toggleMobileMenu} aria-label="Close navigation">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <ul className="flex flex-col items-center gap-4 text-lg">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                        return (
                            <motion.li key={link.href} whileHover={{ scale: 1.05 }}>
                                <Link
                                    href={link.href}
                                    onClick={() => toggleMobileMenu()}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`relative px-6 py-2 text-base font-medium transition ${isActive ? 'text-white' : 'text-white/55 hover:text-white/80'}`}
                                    style={isActive && isPlayPage ? { background: 'var(--theme-btn)' } : undefined}
                                >
                                    {link.label}
                                    {isActive && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.15 }}
                                            className={`absolute bottom-0 left-6 right-6 h-[2px] rounded-full ${isPlayPage ? '' : 'bg-gradient-to-r from-rose-400 via-amber-500 to-red-600'}`}
                                            style={isPlayPage ? { background: 'var(--theme-btn)' } : undefined}
                                        />
                                    )}
                                </Link>
                            </motion.li>
                        );
                    })}
                </ul>
                <div className="mt-10 flex w-full max-w-sm flex-col gap-3">
                    {session ? (
                        <>
                            <Link
                                href="/account"
                                onClick={() => toggleMobileMenu()}
                                className="flex items-center gap-3 w-full rounded-full border border-white/20 px-4 py-3 text-white/85"
                            >
                                {session.user?.image && !avatarError ? (
                                    <img
                                        src={session.user.image}
                                        alt={session.user.name ?? 'Account'}
                                        className="h-7 w-7 rounded-full object-cover ring-1 ring-white/10"
                                        onError={() => setAvatarError(true)}
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1a0a0e] ring-1 ring-white/15">
                                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white/55" aria-hidden>
                                            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                                            <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                    </span>
                                )}
                                <span>My Account</span>
                            </Link>
                            <button
                                onClick={() => {
                                    signOut();
                                    toggleMobileMenu();
                                }}
                                className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-white/70 font-medium"
                            >
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <Link
                            href="/login"
                            onClick={() => toggleMobileMenu()}
                            className={`w-full rounded-full px-5 py-3 text-center text-white font-semibold ${isPlayPage ? '' : 'bg-gradient-to-r from-rose-400 via-amber-600 to-red-800'}`}
                            style={isPlayPage ? { background: 'var(--theme-btn)' } : undefined}
                        >
                            Login
                        </Link>
                    )}
                </div>
            </nav>

            <div className="hidden" />
        </motion.header>
        </>
    );
}