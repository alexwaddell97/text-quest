import { NextResponse } from "next/server";
import OpenAI from "openai";
import { MongoClient, ObjectId } from "mongodb";

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


// Simulating a simple in-memory store for chat history
const chatHistoryStore: Record<string, { role: string; content: string }[]> = {};


export async function POST(request: Request): Promise<NextResponse> {
    const { setting, character, message, gameId, role }: ChatRequest = await request.json();
    // MongoDB connection URI and client setup
    const client = new MongoClient(process.env.MONGODB_URI || '');
    await client.connect();
    const database = client.db("dev");
    const sessionsCollection = database.collection("sessions");

    let session;
    let newGameId = gameId;

    if (gameId || character?.session_id) {
        // Retrieve the conversation history for the given gameId
        session = await sessionsCollection.findOne<{ _id: ObjectId; messages: { role: string; content: string }[], character_id: ObjectId, setting_id: ObjectId }>({ _id: new ObjectId(gameId || character?.session_id) });
    }

    if (!session) {
        // If no gameId is provided or no session is found, create a new session
        newGameId = new ObjectId().toString();
        const initialMessages = [
            { role: "system", content: 'This is a setup message. You are connected to a Roleplaying Realm, a website that generates text based adventure games in various settings. When you present options to the user, please wrap these in four asterisks either side like ****Do a thing****. Any text related to the option should be in the asterisks. This will allow the AI to understand the options you are presenting. Add 4 new line spaces between paragraphs.' },
            { role: "system", content: setting.system_message },
            { role: "system", content: `Genre: ${setting.genre}` },
            { role: "system", content: `Key Themes: ${setting.key_themes.map(theme => `${theme.theme} (${theme.description})`).join(", ")}` },
            { role: "system", content: `Rules: ${setting.rules.map(rule => `${rule.rule} (${rule.description})`).join(", ")}` },
            { role: "system", content: `Factions: ${Object.keys(setting.factions).map(key => `${setting.factions[key].name} (Description: ${setting.factions[key].description}, Notable Members: ${setting.factions[key].notable_members?.join(", ") || "None"})`).join(", ")}` },
            { role: "system", content: `Key Beings: ${Object.keys(setting.key_beings).map(key => `${setting.key_beings[key].name} (Description: ${setting.key_beings[key].description}, Role: ${setting.key_beings[key].role})`).join(", ")}` },
            { role: "system", content: `Major Locations: ${Object.keys(setting.major_locations).map(key => `${setting.major_locations[key].name} (Description: ${setting.major_locations[key].description})`).join(", ")}` },
            {
            role: "system",
            content: `Character Info: Name: ${character.name}, Race: ${character.race}, Description: ${character.description}, Backstory: ${character.backstory}, Level: ${character.level}, Health: ${character.health.current}/${character.health.max}, XP: ${character.xp.current}, XP to Next Level: ${character.xp.max - character.xp.current}, Currency: ${character.currency}, Stats: Strength: ${character.stats.strength}, Agility: ${character.stats.agility}, Intelligence: ${character.stats.intelligence}, Charisma: ${character.stats.charisma}, Inventory: ${character.inventory.map((item: Item) => `${item.name} (Description: ${item.description}, Rarity: ${item.rarity}, Quantity: ${item.quantity})`).join(", ")}`
            },
        ];

        await sessionsCollection.insertOne({ _id: new ObjectId(newGameId), messages: initialMessages, character_id: new ObjectId(character._id), setting_id: new ObjectId(setting._id), user_id: new ObjectId(character.user_id) });
        session = { _id: new ObjectId(newGameId), messages: initialMessages, character_id: character._id, setting_id: setting._id };
    }

    // If a message is provided, add it to the conversation history
    if (message) {
        session!.messages.push({ role: role || "user", content: message });

        // Create the message list with the correct type
        const messages: ChatCompletionMessageParam[] = session!.messages.map((msg: { role: string; content: string }) => ({
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
        session!.messages.push({ role: "assistant", content: assistantMessage });

        // Update the session in the database
        await sessionsCollection.updateOne({ _id: session!._id }, { $set: { messages: session!.messages } });

        return NextResponse.json({ completion, gameId: newGameId });
    } else {
        // If no message is provided, return a success response indicating the chat is ready
        // Also pass back all messages in the session that were from assistant and user
        const filteredMessages = session!.messages.filter(msg => msg.role === "assistant" || msg.role === "user");
        return NextResponse.json({ status: "Chat initialized and ready for messages.", gameId: newGameId, messages: filteredMessages });
    }
}