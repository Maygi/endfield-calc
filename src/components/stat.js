import { EVENT_TYPE, MODIFIER_TYPE } from "../data/constants";

export class StatComponent {
    constructor(engine, entityId, characterRef) {
        this.engine = engine;
        this.entityId = entityId;

        this.baseStats = { ...characterRef.stats }; // placeholder. todo: implement level scaling too - the stats should be initialized to whatever level the char/entity is.

        // each modifier is stored within these data objects as [modifierName]: <modifierID, { value, modifierType }>
        this.modifiers = {};

        this.finalStats = { ...this.baseStats }; // contains cached calculations. this is what the calculator references from.
        this.dirtyFlags = new Set();

        for (const stat in this.baseStats) {
            this.modifiers[stat] = new Map();
        }
    }

    handleEvent(state, event) {
        if (event.type === EVENT_TYPE.STATE_UPDATE && event.targetId === this.entityId) {
            if (!event.data.modifierType === MODIFIER_TYPE.DELTA) {
                this.processModifier(event.data);
            }
        }
    }

    processModifier(data) {
        const { stat, value, modifierType, modifierId, isRemoval } = data;

        // in the unlikely event of the stat being completely new
        if (!this.modifiers[stat]) {
            this.modifiers.stat = new Map();
            this.baseStats[stat] = 0;
            this.finalStats[stat] = 0;
        }

        if (isRemoval) {
            this.modifiers[stat].delete(modifierId);
        } else {
            this.modifiers[stat].set(modifierId, { value, modifierType });
        }

        this.dirtyFlags.add(stat);
    }

    getStat(stat) {
        if (this.dirtyFlags.has(stat)) {
            this.recalculate(stat);
        }
        return this.finalStats[stat];
    }

    recalculate(stat) {
        const base = this.baseStats[stat];
        const mods = this.modifiers[stat];

        let sumFlats = 0;
        let sumPercents = 0;

        let highestMin = -Infinity;
        let lowestMax = Infinity;

        // i am not the place to go for damage formulas so just use this as a placeholder
        if (modifiers) {
            for (const mod of mods.values()) {
                switch (mod.modifierType) {
                    case MODIFIER_TYPE.FLAT:
                        sumFlats += mod.value;
                        break;
                    case MODIFIER_TYPE.PERCENTAGE:
                        sumPercents += mod.value;
                        break;
                    case MODIFIER_TYPE.MIN:
                        if (mod.value > highestMin) highestMin = mod.value;
                        break;
                    case MODIFIER_TYPE.MAX:
                        if (mod.value < lowestMax) lowestMax = mod.value;
                        break;
                }
            }
        }

        let calculated = (base + sumFlats) * (1 + sumPercents); // is this even the formula lol idk

        // clamp on min and max
        calculated = Math.max(highestMin, Math.max(lowestMax, calculated));

        this.finalStats[stat] = calculated;
        this.dirtyFlags.delete(property);
    }

    getStatBreakdown(stat) {
        const mods = {};
        if (this.modifiers[stat]) {
            for (const [id, mod] of this.modifiers[stat].entries()) {
                mods[id] = mod;
            }
        }

        return {
            base: this.baseStats[stat],
            activeModifiers: mods,
            final: this.getStat(stat)
        }
    }
}