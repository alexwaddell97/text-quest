/**
 * scripts/patch-wow-theme.ts
 *
 * Patches the World of Warcraft setting's theme to match the rich
 * earthy browns and warm golds of the original 2004 box art.
 *
 * Usage:  npm run patch:wow-theme
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = 'dev';
const COLLECTION = 'settings';

// ─── WoW theme — deep chocolate browns + aged Azerothian gold ────────────────
//
// Inspired by the original 2004 Warcraft box art:
//   • Near-black with warm mahogany undertones for backgrounds
//   • Aged parchment / cream tint on all text
//   • Goldenrod → burnished brass for accent colours
//   • Amber-orange and deep sienna for ambient radial orbs
//   • Cinzel — the closest Google Font to Blizzard's classic Warcraft serif
//
const WOW_THEME = {
    bg:             '#060402',
    panel:          '#0e0804',
    elevated:       '#1c1208',
    muted:          '#c49a2c',
    text:           '#f5ecd8',
    textWeak:       '#d4ba82',
    accent:         '#b8860b',
    accentStrong:   '#f0c040',
    border:         'rgba(195, 150, 30, 0.12)',
    glow:           'rgba(185, 125, 15, 0.32)',
    ambientA:       'rgba(150, 75, 8, 0.22)',
    ambientB:       'rgba(95, 45, 0, 0.14)',
    buttonGradient: 'linear-gradient(135deg, #5c2800 0%, #8b5a00 50%, #3d1800 100%)',
    playerBubble:   'linear-gradient(135deg, rgba(92,40,0,0.38) 0%, rgba(139,90,0,0.14) 100%)',
    fontUrl:        'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap',
    fontDisplay:    "'Cinzel', 'Space Grotesk', serif",
};

async function main() {
    if (!MONGODB_URI) throw new Error('MONGODB_URI is not set in your .env.local file');

    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const col = client.db(DB_NAME).collection(COLLECTION);

    const result = await col.updateOne(
        { name: { $regex: /^warcraft$/i } },
        { $set: { theme: WOW_THEME } },
    );

    if (result.matchedCount === 0) {
        console.log('⚠️  No setting named "World of Warcraft" found in the database.');
    } else if (result.modifiedCount === 0) {
        console.log('ℹ️  Theme already up-to-date (no changes written).');
    } else {
        console.log('✅  World of Warcraft theme patched successfully.');
        console.log('    bg:', WOW_THEME.bg, '/ accent:', WOW_THEME.accent, '/ accentStrong:', WOW_THEME.accentStrong);
    }

    await client.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
