import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { Quest, QuestChange } from '@/types';
import { applyQuestChanges } from '@/utils/questUtils';
import { getDb } from '@/lib/mongodb';

export async function PATCH(request: Request): Promise<NextResponse> {
    const { characterId, changes }: { characterId: string; changes: QuestChange[] } = await request.json();

    if (!characterId || !Array.isArray(changes) || changes.length === 0) {
        return NextResponse.json({ error: 'characterId and a non-empty changes array are required' }, { status: 400 });
    }

    try {
        const db = await getDb();
        const charactersCollection = db.collection('characters');

        const character = await charactersCollection.findOne({ _id: new ObjectId(characterId) });
        if (!character) {
            return NextResponse.json({ error: 'Character not found' }, { status: 404 });
        }

        const currentQuests: Quest[] = character.quests ?? [];
        const updatedQuests = applyQuestChanges(currentQuests, changes);

        await charactersCollection.updateOne(
            { _id: new ObjectId(characterId) },
            { $set: { quests: updatedQuests } },
        );

        return NextResponse.json({ quests: updatedQuests });
    } catch (error: unknown) {
        console.error('Error updating quests:', error);
        return NextResponse.json({ error: (error as Error)?.message ?? 'Failed to update quests' }, { status: 500 });
    }
}
