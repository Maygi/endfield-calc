import Engine from "../simulator/engine";

export class TriggerComponent {
    constructor(engine, entityId, triggers = []) {
        this.engine = engine;
        this.entityId = entityId;
        this.triggers = triggers;
    }

    initialize(state) {
        for (const trigger of this.triggers) {
            // each passive might have several triggering conditions
            for (const eventType of trigger.eventTypes) {
                Engine.subscribe(state, eventType, this.entityId, 'TriggerComponent');
            }
        }
    }

    notify(state, event) {
        for (const trigger of this.triggers) {
            // sanity check
            if (!trigger.eventTypes.includes(event.type)) continue;

            // within the condition, use tags and state to do further checks
            if (trigger.condition && trigger.condition(state, event, this.entityId)) {
                const effects = trigger.execute(state, event, this.entityId);
                if (effects) {
                    for (const event of effects) {
                        this.engine.pushEvent(event);
                    }
                }
            }
        }
    }

    clone(newEngine) {
        return new TriggerComponent(newEngine, this.entityId, this.triggers);
    }
}