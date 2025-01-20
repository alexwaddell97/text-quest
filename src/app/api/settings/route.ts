const { MongoClient, ObjectId } = require('mongodb');
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const settingId = searchParams.get('settingId');
    const genre = searchParams.get('genre');
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const sort = searchParams.get('sort');

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
            const query: any = {};
            if (genre) {
                query.genre = genre;
            }

            const skip = (page - 1) * limit;
            let sortOption: any = {};

            if (sort === 'most-voted') {
                sortOption.votes = -1;
            } else if (sort === 'least-voted') {
                sortOption.votes = 1;
            }

            const settings = await collection.find(query).sort(sortOption).skip(skip).limit(limit).toArray();
            const totalDocuments = await collection.countDocuments(query);
            const totalPages = Math.ceil(totalDocuments / limit);

            const genres = await collection.distinct('genre');

            return NextResponse.json({ settings, totalPages, genres });
        }
    } finally {
        await client.close();
    }
}

export async function POST(request: Request) {
    return NextResponse.json('');
}