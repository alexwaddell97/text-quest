import { NextResponse } from 'next/server';
import { MongoClient, ObjectId, Collection } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI || '');

interface VoteRequest {
    user_id: ObjectId;
    setting_id: ObjectId;
    voteType: 'up' | 'down';
}

export async function POST(request: Request) {
    const { user_id, setting_id, voteType }: VoteRequest = await request.json();

    if (!user_id || !setting_id || !voteType) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    try {
        await client.connect();
        const database = client.db('dev');
        const settingsCollection: Collection<{ _id: ObjectId; votes: number }> = database.collection('settings');
        const usersCollection: Collection<{ _id: ObjectId; votes: ObjectId[] }> = database.collection('users');

        if (voteType === 'up') {
            await settingsCollection.updateOne(
                { _id: new ObjectId(setting_id) },
                { $inc: { votes: 1 } }
            );

            await usersCollection.updateOne(
                { _id: new ObjectId(user_id) },
                { $addToSet: { votes: new ObjectId(setting_id) } }
            );
        } else if (voteType === 'down') {
            await settingsCollection.updateOne(
                { _id: new ObjectId(setting_id) },
                { $inc: { votes: -1 } }
            );
            
            await usersCollection.updateOne(
                { _id: new ObjectId(user_id) },
                { $pull: { votes: setting_id } }
            );
        }

        return NextResponse.json({ message: 'Vote recorded' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        await client.close();
    }
}