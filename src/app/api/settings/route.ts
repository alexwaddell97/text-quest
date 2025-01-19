const { MongoClient, ObjectId } = require('mongodb');
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const settingId = searchParams.get('settingId');
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);

    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const database = client.db('dev');
        const collection = database.collection('settings');

        if (settingId) {
            const setting = await collection.findOne({ _id: new ObjectId(settingId) });

            if (!setting) {
                return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
            }

            return NextResponse.json(setting);
        } else {
            const skip = (page - 1) * limit;
            const settings = await collection.find({}).skip(skip).limit(limit).toArray();
            const totalDocuments = await collection.countDocuments();
            const totalPages = Math.ceil(totalDocuments / limit);

            return NextResponse.json({ settings, totalPages });
        }
    } finally {
        await client.close();
    }
}

export async function POST(request: Request) {
    return NextResponse.json('');
}