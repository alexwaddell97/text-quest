import { NextResponse } from "next/server";
import OpenAI from "openai";
import { MongoClient, ObjectId } from "mongodb";
import { Quest, QuestChange } from "@/types";
import { applyQuestChanges } from "@/utils/questUtils";
import { chatHistoryStore } from "@/utils/guestSessionStore";

const openai = new OpenAI();

export async function GET(request: Request) {
    const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: "You are a helpful assistant." }],
        model: "gpt-5-mini",
    });

    return NextResponse.json(completion);
}

// Define types for the input and output
interface Setting {
    _id: ObjectId;
    system_message: string;
    genre: string;
    factions: Record<string, { name: string; description: string; notable_members: string[] }>;
    key_beings: Record<string, { name: string; description: string, role: string }>;
    major_locations: Record<string, { name: string; description: string }>;
    key_themes: { theme: string; description: string }[];
    cover_image: string;
    rules: { rule: string; description: string }[];
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
    inventory: { name: string; description: string; rarity: string; quantity: number }[];
    session_id: ObjectId;
    quests?: Quest[];
}

interface ChatRequest {
    setting: Setting;
    character: Character;
    message: string;
    gameId: string;
    role?: string;
}

interface ChatCompletionMessageParam {
    role: "system" | "user" | "assistant"; // Only these roles are allowed
    content: string;
    name?: string; // Optional, but required for some specific types like function messages
}

interface Item {
    name: string;
    description: string;
    rarity: string;
    quantity: number;
}


export async function POST(request: Request): Promise<NextResponse> {
    const { setting, character, message, gameId, role }: ChatRequest = await request.json();
    // MongoDB connection URI and client setup
    const client = new MongoClient(process.env.MONGODB_URI || '');
    await client.connect();
    const database = client.db("dev");
    const sessionsCollection = database.collection("sessions");

    const isGuest = !character.user_id;
    const isValidObjectId = (v: any): v is string => typeof v === 'string' && /^[a-f\d]{24}$/i.test(v);

    let session: { _id: any; messages: { role: string; content: string }[] } | null = null;
    let newGameId = gameId;

    const buildInitialMessages = () => [
        { role: "system", content: 'This is a setup message. You are connected to a Roleplaying Realm, a website that generates text based adventure games in various settings.' },
        { role: "system", content: 'RESPONSE FORMAT: Your responses must always be a JSON object with four fields: "narrative" (the GM story text — markdown is fine here), "options" (array of 2–4 standard action choices as plain strings), "skill_options" (array of 0–2 stat-check options, each with {stat, label}), and "item_options" (array of 0–1 item-use options, each with {item, label}). Never put option text inside the narrative — all choices belong in their respective arrays only.' },
        { role: "system", content: 'OPTIONS RULES: Options in all arrays must be consistent with the player\'s level, backstory, setting, and current situation. Never include options requiring items the player does not have. SKILL CHECK OPTIONS: these are rare and special — only include one when the current situation presents a genuinely meaningful physical, mental, or social challenge where a stat check would significantly change the outcome (e.g. a locked door that could be forced, a suspicious guard who might be persuaded, a creature whose lore might be recalled). Do NOT add skill checks for routine actions, travelling, shopping, or relaxed scenes. Expect to include a skill option in roughly 1 out of every 8–10 responses. The relevant stat must be 10 or higher; stat must be exactly one of: Strength, Agility, Intelligence, Charisma. ITEM OPTIONS: similarly rare — only surface an item option when a specific item the player carries is directly and obviously relevant to the current scene (e.g. a lockpick at a locked door, a health potion while injured, a map while lost). Do not invent relevance. Expect to include an item option in roughly 1 out of every 8–10 responses. Only reference items actually present in the player\'s inventory by their exact name.\n\nQUEST-DRIVEN OPTIONS (mandatory): Whenever the player has active quests with at least one pending objective, at least one entry in the main "options" array must be a concrete action that could meaningfully advance or complete a pending objective — even if that path isn\'t the most obvious one in the immediate scene. Make it feel natural (e.g. "Head to the docks to track down the smuggler") rather than mechanical. This ensures the player always has a clear path forward through their objectives.' },
        { role: "system", content: 'CRITICAL — INVENTORY SYSTEM: This game has a live inventory system. The ONLY way items are actually added or removed from the player\'s inventory is by calling the update_inventory function tool. Writing about items in text does NOTHING — the items will not appear. NEVER write phrases like "Your inventory is updated", "You now have...", or list gained items in prose. Instead, silently call update_inventory with the structured data, then write your narrative naturally (e.g. "You pocket the communicator and press on.").\n\nINVENTORY LOGIC RULES (strictly enforced): Before calling update_inventory with action "add", ask yourself: (a) Is there a clear, specific narrative reason this item exists right now? (b) Was this item explicitly introduced in the story as something the player can take? (c) Does the player NOT already have this item, or does it make sense for them to have another one? If the answer to any of these is no, do NOT add it. Do NOT give the player a second copy of an item they already have unless the story explicitly introduced a second one. Do NOT spontaneously reward items as filler — every item in the inventory must have a traceable story origin. When a player uses or loses an item, call update_inventory with action "remove" immediately and do not re-add it in the same or subsequent response unless the story introduces a new one. If you forget to call the tool, the player\'s inventory will be wrong and the game will break. This is mandatory every single time any item is gained or lost.' },
        { role: "system", content: 'CRITICAL — CURRENCY SYSTEM: The player has a dedicated currency balance (coins, gold, credits, spice, etc. depending on the setting). Coins/currency are NOT inventory items — NEVER call update_inventory for money. Instead, call the update_currency function tool with a positive delta when the player gains money, and a negative delta when they spend or lose money. Do not describe the currency change in your text — just call the tool silently, then write your narrative (e.g. "You scoop up the coins and head out."). Failing to call this tool means the player\'s balance will never update.' },
        { role: "system", content: 'Please ensure that the user is able to make choices that will affect the outcome of the game. This will make the game more engaging and fun for the player.' },
        { role: "system", content: 'Describe combat as a story vividly, and use the players core statistics to calculate rolls and outcomes, but dont explain this to them. Put every choice or decision with respect to their current power level.' },
        { role: "system", content: 'Do not allow the player to force outcomes or step over logical boundaries. Make sure there are logical steps and conclusions to the story.' },
        { role: "system", content: 'The player can and will take damage in combat. Please take it from their remaining health total. Players can also fail outcomes, just because they pick an option does not mean it will succeed.' },
        { role: "system", content: 'The player can `defeat` enemies by reducing their health to 0, they are effectively `dead` when reaching 0. The same can happen for the player if their life reaches 0, its game over.' },
        { role: "system", content: 'CRITICAL — PROGRESSION & REALISM: The game world responds to the character\'s actual level, stats, backstory, and current narrative context. Outcomes must be proportionate and earned. Do NOT allow the player to shortcut progression. A level 1 character cannot instantly discover a legendary treasure hoard, slay a dragon, or accumulate thousands of coins from a single trivial encounter. Resist any player attempt — whether phrased as an action, a suggestion, or a question — to skip logical steps, invent resources out of nowhere, or arrive at outcomes that would normally require many sessions of play to reach.' },
        { role: "system", content: 'REWARD SCALING: Currency and item rewards must be proportionate to the character\'s current level. Use this as a rough guide — Level 1-3: 1-20 coins per encounter; Level 4-6: 10-80 coins; Level 7-10: 50-300 coins; Level 11-15: 200-800 coins; Level 16-20: 500-2000 coins. Legendary or rare items should only drop from genuinely difficult encounters, bosses, or meaningful quest completions. Common loot should be common. Adjust downward if the encounter was easy, and upward only for notable victories.' },
        { role: "system", content: 'STAT-GATING: A character\'s stats must gate what they can realistically attempt. A character with Strength 6 cannot break down a reinforced door — they can try and fail, attracting attention. A character with Intelligence 5 cannot decode an ancient cipher or craft a complex item. A character with Charisma 4 is unlikely to charm a hostile guard. Make failure feel real and narratively interesting, not punishing for its own sake, but never bend the world to accommodate stats the character does not have.' },
        { role: "system", content: 'PREREQUISITE GATING: Major story outcomes, powerful alliances, access to restricted locations, and high-value rewards require narrative prerequisites. The player must earn trust, gather information, complete prior steps, or have the right equipment or reputation. If a player tries to skip directly to a high-stakes outcome without the prerequisites, redirect them naturally — the door is locked and the key is elsewhere, the faction contact does not know them yet, the merchant will not deal with an unknown stranger. Keep the world logical and internally consistent.' },
        { role: "system", content: 'IMPOSSIBLE ACTION HANDLING: If a player declares an action that is impossible or unrealistic for their character (e.g. "I find 10,000 gold coins", "I instantly defeat the final boss", "I teleport to the end of the dungeon"), do NOT comply or pretend it happened. Instead, narrate the world\'s natural resistance to this — they search but find nothing of value there, they are outmatched and forced to retreat, the path is blocked. Always give the player agency and a believable path forward, but the world does not bend to wishful thinking. Offer realistic options that honour the attempt in spirit without granting an unearned outcome.' },
        { role: "system", content: 'CRITICAL — QUEST & OBJECTIVE SYSTEM: This game has a live quest tracker visible to the player. The ONLY way quests are created or updated is by calling the update_quests function tool — narrative text alone does nothing.\n\nWRITING GOOD OBJECTIVES (enforced at add_quest time): Every objective must be written as a concrete, observable action — something with a clear, unambiguous done-state that only one interpretation fits. BAD (vague, never use): "Survive the encounter", "Deal with the threat", "Handle the situation", "Explore the area". GOOD (concrete, use these patterns): "Defeat or drive off the corrupted furbolg", "Escape the ambush alive", "Slay the bandit captain", "Return to Brightwater alive after clearing the glade". If the intent is survival through combat, write it as the specific action that constitutes that survival — "Defeat the X" or "Escape past the X". Never write objectives that depend on the player\'s subjective interpretation. Each objective must answer: what exact thing must happen for this to count as done?\n\nOBJECTIVE COMPLETION RULES (strictly enforced): Only call complete_objective when the objective action has been FULLY and UNAMBIGUOUSLY completed — not started, not in-progress, not partially done. Ask yourself: "Has the player actually finished this thing, or are they still in the process?" Examples: objective "Recruit the blacksmith" → complete ONLY after the blacksmith EXPLICITLY agrees to join. Approaching them, initiating a conversation, them asking questions, or them requesting something in return is NOT complete. Objective "Deliver the message" → complete ONLY after it is physically handed over and acknowledged. Objective "Defeat the bandit leader" → complete ONLY after he is dead or surrenders. When in doubt, do NOT mark complete — it is always better to be late than premature.\n\nWHEN TO USE THE TOOL: (1) add_quest — when the player receives a meaningful multi-step task, discovers a mystery, or begins a clear story arc. Give it a stable snake_case id (e.g. "find_the_lost_relic"), a concise title, a 1-sentence description, 1–4 actionable objectives, the giver\'s name, and a reward hint if known. (2) complete_objective — ONLY when fully done per the rules above. Set objective_id to the EXACT id from the Active Quests context brackets — e.g. "[talk_to_innkeeper]" → objective_id: "talk_to_innkeeper". Never invent objective ids. (3) add_objective — when play reveals a new required step. (4) complete_quest — when all objectives are done and fully resolved. (5) fail_quest — when the quest is unresolvable.\n\nROUNDABOUT COMPLETION: If a pending objective is effectively achieved via an unexpected path — the method differs from what was described but the outcome is clearly reached — call complete_objective immediately. The method does not matter, only the outcome. Example: objective is "Find the smuggler\'s ledger" but the player instead intimidated the dock foreman into revealing the same information — the information is obtained, so complete the objective.\n\nDEFUNCT OBJECTIVES: If circumstances change so that a pending objective can never now be completed (the quest giver was killed, the target was destroyed before collection, the location is permanently sealed), do NOT leave the quest floating as active. Call fail_quest so the player knows it is done and can move on.\n\nQUEST CHAINING (for complex multi-stage arcs): When completing a quest naturally opens a new, deeper phase of the same story (e.g. finding the relic now requires decoding it), create a new follow-up quest using add_quest with parent_quest_id set to the original quest\'s id. Example: complete "find_the_relic" → then add_quest "decode_the_relic" with parent_quest_id: "find_the_relic". The UI will display these as a connected quest chain. Use chaining for genuinely complex arcs — not every quest needs a follow-up.\n\nDo NOT create quests for incidental actions, single purchases, or trivial one-step interactions. Quests represent meaningful story threads.' },
        { role: "system", content: setting.system_message },
        { role: "system", content: `Genre: ${setting.genre}` },
        { role: "system", content: `Key Themes: ${setting.key_themes.map(theme => `${theme.theme} (${theme.description})`).join(", ")}` },
        { role: "system", content: `Rules: ${setting.rules.map(rule => `${rule.rule} (${rule.description})`).join(", ")}` },
        { role: "system", content: `Factions: ${Object.keys(setting.factions).map(key => `${setting.factions[key].name} (Description: ${setting.factions[key].description}, Notable Members: ${setting.factions[key].notable_members?.join(", ") || "None"})`).join(", ")}` },
        { role: "system", content: `Key Beings: ${Object.keys(setting.key_beings).map(key => `${setting.key_beings[key].name} (Description: ${setting.key_beings[key].description}, Role: ${setting.key_beings[key].role})`).join(", ")}` },
        { role: "system", content: `Major Locations: ${Object.keys(setting.major_locations).map(key => `${setting.major_locations[key].name} (Description: ${setting.major_locations[key].description})`).join(", ")}` },
        { role: "system", content: `Character Info: Name: ${character.name}, Race: ${character.race}, Description: ${character.description}, Backstory: ${character.backstory}, Level: ${character.level}, Health: ${character.health.current}/${character.health.max}, XP: ${character.xp.current}, XP to Next Level: ${character.xp.max - character.xp.current}, Currency: ${character.currency}, Stats: Strength: ${character.stats.strength}, Agility: ${character.stats.agility}, Intelligence: ${character.stats.intelligence}, Charisma: ${character.stats.charisma}, Inventory: ${character.inventory.map((item: Item) => `${item.name} (Description: ${item.description}, Rarity: ${item.rarity}, Quantity: ${item.quantity})`).join(", ")}` },
        { role: "system", content: `Active Quests: ${
            (character.quests ?? []).filter(q => q.status === 'active').length === 0
                ? 'None'
                : (character.quests ?? []).filter(q => q.status === 'active').map(q =>
                    `[ID: ${q.id}]${q.parent_quest_id ? ` (stage of: ${q.parent_quest_id})` : ''} ${q.title} — ${q.description} | Objectives: ${q.objectives.map(o => `[${o.id}] ${o.description} (${o.completed ? 'done' : 'pending'})`).join(', ')}`
                  ).join(' || ')
        }` },
    ];

    if (isGuest) {
        // Guest: use in-memory store — no MongoDB ObjectId conversions needed
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
    } else {
        // Authenticated: use MongoDB
        const lookupId = gameId || character?.session_id;
        if (lookupId && isValidObjectId(String(lookupId))) {
            session = await sessionsCollection.findOne<{ _id: ObjectId; messages: { role: string; content: string }[] }>({ _id: new ObjectId(String(lookupId)) });
            // Sanitize: if any assistant message stored raw JSON instead of just the narrative, extract it
            if (session?.messages) {
                session.messages = session.messages.map((msg) => {
                    if (msg.role === 'assistant') {
                        try {
                            const parsed = JSON.parse(msg.content);
                            if (parsed?.narrative) return { ...msg, content: parsed.narrative };
                        } catch {}
                    }
                    return msg;
                });
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
            });
            session = { _id: new ObjectId(newGameId), messages: initialMessages };
        }
    }

    // If a message is provided, add it to the conversation history
    if (message) {
        session!.messages.push({ role: role || "user", content: message });

        // ── Context compression ──────────────────────────────────────────────
        // System messages are fixed and likely prompt-cached — keep them all.
        // Conversation turns (user/assistant) grow unbounded; we compress them
        // periodically to keep token costs from compounding session to session.
        //
        // Strategy:
        //   • COMPRESS_AFTER  — once conversation turns exceed this, summarise
        //   • KEEP_RECENT     — always keep this many recent turns verbatim
        //   • Everything older is distilled into a single [Story so far] paragraph
        //     by gpt-4o-mini (cheap), then persisted back to storage so future
        //     requests start from the already-compressed state.
        //   • While below the threshold, a sliding window caps what is SENT to
        //     the model (MAX_WINDOW), keeping single-request costs bounded even
        //     before the first compression fires.
        const COMPRESS_AFTER = 40;  // non-system messages before summarising (~20 rounds)
        const KEEP_RECENT    = 14;  // recent turns to keep verbatim after compression (~7 rounds)
        const MAX_WINDOW     = 30;  // sliding window cap when below threshold (~15 rounds)

        const systemMsgs = session!.messages.filter(m => m.role === 'system');
        let convTurns    = session!.messages.filter(m => m.role !== 'system');

        if (convTurns.length > COMPRESS_AFTER) {
            // Summarise the oldest batch, keep the genuinely recent turns intact
            const toSummarise = convTurns.slice(0, convTurns.length - KEEP_RECENT);
            const toKeep      = convTurns.slice(convTurns.length - KEEP_RECENT);

            try {
                const summaryCompletion = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a game historian for a text-based RPG. Summarise the following session transcript into one compact paragraph (≤120 words). Cover: key events, decisions made, enemies fought, items gained or lost, quests started or updated, and important NPCs encountered. Be specific and factual. Write in past tense from the player\'s perspective. Omit filler and flavour text.',
                        },
                        {
                            role: 'user',
                            content: toSummarise.map(m => `${m.role === 'user' ? 'Player' : 'GM'}: ${m.content}`).join('\n'),
                        },
                    ],
                    max_tokens: 180,
                });

                const summaryText = summaryCompletion.choices[0]?.message?.content?.trim() ?? '';
                if (summaryText) {
                    const summaryMsg = { role: 'system', content: `[Story so far]: ${summaryText}` };
                    convTurns = [summaryMsg, ...toKeep];
                    // Persist the compressed session so future requests start lean
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
                // Compression failed — fall through to sliding window as safe fallback
                console.warn('Session compression failed, falling back to sliding window:', err);
                convTurns = convTurns.slice(convTurns.length - MAX_WINDOW);
            }
        } else if (convTurns.length > MAX_WINDOW) {
            // Below compression threshold but above window cap — just slice for this request
            // (do NOT persist the truncation; DB keeps full history for future compression)
            convTurns = convTurns.slice(convTurns.length - MAX_WINDOW);
        }

        // Create the message list with the correct type
        const messages: ChatCompletionMessageParam[] = [
            ...systemMsgs,
            ...convTurns,
        ].map((msg: { role: string; content: string }) => ({
            role: msg.role as "system" | "user" | "assistant",
            content: msg.content,
        }));

        // Tool definitions — strict: true guarantees schema-conformant arguments
        const inventoryTool = {
            type: "function" as const,
            function: {
                name: "update_inventory",
                strict: true,
                description:
                    "MANDATORY: Call this every time any item is gained or lost — loot, purchases, consumables used, equipment broken, items given away, etc. " +
                    "Do NOT describe inventory changes in your narrative — only this function call actually updates the inventory.",
                parameters: {
                    type: "object",
                    properties: {
                        changes: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    action: { type: "string", enum: ["add", "remove"], description: "'add' when the player gains an item, 'remove' when it is used, broken, lost, or given away." },
                                    name: { type: "string", description: "Short item name." },
                                    description: { anyOf: [{ type: "string" }, { type: "null" }], description: "Brief item description (1 sentence). Provide when adding, null when removing." },
                                    rarity: { anyOf: [{ type: "string", enum: ["common", "uncommon", "rare", "legendary", "unique"] }, { type: "null" }], description: "Item rarity. Provide when adding, null when removing." },
                                    quantity: { type: "number", description: "How many to add or remove." },
                                    location_context: { anyOf: [{ type: "string" }, { type: "null" }], description: "Where/how the item was acquired. Provide when adding, null when removing." },
                                    usable_at: { anyOf: [{ type: "string" }, { type: "null" }], description: "Where or under what conditions this item can be used. Provide when adding, null when removing." },
                                },
                                required: ["action", "name", "description", "rarity", "quantity", "location_context", "usable_at"],
                                additionalProperties: false,
                            },
                        },
                    },
                    required: ["changes"],
                    additionalProperties: false,
                },
            },
        };

        const currencyTool = {
            type: "function" as const,
            function: {
                name: "update_currency",
                strict: true,
                description:
                    "MANDATORY: Call this every time the player gains or loses coins, gold, credits, or any form of currency. " +
                    "Do NOT add currency as an inventory item — use this tool instead. " +
                    "Pass a positive delta to add money, negative to subtract.",
                parameters: {
                    type: "object",
                    properties: {
                        delta: { type: "number", description: "Amount to add (positive) or subtract (negative) from the player's currency balance." },
                        reason: { type: "string", description: "Brief reason, e.g. 'Found coins on the table', 'Paid merchant for supplies'." },
                    },
                    required: ["delta", "reason"],
                    additionalProperties: false,
                },
            },
        };

        const questsTool = {
            type: "function" as const,
            function: {
                name: "update_quests",
                strict: true,
                description:
                    "MANDATORY: Call this to create quests, mark objectives complete, add new objectives, or resolve quests. " +
                    "Only call for meaningful multi-step story threads — not trivial one-step interactions. " +
                    "Do NOT describe quest changes in your narrative — only this tool actually updates the tracker.",
                parameters: {
                    type: "object",
                    properties: {
                        changes: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    action: {
                                        type: "string",
                                        enum: ["add_quest", "complete_quest", "fail_quest", "complete_objective", "add_objective"],
                                        description: "The operation to perform.",
                                    },
                                    quest_id: { type: "string", description: "Stable snake_case identifier for the quest (e.g. 'find_the_lost_relic'). Must be consistent across all updates to the same quest." },
                                    title: { anyOf: [{ type: "string" }, { type: "null" }], description: "Quest title. Required for add_quest; null otherwise." },
                                    description: { anyOf: [{ type: "string" }, { type: "null" }], description: "One-sentence quest description. Required for add_quest; null otherwise." },
                                    objectives: {
                                        anyOf: [
                                            {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    properties: {
                                                        id: { type: "string", description: "Stable snake_case objective id (e.g. 'talk_to_innkeeper')." },
                                                        description: { type: "string", description: "Short action description for the objective." },
                                                    },
                                                    required: ["id", "description"],
                                                    additionalProperties: false,
                                                },
                                            },
                                            { type: "null" },
                                        ],
                                        description: "Initial objectives. Required for add_quest; null otherwise.",
                                    },
                                    given_by: { anyOf: [{ type: "string" }, { type: "null" }], description: "Name of the NPC or faction that assigned this quest. Provide for add_quest; null otherwise." },
                                    reward_hint: { anyOf: [{ type: "string" }, { type: "null" }], description: "Short hint about the reward if known (e.g. '50 gold and a mysterious key'). Provide for add_quest when known; null otherwise." },
                                    objective_id: { anyOf: [{ type: "string" }, { type: "null" }], description: "CRITICAL: For complete_objective, you MUST copy this value EXACTLY from the objective id shown in square brackets in the Active Quests context (e.g. if context shows '[talk_to_innkeeper] ...', use 'talk_to_innkeeper'). NEVER invent, guess, or paraphrase this id — it must match character state exactly or the objective will silently fail. Required for complete_objective and add_objective; null for all other actions." },
                                    objective_description: { anyOf: [{ type: "string" }, { type: "null" }], description: "Description of the new objective. Required for add_objective; null otherwise." },
                                    parent_quest_id: { anyOf: [{ type: "string" }, { type: "null" }], description: "For add_quest only: set to the quest_id of the parent quest when this quest is a continuation/next stage of a larger arc. Creates a visible chain in the quest tracker. Null for standalone quests or any action other than add_quest." },
                                },
                                required: ["action", "quest_id", "title", "description", "objectives", "given_by", "reward_hint", "objective_id", "objective_description", "parent_quest_id"],
                                additionalProperties: false,
                            },
                        },
                    },
                    required: ["changes"],
                    additionalProperties: false,
                },
            },
        };

        // Structured output schema — guarantees narrative + options arrive in typed fields
        const gameResponseFormat = {
            type: "json_schema" as const,
            json_schema: {
                name: "game_response",
                strict: true,
                schema: {
                    type: "object",
                    properties: {
                        narrative: { type: "string", description: "The GM story text (markdown is fine). Never put option text here." },
                        options: {
                            type: "array",
                            description: "2–4 standard action choices as plain strings.",
                            items: { type: "string" },
                        },
                        skill_options: {
                            type: "array",
                            description: "0–2 stat-check options. Only include when the relevant stat is 10+.",
                            items: {
                                type: "object",
                                properties: {
                                    stat: { type: "string", description: "Exactly one of: Strength, Agility, Intelligence, Charisma" },
                                    label: { type: "string", description: "Short action description, e.g. 'Force the door open'" },
                                },
                                required: ["stat", "label"],
                                additionalProperties: false,
                            },
                        },
                        item_options: {
                            type: "array",
                            description: "0–1 options using a specific item the player currently has in their inventory.",
                            items: {
                                type: "object",
                                properties: {
                                    item: { type: "string", description: "Exact item name as listed in the player's inventory." },
                                    label: { type: "string", description: "What the player does with it, e.g. 'Drink the potion to restore health'" },
                                },
                                required: ["item", "label"],
                                additionalProperties: false,
                            },
                        },
                    },
                    required: ["narrative", "options", "skill_options", "item_options"],
                    additionalProperties: false,
                },
            },
        };

        // Make the API request with the full conversation history + tools + structured response format
        const completion = await openai.chat.completions.create({
            messages,
            model: "gpt-5.2",
            tools: [inventoryTool, currencyTool, questsTool],
            tool_choice: "auto",
            response_format: gameResponseFormat as any,
        });

        const choice = completion.choices[0];

        // Parse any inventory / currency / quest changes emitted by the AI
        let inventoryChanges: { action: string; name: string; description?: string; rarity?: string; quantity: number }[] = [];
        let currencyDelta = 0;
        let questChanges: QuestChange[] = [];
        if (choice.message.tool_calls?.length) {
            for (const toolCall of choice.message.tool_calls) {
                if (toolCall.function.name === "update_inventory") {
                    try {
                        const args = JSON.parse(toolCall.function.arguments);
                        if (Array.isArray(args.changes)) {
                            inventoryChanges = inventoryChanges.concat(args.changes);
                        }
                    } catch {
                        // malformed JSON from model — skip
                    }
                } else if (toolCall.function.name === "update_currency") {
                    try {
                        const args = JSON.parse(toolCall.function.arguments);
                        if (typeof args.delta === 'number') {
                            currencyDelta += args.delta;
                        }
                    } catch {
                        // malformed JSON from model — skip
                    }
                } else if (toolCall.function.name === "update_quests") {
                    try {
                        const args = JSON.parse(toolCall.function.arguments);
                        if (Array.isArray(args.changes)) {
                            questChanges = questChanges.concat(args.changes);
                        }
                    } catch {
                        // malformed JSON from model — skip
                    }
                }
            }
        }

        let rawAssistantContent = choice.message.content ?? '';

        // If the model only returned a tool call (content is null), do a follow-up
        // completion supplying the tool result so we get the structured narrative response.
        if (choice.message.tool_calls?.length && !rawAssistantContent) {
            const followUpMessages: ChatCompletionMessageParam[] = [
                ...messages,
                {
                    role: "assistant" as const,
                    content: choice.message.content ?? '',
                    // @ts-ignore — tool_calls is valid on assistant messages in the API
                    tool_calls: choice.message.tool_calls,
                },
                // Provide the tool result so the model can continue
                ...choice.message.tool_calls.map((tc) => ({
                    role: "tool" as const,
                    tool_call_id: tc.id,
                    content: JSON.stringify({ status: "applied" }),
                })),
            ];

            const followUp = await openai.chat.completions.create({
                messages: followUpMessages as any,
                model: "gpt-5.2",
                response_format: gameResponseFormat as any,
            });

            rawAssistantContent = followUp.choices[0]?.message?.content ?? '';
        }

        // Parse structured JSON response from the model
        let structuredResponse: {
            narrative: string;
            options: string[];
            skill_options: { stat: string; label: string }[];
            item_options: { item: string; label: string }[];
        } | null = null;

        try {
            structuredResponse = JSON.parse(rawAssistantContent);
        } catch {
            // Fallback: treat raw content as plain narrative
            structuredResponse = null;
        }

        // Store only the narrative in session history so the model has clean context
        const narrativeToStore = structuredResponse?.narrative ?? rawAssistantContent;
        session!.messages.push({ role: "assistant", content: narrativeToStore });

        // Persist session
        if (isGuest) {
            chatHistoryStore[String(session!._id)] = session!.messages;
        } else {
            await sessionsCollection.updateOne({ _id: session!._id }, { $set: { messages: session!.messages } });
        }

        return NextResponse.json({
            completion,
            assistantMessage: narrativeToStore,
            structuredResponse,
            gameId: newGameId,
            inventoryChanges,
            currencyDelta,
            questChanges,
        });
    } else {
        // If no message is provided, return a success response indicating the chat is ready
        // Also pass back all messages in the session that were from assistant and user
        const filteredMessages = session!.messages.filter(msg => msg.role === "assistant" || msg.role === "user");
        return NextResponse.json({ status: "Chat initialized and ready for messages.", gameId: newGameId || session._id, messages: filteredMessages });
    }
}