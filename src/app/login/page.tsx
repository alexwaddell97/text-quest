"use client"
import { useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const ICON_CLASS = "h-5 w-5 flex-shrink-0 text-white";

const googleIcon = (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} aria-hidden="true">
        <path
            fill="currentColor"
            d="M11.99 13.04v3.9h5.23c-.23 1.35-1.57 3.95-5.23 3.95-3.15 0-5.72-2.6-5.72-5.83s2.57-5.83 5.72-5.83c1.8 0 3.01.77 3.7 1.42l2.61-2.52C16.69 6.37 14.77 5.5 12 5.5 6.99 5.5 3 9.54 3 14.5S6.99 23.5 12 23.5c6.92 0 8.5-5.99 8.5-9.13 0-.62-.06-1.08-.14-1.33z"
        />
    </svg>
);

const appleIcon = (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} aria-hidden="true">
        <path
            fill="currentColor"
            d="M16.365 1.43c-1.519 0-3.059.98-3.925 2.118-.865 1.012-1.625 2.62-1.42 4.13 1.557.122 3.162-.892 4.056-2.182.844-1.247 1.463-3.004 1.23-4.066-.131-.003-.29-.007-.461-.007zm3.58 11.16c-.02-3.008 2.45-4.46 2.56-4.536-1.4-2.046-3.577-2.332-4.355-2.356-1.85-.19-3.61 1.1-4.549 1.1-.94 0-2.397-1.07-3.95-1.04-2.03.03-3.91 1.247-4.955 3.16-2.11 3.657-.538 9.07 1.514 12.048.998 1.446 2.19 3.07 3.75 3.018 1.517-.06 2.086-.988 3.92-.988 1.834 0 2.348.988 3.95.953 1.634-.026 2.667-1.474 3.66-2.926 1.158-1.686 1.63-3.338 1.65-3.42-.037-.014-3.168-1.21-3.198-4.97z"
        />
    </svg>
);

const discordIcon = (
    <svg viewBox="0 0 24 24" className={ICON_CLASS} aria-hidden="true">
        <path
            fill="currentColor"
            d="M20.222 0H3.778A3.78 3.78 0 000 3.778v12.444A3.78 3.78 0 003.778 20h12.342l-.577-2.015 3.286 3.075L21 22.662V3.778A3.78 3.78 0 0017.222 0zm-5.005 14.222s-.346-.415-.634-.763c2.91-.825 3.99-2.613 3.99-2.613-.898.576-1.743.98-2.528 1.26-1.09.452-2.139.753-3.165.933-2.09.387-3.879.28-5.487-.028a15.995 15.995 0 01-3.123-.933 11.341 11.341 0 01-2.527-1.26s1.052 1.761 3.946 2.607c-.314.358-.647.783-.647.783-2.46-.077-4.262-1.684-4.262-1.684 0-3.56 1.601-6.445 1.601-6.445 1.6-1.2 3.126-1.163 3.126-1.163l.111.126c-1.998.576-2.913 1.959-2.913 1.959s.178-.105.484-.241c2.195-.951 3.954-1.221 4.655-1.285.118-.014.223-.014.341-.014.658-.091 1.335-.122 2.03-.122.735 0 1.47.046 2.191.152.522.077 1.056.182 1.594.318 1.015.258 2.103.646 3.219 1.233 0 0-1.129-.681-3.475-1.387l.151-.167s1.517-.039 3.126 1.163c0 0 1.601 2.885 1.601 6.445 0-.017-1.801 1.591-4.261 1.668zM9.262 9.78c-1.204 0-2.182 1.078-2.182 2.411 0 1.332.977 2.41 2.182 2.41 1.204 0 2.182-1.078 2.182-2.41 0-1.333-.978-2.411-2.182-2.411zm4.943 0c-1.204 0-2.181 1.078-2.181 2.411 0 1.332.977 2.41 2.181 2.41 1.205 0 2.182-1.078 2.182-2.41 0-1.333-.977-2.411-2.182-2.411z"
        />
    </svg>
);

// Centralized provider config so new auth methods can be toggled on without reshaping the UI.
const LOGIN_PROVIDERS = [
    {
        id: "google",
        label: "Continue with Google",
        description: "Link your Google profile to keep your adventures synced across devices.",
        icon: googleIcon,
        disabled: false,
    },
    {
        id: "apple",
        label: "Sign in with Apple",
        description: "Private Relay compatible. Slated for an upcoming release.",
        icon: appleIcon,
        disabled: true,
    },
    {
        id: "discord",
        label: "Join via Discord",
        description: "Bring your troupe. Perfect for shared campaigns.",
        icon: discordIcon,
        disabled: true,
    },
];

export default function Login() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const heroLabelClass = "text-white/60";
    const heroHeadingClass = "text-white";
    const heroBodyClass = "text-white/70";
    const heroMetaClass = "text-white/60";
    const shellBorderClass = "border-white/10";
    const shellBackgroundClass = "bg-gradient-to-br from-[#1b050b]/80 via-[#070407]/90 to-[#010101]";
    const shellTextClass = "text-white";
    const providerBorder = "border-white/10";
    const providerHover = "hover:border-white/40";
    const sectionLabelClass = "text-white/50";
    const soonBadgeClass = "text-white/60";
    const sessionTextClass = "text-white/70";

    useEffect(() => {
        if (session) {
            router.push("/");
        }
    }, [session, router]);

    const cardPalette = useMemo(() => {
        return {
            surface: "bg-[rgba(18,6,10,0.78)] backdrop-blur-xl",
            border: "border-white/10",
            text: "text-white",
            muted: "text-white/65",
            background: "bg-[radial-gradient(circle_at_top,_rgba(73,10,20,0.85),_rgba(5,4,6,0.98))]",
        };
    }, []);

    const handleProviderClick = (providerId: string, disabled: boolean) => {
        if (disabled) {
            return;
        }
        signIn(providerId);
    };

    return (
        <div className={`min-h-screen w-full ${cardPalette.background} px-4 py-16`}>
            <div className={`mx-auto flex w-full max-w-6xl flex-col gap-12 rounded-[40px] border ${shellBorderClass} ${shellBackgroundClass} ${shellTextClass} px-6 py-10 backdrop-blur-xl md:px-12`}>
                <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
                    <div className="space-y-6">
                        <p className={`text-xs uppercase tracking-[0.35em] ${heroLabelClass}`}>Authentication Hub</p>
                        <h1 className={`text-4xl font-semibold leading-tight md:text-5xl ${heroHeadingClass}`}>
                            Unlock the studio.<br />
                            Continue the story anywhere.
                        </h1>
                        <p className={`${heroBodyClass} md:text-lg`}>
                            Secure sign-in keeps your characters, settings, and AI companions synced. We support
                            passwordless options and collaborative play—starting with Google while additional gates roll out.
                        </p>
                        <div className={`flex flex-wrap gap-4 text-sm ${heroMetaClass}`}>
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                Production ready OAuth
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-rose-400" />
                                Session synced saves
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-sky-400" />
                                Upcoming team access
                            </div>
                        </div>
                    </div>

                    <motion.div
                        className={`relative overflow-hidden rounded-3xl border ${cardPalette.border} ${cardPalette.surface} ${cardPalette.text} p-8 shadow-2xl`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="mb-6 space-y-2">
                            <p className={`text-xs uppercase tracking-[0.2em] ${sectionLabelClass}`}>Sign in</p>
                            <h2 className="text-2xl font-semibold">Choose a method</h2>
                            <p className={`text-sm ${cardPalette.muted}`}>
                                We&apos;ll redirect you to a secure provider and bring you back to continue playing.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {LOGIN_PROVIDERS.map((provider) => {
                                const isDisabled = provider.disabled;
                                return (
                                    <button
                                        key={provider.id}
                                        onClick={() => handleProviderClick(provider.id, isDisabled)}
                                        className={`relative flex w-full items-start gap-3 rounded-2xl border ${providerBorder} px-5 py-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 ${
                                            isDisabled ? "cursor-not-allowed opacity-60" : providerHover
                                        }`}
                                        aria-disabled={isDisabled}
                                    >
                                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
                                            {provider.icon}
                                        </span>
                                        <span>
                                            <span className="flex items-center gap-2 text-base font-semibold">
                                                {provider.label}
                                                {isDisabled && <span className={`text-xs uppercase tracking-widest ${soonBadgeClass}`}>Soon</span>}
                                            </span>
                                            <span className={`mt-1 block text-sm ${cardPalette.muted}`}>{provider.description}</span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {status === "loading" && (
                            <div className={`mt-6 flex items-center gap-3 text-sm ${sessionTextClass}`}>
                                <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
                                Checking your session...
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
