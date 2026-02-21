
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
    location_context?: string;
    usable_at?: string;
}

export interface InventoryChange {
    action: "add" | "remove";
    name: string;
    description?: string;
    rarity?: "common" | "uncommon" | "rare" | "legendary" | "unique";
    quantity: number;
    location_context?: string;
    usable_at?: string;
}

export interface QuestObjective {
    id: string;
    description: string;
    completed: boolean;
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    status: 'active' | 'completed' | 'failed';
    objectives: QuestObjective[];
    given_by: string | null;
    reward_hint: string | null;
    parent_quest_id?: string | null;
}

export type QuestChangeAction = 'add_quest' | 'complete_quest' | 'fail_quest' | 'complete_objective' | 'add_objective';

export interface QuestChange {
    action: QuestChangeAction;
    quest_id: string;
    title: string | null;
    description: string | null;
    objectives: { id: string; description: string }[] | null;
    given_by: string | null;
    reward_hint: string | null;
    objective_id: string | null;
    objective_description: string | null;
    parent_quest_id: string | null;
}

export interface Message {
    text: string;
    sender: "You" | "Gamemaster";
    inventoryChanges?: InventoryChange[];
    // Structured options from the game_response schema (new sessions)
    options?: string[];
    skill_options?: { stat: string; label: string }[];
    item_options?: { item: string; label: string }[];
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
    currency: number;
    stats: {
        strength: number;
        agility: number;
        intelligence: number;
        charisma: number;
    };
    image_url?: string;
    quests?: Quest[];
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
    image_url?: string;
}