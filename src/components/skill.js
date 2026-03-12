import { ABILITY_TYPE, EVENT_TYPE } from "../data/constants";
import { CHARACTER_INDEX } from "../data/characters";

export class AbilityComponent {
    constructor(engine, entityId, charId, config) {
        this.engine = engine;
        this.entityId = entityId;
        this.charId = charId;

        // initialize defaults
        this.config = {
            levels: {
                [ABILITY_TYPE.BASIC]: 1,
                [ABILITY_TYPE.BATTLE_SKILL]: 1,
                [ABILITY_TYPE.COMBO_SKILL]: 1,
                [ABILITY_TYPE.ULTIMATE]: 1,
                ...config?.levels},
            talents: { ...config?.talents },
            potentials: config?.potentials || 0
        };

        this.cooldowns = new Map();

        // if needed
        this.globalCooldownReadyAt = 0;
    }

    handleEvent(state, event) {
        if (event.type !== EVENT_TYPE.SKILL_EVENT) return;

        const kit = CHARACTER_INDEX[this.charId];
        if (!kit || !kit.skills) return;

        const abilityType = event.data.type;
        const skillDef = kit.skills[abilityType];

        if (!skillDef) {
            console.warn(`AbilityComponent: Could not find definition for ${abilityType} ability of character ${this.charId}`);
            return;
        }

        const level = this.config.levels[abilityType];

        // check gcd (idk if any character actually uses gcds lol but in case?)
        if (event.time < this.globalCooldownReadyAt) {
            console.warn(`${this.charId} attempted to cast ${abilityType} at ${event.time} but is restricted by GCD until ${this.globalCooldownReadyAt}`);
            // flag in UI? or flat out return to reject
        }

        // check icd
        const skillCdReadyAt = this.cooldowns.get(abilityType) || 0;
        if (event.time < skillCdReadyAt) {
            console.warn(`${this.charId} attempted to cast ${abilityType} at ${event.time} but is restricted by ICD until ${skillCdReadyAt}`);
        }

        const spCost = skillDef.spCost ? skillDef.spCost[level] : 0;
        if (spCost > 0) {
            const currentSP = state.getSP();
            if (currentSP < spCost) {
                console.warn(`${this.charId} attempted to cast ${abilityType} at ${event.time} but there is insufficient SP`);
                return;
            }
        }

        // execution
        const cdDuration = skillDef.cooldown(level);
        if (cdDuration > 0) {
            this.cooldowns.set(abilityType, event.time + cdDuration);
        }

        if (skillDef.gcd > 0) {
            this.globalCooldownReadyAt = event.time + skillDef.gcd;
        }

        const targetId = event.targetId;
        const events = skillDef.execute(event.time, level, this.config, this.entityId, targetId);

        if (events) {
            for (const event of events) {
                this.engine.pushEvent(event);
            }
        }
    }

    clone(newEngine) {
        const copy = new AbilityComponent(newEngine, this.entityId, this.charId, this.config);

        copy.globalCooldownReadyAt = this.globalCooldownReadyAt;
        for (const [type, readyTime] of this.cooldowns) {
            copy.cooldowns.set(type, readyTime);
        }

        return copy;
    }
}