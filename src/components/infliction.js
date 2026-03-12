import { BURST, REACTIONS } from "../data/arts.js";
import { ELEMENT, EVENT_TYPE } from "../data/constants.js";
import CombatState from "../simulator/combatstate";
import { ApplyStatusEvent, HitEvent } from "../simulator/events.js";

export default class InflictionComponent {
    constructor(engine, entityId, element = null, stacks = 0) {
        this.engine = engine;
        this.entityId = entityId;
        this.currentElement = element;
        this.stacks = stacks;
    }

    applyElement(element, state, event) {
        // if target has no current element
        if (!this.currentElement) {
            this.currentElement = element;
            this.stacks = 1;
            return;
        }

        // arts burst
        if (this.currentElement === element) {
            this.triggerBurst(state, event, element, this.stacks);
            this.stacks = Math.min(this.stacks + 1, 4);
        } else {
            // arts reaction
            this.triggerReaction(state, event, element, this.stacks);
            this.clearAll();
        }
    }

    /**
     * Clears all inflictions.
     */
    clearAll() {
        this.currentElement = null;
        this.stacks = 0;
    }

    /**
     * Generates the HitEvent from Burst triggers.
     */
    triggerBurst(state, event, element, stacks) {
        const burstEvent = new HitEvent(
            event.timeStamp,
            event.priority,
            event.sourceId,
            this.entityId,
            BURST.type,
            BURST.mv,
            element,
            BURST.stagger
        );

        this.engine.pushEvent(burstEvent);
    }

    /**
     * Generates the initial HitEvent and applies the corresponding debuff
     */
    triggerReaction(state, event, element, stacks) {
        const reaction = REACTIONS.debuff[element];
        if (!reaction) {
            console.warn(`Missing reaction definition for element: ${element}`);
            return;
        }

        const level = stacks - 1;
        const initialMV = REACTIONS.initialDmg.mv[level];

        const initialDamage = new HitEvent(
            event.time,
            event.priority,
            event.sourceId,
            this.entityId,
            reaction.name,
            initialMV,
            element,
            REACTIONS.initialDmg.stagger
        );
        this.engine.pushEvent(initialDamage);

        const applyDebuff = new ApplyStatusEvent(
            event.time,
            event.priority,
            event.sourceId,
            this.entityId,
            'ARTS',
            reaction.name,
            { level }
        );
        this.engine.pushEvent(applyDebuff);
    }

    clone(newEngine) {
        return new InflictionComponent(newEngine, this.entityId, this.currentElement, this.stacks);
    }
}