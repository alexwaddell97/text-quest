import Link from 'next/link';

const steps = [
    {
        number: '01',
        title: 'Pick a World',
        blurb: 'Browse the collection of community settings on the home screen. Filter by genre or search by name to find a world that matches the kind of story you want to tell.',
        details: [
            'Dozens of curated genres — fantasy, sci-fi, horror, and more',
            'Each world has its own lore, factions, locations, and key figures',
            'Vote on your favourites to surface the best settings',
        ],
    },
    {
        number: '02',
        title: 'Build Your Character',
        blurb: 'Give your character a name, race, backstory, and appearance. Choose a stat to excel at and one weakness, then optionally pack starting gear before the adventure begins.',
        details: [
            'Four core stats: Strength, Agility, Intelligence, and Charisma',
            'Free-form name, race, description, and backstory fields',
            'Generate an AI portrait based on your character details',
        ],
    },
    {
        number: '03',
        title: 'Play with Your AI Gamemaster',
        blurb: 'Type what your character does or says and the Gamemaster narrates what happens next. Every response is grounded in the world you chose and shaped by the choices you make.',
        details: [
            'Free-text input — say anything, the GM adapts',
            'Structured choice prompts, skill checks, and item-use options',
            'Inventory, quests, and chronicle update automatically',
        ],
    },
    {
        number: '04',
        title: 'Grow and Progress',
        blurb: 'Earn XP as you play through encounters and completing objectives. Level up to boost a stat, uncover rare loot, and track your full adventure in the chronicle.',
        details: [
            'XP and level-up system with stat allocation on each level',
            'Items with five rarity tiers: common through unique',
            'Quest log with objectives and a turn-by-turn chronicle',
        ],
    },
];

const features = [
    {
        title: 'Adaptive AI Gamemaster',
        description:
            "The GM is seeded with the world's system message, your character details, and every prior turn. It stays consistent with established lore, remembers recent events, and responds to anything you throw at it.",
    },
    {
        title: 'Living Inventory',
        description:
            'Items the GM grants or removes sync directly to your character sheet. Each item has a rarity tier (common, uncommon, rare, legendary, or unique), a context note, and a hint for when it can be used.',
    },
    {
        title: 'Quest Tracker',
        description:
            'Active, completed, and failed quests are logged with granular objectives. The GM can open new quests, mark objectives done, and chain sub-quests as the story unfolds.',
    },
    {
        title: 'Chronicle',
        description:
            'Every turn is recorded as a chronicle entry tied to your current location. Flip back through your full adventure at any point — useful for picking up after a break or reviewing a pivotal moment.',
    },
];

const faqs = [
    {
        q: 'Do I need an account to play?',
        a: 'No — you can jump straight in as a guest. Guest sessions are fully playable, but your character, inventory, and quest progress disappear when you leave. Create a free account to save everything permanently.',
    },
    {
        q: 'Is there multiplayer or co-op?',
        a: 'Roleplaying Realm is designed as a solo AI GM experience. You and the Gamemaster share the story — no other players required.',
    },
    {
        q: 'How do stats affect the game?',
        a: 'Your four core stats (Strength, Agility, Intelligence, Charisma) influence which skill-check options the GM presents after a narrative beat. A high-Charisma character will see more persuasion options; a strong character gets more force-based choices.',
    },
    {
        q: 'How does levelling up work?',
        a: "The GM awards XP at key moments — defeating enemies, completing quests, or clever play. When your XP bar fills you'll see a level-up prompt where you choose which stat to improve.",
    },
    {
        q: 'Can I play in multiple worlds?',
        a: "Yes. You can have separate characters across different worlds and switch between them freely. Each character's sheet, inventory, and quest log are fully independent.",
    },
    {
        q: 'Who creates the worlds?',
        a: 'Settings are hand-crafted with rich lore, factions, locations, and a dedicated system message that shapes how the GM behaves in that world. Community members vote on them to surface the best ones.',
    },
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

                {/* Hero */}
                <section className="space-y-6">
                    <div className="space-y-4">
                        <p className="text-xs uppercase tracking-[0.35em] text-white/60">How it works</p>
                        <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
                            Pick a world. Build a character.<br className="hidden md:block" /> Let the story begin.
                        </h1>
                        <p className="max-w-2xl text-base text-white/75 md:text-lg">
                            Roleplaying Realm is a solo AI text RPG. Choose a setting, create your character, and play through an adaptive narrative driven entirely by an AI Gamemaster — no prep, no rules to memorise, no other players needed.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/"
                            className="flex items-center justify-center rounded-full bg-gradient-to-r from-rose-400 via-amber-600 to-red-800 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/30"
                        >
                            Browse worlds
                        </Link>
                        <Link
                            href="/login"
                            className="flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 hover:border-white/50 transition"
                        >
                            Create a free account
                        </Link>
                    </div>
                </section>

                {/* Steps */}
                <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
                    <div className="mb-8 space-y-1">
                        <p className="text-sm uppercase tracking-[0.3em] text-white/60">The flow</p>
                        <h2 className="text-2xl font-semibold text-white">From browse to adventure in four steps.</h2>
                    </div>
                    <div className="space-y-10">
                        {steps.map((step, index) => (
                            <div key={step.number} className="grid gap-6 md:grid-cols-[auto,1fr]">
                                <div className="flex flex-col items-center text-white/40">
                                    <span className="font-mono text-sm">{step.number}</span>
                                    {index !== steps.length - 1 && (
                                        <span className="my-2 h-14 w-px bg-white/15" />
                                    )}
                                </div>
                                <div className="space-y-3 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
                                    <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                                    <p className="text-white/75">{step.blurb}</p>
                                    <ul className="grid gap-2 text-sm text-white/65 md:grid-cols-2">
                                        {step.details.map((detail) => (
                                            <li key={detail} className="flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" aria-hidden />
                                                <span>{detail}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Features */}
                <section className="space-y-6">
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.35em] text-white/50">Systems</p>
                        <h2 className="text-3xl font-semibold text-white">What the GM tracks so you don&apos;t have to.</h2>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                        {features.map((item) => (
                            <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                                <p className="mt-2 text-white/70">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Character anatomy */}
                <section className="grid gap-8 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur md:grid-cols-2">
                    <div className="space-y-4">
                        <p className="text-xs uppercase tracking-[0.35em] text-white/50">Your character sheet</p>
                        <h2 className="text-2xl font-semibold text-white">Everything about your character in one place.</h2>
                        <p className="text-white/70">
                            Your character sheet lives in the side panel during play. It shows your current health, XP progress, stat block, full inventory, and active quests — all kept in sync by the GM in real time.
                        </p>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Core stats</p>
                            <ul className="mt-4 grid grid-cols-2 gap-2 text-sm text-white/80">
                                <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-rose-400" aria-hidden />Strength</li>
                                <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden />Agility</li>
                                <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-sky-400" aria-hidden />Intelligence</li>
                                <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-violet-400" aria-hidden />Charisma</li>
                            </ul>
                        </div>
                    </div>
                    <div className="space-y-5">
                        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-rose-400/20 to-red-800/10 p-6">
                            <h3 className="text-base font-semibold text-white">AI-generated portrait</h3>
                            <p className="mt-2 text-sm text-white/70">
                                Fill in your character&apos;s name, race, description, and backstory, then generate a portrait to match. The image is produced from your exact details and saved to your sheet.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                            <h3 className="text-base font-semibold text-white">Item rarity tiers</h3>
                            <p className="mt-2 text-sm text-white/70">
                                Inventory items range from <span className="text-white/90">common</span> to <span className="text-green-400">uncommon</span>, <span className="text-blue-400">rare</span>, <span className="text-violet-400">legendary</span>, and <span className="text-amber-400">unique</span> — each visually distinct on your sheet.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                            <h3 className="text-base font-semibold text-white">Guest vs. saved characters</h3>
                            <p className="mt-2 text-sm text-white/70">
                                Guest characters are wiped when you close the session. Sign in with a free account and every character, quest, and inventory item persists indefinitely.
                            </p>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="space-y-6">
                    <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-white/50">FAQ</p>
                        <h2 className="text-3xl font-semibold text-white">Common questions.</h2>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                        {faqs.map((item) => (
                            <div key={item.q} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                                <h3 className="text-base font-semibold text-white">{item.q}</h3>
                                <p className="mt-2 text-sm text-white/70">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-rose-500/20 via-amber-400/10 to-red-800/20 p-8 text-center backdrop-blur">
                    <h2 className="text-2xl font-semibold text-white">Ready to start your adventure?</h2>
                    <p className="mt-3 text-white/80">No account needed. Pick a world and your character will be ready in under a minute.</p>
                    <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link
                            href="/"
                            className="rounded-full bg-gradient-to-r from-rose-400 via-amber-600 to-red-800 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/20"
                        >
                            Browse worlds
                        </Link>
                        <Link
                            href="/login"
                            className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white/80 hover:border-white/60 transition"
                        >
                            Create a free account
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
