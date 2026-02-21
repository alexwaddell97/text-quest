import { Setting, SettingTheme } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Predefined atmospheric palettes keyed by genre archetype
// ─────────────────────────────────────────────────────────────────────────────

const THEMES: Record<string, SettingTheme> = {
    // ── Fantasy / Medieval / Magic ──────────────────────────────────────────
    fantasy: {
        bg: '#060409', panel: '#0d0a14', elevated: '#16102a', muted: '#b8a0cc',
        text: '#f2eeff', textWeak: '#d4c4e8', accent: '#a07ab8', accentStrong: '#e8d8f8',
        border: 'rgba(180, 150, 220, 0.1)', glow: 'rgba(140, 100, 200, 0.28)',
        ambientA: 'rgba(100, 60, 180, 0.22)', ambientB: 'rgba(180, 100, 50, 0.12)',
        buttonGradient: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #4c1d95 100%)',
        playerBubble: 'linear-gradient(135deg, rgba(109,40,217,0.3) 0%, rgba(109,40,217,0.1) 100%)',
        fontUrl: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap',
        fontDisplay: "'Cinzel', 'Space Grotesk', serif",
    },
    // ── Sci-Fi / Space / Cyberpunk / Futuristic ─────────────────────────────
    scifi: {
        bg: '#020810', panel: '#060e1a', elevated: '#0c1828', muted: '#7ab0d0',
        text: '#e8f4ff', textWeak: '#a8c8e0', accent: '#3a88c0', accentStrong: '#90d8ff',
        border: 'rgba(80, 160, 240, 0.1)', glow: 'rgba(40, 130, 220, 0.28)',
        ambientA: 'rgba(20, 80, 200, 0.22)', ambientB: 'rgba(0, 200, 180, 0.12)',
        buttonGradient: 'linear-gradient(135deg, #0e4d8a 0%, #1565c0 50%, #0d47a1 100%)',
        playerBubble: 'linear-gradient(135deg, rgba(14,77,138,0.35) 0%, rgba(21,101,192,0.15) 100%)',
        fontUrl: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700&display=swap',
        fontDisplay: "'Orbitron', 'Space Grotesk', monospace",
    },
    // ── Horror / Gothic / Dark / Occult ─────────────────────────────────────
    horror: {
        bg: '#060202', panel: '#100606', elevated: '#1c0a0a', muted: '#cc8888',
        text: '#f5e8e8', textWeak: '#d4b0b0', accent: '#b04040', accentStrong: '#fcd8d8',
        border: 'rgba(180, 60, 60, 0.12)', glow: 'rgba(160, 40, 40, 0.3)',
        ambientA: 'rgba(160, 20, 20, 0.22)', ambientB: 'rgba(80, 0, 0, 0.18)',
        buttonGradient: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #450a0a 100%)',
        playerBubble: 'linear-gradient(135deg, rgba(127,29,29,0.4) 0%, rgba(153,27,27,0.15) 100%)',
        fontUrl: 'https://fonts.googleapis.com/css2?family=Uncial+Antiqua&display=swap',
        fontDisplay: "'Uncial Antiqua', 'Space Grotesk', serif",
    },
    // ── Historical / Ancient / Classical ────────────────────────────────────
    historical: {
        bg: '#080602', panel: '#120e04', elevated: '#1e1808', muted: '#c8a860',
        text: '#f5efde', textWeak: '#d8c898', accent: '#a87840', accentStrong: '#f8d880',
        border: 'rgba(200, 160, 80, 0.1)', glow: 'rgba(170, 130, 60, 0.28)',
        ambientA: 'rgba(160, 100, 20, 0.2)', ambientB: 'rgba(100, 60, 10, 0.14)',
        buttonGradient: 'linear-gradient(135deg, #78350f 0%, #92400e 50%, #451a03 100%)',
        playerBubble: 'linear-gradient(135deg, rgba(120,53,15,0.4) 0%, rgba(146,64,14,0.15) 100%)',
        fontUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap',
        fontDisplay: "'Cormorant Garamond', 'Space Grotesk', serif",
    },
    // ── Post-Apocalyptic / Wasteland / Survival ──────────────────────────────
    postapoc: {
        bg: '#080503', panel: '#120a04', elevated: '#1c1008', muted: '#c09060',
        text: '#f0e8d8', textWeak: '#d0c0a0', accent: '#c06020', accentStrong: '#f0a050',
        border: 'rgba(200, 110, 40, 0.1)', glow: 'rgba(180, 80, 20, 0.3)',
        ambientA: 'rgba(180, 70, 10, 0.22)', ambientB: 'rgba(110, 50, 0, 0.15)',
        buttonGradient: 'linear-gradient(135deg, #7c2d12 0%, #9a3412 50%, #431407 100%)',
        playerBubble: 'linear-gradient(135deg, rgba(124,45,18,0.4) 0%, rgba(154,52,18,0.15) 100%)',
        fontUrl: 'https://fonts.googleapis.com/css2?family=Special+Elite&display=swap',
        fontDisplay: "'Special Elite', 'Space Grotesk', serif",
    },
    // ── Ocean / Pirate / Maritime / Nautical ────────────────────────────────
    nautical: {
        bg: '#020609', panel: '#040e16', elevated: '#081820', muted: '#60a8b8',
        text: '#e8f4f8', textWeak: '#a0c8d8', accent: '#2888a8', accentStrong: '#80d0e8',
        border: 'rgba(40, 140, 180, 0.1)', glow: 'rgba(30, 120, 160, 0.28)',
        ambientA: 'rgba(10, 80, 160, 0.2)', ambientB: 'rgba(0, 150, 180, 0.12)',
        buttonGradient: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #082f49 100%)',
        playerBubble: 'linear-gradient(135deg, rgba(12,74,110,0.38) 0%, rgba(3,105,161,0.15) 100%)',
        fontUrl: 'https://fonts.googleapis.com/css2?family=Pirata+One&display=swap',
        fontDisplay: "'Pirata One', 'Space Grotesk', serif",
    },
    // ── Mystery / Noir / Detective ───────────────────────────────────────────
    mystery: {
        bg: '#050508', panel: '#0a0a12', elevated: '#14141c', muted: '#9898b8',
        text: '#f0f0f8', textWeak: '#c0c0d8', accent: '#7070a0', accentStrong: '#d0d0f0',
        border: 'rgba(120, 120, 180, 0.1)', glow: 'rgba(100, 100, 160, 0.28)',
        ambientA: 'rgba(80, 60, 160, 0.2)', ambientB: 'rgba(40, 40, 100, 0.15)',
        buttonGradient: 'linear-gradient(135deg, #312e81 0%, #3730a3 50%, #1e1b4b 100%)',
        playerBubble: 'linear-gradient(135deg, rgba(49,46,129,0.38) 0%, rgba(55,48,163,0.15) 100%)',
        fontUrl: 'https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700&display=swap',
        fontDisplay: "'Josefin Sans', 'Space Grotesk', sans-serif",
    },
    // ── Western / Frontier / Desert ──────────────────────────────────────────
    western: {
        bg: '#080504', panel: '#120b06', elevated: '#1c110a', muted: '#c09070',
        text: '#f4ede0', textWeak: '#d4c0a8', accent: '#b06840', accentStrong: '#f0aa70',
        border: 'rgba(180, 120, 70, 0.1)', glow: 'rgba(160, 100, 50, 0.28)',
        ambientA: 'rgba(160, 80, 30, 0.2)', ambientB: 'rgba(100, 55, 15, 0.15)',
        buttonGradient: 'linear-gradient(135deg, #713f12 0%, #854d0e 50%, #3f2006 100%)',
        playerBubble: 'linear-gradient(135deg, rgba(113,63,18,0.4) 0%, rgba(133,77,14,0.15) 100%)',
        fontUrl: 'https://fonts.googleapis.com/css2?family=Rye&display=swap',
        fontDisplay: "'Rye', 'Space Grotesk', serif",
    },
    // ── Adventure / Jungle / Exploration ─────────────────────────────────────
    adventure: {
        bg: '#020804', panel: '#060f07', elevated: '#0a180c', muted: '#70a870',
        text: '#e8f4e8', textWeak: '#a0c8a0', accent: '#388838', accentStrong: '#88d888',
        border: 'rgba(60, 160, 60, 0.1)', glow: 'rgba(40, 140, 40, 0.28)',
        ambientA: 'rgba(20, 100, 30, 0.2)', ambientB: 'rgba(80, 160, 20, 0.12)',
        buttonGradient: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #052e16 100%)',
        playerBubble: 'linear-gradient(135deg, rgba(20,83,45,0.38) 0%, rgba(22,101,52,0.15) 100%)',
        fontUrl: 'https://fonts.googleapis.com/css2?family=Almendra:wght@400;700&display=swap',
        fontDisplay: "'Almendra', 'Space Grotesk', serif",
    },
    // ── Steampunk / Industrial ────────────────────────────────────────────────
    steampunk: {
        bg: '#060504', panel: '#0e0b06', elevated: '#181208', muted: '#b89060',
        text: '#f4ecd8', textWeak: '#d4c0a0', accent: '#a87030', accentStrong: '#f0b860',
        border: 'rgba(180, 130, 60, 0.12)', glow: 'rgba(160, 110, 40, 0.28)',
        ambientA: 'rgba(150, 90, 20, 0.2)', ambientB: 'rgba(200, 130, 40, 0.12)',
        buttonGradient: 'linear-gradient(135deg, #78350f 0%, #a16207 50%, #451a03 100%)',
        playerBubble: 'linear-gradient(135deg, rgba(120,53,15,0.38) 0%, rgba(161,98,7,0.15) 100%)',
        fontUrl: 'https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&display=swap',
        fontDisplay: "'IM Fell English', 'Space Grotesk', serif",
    },
    // ── Fallback / Generic ────────────────────────────────────────────────────
    default: {
        bg: '#05060b', panel: '#0f1118', elevated: '#191c26', muted: '#a0a8c0',
        text: '#f5f6fa', textWeak: '#c6cbd8', accent: '#949eb5', accentStrong: '#e2e8f0',
        border: 'rgba(255, 255, 255, 0.09)', glow: 'rgba(148, 158, 181, 0.25)',
        ambientA: 'rgba(100, 80, 200, 0.15)', ambientB: 'rgba(200, 100, 50, 0.1)',
        buttonGradient: 'linear-gradient(135deg, #be123c 0%, #d97706 50%, #991b1b 100%)',
        playerBubble: 'linear-gradient(135deg, rgba(190,18,60,0.3) 0%, rgba(190,18,60,0.1) 100%)',
        fontUrl: '',
        fontDisplay: "'Space Grotesk', sans-serif",
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Keyword → archetype mapping
// ─────────────────────────────────────────────────────────────────────────────

const GENRE_KEYWORDS: { archetype: string; keywords: string[] }[] = [
    {
        archetype: 'fantasy',
        keywords: [
            'fantasy', 'medieval', 'magic', 'wizard', 'dragon', 'elf', 'dwarf',
            'sword', 'sorcery', 'enchant', 'spell', 'kingdom', 'realm',
            'mythic', 'myth', 'legend', 'fae', 'fairy', 'dungeon', 'quest',
        ],
    },
    {
        archetype: 'scifi',
        keywords: [
            'sci-fi', 'scifi', 'science fiction', 'space', 'star', 'galaxy',
            'cyberpunk', 'cyber', 'futuristic', 'robot', 'android', 'neon',
            'dystopia', 'utopia', 'tech', 'alien', 'planet', 'laser', 'ship',
            'colony', 'synthetic', 'ai', 'digital', 'hologram',
        ],
    },
    {
        archetype: 'horror',
        keywords: [
            'horror', 'gothic', 'dark', 'vampire', 'undead', 'ghost', 'haunted',
            'cursed', 'occult', 'demon', 'shadow', 'dread', 'eldritch',
            'lovecraft', 'cthulhu', 'nightmare', 'blood', 'creature',
        ],
    },
    {
        archetype: 'historical',
        keywords: [
            'historical', 'ancient', 'classical', 'roman', 'greek', 'egypt',
            'renaissance', 'victorian', 'war', 'empire', 'samurai', 'feudal',
            'aztec', 'norse', 'viking', 'mediaeval', 'period',
        ],
    },
    {
        archetype: 'postapoc',
        keywords: [
            'apocalypse', 'apocalyptic', 'post-apocalyptic', 'wasteland',
            'survival', 'radioactive', 'fallout', 'mutant', 'ruins',
            'collapse', 'desolate', 'wasteland', 'barren',
        ],
    },
    {
        archetype: 'nautical',
        keywords: [
            'ocean', 'sea', 'pirate', 'nautical', 'maritime', 'ship', 'island',
            'underwater', 'aquatic', 'deep', 'mermaid', 'kraken', 'sailor',
        ],
    },
    {
        archetype: 'mystery',
        keywords: [
            'mystery', 'noir', 'detective', 'crime', 'thriller', 'investigation',
            'spy', 'espionage', 'murder', 'detective', 'conspiracy',
        ],
    },
    {
        archetype: 'western',
        keywords: [
            'western', 'frontier', 'cowboy', 'wild west', 'desert', 'outlaw',
            'sheriff', 'ranch', 'saloon', 'dust', 'canyon',
        ],
    },
    {
        archetype: 'adventure',
        keywords: [
            'adventure', 'jungle', 'exploration', 'expedition', 'wilderness',
            'nature', 'forest', 'tribe', 'ruin', 'treasure', 'temple',
        ],
    },
    {
        archetype: 'steampunk',
        keywords: [
            'steampunk', 'steam', 'industrial', 'airship', 'clockwork',
            'gear', 'brass', 'copper', 'mechanical', 'automaton',
        ],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Derive an archetype from a setting's genre string and name
// ─────────────────────────────────────────────────────────────────────────────

function detectArchetype(setting: Setting): string {
    const corpus = [(Array.isArray(setting.genres) ? setting.genres.join(' ') : ''), setting.name, setting.description]
        .join(' ')
        .toLowerCase();

    for (const { archetype, keywords } of GENRE_KEYWORDS) {
        for (const kw of keywords) {
            if (corpus.includes(kw)) return archetype;
        }
    }
    return 'default';
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the stored theme if present, otherwise derives one from genre/name */
export function getSettingTheme(setting: Setting): SettingTheme {
    if (setting.theme) return setting.theme;
    return deriveThemeFromSetting(setting);
}

/** Auto-generates a theme from the setting's genre/name/description */
export function deriveThemeFromSetting(setting: Setting): SettingTheme {
    const archetype = detectArchetype(setting);
    return THEMES[archetype] ?? THEMES.default;
}

/** Converts a SettingTheme into CSS custom-property key/value pairs */
export function themeToCssVars(theme: SettingTheme): Record<string, string> {
    return {
        '--bg': theme.bg,
        '--panel': theme.panel,
        '--elevated': theme.elevated,
        '--muted': theme.muted,
        '--text': theme.text,
        '--text-weak': theme.textWeak,
        '--accent': theme.accent,
        '--accent-strong': theme.accentStrong,
        '--border': theme.border,
        '--glow': theme.glow,
        '--ambient-a': theme.ambientA,
        '--ambient-b': theme.ambientB,
        '--theme-btn': theme.buttonGradient,
        '--theme-player-bubble': theme.playerBubble,
        '--font-display': theme.fontDisplay,
    };
}
