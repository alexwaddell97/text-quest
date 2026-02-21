import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { chatHistoryStore } from '@/utils/guestSessionStore';

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
        // If no session exists yet for this guest, the message will be injected on
        // next session init via the Active Quests context — safe to skip silently.
        return NextResponse.json({ ok: true });
    }

    // Authenticated: write directly to MongoDB
    const isValidObjectId = (v: any): boolean => typeof v === 'string' && /^[a-f\d]{24}$/i.test(v);

    const client = new MongoClient(process.env.MONGODB_URI || '');
    try {
        await client.connect();
        const sessionsCollection = client.db('dev').collection('sessions');

        // Prefer gameId lookup; fall back to character_id if gameId not supplied
        const query = gameId && isValidObjectId(gameId)
            ? { _id: new ObjectId(gameId) }
            : isValidObjectId(characterId)
            ? { character_id: new ObjectId(characterId) }
            : null;

        if (!query) {
            return NextResponse.json({ error: 'Invalid gameId or characterId' }, { status: 400 });
        }

        await sessionsCollection.updateOne(query, {
            $push: { messages: systemMessage } as any,
        });

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        console.error('inject route error:', err);
        return NextResponse.json({ error: err?.message ?? 'Failed to inject message' }, { status: 500 });
    } finally {
        await client.close();
    }
}
