/**
 * scripts/migrate-genres.ts
 *
 * Migrates each setting's `genre` string field to a `genres` string array
 * WITHOUT touching any other fields (votes, system_message, cover_image, etc.)
 *
 * Usage:  npm run migrate:genres
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = 'dev';
const COLLECTION = 'settings';

// Curated multi-genre arrays keyed by setting name
const GENRE_MAP: Record<string, string[]> = {
    'Mass Effect':                   ['Science Fiction', 'Space Opera', 'Action RPG'],
    'Fallout':                       ['Post-Apocalyptic', 'Science Fiction', 'Dark Comedy'],
    'The Elder Scrolls: Skyrim':     ['Fantasy', 'Action RPG', 'Open World'],
    'Resident Evil':                 ['Horror', 'Survival Horror', 'Action'],
    'Cyberpunk 2077':                ['Cyberpunk', 'Science Fiction', 'Action RPG'],
    'Elden Ring':                    ['Dark Fantasy', 'Fantasy', 'Action RPG'],
    'Alien':                         ['Science Fiction', 'Horror', 'Survival'],
    'The Last of Us':                ['Post-Apocalyptic', 'Horror', 'Drama'],
    'Red Dead Redemption':           ['Western', 'Action Adventure', 'Drama'],
    'Halo':                          ['Science Fiction', 'Military', 'Space Opera'],
    'Warhammer 40,000':              ['Science Fiction', 'Dark Fantasy', 'Military'],
    'Avatar: The Last Airbender':    ['Anime', 'Fantasy', 'Adventure'],
    "Assassin's Creed":              ['Historical', 'Action Adventure', 'Stealth'],
    'The Walking Dead':              ['Horror', 'Post-Apocalyptic', 'Drama'],
    'Pirates of the Caribbean':      ['Adventure', 'Fantasy', 'Swashbuckling'],
    'Sword Art Online':              ['Anime', 'Science Fiction', 'Fantasy'],
    'Yu-Gi-Oh!':                     ['Anime', 'Fantasy', 'Adventure'],
    'Pokémon':                       ['Anime', 'Adventure', 'Fantasy'],
};

async function main() {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const col = client.db(DB_NAME).collection(COLLECTION);

    console.log('\n🔀 Migrating genres field (surgical update — no other fields touched)…\n');

    let updated = 0;
    let skipped = 0;
    let notFound = 0;

    for (const [name, genres] of Object.entries(GENRE_MAP)) {
        const existing = await col.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });

        if (!existing) {
            console.log(`  ⚠️  Not found — ${name}`);
            notFound++;
            continue;
        }

        // Only write if genres has actually changed
        const currentGenres: string[] = existing.genres ?? [];
        const same =
            currentGenres.length === genres.length &&
            genres.every((g, i) => g === currentGenres[i]);

        if (same) {
            console.log(`  ⏭  Skipped  — ${name} (already up-to-date)`);
            skipped++;
            continue;
        }

        await col.updateOne(
            { _id: existing._id },
            {
                $set: { genres },
                $unset: { genre: '' },   // remove legacy single-string field if present
            }
        );

        console.log(`  ✅ Updated  — ${name}  →  [${genres.join(', ')}]`);
        updated++;
    }

    await client.close();

    console.log('\n─────────────────────────────────');
    console.log(`  Updated  : ${updated}`);
    console.log(`  Skipped  : ${skipped}`);
    console.log(`  Not found: ${notFound}`);
    console.log('─────────────────────────────────\n');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
