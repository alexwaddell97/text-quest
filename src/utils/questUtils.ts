import { Quest, QuestChange } from '@/types';

// Pure function — applies an ordered list of quest changes to a quest array.
// Shared by the server-side API route and the client-side guest helper so
// neither has to import the other.
export function applyQuestChanges(quests: Quest[], changes: QuestChange[]): Quest[] {
    const result: Quest[] = quests.map((q) => ({
        ...q,
        objectives: q.objectives.map((o) => ({ ...o })),
    }));

    for (const change of changes) {
        switch (change.action) {
            case 'add_quest': {
                if (result.find((q) => q.id === change.quest_id)) break; // idempotent
                result.push({
                    id: change.quest_id,
                    title: change.title ?? 'Untitled Quest',
                    description: change.description ?? '',
                    status: 'active',
                    objectives: (change.objectives ?? []).map((o) => ({
                        id: o.id,
                        description: o.description,
                        completed: false,
                    })),
                    given_by: change.given_by ?? null,
                    reward_hint: change.reward_hint ?? null,
                    parent_quest_id: change.parent_quest_id ?? null,
                });
                break;
            }
            case 'complete_quest': {
                const q = result.find((q) => q.id === change.quest_id);
                if (q) q.status = 'completed';
                break;
            }
            case 'fail_quest': {
                const q = result.find((q) => q.id === change.quest_id);
                if (q) q.status = 'failed';
                break;
            }
            case 'complete_objective': {
                const q = result.find((q) => q.id === change.quest_id);
                if (q && change.objective_id) {
                    const obj = q.objectives.find((o) => o.id === change.objective_id);
                    if (obj) obj.completed = true;
                    // Auto-complete the quest when every objective is done
                    if (q.status === 'active' && q.objectives.length > 0 && q.objectives.every((o) => o.completed)) {
                        q.status = 'completed';
                    }
                }
                break;
            }
            case 'add_objective': {
                const q = result.find((q) => q.id === change.quest_id);
                if (q && change.objective_id && change.objective_description) {
                    if (!q.objectives.find((o) => o.id === change.objective_id)) {
                        q.objectives.push({
                            id: change.objective_id,
                            description: change.objective_description,
                            completed: false,
                        });
                    }
                }
                break;
            }
        }
    }

    return result;
}
