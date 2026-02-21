import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
import { MongoClient } from 'mongodb';
import { SETTINGS } from './settings-data';

async function main() {
    const client = new MongoClient(process.env.MONGODB_URI as string);
    await client.connect();
    const docs = await client.db('dev').collection('settings').find({}, { projection: { name: 1, cover_image: 1 } }).toArray();

    const seedMap = Object.fromEntries(SETTINGS.map(s => [s.name, s.cover_image]));

    let overwritten = 0;
    console.log('\nCover image status per setting:\n');
    for (const d of docs) {
        const seedImg = seedMap[d.name];
        const same = d.cover_image === seedImg;
        const marker = same ? '📦 SEED DEFAULT' : '✅ custom';
        console.log(`  ${marker}  ${d.name}`);
        console.log(`           ${d.cover_image}`);
        if (same) overwritten++;
    }
    console.log(`\n${overwritten} / ${docs.length} settings are using the seed-file default image.\n`);
    await client.close();
}

main().catch(console.error);
