import { NextResponse } from "next/server";
import OpenAI from "openai";
import { generatePortrait } from "@/utils/generatePortrait";

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
    system_message: string;
    genre: string;
    factions: Record<string, { name: string; description: string; notable_members: string[] }>;
    key_beings: Record<string, { name: string; description: string, role: string }>;
    major_locations: Record<string, { name: string; description: string }>;
    key_themes: string[];
    cover_image: string;
    rules: string[];
}

interface ChatRequest {
    setting: Setting;
    character: any;
    message: string;
    gameId: string;
}

interface ChatCompletionMessageParam {
    role: "system" | "user" | "assistant"; // Only these roles are allowed
    content: string;
    name?: string; // Optional, but required for some specific types like function messages
}


// Simulating a simple in-memory store for chat history
const chatHistoryStore: Record<string, { role: string; content: string }[]> = {};

export async function POST(request: Request): Promise<NextResponse> {
    const { setting }: { setting: Setting } = await request.json();

    const messages = [
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
            content: `Create a detailed RPG character for the following setting. Make sure the name, lineage/race, backstory and description all feel native to this world — avoid anything that would feel out of place.\n\nSetting: ${JSON.stringify(setting)}`,
        },
    ];

    // Define a schema for the character
    const functions = [
        {
            name: "generate_rpg_character",
            description: "Generates a detailed RPG character.",
            parameters: {
                type: "object",
                properties: {
                    name: { type: "string", description: "The character's name" },
                    race: { type: "string", description: "The character's lineage or race in 1-2 words maximum, expressed in terms native to the setting (e.g. 'Muggle-born' for Harry Potter, 'Mandalorian' for Star Wars, 'Undead Rogue' for dark fantasy). Never use generic fantasy races unless the setting explicitly features them. Never exceed 2 words." },
                    description: { type: "string", description: "A single paragraph (3-5 sentences) describing the character's physical appearance, personality and demeanour. No line breaks." },
                    backstory: { type: "string", description: "A single paragraph (4-6 sentences) covering the character's origin, key life events and motivation. No line breaks." },
                    stats: {
                        type: "object",
                        properties: {
                            Strength: { type: "integer", description: "Strength stat (1-18)" },
                            Agility: { type: "integer", description: "Agility stat (1-18)" },
                            Intelligence: { type: "integer", description: "Intelligence stat (1-18)" },
                            Charisma: { type: "integer", description: "Charisma stat (1-18)" },
                        },
                        required: ["Strength", "Agility", "Intelligence", "Charisma"],
                    },
                },
                required: ["name", "race", "description", "backstory", "stats"],
            },
        },
    ];

    // Make the OpenAI API call
    const completion = await openai.chat.completions.create({
        model: "gpt-5-mini", // Use a model that supports function calling
        messages: messages as ChatCompletionMessageParam[], // Type assertion to match the expected type
        functions,
        function_call: { name: "generate_rpg_character" }, // Explicitly request the function
    });

    // Extract the function response
    const functionResponse = completion.choices[0]?.message?.function_call?.arguments;

    let character;
    try {
        character = functionResponse ? JSON.parse(functionResponse) : {};
    } catch (error) {
        return NextResponse.json({ error: "Failed to parse character data" }, { status: 500 });
    }

    // Generate portrait in the same request so the client gets everything at once
    const imageUrl = await generatePortrait({
        name: character.name,
        race: character.race,
        description: character.description,
        backstory: character.backstory,
        setting,
    });

    return NextResponse.json({ character, imageUrl: imageUrl ?? undefined });
}