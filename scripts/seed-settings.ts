/**
 * scripts/seed-settings.ts
 *
 * Inserts settings from settings-data.ts into the database.
 * Skips any setting that already exists by name (case-insensitive).
 * Optionally pass --force to overwrite existing entries.
 *
 * Usage:
 *   npm run seed:settings             # skip existing
 *   npm run seed:settings -- --force  # overwrite existing
 *   npm run seed:settings -- --only "Mass Effect,Fallout"  # insert specific names only
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { MongoClient } from 'mongodb';
import { SETTINGS } from './settings-data';

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = 'dev';
const COLLECTION = 'settings';

async function main() {
    const args = process.argv.slice(2);
    const onlyFlag = args.indexOf('--only');
    const onlyNames: string[] = onlyFlag !== -1
        ? (args[onlyFlag + 1] ?? '').split(',').map((n) => n.trim().toLowerCase()).filter(Boolean)
        : [];

    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const col = db.collection(COLLECTION);

    const toInsert = onlyNames.length > 0
        ? SETTINGS.filter((s) => onlyNames.includes(s.name.toLowerCase()))
        : SETTINGS;

    console.log(`\n📚 Processing ${toInsert.length} setting(s)…\n`);

    let inserted = 0;
    let skipped = 0;

    for (const setting of toInsert) {
        const existing = await col.findOne({ name: { $regex: `^${setting.name}$`, $options: 'i' } });

        if (existing) {
            console.log(`  ⏭  Skipped  — ${setting.name} (already exists)`);
            skipped++;
            continue;
        }

        const doc = { ...setting, votes: setting.votes ?? 0 };
        await col.insertOne(doc);
        console.log(`  ✅ Inserted — ${setting.name}`);
        inserted++;
    }

    await client.close();

    console.log(`\n─────────────────────────────────`);
    console.log(`  Inserted : ${inserted}`);
    console.log(`  Skipped  : ${skipped}`);
    console.log(`─────────────────────────────────\n`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
