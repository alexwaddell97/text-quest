"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import LogoIcon from '@/components/Logo';

const footerLinks = [
    {
        title: 'Worlds',
        href: '/',
    },
    {
        title: 'How it works',
        href: '/how-it-works',
    },
    {
        title: 'Play now',
        href: '/play/default',
    },
];

const socialLinks = [
    {
        label: 'Patreon',
        href: 'https://patreon.com/infiniteworldsai',
        icon: '/icons/patreon.svg',
    },
];

export default function Footer() {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const pathname = usePathname();
    const isPlayPage = pathname.startsWith('/play');

    useEffect(() => {
        const onChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    if (isFullscreen) return null;

    return (
        <motion.footer
            className="relative mt-16 w-full border-t border-white/10 bg-[rgba(8,9,14,0.85)]/80 text-gray-200 backdrop-blur-xl"
            style={isPlayPage ? { backgroundColor: 'var(--panel)', borderColor: 'var(--border)' } : undefined}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
        >
            <div
                className={`pointer-events-none absolute inset-x-0 -top-16 mx-auto h-24 w-3/4 rounded-full blur-3xl ${isPlayPage ? '' : 'bg-gradient-to-r from-rose-500/20 via-amber-300/10 to-red-800/20'}`}
                style={isPlayPage ? { background: `linear-gradient(to right, var(--ambient-a), var(--ambient-b), var(--ambient-a))` } : undefined}
                aria-hidden
            />

            <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 md:flex-row md:items-start md:justify-between">
                <div className="space-y-4 max-w-sm">
                    <div className="flex items-center gap-3">
                        <LogoIcon width={36} height={36} themed={isPlayPage} />
                        <div>
                            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Interactive GM</p>
                            <p className="text-lg font-semibold text-white">Roleplaying Realm</p>
                        </div>
                    </div>
                    <p className="text-sm text-white/70">
                        Sessions that feel guided, collaborative, and safe—whether you are exploring solo or hosting a table of friends.
                    </p>
                </div>

                <div className="grid flex-1 gap-6 text-sm text-white/70 sm:grid-cols-2">
                    <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-white/50">Navigation</p>
                        <ul className="mt-3 space-y-2">
                            {footerLinks.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-white/80 transition hover:text-white">
                                        {link.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-white/50">Support</p>
                        <div className="mt-3 flex flex-col gap-3">
                            {socialLinks.map((item) => (
                                <Link key={item.href} href={item.href} target="_blank" className="inline-flex items-center gap-2 text-white/80 transition hover:text-white">
                                    <Image src={item.icon} alt={item.label} width={22} height={22} />
                                    {item.label}
                                </Link>
                            ))}
                            <span className="text-xs text-white/50">Community moderation active 24/7.</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-white/10" style={isPlayPage ? { borderColor: 'var(--border)' } : undefined}>
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-4 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
                    <span>© {new Date().getFullYear()} Roleplaying Realm. All rights reserved.</span>
                    <div className="flex gap-4">
                        <Link href="/legal/privacy" className="hover:text-white">
                            Privacy
                        </Link>
                        <Link href="/legal/terms" className="hover:text-white">
                            Terms
                        </Link>
                    </div>
                </div>
            </div>
        </motion.footer>
    );
}