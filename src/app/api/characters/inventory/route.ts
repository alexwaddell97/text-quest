import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { InventoryChange } from '@/types';
import { getDb } from '@/lib/mongodb';

export async function PATCH(request: Request): Promise<NextResponse> {
    const { characterId, changes, currencyDelta }: { characterId: string; changes: InventoryChange[]; currencyDelta?: number } = await request.json();

    if (!characterId || (!Array.isArray(changes) && !currencyDelta)) {
        return NextResponse.json({ error: 'characterId and at least one of changes or currencyDelta are required' }, { status: 400 });
    }

    try {
        const db = await getDb();
        const charactersCollection = db.collection('characters');
        const itemsCollection = db.collection('items');

        const character = await charactersCollection.findOne({ _id: new ObjectId(characterId) });
        if (!character) {
            return NextResponse.json({ error: 'Character not found' }, { status: 404 });
        }

        const inventory: { item_id: ObjectId; quantity: number }[] = (character.inventory ?? []).map(
            (entry: { item_id: string | ObjectId; quantity: number }) => ({
                item_id: new ObjectId(entry.item_id),
                quantity: entry.quantity,
            })
        );

        for (const change of (changes ?? [])) {
            if (change.action === 'add') {
                const upsertResult = await itemsCollection.findOneAndUpdate(
                    { name: change.name },
                    {
                        $setOnInsert: {
                            name: change.name,
                            description: change.description ?? '',
                            rarity: change.rarity ?? 'common',
                            location_context: change.location_context ?? '',
                            usable_at: change.usable_at ?? '',
                        },
                    },
                    { upsert: true, returnDocument: 'after' }
                );

                const itemId = upsertResult?._id ?? (await itemsCollection.findOne({ name: change.name }))?._id;
                if (!itemId) continue;

                const existingEntry = inventory.find((e) => e.item_id.equals(itemId));
                if (existingEntry) {
                    existingEntry.quantity += change.quantity;
                } else {
                    inventory.push({ item_id: new ObjectId(itemId), quantity: change.quantity });
                }
            } else if (change.action === 'remove') {
                const item = await itemsCollection.findOne({ name: change.name });
                if (!item) continue;

                const idx = inventory.findIndex((e) => e.item_id.equals(item._id));
                if (idx === -1) continue;

                inventory[idx].quantity -= change.quantity;
                if (inventory[idx].quantity <= 0) {
                    inventory.splice(idx, 1);
                }
            }
        }

        const updateFields: Record<string, unknown> = { inventory };
        let newCurrency: number | undefined;
        if (currencyDelta && currencyDelta !== 0) {
            const currentCurrency = character.currency ?? 0;
            newCurrency = Math.max(0, currentCurrency + currencyDelta);
            updateFields.currency = newCurrency;
        }

        await charactersCollection.updateOne(
            { _id: new ObjectId(characterId) },
            { $set: updateFields }
        );

        const updatedItems = await Promise.all(
            inventory.map(async (entry) => {
                const item = await itemsCollection.findOne({ _id: entry.item_id });
                if (!item) return null;
                return {
                    name: item.name,
                    description: item.description,
                    rarity: item.rarity,
                    quantity: entry.quantity,
                    location_context: item.location_context ?? undefined,
                    usable_at: item.usable_at ?? undefined,
                };
            })
        );

        return NextResponse.json({ inventory: updatedItems.filter(Boolean), ...(newCurrency !== undefined ? { currency: newCurrency } : {}) });
    } catch (error: unknown) {
        console.error('Error updating inventory:', error);
        return NextResponse.json({ error: (error as Error)?.message ?? 'Failed to update inventory' }, { status: 500 });
    }
}
