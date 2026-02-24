import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function POST(request: Request) {
    try {
        const db = await getDb();
        const charactersCollection = db.collection('characters');
        const sessionsCollection = db.collection('sessions');

        const { characterId } = await request.json();

        if (!characterId) {
            return NextResponse.json({ error: 'Character ID is required' }, { status: 400 });
        }

        const characterResult = await charactersCollection.deleteOne({ _id: new ObjectId(characterId) });

        if (characterResult.deletedCount === 0) {
            return NextResponse.json({ error: 'Character not found' }, { status: 404 });
        }

        const sessionResult = await sessionsCollection.deleteOne({ character_id: new ObjectId(characterId) });

        if (sessionResult.deletedCount === 0) {
            return NextResponse.json({ message: 'Character deleted, but no session found for the character' });
        }

        return NextResponse.json({ message: 'Character and associated session deleted successfully' });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to delete character and session' }, { status: 500 });
    }
}
