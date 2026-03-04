import { Effect, EffectInstance } from './effect.js';
import { Damage } from '../damage/damage.js';
import { Skill } from '../../character/skill.js';
import { Timeline } from '../../timeline/timeline.js';

/**
 * A DormantEffect triggers an Effect based on a certain trigger.
 */
class DormantEffect extends Effect {
    constructor(scope, name, duration, effect, trigger) {
        super(scope, name, duration);
        this.effect = effect;
        this.trigger = trigger;
    }

    createInstance(startTime, owner = null) {
        return new DormantEffectInstance(this, startTime, owner);
    }
}

/**
 * An instance of an DormantEffect on the timeline.
 */
class DormantEffectInstance extends EffectInstance {
    constructor(definition, startTime, owner = null, sourceId = null) {
        super(definition, startTime, owner, sourceId);
        this.triggeredEvents = new Set();
        console.log(`Created DormantEffectInstance: ${definition.name} from ${startTime} to ${this.endTime} with trigger ${definition.trigger} and sourceId ${sourceId}`);
    }

    shouldTrigger(event) {
        return (event.skill.name === this.definition.trigger || event.skill.type === this.definition.trigger
            && this.startTime + this.definition.duration <= event.time);
    }

    /**
     * Creates an instance of the effect that is dormant.
     * @param {SkillEvent} targetEvent The event that triggered this dormant effect.
     * @returns 
     */
    triggerInstance(targetEvent) {
        const newEffect = this.definition.effect;
        this.triggeredEvents.add(targetEvent.id);
        if (newEffect instanceof Skill) {
            return new Damage(targetEvent.time, this.definition.effect, this.sourceId);
        } else {
            return this.definition.effect.createInstance(targetEvent.time, this.owner, this.sourceId);
        }
    }
    
    /**
     * When moved or deleted, removes any relevant effects from affected events.
     * @param {Timeline} timeline The timeline reference to remove from.
     */
    clearTriggeredEffects(timeline) {
        console.log(`Clearing triggered effects for DormantEffectInstance ${this.definition.name} with id ${this.sourceId}`);
        for (const eventId of this.triggeredEvents) {
            const event = timeline.events.find(e => e.id === eventId);
            if (event) {
                // Remove damage/effects that came from this dormant effect
                event.damage = event.damage.filter(d => d.sourceId !== this.sourceId);
                event.effects = event.effects.filter(e => e.sourceId !== this.sourceId);
            }
        }
        this.triggeredEvents.clear();
    }
}

export { DormantEffect, DormantEffectInstance };