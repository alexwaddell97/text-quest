import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI();

export async function GET(request: Request) {
    const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: "You are a helpful assistant." }],
        model: "gpt-4o",
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
            content: "You are generating a detailed RPG character from a setting in a game. Provide structured JSON data for the character.",
        },
        {
            role: "user",
            content: `Create a detailed RPG character with the following setting:
        Setting: ${JSON.stringify(setting)}`,
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
                    race: { type: "string", description: "The character's race" },
                    description: { type: "string", description: "A detailed description of the character" },
                    backstory: { type: "string", description: "A detailed backstory for the character" },
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
        model: "gpt-4o-mini", // Use a model that supports function calling
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

    return NextResponse.json({ character });
}