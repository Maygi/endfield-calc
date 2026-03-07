import { Damage } from './damage/damage.js';
import { DormantEffect } from './effects/dormanteffect.js';
import { timeline, enemyStats } from '../main.js';
import { Stats } from '../character/stats.js';
import { BuffEffect } from './effects/buffeffect.js';
import { SCOPE } from '../constants/data.js';
import { Calculation } from './calculation.js';

/**
 * Represents an active event created from a skill.
 */
class SkillEvent {
    constructor(time, skill) {
        this.time = time;
        this.skill = skill;
        this.id = crypto.randomUUID();
        console.log(`Created SkillEvent: ${skill.name} at time ${time} with id ${this.id}`);
        this.initialize(time);
        this.calculation = null;
    }

    /**
     * Returns a string for the mouseover info.
     */
    getInfo() {
        let damageString = this.damage.map(d => `\t- ${d.skill.name} (${(d.skill.mv * 100).toFixed(2)}% MV)`).join('\n');

        return `[${this.time}] ${this.skill.owner.name} used ${this.skill.name}
            \n\tDamage: \n${damageString}`;
    }

    /**
     * @returns The effects triggered by the skill.
     */
    getEffects() {
        return this.effects;
    }

    /**
     * Initializes the Event on the given time, refreshing its effects and calculations.
     * @param {*} time 
     */
    initialize(time) {
        this.time = time;
        this.damage = [];
        this.effects = [];
        this.dormantEffects = [];
        for (const effect of this.skill.effects || []) {
            if (effect instanceof DormantEffect) {
                this.dormantEffects.push(effect.createInstance(time, this.skill.owner, this.id));
            } else {
                this.effects.push(effect.createInstance(time, this.skill.owner, this.id));
            }
        }

        this.damage.push(new Damage(time, this.skill));
        this.recalculate();
        console.log(`Initialized SkillEvent: ${this.skill.name} at time ${time} with damage ${this.damage.length} and effects ${this.effects.length}`);
    }

    /**
     * Moves the event to the given time and reinitializes it.
     * Should ONLY be called from timeline.moveEvent.
     * @param {*} newTime 
     */
    move(newTime) {
        this.time = newTime;
        this.initialize(newTime);
    }

    /**
     * @returns Whether this event has any dormant effects.
     */
    hasDormantEffects() {
        return this.dormantEffects.length > 0;
    }

    /**
     * Checks dormant effects to see if any should be triggered by the new event.
     * Only updates if the new event's time >= this event's time.
     * @param {SkillEvent} newEvent The new event to check against.
     * @return Whether any dormant effects were triggered.
     */
    checkDormantEffects(newEvent) {
        if (newEvent.time < this.time) {
            return false;
        }
        if (this.hasDormantEffects()) {
            let found = false;
            console.log(`Checking dormant effects for ${this.skill.name} at ${this.time} with new event ${newEvent.skill.name} at ${newEvent.time}`);
            for (const dormantEffect of this.dormantEffects) {
                //console.log(`Checking dormant effect with trigger ${dormantEffect.definition.trigger}...`);
                if (dormantEffect.shouldTrigger(newEvent)) {
                    let triggeredEffect = dormantEffect.triggerInstance(newEvent);
                    console.log(`Dormant effect triggered by ${newEvent.skill.name}: ${triggeredEffect.constructor.name}`);
                    found = true;
                    if (triggeredEffect instanceof Damage) {
                        newEvent.damage.push(triggeredEffect);
                    } else {
                        newEvent.effects.push(triggeredEffect);
                    }
                }
            }
            return found;
        }
        return false;
    }

    /**
     * Recalculates the damage value when new events are added.
     */
    recalculate(activeEffects = null) {
        if (activeEffects === null) { // when initialized, just get events up to current time
            const eventsUpToNow = timeline.getEventsUpTo(this.time);
            activeEffects = eventsUpToNow.length > 0 ? eventsUpToNow.flatMap(e => e.effects) : [];
        }
        const buffEffects = [];
        const debuffEffects = [];
        for (const effect of activeEffects) {
            if (effect.definition instanceof BuffEffect) {
                if (effect.definition.scope === SCOPE.ENEMY) {
                    debuffEffects.push(effect);
                } else {
                    buffEffects.push(effect);
                }
            }
        }
        const characterStats = this.skill.owner.baseStats;
        const staggered = timeline.isStaggered(this.time);
        
        this.calculation = new Calculation(characterStats, enemyStats, buffEffects, debuffEffects);
        
        for (const damageInstance of this.damage) {
            const damageCalc = this.calculation.calculateDamage(damageInstance.skill, staggered);
            console.log(damageCalc.toString());
        }

        console.log(this.calculation.getEffectString())
    }
}

export { SkillEvent };