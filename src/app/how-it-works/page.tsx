import Link from 'next/link';

const steps = [
    {
        title: 'Choose or Craft a World',
        blurb: 'Browse the public atlas or spin up your own custom setting with a prompt and a few tone sliders.',
        details: ['Search and filter by genre, mood, or complexity', 'Clone any community world and make it private', 'Dial in safety rules before the first scene']
    },
    {
        title: 'Assemble Your Party',
        blurb: 'Invite friends, drop in NPCs, or let our GM build a solo-friendly companion so the story keeps moving.',
        details: ['Persistent character sheets with memory-aware traits', 'One-click invites for synchronous or async play', 'AI spotter keeps lore and tone consistent']
    },
    {
        title: 'Play the Session',
        blurb: 'Scene-by-scene pacing, cinematic narration, and on-demand rules references keep everyone in flow.',
        details: ['Branching story beats driven by player intent', 'Rules automation for dice, clocks, and combat', 'Session summary + XP suggestions at the end']
    }
];

const highlights = [
    {
        title: 'Cinematic Narration',
        description: 'Dynamic prompting layers keep descriptions rich without derailing table intent. Every response remembers prior beats.'
    },
    {
        title: 'Safety + Tone Tools',
        description: 'Lines/veils, tonal guardrails, and vibe meters are baked in so every group feels in control of the fiction.'
    },
    {
        title: 'Lore-Aware Memory',
        description: 'Important clues, NPC motivations, and unresolved threads are pinned to the timeline for instant recall.'
    },
    {
        title: 'Drop-In Automations',
        description: 'Let the engine handle dice math, clocks, and threat escalations while you stay focused on the narrative.'
    }
];

const faqs = [
    {
        q: 'Do I need to know a specific RPG system?',
        a: 'Nope. Start with our system-agnostic core or import moves from the systems you love. The facilitator adapts on the fly.'
    },
    {
        q: 'Can we play asynchronously?',
        a: 'Yes. Threads capture every turn with timestamps, so you can jump in during lunch breaks or binge a whole arc live.'
    },
    {
        q: 'How does pricing work?',
        a: 'Public worlds are free. Premium perks like private shards, advanced automations, and higher context limits live on the Pro plan.'
    },
    {
        q: 'What about safety and moderation?',
        a: 'Session hosts control filters, pace checks, and vibe resets. Community mods review flagged content within minutes.'
    }
];

export default function HowItWorksPage() {
    return (
        <div
            data-full-width="true"
            className="relative min-h-screen w-full text-gray-100"
        >
            <span className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
                <span className="absolute left-1/2 top-24 h-96 w-96 -translate-x-1/2 rounded-full bg-rose-500/40 blur-[140px]" />
                <span className="absolute right-10 bottom-10 h-72 w-72 rounded-full bg-amber-400/20 blur-[120px]" />
            </span>

            <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-20 md:px-10">
                <section className="space-y-10 md:text-left">
                    <div className="space-y-4 text-center md:text-left">
                        <p className="text-xs uppercase tracking-[0.35em] text-white/60">Simulated game master</p>
                        <h1 className="text-4xl font-semibold leading-tight md:text-5xl">How Roleplaying Realm keeps your table in flow.</h1>
                        <p className="text-base text-white/75 md:text-lg">
                            Build an original setting, invite your crew, and let the AI facilitator handle pacing, lore, and rule calls so you can stay immersed in the story.
                        </p>
                    </div>
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <Link
                            href="/play/default"
                            className="flex items-center justify-center rounded-full bg-gradient-to-r from-rose-400 via-amber-600 to-red-800 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/30"
                        >
                            Jump into a world
                        </Link>
                        <Link
                            href="/login"
                            className="flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 hover:border-white/50"
                        >
                            Host a private table
                        </Link>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-3">
                        {[
                            { value: '2.1M+', label: 'Story beats generated with player intent' },
                            { value: '98%', label: 'Sessions complete without needing manual rewrites' },
                            { value: '40+ hrs', label: 'Average lore retention across long arcs' }
                        ].map((stat) => (
                            <div key={stat.value} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
                                <p className="text-2xl font-semibold text-white">{stat.value}</p>
                                <p className="text-sm text-white/70">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm uppercase tracking-[0.3em] text-white/60">Session flow</p>
                            <h2 className="text-2xl font-semibold text-white">From spark to story arc</h2>
                        </div>
                        <span className="text-sm text-white/70">Everything you need in three beats.</span>
                    </div>
                    <div className="mt-8 space-y-10">
                        {steps.map((step, index) => (
                            <div key={step.title} className="grid gap-6 md:grid-cols-[auto,1fr]">
                                <div className="flex flex-col items-center text-white/60">
                                    <span className="text-sm">0{index + 1}</span>
                                    {index !== steps.length - 1 && <span className="my-2 h-16 w-px bg-white/20" />}
                                </div>
                                <div className="space-y-3 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
                                    <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                                    <p className="text-white/75">{step.blurb}</p>
                                    <ul className="grid gap-2 text-sm text-white/70 md:grid-cols-2">
                                        {step.details.map((detail) => (
                                            <li key={detail} className="flex items-start gap-2">
                                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-400" aria-hidden />
                                                <span>{detail}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <p className="text-xs uppercase tracking-[0.35em] text-white/50">Under the hood</p>
                        <h2 className="text-3xl font-semibold text-white">Why sessions feel guided, not scripted.</h2>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                        {highlights.map((item) => (
                            <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                                <p className="mt-2 text-white/70">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="grid gap-10 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur md:grid-cols-2">
                    <div className="space-y-4">
                        <p className="text-xs uppercase tracking-[0.35em] text-white/50">Collaboration tools</p>
                        <h2 className="text-2xl font-semibold text-white">Designed for real-world groups.</h2>
                        <p className="text-white/70">
                            Live tables, asynchronous threads, and broadcast-only modes share the same canvas. You can blend formats without rebuilding characters or losing continuity.
                        </p>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                            <p className="text-sm uppercase tracking-[0.3em] text-white/50">Facilitator stack</p>
                            <ul className="mt-4 space-y-2 text-sm text-white/75">
                                <li>• Adaptive GM persona tuned to your safety profile</li>
                                <li>• Auto-summaries between sessions with actionable prompts</li>
                                <li>• Lore pinboard that any player can update</li>
                            </ul>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-rose-400/20 to-red-800/10 p-6">
                            <h3 className="text-lg font-semibold text-white">Shared spotlight tracker</h3>
                            <p className="mt-2 text-white/70">
                                The engine keeps tabs on who has acted recently and nudges quieter players with bespoke prompts, so every scene stays collaborative.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                            <h3 className="text-lg font-semibold text-white">Consent-forward content filters</h3>
                            <p className="mt-2 text-white/70">
                                Toggle lines, veils, and tone shifts mid-session. The facilitator immediately adjusts narrative intensity without derailing the plot.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                            <h3 className="text-lg font-semibold text-white">Prep-light GM tools</h3>
                            <p className="mt-2 text-white/70">
                                Build custom oracles, encounter packs, and reward tables once—then drag them into any future world.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-white/50">FAQ</p>
                        <h2 className="text-3xl font-semibold text-white">Everything else you might ask.</h2>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                        {faqs.map((item) => (
                            <div key={item.q} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                                <h3 className="text-lg font-semibold text-white">{item.q}</h3>
                                <p className="mt-2 text-white/70">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-rose-500/20 via-amber-400/10 to-red-800/20 p-8 text-center backdrop-blur">
                    <h2 className="text-2xl font-semibold text-white">Spin up your first world tonight.</h2>
                    <p className="mt-3 text-white/80">Draft a universe, invite your crew, and let the AI GM keep the story tight.</p>
                    <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link
                            href="/play/default"
                            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900"
                        >
                            Explore featured worlds
                        </Link>
                        <Link
                            href="/login"
                            className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white/80"
                        >
                            Create a private table
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
