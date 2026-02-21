/**
 * scripts/seed-themes.ts
 *
 * Generates a bespoke SettingTheme for every setting in the database using
 * GPT-4o, tailored to that setting's visual identity, branding and tone.
 *
 * Usage:
 *   npm run seed:themes           # skip settings that already have a theme
 *   npm run seed:themes -- --force # regenerate themes for all settings
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Next.js uses .env.local — load it explicitly
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') }); // fallback

import { MongoClient } from 'mongodb';
import OpenAI from 'openai';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface SettingTheme {
    bg: string;
    panel: string;
    elevated: string;
    muted: string;
    text: string;
    textWeak: string;
    accent: string;
    accentStrong: string;
    border: string;
    glow: string;
    ambientA: string;
    ambientB: string;
    buttonGradient: string;
    playerBubble: string;
    fontUrl: string;
    fontDisplay: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// OpenAI function schema for structured output
// ─────────────────────────────────────────────────────────────────────────────

const themeFunction: OpenAI.Chat.Completions.ChatCompletionTool = {
    type: 'function',
    function: {
        name: 'generate_setting_theme',
        description: 'Returns a bespoke dark-UI colour palette and font choice that perfectly captures the visual identity of the given setting.',
        parameters: {
            type: 'object',
            required: [
                'bg', 'panel', 'elevated', 'muted',
                'text', 'textWeak', 'accent', 'accentStrong',
                'border', 'glow', 'ambientA', 'ambientB',
                'buttonGradient', 'playerBubble', 'fontUrl', 'fontDisplay',
            ],
            properties: {
                bg:             { type: 'string', description: 'Deepest background colour (#rrggbb). Almost-black but tinted with the setting\'s primary hue.' },
                panel:          { type: 'string', description: 'Primary surface / card background (#rrggbb). Slightly lighter than bg.' },
                elevated:       { type: 'string', description: 'Elevated/hovered surface (#rrggbb). Noticeably lighter than panel but still dark.' },
                muted:          { type: 'string', description: 'Mid-tone muted text or secondary labels (#rrggbb).' },
                text:           { type: 'string', description: 'Primary readable text (#rrggbb). Near-white, slightly tinted.' },
                textWeak:       { type: 'string', description: 'Secondary/dimmed text (#rrggbb). Lighter than muted, darker than text.' },
                accent:         { type: 'string', description: 'Main interactive accent colour (#rrggbb). The setting\'s signature hue, medium brightness.' },
                accentStrong:   { type: 'string', description: 'Bright/highlighted accent (#rrggbb). Used on active states, headings, glow edges.' },
                border:         { type: 'string', description: 'Subtle border colour as rgba(r,g,b,a) — low opacity, tinted.' },
                glow:           { type: 'string', description: 'Box-shadow glow colour as rgba(r,g,b,a) — signature hue, ~0.25–0.35 alpha.' },
                ambientA:       { type: 'string', description: 'First colour of the ambient radial-gradient orb at the top of the play screen, rgba(r,g,b,a).' },
                ambientB:       { type: 'string', description: 'Second colour of the ambient orb, rgba(r,g,b,a). Different hue from ambientA for movement.' },
                buttonGradient: { type: 'string', description: 'CSS gradient for primary action buttons, e.g. "linear-gradient(135deg, #colorA 0%, #colorB 100%)". Pull from the setting\'s most iconic action colour.' },
                playerBubble:   { type: 'string', description: 'CSS gradient for the player message chat bubble. Should share hues with buttonGradient but at lower opacity, e.g. "linear-gradient(135deg, rgba(r,g,b,0.35) 0%, rgba(255,255,255,0.03) 100%)".' },
                fontUrl:        { type: 'string', description: 'Google Fonts CSS2 API URL for the display font that fits the setting tone, e.g. "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap". Use "" if no specific font fits.' },
                fontDisplay:    { type: 'string', description: 'CSS font-family stack including the Google Font, e.g. "\'Cinzel\', serif" or "\'Orbitron\', sans-serif". Match the setting\'s personality.' },
            },
            additionalProperties: false,
        },
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Generate bespoke theme for one setting via GPT-4o
// ─────────────────────────────────────────────────────────────────────────────

async function generateTheme(openai: OpenAI, setting: Record<string, unknown>): Promise<SettingTheme> {
    const settingContext = JSON.stringify({
        name: setting.name,
        genre: setting.genre,
        description: setting.description,
        key_themes: setting.key_themes,
        factions: setting.factions,
        major_locations: setting.major_locations,
    });

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0.4,
        tools: [themeFunction],
        tool_choice: { type: 'function', function: { name: 'generate_setting_theme' } },
        messages: [
            {
                role: 'system',
                content: `You are a senior UI/UX designer specialising in dark-mode game interfaces.
Your task is to create a deeply atmospheric, setting-specific colour palette for a text-based RPG game UI.

PALETTE RULES:
- ALL values must result in a **dark-mode** UI. Background values must be very dark (luminance < 15%).
- The palette must feel unmistakeably tied to this specific setting — a player should glance at it and immediately feel the world.
- Use the setting's iconic brand colours, dominant environmental tones, and emotional register.
  Examples:
  • Harry Potter → deep midnight navy of the Great Hall sky, Hogwarts gold accent, parchment text tint
  • Star Wars → deep space black, iconic orange X-wing or Sith crimson, lightsaber glow
  • Stranger Things → worn CRT-tube black, Hawkins amber warmth, Upside-Down crimson-red glow
  • Doctor Who → deep TARDIS Police-Box blue, time-vortex gold/amber accent
  • The Matrix → absolute terminal black, phosphor green accent, electric green glow
  • Dune → desert charcoal with sandstone undertones, spice-orange/amber accent, arrakis heat-shimmer glow
  • The Witcher → fog-grey near-black, wolven trial silver-white accent, Kaer Morhen alchemy-amber glow
  • Game of Thrones → stone-wall slate charcoal, Valyrian steel blue-grey accent, dragonfire ember glow
  • Warcraft → deep fel-green-tinted black, horde blood-red or alliance royal-blue accent
  • Marvel → cosmic dark blue-black, vibranium purple or Iron Man gold, energy burst glow
  • Bridgerton → deep midnight blue-teal, pearl/ivory accent, candlelight warm glow
  • Baldur's Gate → deep dungeon-stone black, magic-scroll parchment gold accent, arcane purple glow
  • Lord of the Rings → deep forest/stone black, Elvish silver or Dwarvish bronze accent, Mordor/Shire ambient
  • Metal Gear Solid → tactical dark grey-green, codec-screen amber accent, radar-green glow
  … apply the same level of specificity for any other setting.
- Use only hex (#rrggbb) for solid colours and rgba(r,g,b,a) for transparent values.
- Borders: rgba with alpha 0.08–0.15. Glows: rgba with alpha 0.22–0.35.
- Ambient colours: rgba with alpha 0.12–0.28; use two distinct hues for a lively gradient feel.

BUTTON GRADIENT (buttonGradient):
- A CSS linear-gradient string for the primary "Send" and "Start session" action buttons.
- Pull the most iconic, vivid action colour from the setting. Examples:
  • Harry Potter → linear-gradient(135deg, #7b2d8b 0%, #c9a84c 100%) (deep purple into Hogwarts gold)
  • The Matrix → linear-gradient(135deg, #003300 0%, #00ff41 100%) (terminal green surge)
  • Dune → linear-gradient(135deg, #8b4500 0%, #d4820a 100%) (sandstone to spice orange)
- Stays dark/saturated but clearly themed. Include slight top-left to bottom-right angle.

PLAYER BUBBLE (playerBubble):
- Same hues as buttonGradient at very low opacity (0.25–0.40 on the primary, ~0.03 on secondary).
- Example: if buttonGradient uses #7b2d8b and #c9a84c, playerBubble → linear-gradient(135deg, rgba(123,45,139,0.35) 0%, rgba(255,255,255,0.03) 100%)

FONT SELECTION (fontUrl + fontDisplay):
- Choose a Google Font that fits the setting's tone and era:
  • Fantasy/Medieval → 'Cinzel', 'MedievalSharp', 'UnifrakturMaguntia'
  • Sci-fi/Cyber → 'Orbitron', 'Exo 2', 'Rajdhani'
  • Horror/Gothic → 'Creepster', 'New Rocker', 'Nosifer'
  • Western → 'Rye', 'Uncial Antiqua'
  • Victorian/Steampunk → 'IM Fell English', 'Philosopher'
  • Modern thriller → 'Oswald', 'Bebas Neue', 'Barlow Condensed'
  • Romance/Regency → 'Playfair Display', 'Cormorant Garamond'
  • Space opera → 'Space Grotesk', 'Chakra Petch'
- Use the Google Fonts CSS2 API for fontUrl: https://fonts.googleapis.com/css2?family=Font+Name:wght@400;700&display=swap
- fontDisplay should be the CSS font-family stack, e.g. "'Cinzel', serif"
- Use "" for fontUrl and generic fallback for fontDisplay if the setting has a thoroughly modern feel with no strong typographic identity.`,
            },
            {
                role: 'user',
                content: `Generate the perfect UI colour palette for this setting:\n\n${settingContext}`,
            },
        ],
    });

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('No tool call returned from OpenAI');

    return JSON.parse(toolCall.function.arguments) as SettingTheme;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

const FORCE = process.argv.includes('--force');

async function main() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI is not set in your .env.local file');

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) throw new Error('OPENAI_API_KEY is not set in your .env.local file');

    const openai = new OpenAI({ apiKey: openaiKey });

    console.log('Connecting to MongoDB…');
    const client = new MongoClient(mongoUri);
    await client.connect();

    const db = client.db('dev');
    const collection = db.collection('settings');

    const query = FORCE ? {} : { theme: { $exists: false } };
    const settings = await collection.find(query).toArray();

    if (settings.length === 0) {
        console.log('No settings to update — all already have a custom theme.\nRun with --force to regenerate all.');
        await client.close();
        return;
    }

    console.log(`Generating tailored themes for ${settings.length} setting(s)${FORCE ? ' (force)' : ''}…\n`);

    let updated = 0;
    for (const setting of settings) {
        process.stdout.write(`  Crafting theme for "${setting.name}"… `);
        try {
            const theme = await generateTheme(openai, setting as Record<string, unknown>);
            await collection.updateOne({ _id: setting._id }, { $set: { theme } });
            console.log(`✓  (bg: ${theme.bg}  accent: ${theme.accent}  font: ${theme.fontDisplay || 'default'})`);
            updated++;
        } catch (err) {
            console.log(`✗ FAILED`);
            console.error(`     ${(err as Error).message}`);
        }
    }

    console.log(`\nDone. ${updated}/${settings.length} setting(s) updated.`);
    await client.close();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
