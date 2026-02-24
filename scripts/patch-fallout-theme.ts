/**
 * scripts/patch-fallout-theme.ts
 *
 * Patches the Fallout setting's theme to match the iconic Vault-Tec yellow
 * of the original primary art — Vault Boy illustration, box art, and UI chrome.
 *
 * Usage:  npm run patch:fallout
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = 'dev';
const COLLECTION = 'settings';

// ─── Fallout theme — Pip-Boy phosphor green ──────────────────────────────────
//
// Inspired by the Fallout 1/2/3/NV Pip-Boy interface and retro-futuristic tone:
//   • Near-black with warm green undertones
//   • Pip-Boy green (#c4e85a) as the hero accent
//   • Cool off-white text with green tint
//   • Share Tech Mono — closest freely available font to the Pip-Boy UI face
//
const FALLOUT_THEME = {
    bg:             '#080a04',
    panel:          '#111407',
    elevated:       '#1c200f',
    muted:          '#6b7a3a',
    text:           '#e8ecd8',
    textWeak:       '#b8c890',
    accent:         '#8db33a',
    accentStrong:   '#c4e85a',
    border:         'rgba(141,179,58,0.12)',
    glow:           'rgba(141,179,58,0.3)',
    ambientA:       'rgba(80,120,20,0.22)',
    ambientB:       'rgba(200,150,20,0.14)',
    buttonGradient: 'linear-gradient(135deg, #4a5c10 0%, #8db33a 100%)',
    playerBubble:   'linear-gradient(135deg, rgba(80,110,20,0.35) 0%, rgba(255,255,255,0.03) 100%)',
    fontUrl:        'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap',
    fontDisplay:    "'Share Tech Mono', monospace",
};

async function main() {
    if (!MONGODB_URI) throw new Error('MONGODB_URI is not set in your .env.local file');

    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const col = client.db(DB_NAME).collection(COLLECTION);

    const result = await col.updateOne(
        { name: { $regex: /^fallout/i } },
        { $set: { theme: FALLOUT_THEME } },
    );

    if (result.matchedCount === 0) {
        console.log('⚠️  No setting matching "Fallout" found in the database.');
    } else {
        console.log(`✓  Fallout theme patched  (accent: ${FALLOUT_THEME.accentStrong}  bg: ${FALLOUT_THEME.bg})`);
    }

    await client.close();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
