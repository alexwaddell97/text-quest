const { MongoClient, ObjectId } = require('mongodb');
import { NextResponse } from 'next/server';
import { CharacterSchema } from '@/types';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const characterId = searchParams.get('characterId');
    const settingId = searchParams.get('settingId');
    const userId = searchParams.get('userId');
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const database = client.db('dev');
        const charactersCollection = database.collection('characters');
        const itemsCollection = database.collection('items');
        const sessionsCollection = database.collection('sessions');

        const query: any = {};
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
                character.inventory.map(async (item: { item_id: string, quantity: number }) => {
                    const inventoryItem = await itemsCollection.findOne({ _id: new ObjectId(item.item_id) });
                    if (inventoryItem) {
                        return {
                            name: inventoryItem.name,
                            description: inventoryItem.description,
                            rarity: inventoryItem.rarity,
                            quantity: item.quantity
                        };
                    }
                    return null;
                })
            );

            // Fetch session for the character
            const session = await sessionsCollection.findOne({ character_id: new ObjectId(characterId) });

            return NextResponse.json({ ...character, inventory: inventoryItems.filter(item => item !== null), session_id: session?._id });
        } else {
            const characters = await charactersCollection.find(query).toArray();

            // Fetch items for each character's inventory
            const charactersWithInventory = await Promise.all(
                characters.map(async (character: CharacterSchema) => {
                    const inventoryItems = await Promise.all(
                        character.inventory.map(async (item: { item_id: string, quantity: number }) => {
                            const inventoryItem = await itemsCollection.findOne({ _id: new ObjectId(item.item_id) });
                            if (inventoryItem) {
                                return {
                                    name: inventoryItem.name,
                                    description: inventoryItem.description,
                                    rarity: inventoryItem.rarity,
                                    quantity: item.quantity
                                };
                            }
                            return null;
                        })
                    );

                    // Fetch session for the character
                    const session = await sessionsCollection.findOne({ character_id: new ObjectId(character._id) });

                    return {
                        ...character,
                        inventory: inventoryItems.filter(item => item !== null),
                        session_id: session?._id
                    };
                })
            );

            return NextResponse.json(charactersWithInventory);
        }
    } finally {
        await client.close();
    }
}

export async function POST(request: Request) {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const database = client.db('dev');
        const charactersCollection = database.collection('characters');

        const { settingId, userId, character } = await request.json();

        // Validate character object here if needed

        // Set setting_id and default level
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
        console.log(error)
        return NextResponse.json({ error: 'Failed to add character' }, { status: 500 });
    } finally {
        await client.close();
    }
}