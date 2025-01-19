
export interface Setting {
    _id: string;
    name: string;
    description: string;
    system_message: string;
    genre: string;
    factions: { name: string; description: string }[];
    key_beings: { name: string; description: string }[];
    key_themes: { theme: string; description: string }[];
    major_locations: { name: string; description: string }[];
    rules: { rule: string; description: string }[];
    cover_image: string;
}

export interface InventoryItem {
    name: string;
    description: string;
    rarity: "common" | "uncommon" | "rare" | "legendary" | "unique";
    quantity: number;
}

export interface Message {
    text: string;
    sender: "You" | "Gamemaster";
}

export interface Character {
    _id: string;
    setting_id: string;
    user_id: string;
    name: string;
    race: string;
    description: string;
    backstory: string;
    level: number;
    xp: {
        current: number;
        max: number;
    };
    health: {
        current: number;
        max: number;
    };
    inventory: InventoryItem[];
    stats: {
        strength: number;
        agility: number;
        intelligence: number;
        charisma: number;
    };
}

export interface CharacterSchema {
    _id: string;
    setting_id: string;
    user_id: string;
    name: string;
    race: string;
    description: string;
    backstory: string;
    level: number;
    xp: {
        current: number;
        max: number;
    };
    health: {
        current: number;
        max: number;
    };
    inventory: {item_id: string, quantity: number}[];
    stats: {
        strength: number;
        agility: number;
        intelligence: number;
        charisma: number;
    };
}