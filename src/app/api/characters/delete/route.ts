import { MongoClient, ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const client = new MongoClient(process.env.MONGODB_URI as string);

    try {
        await client.connect();
        const database = client.db('dev');
        const charactersCollection = database.collection('characters');
        const sessionsCollection = database.collection('sessions');

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
    } finally {
        await client.close();
    }
}
