import { NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { ObjectId } from "mongodb";
import { QuestChange, ChronicleEntry, WorldFact } from "@/types";
import { chatHistoryStore, chronicleStore, worldFactsStore } from "@/utils/guestSessionStore";
import { getDb } from "@/lib/mongodb";

const openai = new OpenAI();
const anthropic = new Anthropic();

export async function GET() {
    const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: "You are a helpful assistant." }],
        model: "gpt-4o-mini",
    });

    return NextResponse.json(completion);
}

// ─── Types ──────────────────────────────────────────────────────────────────
interface Setting {
    _id: ObjectId;
    system_message: string;
    genre: string;
    factions: Record<string, { name: string; description: string; notable_members: string[] }>;
    key_beings: Record<string, { name: string; description: string; role: string }>;
    major_locations: Record<string, { name: string; description: string }>;
    key_themes: { theme: string; description: string }[];
    cover_image: string;
    rules: { rule: string; description: string }[];
}

interface Item {
    name: string;
    description: string;
    rarity: string;
    quantity: number;
}

interface Character {
    _id: ObjectId;
    user_id: ObjectId;
    name: string;
    race: string;
    description: string;
    backstory: string;
    level: number;
    health: { current: number; max: number };
    xp: { current: number; max: number };
    currency: number;
    stats: { strength: number; agility: number; intelligence: number; charisma: number };
    inventory: Item[];
    session_id: ObjectId;
    quests?: { id: string; title: string; description: string; status: string; objectives: { id: string; description: string; completed: boolean }[]; given_by: string | null; reward_hint: string | null; parent_quest_id?: string | null }[];
}

interface ChatRequest {
    setting: Setting;
    character: Character;
    message: string;
    gameId: string;
    role?: string;
}

// ─── Prompt builders ────────────────────────────────────────────────────────

/** Immutable core rules — these never change between turns. */
function buildCoreRulesPrompt(): string {
    return `You are the Gamemaster (GM) of a Roleplaying Realm — a text-based adventure game on a website. Your job is to narrate an immersive, reactive story and present the player with meaningful choices.

RESPONSE FORMAT (mandatory — violating this breaks the game UI)
Your ENTIRE text response must be a single raw JSON object — no preamble, no explanation, no markdown code fences, no text before or after the JSON. The JSON object must have exactly four fields:
- "narrative" (string) — the GM story text (markdown is fine inside this string)
- "options" (array of 2–4 strings) — standard action choices. MUST always contain at least 2 options. NEVER return an empty options array.
- "skill_options" (array of 0–2 objects) — stat-check options, each {stat, label}. Can be empty.
- "item_options" (array of 0–1 objects) — item-use options, each {item, label}. Can be empty.
Never put option text inside the narrative — all choices belong in their respective arrays only.
The very first character of your response must be { and the very last must be }. Do NOT wrap the JSON in backticks or code blocks.

OPTIONS RULES
Options must be consistent with the player's level, backstory, setting, and current situation. Never include options requiring items the player does not have.

Skill check options should appear roughly 1 in 3 responses — whenever the scene involves a physical, social, or mental challenge where a stat roll would meaningfully change the outcome. The relevant stat must be 6 or higher. stat must be exactly one of: Strength, Agility, Intelligence, Charisma. Err strongly on the side of including one when combat, persuasion, stealth, climbing, investigation, or similar challenges are present. When in doubt, include a skill option.

Item options: always include one if the player has any inventory item that could plausibly interact with the current scene — combat, exploration, social encounters, puzzles, environment. Do not apply any frequency limit; the only question is whether an item is contextually relevant right now. Only reference items actually present in the player's inventory by exact name. NOTE: item_options are for using items already in the player's inventory — NOT for picking up new items. New items the player could take belong in the regular "options" array (e.g. "Take the hunting knife", "Grab the rope").

QUEST-DRIVEN OPTIONS (mandatory rule)
When the player has active quests with pending (not yet completed) objectives, at least one entry in the "options" array MUST directly or indirectly advance a pending objective. This is non-negotiable — it applies even when the current scene feels unrelated.
If the objective cannot be completed this turn, the option must still move the player meaningfully closer to it — changing location, gathering information, building relationships, or removing obstacles that block the objective. It should feel like a natural next step in context, not a mechanical reminder. Never label the option with the quest name or say "work on quest". Phrase it as what the character would actually do.

INVENTORY SYSTEM (critical)
This game has a live inventory system. The ONLY way items are added or removed is by calling the update_inventory tool. Writing about items in text does NOTHING. Never write "Your inventory is updated" or list gained items in prose. Instead, silently call update_inventory, then write your narrative naturally.

You can — and should — pass multiple changes in a single call. For example, if the player defeats an enemy and picks up their sword while expending a healing potion, call update_inventory once with three changes: add sword, remove potion, maybe add any other loot. Do all item changes for the turn in one batch.

CRITICAL rule for "add": only call update_inventory with action "add" when the player's action in THIS TURN explicitly and unambiguously involved taking or acquiring that item (e.g. they chose "Pick up the knife", "Take the rope", "Loot the body"). If you are merely describing items that exist in the environment — items the player could potentially take but has not yet chosen to — do NOT add them. Present those items as options instead (e.g. "Take the hunting knife", "Grab the rope and tinderbox"). Never add items proactively just because the scene reveals them. The player must actively choose to take something before it enters their inventory. When a player uses or loses an item, call update_inventory with action "remove" immediately.

CRITICAL rule for "remove": only call update_inventory with action "remove" for items consumed, destroyed, or lost THIS TURN — not because you saw them used in a previous turn, chronicle entry, or earlier message. The CHARACTER STATE shown above already reflects every removal from prior turns and is always the current truth. If an item appears in CHARACTER STATE inventory, it has NOT yet been removed this session. Never remove an item you already removed in a previous turn's tool call.

CURRENCY SYSTEM (critical)
The player has a dedicated currency balance (coins, gold, credits, etc. depending on setting). Currency is NOT an inventory item — never call update_inventory for money. Instead call the update_currency tool with a positive delta when the player gains money, negative when they spend or lose it. Do not describe the currency change in your text.

QUEST & OBJECTIVE SYSTEM (critical)
This game has a live quest tracker. The ONLY way quests are created or updated is by calling the update_quests tool — narrative text alone does nothing.

You can — and should — pass multiple changes in a single call. For example, in one turn you might: complete an objective, add a new objective that was just revealed, AND create a brand-new follow-up quest — all in one update_quests call with three entries in the changes array. Never hold back quest updates because you think only one can happen at a time.

Every objective must be concrete and observable — something with a clear done-state. BAD: "Survive the encounter", "Deal with the threat". GOOD: "Defeat the corrupted furbolg", "Return to Brightwater after clearing the glade".

Only call complete_objective when the objective action has been FULLY and UNAMBIGUOUSLY completed — not started, not in-progress. When in doubt, do NOT mark complete.

Tool actions: add_quest (meaningful multi-step tasks), complete_objective (ONLY when fully done, objective_id must EXACTLY match the id from Active Quests), add_objective (new steps discovered), complete_quest (all objectives resolved), fail_quest (quest unresolvable).

Roundabout completion: if a pending objective is achieved via an unexpected path, complete it. Defunct objectives: if circumstances make an objective impossible, fail the quest.

Quest chaining: when completing a quest naturally opens a new phase, create a follow-up quest with parent_quest_id. Not every quest needs a follow-up.

GAMEPLAY & BALANCE
The player has full agency — they can attempt anything their character could physically or logically do in the world. Attack a quest giver, betray an ally, go rogue, pick a fight with a guard, set fire to a building — if it's within the realm of possibility for a person in that situation, narrate it happening and play out the real consequences. Your job is to be a reactive world, not a permission system.
- Use the player's stats to determine success/failure behind the scenes and narrate the outcome honestly.
- The player can and will take damage. Failure is a valid outcome — picking an option does not guarantee success.
- A character or enemy at 0 health is defeated/dead. NPCs die, relationships break, doors close permanently — consequences are real.
- Never say "you can't do that" or redirect the player away from their chosen action. Instead, play it out.

PROGRESSION & REALISM
Outcomes are proportionate to the character's level, stats, and realistic circumstances. A level 1 character attacking a dragon will likely die — but they can try. The world responds honestly: a weak character fails more, a strong one succeeds more. What's restricted is only physics-defying invention — the player cannot conjure items, gold, or outcomes from nothing. Bold, risky, or unconventional play is always allowed.

REWARD SCALING
Currency and item rewards must be proportionate to level:
- Level 1-3: 1-20 coins per encounter
- Level 4-6: 10-80 coins
- Level 7-10: 50-300 coins
- Level 11-15: 200-800 coins
- Level 16-20: 500-2000 coins
Legendary/rare items only from difficult encounters, bosses, or major quest completions.

STAT-GATING
Stats determine likelihood of success, not permission to attempt. Low Strength means the door probably won't budge — not that the player can't try. Low Charisma means the guard likely won't be charmed — not that the player can't attempt it. Make failure narratively interesting and leave paths open.

IMPOSSIBLE ACTIONS
Only block actions that are literally impossible in the world's physics: conjuring items out of thin air ("I find 10,000 gold coins on the ground"), instant teleportation with no established mechanism, or similar reality-breaking declarations. Everything else — however risky, foolish, or unexpected — should be played out with honest consequences.

CHRONICLE & WORLD FACTS (mandatory)
Call update_chronicle at the end of EVERY turn with a brief entry (1-2 factual sentences) about what just happened — the player's action and its outcome. Be specific: exact names, locations, and results. These entries form the player's adventure journal and your own persistent memory.
Call update_world_facts whenever a significant world-state fact is established that you must never forget or contradict — NPC deaths, player bounties/wanted status, locked doors needing a specific key, broken alliances, discovered secrets, permanent environmental changes. Only call it for facts that would cause serious hallucination if forgotten. Use action "add" for new facts, "update" to revise an existing one, "remove" when a fact is no longer true.`;
}

/** Setting-specific context — changes per setting but not per turn. */
function buildSettingPrompt(setting: Setting): string {
    const lines = [
        setting.system_message,
        `Genre: ${setting.genre}`,
        `Key Themes: ${setting.key_themes.map(t => `${t.theme} (${t.description})`).join(", ")}`,
        `Rules: ${setting.rules.map(r => `${r.rule} (${r.description})`).join(", ")}`,
        `Factions: ${Object.keys(setting.factions).map(key => `${setting.factions[key].name} (${setting.factions[key].description}, Notable: ${setting.factions[key].notable_members?.join(", ") || "None"})`).join(", ")}`,
        `Key Beings: ${Object.keys(setting.key_beings).map(key => `${setting.key_beings[key].name} (${setting.key_beings[key].description}, Role: ${setting.key_beings[key].role})`).join(", ")}`,
        `Major Locations: ${Object.keys(setting.major_locations).map(key => `${setting.major_locations[key].name} (${setting.major_locations[key].description})`).join(", ")}`,
    ];
    return lines.join("\n\n");
}

/** Character state — rebuilt fresh every turn so the model always has current data. */
function buildCharacterPrompt(character: Character): string {
    const quests = character.quests ?? [];
    const activeQuests = quests.filter(q => q.status === 'active');
    const questsStr = activeQuests.length === 0
        ? 'None'
        : activeQuests.map(q =>
            `[ID: ${q.id}]${q.parent_quest_id ? ` (stage of: ${q.parent_quest_id})` : ''} ${q.title} — ${q.description} | Objectives: ${q.objectives.map(o => `[${o.id}] ${o.description} (${o.completed ? 'done' : 'pending'})`).join(', ')}`
        ).join(' || ');

    return `CHARACTER STATE (current — always trust this over prior messages):
Name: ${character.name} | Race: ${character.race} | Level: ${character.level}
Health: ${character.health.current}/${character.health.max} | XP: ${character.xp.current}/${character.xp.max}
Currency: ${character.currency}
Stats: STR ${character.stats.strength} | AGI ${character.stats.agility} | INT ${character.stats.intelligence} | CHA ${character.stats.charisma}
Description: ${character.description}
Backstory: ${character.backstory}
Inventory: ${character.inventory.length === 0 ? 'Empty' : character.inventory.map((item: Item) => `${item.name} ×${item.quantity} [${item.rarity}] — ${item.description}`).join("; ")}

Active Quests: ${questsStr}`;
}

/**
 * Chronicle + world facts — injected fresh every turn so the model always has
 * an accurate, structured memory of the adventure regardless of how long the
 * chat history has grown.
 */
function buildChroniclePrompt(entries: ChronicleEntry[], worldFacts: WorldFact[]): string {
    const lines: string[] = ['ADVENTURE MEMORY (always trust these over vague recollections from chat history):'];

    if (worldFacts.length > 0) {
        lines.push('\n[Established World Facts — permanent truths, never contradict these]:');
        for (const wf of worldFacts) {
            lines.push(`• ${wf.fact}`);
        }
    }

    if (entries.length > 0) {
        const recent = entries.slice(-12);
        lines.push('\n[Chronicle — recent turns in order]:');
        for (const e of recent) {
            lines.push(`Turn ${e.turn} @ ${e.location}: ${e.entry}`);
        }
    }

    return lines.join('\n');
}

// ─── Anthropic tool definitions ─────────────────────────────────────────────

const inventoryTool: Anthropic.Messages.Tool = {
    name: "update_inventory",
    description:
        "MANDATORY: Call this every time any item is gained or lost — loot, purchases, consumables used, equipment broken, items given away, etc. " +
        "Do NOT describe inventory changes in your narrative — only this function call actually updates the inventory.",
    input_schema: {
        type: "object" as const,
        properties: {
            changes: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        action: { type: "string", enum: ["add", "remove"], description: "'add' when the player gains an item, 'remove' when it is used, broken, lost, or given away." },
                        name: { type: "string", description: "Short item name." },
                        description: { type: "string", description: "Brief item description (1 sentence). Provide when adding, empty string when removing." },
                        rarity: { type: "string", enum: ["common", "uncommon", "rare", "legendary", "unique"], description: "Item rarity. Provide when adding, 'common' when removing." },
                        quantity: { type: "number", description: "How many to add or remove." },
                        location_context: { type: "string", description: "Where/how the item was acquired. Provide when adding, empty string when removing." },
                        usable_at: { type: "string", description: "Where or under what conditions this item can be used. Provide when adding, empty string when removing." },
                    },
                    required: ["action", "name", "description", "rarity", "quantity", "location_context", "usable_at"],
                },
            },
        },
        required: ["changes"],
    },
};

const currencyTool: Anthropic.Messages.Tool = {
    name: "update_currency",
    description:
        "MANDATORY: Call this every time the player gains or loses coins, gold, credits, or any form of currency. " +
        "Do NOT add currency as an inventory item — use this tool instead. " +
        "Pass a positive delta to add money, negative to subtract.",
    input_schema: {
        type: "object" as const,
        properties: {
            delta: { type: "number", description: "Amount to add (positive) or subtract (negative) from the player's currency balance." },
            reason: { type: "string", description: "Brief reason, e.g. 'Found coins on the table', 'Paid merchant for supplies'." },
        },
        required: ["delta", "reason"],
    },
};

const questsTool: Anthropic.Messages.Tool = {
    // cache_control here means all three tools (inventory, currency, quests) are cached together
    cache_control: { type: 'ephemeral' },
    name: "update_quests",
    description:
        "MANDATORY: Call this to create quests, mark objectives complete, add new objectives, or resolve quests. " +
        "Only call for meaningful multi-step story threads — not trivial one-step interactions.",
    input_schema: {
        type: "object" as const,
        properties: {
            changes: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        action: { type: "string", enum: ["add_quest", "complete_quest", "fail_quest", "complete_objective", "add_objective"], description: "The operation to perform." },
                        quest_id: { type: "string", description: "Stable snake_case identifier for the quest." },
                        title: { type: "string", description: "Quest title. Required for add_quest; empty string otherwise." },
                        description: { type: "string", description: "One-sentence quest description. Required for add_quest; empty string otherwise." },
                        objectives: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    id: { type: "string", description: "Stable snake_case objective id." },
                                    description: { type: "string", description: "Short action description." },
                                },
                                required: ["id", "description"],
                            },
                            description: "Initial objectives. Required for add_quest; empty array otherwise.",
                        },
                        given_by: { type: "string", description: "NPC name who assigned the quest. Provide for add_quest; empty string otherwise." },
                        reward_hint: { type: "string", description: "Short reward hint. Provide for add_quest when known; empty string otherwise." },
                        objective_id: { type: "string", description: "For complete_objective: EXACT id from Active Quests context. Required for complete_objective and add_objective; empty string otherwise." },
                        objective_description: { type: "string", description: "Description of new objective. Required for add_objective; empty string otherwise." },
                        parent_quest_id: { type: "string", description: "For quest chaining — quest_id of parent quest. Empty string for standalone quests." },
                    },
                    required: ["action", "quest_id", "title", "description", "objectives", "given_by", "reward_hint", "objective_id", "objective_description", "parent_quest_id"],
                },
            },
        },
        required: ["changes"],
    },
};

const chronicleTool: Anthropic.Messages.Tool = {
    name: "update_chronicle",
    description:
        "MANDATORY: Call this at the end of EVERY turn to log what just happened. " +
        "Write 1-2 factual sentences about this turn's events — the player's action, its outcome, significant NPC reactions, and where the player is now. " +
        "Be specific: use exact names, locations, and results. This powers the player's adventure journal and your own long-term memory.",
    input_schema: {
        type: "object" as const,
        properties: {
            location: { type: "string", description: "Current location of the player, e.g. 'The Sunken Tavern, Dockside District'." },
            entry: { type: "string", description: "1-2 factual sentences describing this turn's events and outcome." },
        },
        required: ["location", "entry"],
    },
};

const worldFactsTool: Anthropic.Messages.Tool = {
    name: "update_world_facts",
    description:
        "Call this when a significant world-state fact is established that you must never forget — NPC deaths, player bounties/wanted status, " +
        "specific keys or items needed for locked doors, broken alliances, discovered secrets, permanent environmental changes. " +
        "Only call for facts whose forgetting would cause serious hallucination. " +
        "Use action 'add' for new facts, 'update' to revise an existing fact, 'remove' when a fact is no longer true.",
    input_schema: {
        type: "object" as const,
        properties: {
            action: { type: "string", enum: ["add", "update", "remove"], description: "Operation to perform." },
            id: { type: "string", description: "Stable snake_case identifier, e.g. 'tarric_is_dead', 'wanted_in_ashenveil'." },
            fact: { type: "string", description: "One sentence stating the fact. Required for add/update; empty string for remove." },
        },
        required: ["action", "id", "fact"],
    },
};

// ─── Server-side validation ─────────────────────────────────────────────────

function validateInventoryChanges(
    changes: { action: string; name: string; description?: string; rarity?: string; quantity: number; location_context?: string; usable_at?: string }[],
    character: Character,
): typeof changes {
    const rarityOrder = ['common', 'uncommon', 'rare', 'legendary', 'unique'];
    const maxRarityByLevel = character.level <= 3 ? 'uncommon'
        : character.level <= 6 ? 'rare'
        : character.level <= 12 ? 'legendary'
        : 'unique';
    const maxRarityIdx = rarityOrder.indexOf(maxRarityByLevel);

    // Track quantities already scheduled for removal in this batch to prevent double-dipping
    const removedThisBatch = new Map<string, number>();

    return changes.filter(change => {
        if (change.quantity <= 0) return false;

        if (change.action === 'add') {
            // Skip if the character already has this item (prevents Claude re-adding on subsequent turns)
            const alreadyOwned = character.inventory.some(
                i => i.name.toLowerCase() === change.name.toLowerCase()
            );
            if (alreadyOwned) return false;

            // Cap rarity to level-appropriate maximum
            const itemRarityIdx = rarityOrder.indexOf(change.rarity ?? 'common');
            if (itemRarityIdx > maxRarityIdx) {
                change.rarity = maxRarityByLevel;
            }
            return true;
        }

        if (change.action === 'remove') {
            // Only allow removal of items the player actually has
            const existing = character.inventory.find(i =>
                i.name.toLowerCase() === change.name.toLowerCase()
            );
            if (!existing) return false;

            // Clamp quantity to what's actually available (prevents over-removal)
            if (change.quantity > existing.quantity) {
                change.quantity = existing.quantity;
            }
            if (change.quantity <= 0) return false;

            // Dedup: track how much of this item we've already scheduled to remove
            // in this batch so two remove entries for the same item don't double-dip
            const key = change.name.toLowerCase();
            const alreadyRemoving = removedThisBatch.get(key) ?? 0;
            const remaining = existing.quantity - alreadyRemoving;
            if (remaining <= 0) return false;
            if (change.quantity > remaining) change.quantity = remaining;
            removedThisBatch.set(key, alreadyRemoving + change.quantity);
            return true;
        }

        return false;
    });
}

function validateCurrencyDelta(delta: number, character: Character): number {
    if (delta === 0) return 0;

    // Enforce reward scaling caps on gains
    if (delta > 0) {
        const level = character.level ?? 1;
        let maxReward: number;
        if (level <= 3) maxReward = 20;
        else if (level <= 6) maxReward = 80;
        else if (level <= 10) maxReward = 300;
        else if (level <= 15) maxReward = 800;
        else maxReward = 2000;

        return Math.min(delta, maxReward);
    }

    // For spending, don't allow going below 0
    if (delta < 0) {
        return Math.max(delta, -character.currency);
    }

    return delta;
}

// ─── Placeholder / abbreviation detection ──────────────────────────────────

/** Returns true if the model returned a stub value like "...", "…", "[narrative]", etc. */
function isPlaceholderNarrative(text: string | undefined | null): boolean {
    if (!text) return true;
    const t = text.trim();
    return (
        t === '...' ||
        t === '\u2026' ||
        t.length < 30 ||
        /^[.\s…]+$/.test(t) ||
        /^\[.*\]$/.test(t) // e.g. "[narrative here]"
    );
}

// ─── Main POST handler ─────────────────────────────────────────────────────

export async function POST(request: Request): Promise<NextResponse> {
    const { setting, character, message, gameId, role }: ChatRequest = await request.json();

    const db = await getDb();
    const sessionsCollection = db.collection("sessions");

    const isGuest = !character.user_id;
    const isValidObjectId = (v: unknown): v is string => typeof v === 'string' && /^[a-f\d]{24}$/i.test(v);

    let session: { _id: any; messages: { role: string; content: string }[] } | null = null;
    let newGameId = gameId;

    // Chronicle and world facts — loaded per-session and kept in sync
    let chronicle: ChronicleEntry[] = [];
    let worldFacts: WorldFact[] = [];

    // Build the initial system messages (consolidated into 3 messages)
    const buildInitialMessages = () => [
        { role: "system", content: buildCoreRulesPrompt() },
        { role: "system", content: buildSettingPrompt(setting) },
        { role: "system", content: buildCharacterPrompt(character) },
    ];

    if (isGuest) {
        const sessionKey = gameId || `guest-${character._id}`;
        if (chatHistoryStore[sessionKey]) {
            session = { _id: sessionKey, messages: chatHistoryStore[sessionKey] };
            newGameId = sessionKey;
        } else {
            newGameId = `guest-${character._id}`;
            const initialMessages = buildInitialMessages();
            chatHistoryStore[newGameId] = initialMessages;
            session = { _id: newGameId, messages: initialMessages };
        }
        // Load guest chronicle/worldFacts from in-memory stores
        const key = String(session._id);
        chronicle = chronicleStore[key] ?? [];
        worldFacts = Object.entries(worldFactsStore[key] ?? {}).map(([id, fact]) => ({ id, fact }));
    } else {
        const lookupId = gameId || character?.session_id;
        if (lookupId && isValidObjectId(String(lookupId))) {
            const rawSession = await sessionsCollection.findOne<{ _id: ObjectId; messages: { role: string; content: string }[]; chronicle?: ChronicleEntry[]; world_facts?: Record<string, string> }>({ _id: new ObjectId(String(lookupId)) });
            if (rawSession) {
                // Sanitize: if any assistant message stored raw JSON instead of just the narrative, extract it
                rawSession.messages = rawSession.messages.map((msg) => {
                    if (msg.role === 'assistant') {
                        try {
                            const parsed = JSON.parse(msg.content);
                            if (parsed?.narrative) return { ...msg, content: parsed.narrative };
                        } catch { /* not JSON, keep as-is */ }
                    }
                    return msg;
                });
                session = rawSession;
                chronicle = rawSession.chronicle ?? [];
                worldFacts = Object.entries(rawSession.world_facts ?? {}).map(([id, fact]) => ({ id, fact }));
            }
        }

        if (!session) {
            newGameId = new ObjectId().toString();
            const initialMessages = buildInitialMessages();
            await sessionsCollection.insertOne({
                _id: new ObjectId(newGameId),
                messages: initialMessages,
                character_id: isValidObjectId(String(character._id)) ? new ObjectId(String(character._id)) : character._id,
                setting_id: isValidObjectId(String(setting._id)) ? new ObjectId(String(setting._id)) : setting._id,
                user_id: isValidObjectId(String(character.user_id)) ? new ObjectId(String(character.user_id)) : null,
                last_played: new Date(),
            });
            session = { _id: new ObjectId(newGameId), messages: initialMessages };
        }
    }

    // Sanitise literal (unescaped) newlines / carriage-returns inside JSON string
    // values — Claude occasionally emits these, producing otherwise valid-looking JSON
    // that silently fails to parse. Used by both the active-message and bootstrap paths.
    const fixLiteralNewlines = (text: string): string => {
        let inStr = false;
        let out = '';
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (c === '\\' && inStr) {
                out += c + (text[i + 1] ?? '');
                i++;
            } else if (c === '"') {
                inStr = !inStr;
                out += c;
            } else if (inStr && c === '\n') {
                out += '\\n';
            } else if (inStr && c === '\r') {
                out += '\\r';
            } else {
                out += c;
            }
        }
        return out;
    };

    if (message) {
        session!.messages.push({ role: role || "user", content: message });

        // ── Context compression ─────────────────────────────────────────────
        const COMPRESS_AFTER = 40;
        const KEEP_RECENT = 12;
        const MAX_WINDOW = 20;

        const systemMsgs = session!.messages.filter(m => m.role === 'system');
        let convTurns = session!.messages.filter(m => m.role !== 'system');

        if (convTurns.length > COMPRESS_AFTER) {
            const toSummarise = convTurns.slice(0, convTurns.length - KEEP_RECENT);
            const toKeep = convTurns.slice(convTurns.length - KEEP_RECENT);

            // If we have chronicle entries, use them directly instead of calling GPT —
            // they're already factual, structured, and free.
            if (chronicle.length > 0) {
                const summaryText = chronicle
                    .slice(-15)
                    .map(e => `Turn ${e.turn} @ ${e.location}: ${e.entry}`)
                    .join(' | ');
                const summaryMsg = { role: 'system', content: `[Story so far]: ${summaryText}` };
                convTurns = [summaryMsg, ...toKeep];
                session!.messages = [...systemMsgs, ...convTurns];
                if (isGuest) {
                    chatHistoryStore[String(session!._id)] = session!.messages;
                } else {
                    await sessionsCollection.updateOne(
                        { _id: session!._id },
                        { $set: { messages: session!.messages } },
                    );
                }
            } else {
            try {
                // Include character snapshot so the summary captures item/quest state
                const characterSnapshot = `\n\nCharacter state at compression time:\n${buildCharacterPrompt(character)}`;

                const summaryCompletion = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a game historian for a text-based RPG. Summarise the following session transcript into one compact paragraph (≤150 words). Cover: key events, decisions made, enemies fought, items gained or lost (by exact name), currency gained or spent (with amounts), quests started or updated (by quest id), and important NPCs encountered. Be specific and factual — exact names and numbers matter. Write in past tense from the player\'s perspective. Omit filler and flavour text.',
                        },
                        {
                            role: 'user',
                            content: toSummarise.map(m => `${m.role === 'user' ? 'Player' : 'GM'}: ${m.content}`).join('\n') + characterSnapshot,
                        },
                    ],
                    max_tokens: 250,
                });

                const summaryText = summaryCompletion.choices[0]?.message?.content?.trim() ?? '';
                if (summaryText) {
                    const summaryMsg = { role: 'system', content: `[Story so far]: ${summaryText}` };
                    convTurns = [summaryMsg, ...toKeep];
                    session!.messages = [...systemMsgs, ...convTurns];
                    if (isGuest) {
                        chatHistoryStore[String(session!._id)] = session!.messages;
                    } else {
                        await sessionsCollection.updateOne(
                            { _id: session!._id },
                            { $set: { messages: session!.messages } },
                        );
                    }
                }
            } catch (err) {
                console.warn('Session compression failed, falling back to sliding window:', err);
                convTurns = convTurns.slice(convTurns.length - MAX_WINDOW);
            }
            }
        } else if (convTurns.length > MAX_WINDOW) {
            convTurns = convTurns.slice(convTurns.length - MAX_WINDOW);
        }

        // ── Refresh character state in system messages ──────────────────────
        const freshCharacterPrompt = buildCharacterPrompt(character);
        let refreshedSystemMsgs = systemMsgs.map(msg => {
            if (msg.content.startsWith('CHARACTER STATE')) {
                return { ...msg, content: freshCharacterPrompt };
            }
            return msg;
        });

        // Inject or refresh the chronicle/world-facts block (always dynamic)
        if (chronicle.length > 0 || worldFacts.length > 0) {
            const chronicleContent = buildChroniclePrompt(chronicle, worldFacts);
            const existingIdx = refreshedSystemMsgs.findIndex(m => m.content.startsWith('ADVENTURE MEMORY'));
            if (existingIdx !== -1) {
                refreshedSystemMsgs[existingIdx] = { role: 'system', content: chronicleContent };
            } else {
                refreshedSystemMsgs = [...refreshedSystemMsgs, { role: 'system', content: chronicleContent }];
            }
        }

        // ── Build Anthropic messages ────────────────────────────────────────
        // Build system as a block array so stable blocks (core rules + setting)
        // benefit from Anthropic prompt caching (~10% cost on cache hits).
        // Index 0 = core rules (never changes), index 1 = setting (per-setting,
        // stable within a session), rest = character state / story summaries (dynamic).
        const systemBlocks: Anthropic.Messages.TextBlockParam[] = refreshedSystemMsgs.map((msg, i) => {
            const isStable = i === 0 ||
                (i === 1 &&
                    !msg.content.startsWith('CHARACTER STATE') &&
                    !msg.content.startsWith('[Story so far]'));
            return {
                type: 'text' as const,
                text: msg.content,
                ...(isStable ? { cache_control: { type: 'ephemeral' as const } } : {}),
            };
        });

        const anthropicMessages: Anthropic.Messages.MessageParam[] = convTurns
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => {
                let content = m.content;
                // Strip JSON wrapper from stored assistant messages so Claude only sees clean narrative
                if (m.role === 'assistant') {
                    let parsed: Record<string, unknown> | null = null;
                    try { parsed = JSON.parse(content); } catch {
                        try { parsed = JSON.parse(fixLiteralNewlines(content)); } catch { /* not JSON, use as-is */ }
                    }
                    if (parsed?.narrative) content = parsed.narrative as string;
                }
                return { role: m.role as 'user' | 'assistant', content };
            });

        // Ensure conversation starts with a user message (Anthropic requirement)
        if (anthropicMessages.length === 0 || anthropicMessages[0].role !== 'user') {
            anthropicMessages.unshift({ role: 'user', content: '[game session starting]' });
        }

        // Ensure strict user/assistant alternation (Anthropic requirement)
        const sanitizedMessages: Anthropic.Messages.MessageParam[] = [];
        for (const msg of anthropicMessages) {
            const lastRole = sanitizedMessages.length > 0 ? sanitizedMessages[sanitizedMessages.length - 1].role : null;
            if (lastRole === msg.role) {
                const last = sanitizedMessages[sanitizedMessages.length - 1];
                last.content = `${last.content}\n\n${msg.content}`;
            } else {
                sanitizedMessages.push({ ...msg });
            }
        }

        // Ensure the final message is from the user
        if (sanitizedMessages.length > 0 && sanitizedMessages[sanitizedMessages.length - 1].role !== 'user') {
            sanitizedMessages.push({ role: 'user', content: '[continue]' });
        }

        // ── Call Claude Sonnet 4.6 ──────────────────────────────────────────
        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 2048,
            system: systemBlocks,
            messages: sanitizedMessages,
            tools: [inventoryTool, currencyTool, questsTool, chronicleTool, worldFactsTool],
        });

        // ── Parse tool calls and text from response ─────────────────────────
        let inventoryChanges: { action: string; name: string; description?: string; rarity?: string; quantity: number; location_context?: string; usable_at?: string }[] = [];
        let currencyDelta = 0;
        let questChanges: QuestChange[] = [];
        let rawNarrative = '';
        let pendingChronicleEntry: { location: string; entry: string } | null = null;
        const pendingWorldFactChanges: { action: string; id: string; fact: string }[] = [];

        for (const block of response.content) {
            if (block.type === 'tool_use') {
                if (block.name === 'update_inventory') {
                    const args = block.input as { changes: typeof inventoryChanges };
                    if (Array.isArray(args.changes)) {
                        inventoryChanges = inventoryChanges.concat(args.changes);
                    }
                } else if (block.name === 'update_currency') {
                    const args = block.input as { delta: number; reason: string };
                    if (typeof args.delta === 'number') {
                        currencyDelta += args.delta;
                    }
                } else if (block.name === 'update_quests') {
                    const args = block.input as { changes: QuestChange[] };
                    if (Array.isArray(args.changes)) {
                        questChanges = questChanges.concat(args.changes);
                    }
                } else if (block.name === 'update_chronicle') {
                    const args = block.input as { location: string; entry: string };
                    if (args.location && args.entry) {
                        pendingChronicleEntry = { location: args.location, entry: args.entry };
                    }
                } else if (block.name === 'update_world_facts') {
                    const args = block.input as { action: string; id: string; fact: string };
                    if (args.id) {
                        pendingWorldFactChanges.push(args);
                    }
                }
            } else if (block.type === 'text') {
                rawNarrative += block.text;
            }
        }

        // If the model only returned tool calls with no text, do a follow-up
        if (!rawNarrative && response.stop_reason === 'tool_use') {
            const toolResultBlocks: Anthropic.Messages.ToolResultBlockParam[] = response.content
                .filter((b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use')
                .map(b => ({
                    type: 'tool_result' as const,
                    tool_use_id: b.id,
                    content: JSON.stringify({ status: "applied" }),
                }));

            const followUp = await anthropic.messages.create({
                model: "claude-sonnet-4-6",
                max_tokens: 1024,
                system: systemBlocks,
                messages: [
                    ...sanitizedMessages,
                    { role: 'assistant', content: response.content },
                    {
                        role: 'user',
                        content: [
                            ...toolResultBlocks,
                            {
                                type: 'text' as const,
                                text: 'Inventory/quest updates applied. Now write your full response as a single raw JSON object with exactly four fields: "narrative", "options" (MUST have 2–4 entries, never empty), "skill_options", and "item_options". No markdown, no preamble — raw JSON only.',
                            },
                        ],
                    },
                ],
                tools: [inventoryTool, currencyTool, questsTool, chronicleTool, worldFactsTool],
            });

            for (const block of followUp.content) {
                if (block.type === 'text') {
                    rawNarrative += block.text;
                }
            }
        }

        // ── Parse structured JSON from narrative ────────────────────────────
        const emptyStructured = () => ({ narrative: rawNarrative, options: [] as string[], skill_options: [] as { stat: string; label: string }[], item_options: [] as { item: string; label: string }[] });
        let structuredResponse: ReturnType<typeof emptyStructured>;

        const parseNarrative = (raw: string) => {
            const trimmed = raw.trim();

            // 1. Pure JSON
            try {
                return JSON.parse(trimmed);
            } catch { /* fall through */ }

            // 1b. Same, but with literal newlines inside strings sanitised first
            try {
                return JSON.parse(fixLiteralNewlines(trimmed));
            } catch { /* fall through */ }

            // 2. JSON wrapped in markdown code fences
            const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (fenceMatch) {
                try { return JSON.parse(fenceMatch[1].trim()); } catch { /* fall through */ }
            }

            // 3. Claude prefixed plain-text before the JSON blob — find the first { … }
            const firstBrace = trimmed.indexOf('{');
            if (firstBrace !== -1) {
                // Walk from the end to find the matching closing brace
                const lastBrace = trimmed.lastIndexOf('}');
                if (lastBrace > firstBrace) {
                    try {
                        const candidate = trimmed.slice(firstBrace, lastBrace + 1);
                        const parsed = JSON.parse(fixLiteralNewlines(candidate));
                        // If the narrative field is missing, prefix the leading plain text into it
                        if (parsed && typeof parsed === 'object') {
                            if (!parsed.narrative && firstBrace > 0) {
                                parsed.narrative = trimmed.slice(0, firstBrace).trim();
                            }
                            return parsed;
                        }
                    } catch { /* fall through */ }
                }
            }

            // 3b. Regex slice — handles unescaped double-quotes inside narrative strings
            //     (e.g. Claude writes  "narrative": "He said "hello" to her", "options":...)
            {
                const ki = trimmed.indexOf('"narrative"');
                if (ki !== -1) {
                    // find the colon then the opening quote
                    const colon = trimmed.indexOf(':', ki + 11);
                    if (colon !== -1) {
                        const openQuote = trimmed.indexOf('"', colon + 1);
                        if (openQuote !== -1) {
                            // look for the nearest recognised end-of-narrative boundary
                            const endMarkers = ['","options"', '","skill_options"', '","item_options"', '"\\n}', '"\n}'];
                            let endIdx = -1;
                            for (const marker of endMarkers) {
                                const pos = trimmed.indexOf(marker, openQuote + 1);
                                if (pos !== -1 && (endIdx === -1 || pos < endIdx)) endIdx = pos;
                            }
                            if (endIdx === -1) {
                                // fallback: last "}
                                endIdx = trimmed.lastIndexOf('"}');
                            }
                            if (endIdx > openQuote) {
                                const extractedNarrative = trimmed.slice(openQuote + 1, endIdx);
                                return {
                                    narrative: extractedNarrative,
                                    options: [],
                                    skill_options: [],
                                    item_options: [],
                                };
                            }
                        }
                    }
                }
            }

            // 4. Last resort — treat everything as plain narrative
            return { narrative: trimmed, options: [], skill_options: [], item_options: [] };
        };

        structuredResponse = parseNarrative(rawNarrative) ?? emptyStructured();

        // ── Retry if Claude returned a placeholder narrative ("...") ─────────
        if (isPlaceholderNarrative(structuredResponse?.narrative)) {
            const retryMsg = await anthropic.messages.create({
                model: 'claude-sonnet-4-6',
                max_tokens: 2048,
                system: systemBlocks,
                messages: [
                    ...sanitizedMessages,
                    {
                        role: 'user',
                        content: 'Your previous response contained a placeholder value ("...") instead of actual content. Write the FULL narrative now. Return a single raw JSON object with fields: "narrative" (full story text, at least 2 sentences), "options" (2–4 choices), "skill_options", "item_options". No placeholders, no abbreviations, no markdown fences.',
                    },
                ],
            });
            let retryRaw = '';
            for (const block of retryMsg.content) {
                if (block.type === 'text') retryRaw += block.text;
            }
            if (retryRaw) {
                const retried = parseNarrative(retryRaw);
                if (!isPlaceholderNarrative(retried?.narrative)) {
                    structuredResponse = retried;
                    rawNarrative = retryRaw;
                }
            }
        }

        // ── Ensure options are never empty ────────────────────────────────
        if (!structuredResponse.options || structuredResponse.options.length === 0) {
            try {
                const pendingForFallback = (character.quests ?? [])
                    .filter(q => q.status === 'active')
                    .flatMap(q => q.objectives.filter(o => !o.completed).map(o => o.description))
                    .slice(0, 2);
                const questContext = pendingForFallback.length > 0
                    ? `\nActive objectives the player should be working toward: ${pendingForFallback.join('; ')}. At least one option must move the player closer to one of these objectives.`
                    : '';
                const optionsCompletion = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: `You are a game master assistant. Given a narrative passage from a text-based RPG, return a JSON array of exactly 3 short action options the player could take next (strings only). The options must be contextually appropriate and varied.${questContext} Return ONLY the raw JSON array, e.g. ["Option A", "Option B", "Option C"].`,
                        },
                        { role: 'user', content: structuredResponse.narrative ?? rawNarrative },
                    ],
                    max_tokens: 150,
                });
                const raw = optionsCompletion.choices[0]?.message?.content?.trim() ?? '';
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    structuredResponse.options = parsed;
                }
            } catch {
                structuredResponse.options = ['Continue forward', 'Look around carefully', 'Wait and observe'];
            }
        }

        // ── Ensure at least one option advances a pending quest objective ──
        const pendingObjectives = (character.quests ?? [])
            .filter(q => q.status === 'active')
            .flatMap(q => q.objectives.filter(o => !o.completed).map(o => ({ questTitle: q.title, description: o.description })));

        if (pendingObjectives.length > 0 && structuredResponse.options.length > 0) {
            // Check if any existing option shares meaningful words with any pending objective
            const stopWords = new Set(['the', 'a', 'an', 'to', 'of', 'and', 'or', 'in', 'on', 'at', 'for', 'with', 'is', 'it', 'be', 'you']);
            const optionsText = structuredResponse.options.join(' ').toLowerCase();
            const hasQuestOption = pendingObjectives.some(obj => {
                const words = obj.description.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !stopWords.has(w));
                return words.some(w => optionsText.includes(w));
            });

            if (!hasQuestOption) {
                // Derive a natural-sounding option from the first pending objective.
                // Objectives are already phrased as concrete actions ("Defeat X", "Return to Y",
                // "Find Z") so they read well as player choices with minimal transformation.
                const firstObj = pendingObjectives[0];
                const questOption = firstObj.description.length <= 60
                    ? firstObj.description
                    : firstObj.description.slice(0, 57) + '...';

                if (structuredResponse.options.length >= 4) {
                    // Replace last option to stay within the 2–4 cap
                    structuredResponse.options[structuredResponse.options.length - 1] = questOption;
                } else {
                    structuredResponse.options.push(questOption);
                }
            }
        }

        // ── Server-side validation of tool calls ────────────────────────────
        inventoryChanges = validateInventoryChanges(inventoryChanges, character);
        currencyDelta = validateCurrencyDelta(currencyDelta, character);

        // ── Apply chronicle entry ────────────────────────────────────────────
        if (pendingChronicleEntry) {
            const lastEntry = chronicle[chronicle.length - 1];
            const normalise = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
            const isDuplicate = lastEntry && normalise(lastEntry.entry) === normalise(pendingChronicleEntry.entry);
            if (!isDuplicate) {
                const newEntry: ChronicleEntry = {
                    turn: chronicle.length + 1,
                    location: pendingChronicleEntry.location,
                    entry: pendingChronicleEntry.entry,
                    timestamp: new Date().toISOString(),
                };
                chronicle = [...chronicle, newEntry];
            }
        }

        // ── Apply world fact changes ─────────────────────────────────────────
        if (pendingWorldFactChanges.length > 0) {
            const factsMap: Record<string, string> = Object.fromEntries(worldFacts.map(wf => [wf.id, wf.fact]));
            for (const change of pendingWorldFactChanges) {
                if (change.action === 'remove') {
                    delete factsMap[change.id];
                } else {
                    // add or update
                    if (change.fact) factsMap[change.id] = change.fact;
                }
            }
            worldFacts = Object.entries(factsMap).map(([id, fact]) => ({ id, fact }));
        }

        // ── Persist chronicle and world facts ───────────────────────────────
        if (pendingChronicleEntry || pendingWorldFactChanges.length > 0) {
            const factsRecord = Object.fromEntries(worldFacts.map(wf => [wf.id, wf.fact]));
            if (isGuest) {
                const key = String(session!._id);
                chronicleStore[key] = chronicle;
                worldFactsStore[key] = factsRecord;
            } else {
                await sessionsCollection.updateOne(
                    { _id: session!._id },
                    { $set: { chronicle, world_facts: factsRecord } },
                );
            }
        }

        // Store the full JSON in session so options can be restored on reload.
        // Always stringify the already-parsed structuredResponse — never store raw
        // model output directly, which may contain literal unescaped newlines.
        const narrativeToStore = structuredResponse?.narrative ?? rawNarrative;
        const contentToStore = JSON.stringify(structuredResponse ?? { narrative: narrativeToStore, options: [], skill_options: [], item_options: [] });
        session!.messages.push({ role: "assistant", content: contentToStore });

        // Persist session
        if (isGuest) {
            chatHistoryStore[String(session!._id)] = session!.messages;
        } else {
            await sessionsCollection.updateOne({ _id: session!._id }, { $set: { messages: session!.messages, last_played: new Date() } });
        }

        return NextResponse.json({
            assistantMessage: narrativeToStore,
            structuredResponse,
            gameId: newGameId,
            inventoryChanges,
            currencyDelta,
            questChanges,
            chronicleEntries: chronicle,
            worldFacts,
        });
    } else {
        const filteredMessages = session!.messages.filter(msg => msg.role === "assistant" || msg.role === "user");
        // Parse the last assistant message to restore options on reload
        let lastStructuredResponse = null;
        for (let i = filteredMessages.length - 1; i >= 0; i--) {
            if (filteredMessages[i].role === 'assistant') {
                const raw = filteredMessages[i].content;
                // Try plain parse first, then sanitized (legacy sessions may have literal newlines)
                let parsed: Record<string, unknown> | null = null;
                try { parsed = JSON.parse(raw); } catch {
                    try { parsed = JSON.parse(fixLiteralNewlines(raw)); } catch { /* plain text */ }
                }
                if (parsed?.narrative) lastStructuredResponse = parsed;
                break;
            }
        }
        return NextResponse.json({ status: "Chat initialized and ready for messages.", gameId: newGameId || session!._id, messages: filteredMessages, lastStructuredResponse, chronicleEntries: chronicle, worldFacts });
    }
}
