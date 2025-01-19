import { InventoryItem } from "@/types";

export const getRarityColor = (rarity: InventoryItem["rarity"]) => {
    switch (rarity) {
        case "common":
            return "text-gray-500";
        case "uncommon":
            return "text-green-500";
        case "rare":
            return "text-blue-500";
        case "legendary":
            return "text-orange-500";
        case "unique":
            return "text-red-500 unique-item";
        default:
            return "";
    }
};