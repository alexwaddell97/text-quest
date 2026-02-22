import { Character, InventoryChange, QuestChange } from '@/types';
import { applyQuestChanges } from '@/utils/questUtils';

const STORAGE_KEY = 'tq_guest_characters';

export function getGuestCharacters(): Character[] {
    if (typeof window === 'undefined') return [];
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    } catch {
        return [];
    }
}

export function saveGuestCharacter(character: Character): void {
    const all = getGuestCharacters();
    const idx = all.findIndex((c) => c._id === character._id);
    if (idx >= 0) {
        all[idx] = character;
    } else {
        all.push(character);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteGuestCharacter(id: string): void {
    const all = getGuestCharacters().filter((c) => c._id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function buildGuestCharacter(
    characterData: {
        name: string;
        race: string;
        description: string;
        backstory: string;
        stats: Character['stats'];
        image_url?: string;
        gender?: Character['gender'];
    },
    settingId: string,
): Character {
    return {
        _id: crypto.randomUUID(),
        setting_id: settingId,
        user_id: '',
        level: 1,
        currency: 100,
        inventory: [],
        xp: { current: 0, max: 100 },
        health: { current: 100, max: 100 },
        ...characterData,
    };
}

export function applyGuestInventoryChanges(
    id: string,
    changes: InventoryChange[],
    currencyDelta: number,
): Character | null {
    const all = getGuestCharacters();
    const char = all.find((c) => c._id === id);
    if (!char) return null;

    const inventory = [...char.inventory];
    for (const change of changes) {
        if (change.action === 'add') {
            const existing = inventory.find((i) => i.name === change.name);
            if (existing) {
                existing.quantity += change.quantity;
            } else {
                inventory.push({
                    name: change.name,
                    description: change.description ?? '',
                    rarity: change.rarity ?? 'common',
                    quantity: change.quantity,
                });
            }
        } else {
            const idx = inventory.findIndex((i) => i.name === change.name);
            if (idx >= 0) {
                const next = { ...inventory[idx], quantity: Math.max(0, inventory[idx].quantity - change.quantity) };
                if (next.quantity === 0) {
                    inventory.splice(idx, 1);
                } else {
                    inventory[idx] = next;
                }
            }
        }
    }

    const updated: Character = {
        ...char,
        inventory,
        currency: Math.max(0, (char.currency ?? 0) + currencyDelta),
    };
    saveGuestCharacter(updated);
    return updated;
}

export function applyGuestXpAndLevelUp(
    id: string,
    xpGain: number,
    statUpgrade?: string,
): { character: Character; leveledUp: boolean } | null {
    const all = getGuestCharacters();
    const char = all.find((c) => c._id === id);
    if (!char) return null;

    const currentXp = char.xp?.current ?? 0;
    const xpMax = char.xp?.max ?? 100;
    const newXpRaw = currentXp + xpGain;

    let level = char.level ?? 1;
    let leveledUp = false;
    let finalXpCurrent = newXpRaw;
    let finalXpMax = xpMax;
    const stats = { ...(char.stats as Record<string, number>) };

    if (newXpRaw >= xpMax) {
        leveledUp = true;
        level = level + 1;
        finalXpCurrent = Math.max(0, newXpRaw - xpMax);
        finalXpMax = 100 * level;
        if (statUpgrade && statUpgrade in stats) {
            stats[statUpgrade] = (stats[statUpgrade] ?? 0) + 1;
        }
    }

    const updated: Character = {
        ...char,
        xp: { current: finalXpCurrent, max: finalXpMax },
        level,
        stats: stats as Character['stats'],
    };
    saveGuestCharacter(updated);
    return { character: updated, leveledUp };
}

export function applyGuestQuestChanges(
    id: string,
    changes: QuestChange[],
): Character | null {
    const all = getGuestCharacters();
    const char = all.find((c) => c._id === id);
    if (!char) return null;

    const updatedQuests = applyQuestChanges(char.quests ?? [], changes);
    const updated: Character = { ...char, quests: updatedQuests };
    saveGuestCharacter(updated);
    return updated;
}
