import { MongoClient, ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const client = new MongoClient(process.env.MONGODB_URI as string);

    try {
        await client.connect();
        const database = client.db('dev');
        const usersCollection = database.collection('users');

        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const newTheme = user.settings.theme === 'light' ? 'dark' : 'light';

        await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { 'settings.theme': newTheme } }
        );

        return NextResponse.json({ message: 'User theme updated successfully' });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to update user theme' }, { status: 500 });
    } finally {
        await client.close();
    }
}
