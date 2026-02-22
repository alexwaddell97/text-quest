import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { chatHistoryStore } from '@/utils/guestSessionStore';
import { getDb } from '@/lib/mongodb';

/**
 * POST /api/game/inject
 *
 * Injects a silent system message into the current session without triggering
 * an AI response. Used for out-of-band narrative events (e.g. quest cancelled
 * by the player) so the GM stays contextually aware without the player seeing
 * a mechanical message in the chat.
 *
 * Body: { gameId: string; characterId: string; isGuest: boolean; content: string }
 */
export async function POST(request: Request): Promise<NextResponse> {
    const { gameId, characterId, isGuest, content } = await request.json();

    if (!content || (!gameId && !characterId)) {
        return NextResponse.json({ error: 'content and either gameId or characterId are required' }, { status: 400 });
    }

    const systemMessage = { role: 'system', content };

    if (isGuest) {
        const key = gameId ?? `guest-${characterId}`;
        if (chatHistoryStore[key]) {
            chatHistoryStore[key].push(systemMessage);
        }
        return NextResponse.json({ ok: true });
    }

    const isValidObjectId = (v: unknown): boolean => typeof v === 'string' && /^[a-f\d]{24}$/i.test(v);

    try {
        const db = await getDb();
        const sessionsCollection = db.collection('sessions');

        const query = gameId && isValidObjectId(gameId)
            ? { _id: new ObjectId(gameId) }
            : isValidObjectId(characterId)
            ? { character_id: new ObjectId(characterId) }
            : null;

        if (!query) {
            return NextResponse.json({ error: 'Invalid gameId or characterId' }, { status: 400 });
        }

        await sessionsCollection.updateOne(query, {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            $push: { messages: systemMessage } as any,
        });

        return NextResponse.json({ ok: true });
    } catch (err: unknown) {
        console.error('inject route error:', err);
        return NextResponse.json({ error: (err as Error)?.message ?? 'Failed to inject message' }, { status: 500 });
    }
}
