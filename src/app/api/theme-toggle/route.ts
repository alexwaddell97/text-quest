import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function POST(request: Request) {
    try {
        const db = await getDb();
        const usersCollection = db.collection('users');

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
    }
}
