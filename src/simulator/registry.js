import { CHARACTER_INDEX } from "../data/characters";
import { PHYSICAL_STATUSES } from "../data/physical"

export const Registry = {
    getStatusDefinition(namespace, statusName) {
        if (namespace === 'PHYSICAL') {
            return PHYSICAL_STATUSES[statusName];
        }
        if (namespace === 'ARTS') {
            return; // actually i dont think i use this hmm
        }
        if (CHARACTER_INDEX[namespace] && CHARACTER_INDEX[namespace].statuses) {
            return CHARACTER_INDEX[namespace].statuses[statusName];
        }

        console.warn(`Status ${statusName} not found in namespace ${namespace}`);
        return null;
    }
}