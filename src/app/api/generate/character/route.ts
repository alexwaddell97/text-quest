import { NextResponse } from "next/server";
import OpenAI from "openai";
import { generatePortrait } from "@/utils/generatePortrait";

const openai = new OpenAI();

interface Setting {
    system_message: string;
    genre: string;
    factions: Record<string, { name: string; description: string; notable_members: string[] }>;
    key_beings: Record<string, { name: string; description: string; role: string }>;
    major_locations: Record<string, { name: string; description: string }>;
    key_themes: string[];
    cover_image: string;
    rules: string[];
}

export async function POST(request: Request): Promise<NextResponse> {
    const { setting, hints = {} }: { setting: Setting; hints?: Record<string, string> } = await request.json();

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
            role: "system",
            content: `You are generating a detailed RPG character that fits perfectly within the provided setting. Every field — including the character's name, lineage/race, description, and backstory — must be authentic to that specific setting's lore, tone, and fiction.

NAMING RULES (critical):
- The name must feel native to this exact setting — not generic.
- In superhero universes (Marvel, DC, etc.), characters have a superhero codename/alias as their primary name (e.g. "Iron Fist", "Nightshade", "Vector") — NOT a plain first/last name unless they are explicitly a civilian.
- In wizarding/magic school settings, use British-style given names with magical surnames.
- In sci-fi / space opera settings, use futuristic or alien-sounding names appropriate to the species.
- In historical or mythology settings, use period-accurate names from the relevant culture.
- If in doubt, ask: "Would this name appear in a character roster for this specific franchise or world?" — if not, change it.

LINEAGE/RACE RULES:
- Do NOT use generic fantasy races (e.g. Elf, Dwarf, Half-Orc) unless the setting explicitly supports them.
- For Harry Potter: lineage = "Muggle-born Witch", "Pure-blood Wizard", "Squib", "Half-blood", etc.
- For Marvel/DC: lineage = origin type such as "Enhanced Human", "Mutant", "Sorcerer", "Alien (Kree)", etc.
- For sci-fi: use species/origins that fit that universe.

Provide structured JSON data for the character.`,
        },
        {
            role: "user",
            content: [
                `Create a detailed RPG character for the following setting. Make sure the name, lineage/race, backstory and description all feel native to this world — avoid anything that would feel out of place.`,
                Object.keys(hints).length > 0
                    ? `\nThe user has pre-filled the following constraints — you MUST honour them exactly and build the rest of the character around them:\n${Object.entries(hints).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`
                    : '',
                `\nSetting: ${JSON.stringify(setting)}`,
            ].filter(Boolean).join(''),
        },
    ];

    const characterTool: OpenAI.Chat.Completions.ChatCompletionTool = {
        type: "function",
        function: {
            name: "generate_rpg_character",
            description: "Generates a detailed RPG character.",
            parameters: {
                type: "object",
                properties: {
                    name: { type: "string", description: "The character's name" },
                    race: { type: "string", description: "The character's lineage or race in 1-2 words maximum, expressed in terms native to the setting (e.g. 'Muggle-born' for Harry Potter, 'Mandalorian' for Star Wars, 'Undead Rogue' for dark fantasy). Never use generic fantasy races unless the setting explicitly features them. Never exceed 2 words." },
                    gender: { type: "string", enum: ["male", "female", "non-specific"], description: "The character's gender. Choose what fits best for the character concept." },
                    description: { type: "string", description: "A single paragraph (3-5 sentences) describing the character's physical appearance, personality and demeanour. No line breaks." },
                    backstory: { type: "string", description: "A single paragraph (4-6 sentences) covering the character's origin, key life events and motivation. No line breaks." },
                    stats: {
                        type: "object",
                        description: "Assign exactly: 12 to the ONE stat that most fits this character's concept and backstory (their standout ability), 8 to the ONE stat that least fits them (their clear weakness), and 10 to the remaining two. Every character MUST have exactly one 12, two 10s, and one 8.",
                        properties: {
                            Strength: { type: "integer", description: "Must be exactly 12, 10, or 8" },
                            Agility: { type: "integer", description: "Must be exactly 12, 10, or 8" },
                            Intelligence: { type: "integer", description: "Must be exactly 12, 10, or 8" },
                            Charisma: { type: "integer", description: "Must be exactly 12, 10, or 8" },
                        },
                        required: ["Strength", "Agility", "Intelligence", "Charisma"],
                    },
                    starting_inventory: {
                        type: "array",
                        description: "2–4 starting items that fit the character's backstory, profession, and setting. Each item should feel earned — something they'd plausibly carry given who they are. No overpowered gear for level 1.",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string", description: "Short item name, native to the setting's vocabulary." },
                                description: { type: "string", description: "One sentence: what it is and why they have it." },
                                rarity: { type: "string", enum: ["common", "uncommon"], description: "Level 1 characters only get common or uncommon items." },
                                quantity: { type: "integer", description: "Usually 1. Consumables (potions, ammo) can be 2–3." },
                            },
                            required: ["name", "description", "rarity", "quantity"],
                        },
                    },
                },
                required: ["name", "race", "gender", "description", "backstory", "stats", "starting_inventory"],
            },
        },
    };

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        tools: [characterTool],
        tool_choice: { type: "function", function: { name: "generate_rpg_character" } },
    });

    const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
    const functionResponse = toolCall?.function?.arguments;

    let character;
    try {
        character = functionResponse ? JSON.parse(functionResponse) : {};
    } catch {
        return NextResponse.json({ error: "Failed to parse character data" }, { status: 500 });
    }

    const imageUrl = await generatePortrait({
        name: character.name,
        race: character.race,
        description: character.description,
        backstory: character.backstory,
        setting,
    });

    return NextResponse.json({ character, imageUrl: imageUrl ?? undefined });
}
