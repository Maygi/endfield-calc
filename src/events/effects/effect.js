/**
 * An base class representing any timed effect. Defined in character data
 * for baseline effects.
 */
class Effect {
    constructor(scope, name, duration) {
        this.scope = scope; // self, global, enemy
        this.name = name;
        this.duration = duration;
        this.type = 'Effect';
    }

    createInstance(startTime, owner = null, sourceId = null) {
        return new EffectInstance(this, startTime, owner, sourceId);
    }
}

/**
 * An instance of an Effect on the timeline.
 */
class EffectInstance {
    constructor(definition, startTime, owner = null, sourceId = null) {
        this.definition = definition;
        this.startTime = startTime;
        this.endTime = startTime + definition.duration;
        this.owner = owner;
        this.sourceId = sourceId;
        console.log(`Created EffectInstance: ${definition.name} from ${this.startTime} to ${this.endTime} with owner ${owner ? owner.name : 'None'} and sourceId ${this.sourceId}`);
    }

    isActiveAt(time) {
        return time >= this.startTime && time <= this.endTime;
    }
}

export { Effect, EffectInstance };