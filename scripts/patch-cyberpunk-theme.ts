/**
 * scripts/patch-cyberpunk-theme.ts
 *
 * Patches the Cyberpunk 2077 setting's theme to the iconic Cyberpunk yellow —
 * the saturated amber-gold of the logo, UI chrome, and primary marketing art.
 *
 * Usage:  npm run patch:cyberpunk
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = 'dev';
const COLLECTION = 'settings';

// ─── Cyberpunk 2077 theme — Night City yellow-black ──────────────────────────
//
// Inspired by the Cyberpunk 2077 logo, game UI, and primary art:
//   • Near-black with warm yellow/amber undertones — not the cool blue-black
//     of generic scifi; Night City glows amber-gold, not blue
//   • #f7c400 → #ffe033 as the hero yellow — exact logo / UI chrome colour
//   • Cream-yellow text, not white — everything has a yellow cast under neon
//   • A whisper of cyan in the second ambient — holographic screen bleed
//   • Rajdhani — angular, condensed, Night City feel
//
const CYBERPUNK_THEME = {
    bg:             '#0a0900',
    panel:          '#141100',
    elevated:       '#201a00',
    muted:          '#9a8420',
    text:           '#fff8dc',
    textWeak:       '#d4c060',
    accent:         '#f7c400',
    accentStrong:   '#ffe033',
    border:         'rgba(247,196,0,0.16)',
    glow:           'rgba(255,220,30,0.35)',
    ambientA:       'rgba(240,160,0,0.22)',
    ambientB:       'rgba(0,200,255,0.10)',
    buttonGradient: 'linear-gradient(135deg, #7a5500 0%, #f7c400 50%, #4a3000 100%)',
    playerBubble:   'linear-gradient(135deg, rgba(180,120,0,0.40) 0%, rgba(255,200,0,0.10) 100%)',
    fontUrl:        'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&display=swap',
    fontDisplay:    "'Rajdhani', sans-serif",
};

async function main() {
    if (!MONGODB_URI) throw new Error('MONGODB_URI is not set in your .env.local file');

    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const col = client.db(DB_NAME).collection(COLLECTION);

    const result = await col.updateOne(
        { name: { $regex: /^cyberpunk/i } },
        { $set: { theme: CYBERPUNK_THEME } },
    );

    if (result.matchedCount === 0) {
        console.log('⚠️  No setting matching "Cyberpunk" found in the database.');
    } else {
        console.log(`✓  Cyberpunk theme patched  (accent: ${CYBERPUNK_THEME.accentStrong}  bg: ${CYBERPUNK_THEME.bg})`);
    }

    await client.close();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
