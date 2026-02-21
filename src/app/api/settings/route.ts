import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const settingId = searchParams.get('settingId');
    const genre = searchParams.get('genre');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const sort = searchParams.get('sort');

    const db = await getDb();
    const collection = db.collection('settings');

    if (settingId) {
        const setting = await collection.findOne({ _id: new ObjectId(settingId) });

        if (!setting) {
            return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
        }

        return NextResponse.json(JSON.parse(JSON.stringify(setting)));
    } else {
        const query: any = {};
        if (genre) {
            query.genres = genre;
        }
        if (search) {
            const rx = { $regex: search, $options: 'i' };
            query.$or = [
                { name: rx },
                { description: rx },
                { genres: rx },
                { 'factions.name': rx },
                { 'factions.description': rx },
                { 'key_beings.name': rx },
                { 'key_beings.description': rx },
                { 'key_themes.theme': rx },
                { 'key_themes.description': rx },
                { 'major_locations.name': rx },
                { 'major_locations.description': rx },
                { 'rules.rule': rx },
                { 'rules.description': rx },
            ];
        }

        const skip = (page - 1) * limit;
        let sortOption: any = {};

        if (sort === 'most-voted') {
            sortOption.votes = -1;
        } else if (sort === 'least-voted') {
            sortOption.votes = 1;
        }
        // Secondary sort by _id ensures stable pagination when votes are tied
        sortOption._id = 1;

        const settings = await collection.find(query).sort(sortOption).skip(skip).limit(limit).toArray();
        const totalDocuments = await collection.countDocuments(query);
        const totalPages = Math.ceil(totalDocuments / limit) || 0;
        const hasMore = (page * limit) < totalDocuments;

        const genres = await collection.distinct('genres');

        return NextResponse.json(JSON.parse(JSON.stringify({ settings, totalPages, genres, hasMore })));
    }
}

export async function POST() {
    return NextResponse.json('');
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { settingId, theme } = body;

        if (!settingId || !theme) {
            return NextResponse.json({ error: 'settingId and theme are required' }, { status: 400 });
        }

        const db = await getDb();
        const collection = db.collection('settings');

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(settingId) },
            { $set: { theme } },
            { returnDocument: 'after' }
        );

        if (!result) {
            return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
        }

        return NextResponse.json(JSON.parse(JSON.stringify(result)));
    } catch (error) {
        console.error('Error saving setting theme:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
