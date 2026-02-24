import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const characterId = searchParams.get('characterId');
    const settingId = searchParams.get('settingId');
    const userId = searchParams.get('userId');

    const db = await getDb();
    const charactersCollection = db.collection('characters');
    const itemsCollection = db.collection('items');
    const sessionsCollection = db.collection('sessions');

    const query: Record<string, unknown> = {};
    if (characterId) {
        query._id = new ObjectId(characterId);
    }
    if (settingId) {
        query.setting_id = new ObjectId(settingId);
    }
    if (userId) {
        query.user_id = new ObjectId(userId);
    }

    if (characterId) {
        const character = await charactersCollection.findOne(query);

        if (!character) {
            return NextResponse.json({ error: 'Character not found' }, { status: 404 });
        }

        // Fetch items from inventory
        const inventoryItems = await Promise.all(
            character.inventory.map(async (item: { item_id: string; quantity: number }) => {
                const inventoryItem = await itemsCollection.findOne({ _id: new ObjectId(item.item_id) });
                if (inventoryItem) {
                    return {
                        name: inventoryItem.name,
                        description: inventoryItem.description,
                        rarity: inventoryItem.rarity,
                        quantity: item.quantity,
                        location_context: inventoryItem.location_context ?? undefined,
                        usable_at: inventoryItem.usable_at ?? undefined,
                    };
                }
                return null;
            })
        );

        // Fetch session for the character
        const session = await sessionsCollection.findOne({ character_id: new ObjectId(characterId) });

        const doc = JSON.parse(JSON.stringify({
            ...character,
            inventory: inventoryItems.filter(item => item !== null),
            session_id: session?._id ?? null,
        }));
        return NextResponse.json(doc);
    } else {
        const characters = await charactersCollection.find(query).toArray();

        // Fetch items for each character's inventory
        const charactersWithInventory = await Promise.all(
            characters.map(async (character: Record<string, unknown>) => {
                const inventoryItems = await Promise.all(
                    (character.inventory as { item_id: string; quantity: number }[]).map(async (item: { item_id: string; quantity: number }) => {
                        const inventoryItem = await itemsCollection.findOne({ _id: new ObjectId(item.item_id) });
                        if (inventoryItem) {
                            return {
                                name: inventoryItem.name,
                                description: inventoryItem.description,
                                rarity: inventoryItem.rarity,
                                quantity: item.quantity,
                                location_context: inventoryItem.location_context ?? undefined,
                                usable_at: inventoryItem.usable_at ?? undefined,
                            };
                        }
                        return null;
                    })
                );

                // Fetch session for the character
                const session = await sessionsCollection.findOne({ character_id: new ObjectId(character._id) });

                return JSON.parse(JSON.stringify({
                    ...character,
                    inventory: inventoryItems.filter(item => item !== null),
                    session_id: session?._id ?? null,
                    last_played: session?.last_played ?? null,
                    pinned: character.pinned ?? false,
                }));
            })
        );

        return NextResponse.json(charactersWithInventory);
    }
}

export async function PATCH(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const characterId = searchParams.get('characterId');
        if (!characterId) {
            return NextResponse.json({ error: 'characterId required' }, { status: 400 });
        }
        const { pinned } = await request.json();
        const db = await getDb();
        const charactersCollection = db.collection('characters');
        await charactersCollection.updateOne(
            { _id: new ObjectId(characterId) },
            { $set: { pinned: Boolean(pinned) } },
        );
        return NextResponse.json({ ok: true, pinned: Boolean(pinned) });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update pin' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const db = await getDb();
        const charactersCollection = db.collection('characters');

        const { settingId, userId, character } = await request.json();

        character.setting_id = new ObjectId(settingId);
        character.user_id = new ObjectId(userId) || null;
        character.level = 1;
        character.currency = 100;
        character.inventory = [];
        character.xp = { current: 0, max: 100 };
        character.health = { current: 100, max: 100 };

        const result = await charactersCollection.insertOne(character);

        return NextResponse.json({ message: 'Character added successfully', characterId: result.insertedId });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to add character' }, { status: 500 });
    }
}
