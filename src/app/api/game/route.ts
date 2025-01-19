import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI();

export async function GET(request: Request) {
    const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: "You are a helpful assistant." }],
        model: "gpt-4o",
    });

    console.log(completion.choices[0]);

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
    const { setting, character, message, gameId }: ChatRequest = await request.json();

    // Retrieve or initialize the conversation history for the given gameId
    if (!chatHistoryStore[gameId]) {
        // If this is a new conversation, initialize with the system message
        chatHistoryStore[gameId] = [
            { role: "system", content: 'This is a setup message. You are connected to a InfiniteWorlds.ai, a website that generates text based adventure games in various settings. When you present options to the user, please wrap these in four asterisks either side like ****Do a thing****. Any text related to the option should be in the asterisks. This will allow the AI to understand the options you are presenting.' },
            { role: "system", content: setting.system_message },
            { role: "system", content: `Genre: ${setting.genre}` },
            ...setting.key_themes.map(theme => ({ role: "system", content: `Key Theme: ${theme}` })),
            ...setting.rules.map(rule => ({ role: "system", content: `Rule: ${rule}` })),
            ...Object.keys(setting.factions).map(key => ({
            role: "system",
            content: `Faction: ${setting.factions[key].name}, Description: ${setting.factions[key].description}, Notable Members: ${setting.factions[key].notable_members.join(", ")}`
            })),
            ...Object.keys(setting.key_beings).map(key => ({ role: "system", content: `Key Being: ${setting.key_beings[key].name}, Description: ${setting.key_beings[key].description}, Role: ${setting.key_beings[key].role}` })),
            ...Object.keys(setting.major_locations).map(key => ({ role: "system", content: `Major Location: ${setting.major_locations[key].name}, Description: ${setting.major_locations[key].description}` })),
            {
            role: "system",
            content: `Character Info: Name: ${character.name}, Race: ${character.race}, Level: ${character.level}, Health: ${character.health}, XP: ${character.xp}, XP to Next Level: ${character.xpToNextLevel}, Currency: ${character.currency}, Stats: Strength: ${character.stats.strength}, Agility: ${character.stats.agility}, Intelligence: ${character.stats.intelligence}, Charisma: ${character.stats.charisma}, Inventory: ${character.inventory.map(item => `${item.name} (Description: ${item.description}, Rarity: ${item.rarity})`).join(", ")}`
            },
        ];

        console.log(chatHistoryStore[gameId]);
    }

    // If a message is provided, add it to the conversation history
    if (message) {
        chatHistoryStore[gameId].push({ role: "user", content: message });

        // Create the message list with the correct type
        const messages: ChatCompletionMessageParam[] = chatHistoryStore[gameId].map((msg) => ({
            role: msg.role as "system" | "user" | "assistant", // Ensuring the role is valid
            content: msg.content,
        }));

        // Make the API request with the full conversation history
        const completion = await openai.chat.completions.create({
            messages, // Pass the full conversation history including the current message
            model: "gpt-4o-mini",
        });

        // Get the AI's response and ensure it's a string before pushing
        const assistantMessage = completion.choices[0].message.content ?? ''; // Fallback to empty string if null

        // Append the AI's response to the conversation history
        chatHistoryStore[gameId].push({ role: "assistant", content: assistantMessage });

        return NextResponse.json(completion);
    } else {
        // If no message is provided, just return a success response indicating the chat is ready
        return NextResponse.json({ status: "Chat initialized and ready for messages." });
    }
}