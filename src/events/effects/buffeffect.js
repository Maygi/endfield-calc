import { Effect, EffectInstance } from './effect.js';

/**
 * Represents a buffing or debuffing effect definition.
 */
class BuffEffect extends Effect {

    /**
     * 
     * @param {*} scope 
     * @param {*} name 
     * @param {*} duration 
     * @param {*} value The value of the buff
     * @param {*} type The type of the buff, e.g. "atk", "dmgBonus", etc.
     * @param {*} subtype Optional - further categorization for the buff, e.g. "Physical" for a DMG Bonus buff
     */
    constructor(scope, name, duration, value, type, subtype = null) { 
        super(scope, name, duration);
        this.type = type;
        this.subtype = subtype;
        this.value = value;
    }

    /**
     * @returns The stat path in dot notation (e.g. dmgBonus.heat). The dot is excluded if there is no subtype.
     */
    getStatPath() {
        return `${this.type}` + (this.subtype ? `.${this.subtype}` : '');
    }
}

const STACKING_TYPE = {
    'REFRESH': 'Refresh', // refresh duration on new application
    'INDEPENDENT': 'Independent' // each application has its own duration
}

/**
 * Represents a stacking buffing effect definition.
 */
class StackingBuffEffect extends BuffEffect {

    /**
     * 
     * @param {*} scope 
     * @param {*} name 
     * @param {*} duration 
     * @param {*} statPath The path to the stat, e.g. dmgBonus.battleSkill
     * @param {*} value The value of the buff
     * @param {*} stackLimit The maximum number of stacks for this effect
     */
    constructor(scope, name, duration, stackLimit, stackingType, type, subtype = null) { 
        super(scope, name, duration, 0, type, subtype);
        this.stackLimit = stackLimit;
        this.stackingType = stackingType; // "Additive" or "Multiplicative"
    }
}

export { BuffEffect, StackingBuffEffect, STACKING_TYPE };