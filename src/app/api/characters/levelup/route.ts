import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

export async function PATCH(request: Request): Promise<NextResponse> {
    const body: { characterId: string; xpGain: number; statUpgrade?: string } = await request.json();
    const { characterId, xpGain, statUpgrade } = body;

    if (!characterId || typeof xpGain !== 'number') {
        return NextResponse.json({ error: 'characterId and xpGain are required' }, { status: 400 });
    }

    const client = new MongoClient(process.env.MONGODB_URI || '');
    try {
        await client.connect();
        const db = client.db('dev');
        const col = db.collection('characters');

        const char = await col.findOne({ _id: new ObjectId(characterId) });
        if (!char) return NextResponse.json({ error: 'Character not found' }, { status: 404 });

        const currentXp: number = char.xp?.current ?? 0;
        const xpMax: number = char.xp?.max ?? 100;
        const newXpRaw = currentXp + xpGain;

        let level: number = char.level ?? 1;
        let leveledUp = false;
        let finalXpCurrent = newXpRaw;
        let finalXpMax = xpMax;
        const stats: Record<string, number> = { ...(char.stats ?? {}) };

        if (newXpRaw >= xpMax) {
            leveledUp = true;
            level = level + 1;
            finalXpCurrent = Math.max(0, newXpRaw - xpMax);
            finalXpMax = 100 * level;
            if (statUpgrade && statUpgrade in stats) {
                stats[statUpgrade] = (stats[statUpgrade] ?? 0) + 1;
            }
        }

        await col.updateOne(
            { _id: new ObjectId(characterId) },
            { $set: { 'xp.current': finalXpCurrent, 'xp.max': finalXpMax, level, stats } },
        );

        return NextResponse.json({
            xp: { current: finalXpCurrent, max: finalXpMax },
            level,
            stats,
            leveledUp,
        });
    } catch (error: any) {
        console.error('Error updating XP:', error);
        return NextResponse.json({ error: error?.message ?? 'Failed to update XP' }, { status: 500 });
    } finally {
        await client.close();
    }
}
