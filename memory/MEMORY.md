# Text Quest (Roleplaying Realm) - Project Memory

## Architecture
- Next.js 14 app with MongoDB (`dev` database), NextAuth (Google OAuth)
- Game chat AI: Claude Sonnet 4.6 via Anthropic SDK (migrated from GPT-5.2)
- Character generation: GPT-4o-mini via OpenAI SDK (migrated from gpt-5-mini)
- Portrait generation: gpt-image-1-mini via OpenAI SDK + Vercel Blob storage
- Context compression: GPT-4o-mini (summarizes old conversation turns)
- Guest users: localStorage + in-memory session store; Auth users: MongoDB

## Key Files
- `src/app/api/game/route.ts` — Main game chat endpoint (Claude Sonnet 4.6)
- `src/lib/mongodb.ts` — Cached MongoDB connection singleton
- `src/app/api/game/inject/route.ts` — Silent system message injection
- `src/utils/questUtils.ts` — Pure function for applying quest changes
- `src/utils/guestCharacters.ts` — Guest user character persistence (localStorage)

## Important Patterns
- System prompt is consolidated into 3 messages: core rules, setting context, character state
- Character state system message is refreshed every turn (prevents stale inventory/quests)
- Server-side validation enforces reward scaling and rarity caps on AI tool calls
- Anthropic API requires: user-first messages, strict user/assistant alternation
- The `completion` field was removed from game route response; client falls back gracefully

## Env Vars Needed
- `OPENAI_API_KEY` — OpenAI API key
- `ANTHROPIC_API_KEY` — Anthropic API key (new)
- `MONGODB_URI` — MongoDB connection string
- `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Auth
