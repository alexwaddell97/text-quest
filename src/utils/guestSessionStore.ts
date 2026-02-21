/**
 * Shared in-memory store for guest chat sessions.
 * Module-level singletons are shared across all route files within the same
 * Next.js server process, so both game/route.ts and game/inject/route.ts can
 * read and write the same guest sessions.
 */
export const chatHistoryStore: Record<string, { role: string; content: string }[]> = {};

/** Chronicle entries keyed by sessionId */
export const chronicleStore: Record<string, { turn: number; location: string; entry: string; timestamp: string }[]> = {};

/** World facts keyed by sessionId — maps fact id → fact sentence */
export const worldFactsStore: Record<string, Record<string, string>> = {};
