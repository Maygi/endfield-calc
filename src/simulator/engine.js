import { Calculator } from "./calculation";
import CombatState from "./combatstate";
import { Registry } from "./registry";

export default class Engine {
    constructor(state) {
        this.state = state;
        this.registry = new Registry();
    }

    /**
     * Runs the simulation beginning at a particular combat state, up till a specified endTime.
     * @param {CombatState} state
     * @param {*} endTime Cannot be less than the currentTime of the state.
     */
    static simulateTo(state, endTime) {
        while(!state.eventQueue.isEmpty() && state.eventQueue.peek().time <= endTime) {
            const event = state.eventQueue.pop();
            const delta = event.time - state.currentTime;

            if (delta > 0) this.advanceTime(state, delta);
            this.processEvent(state, event);
        }
        this.advanceTime(state, endTime - state.currentTime);
    }

    /**
     * For interstitial periods between events. Since no event has affected the state since, this just updates durations, cooldowns, time-regenerated stuff and any DoTs.
     * @param {CombatState} state 
     * @param {*} time 
     */
    static advanceTime(state, time) {
        if (time <= 0) return;
        state.entities.forEach(entity => {
            entity.components.forEach(component => {
                if (component.update) component.update(state, time);
            });
        });
        state.currentTime += time;
    }

    /**
     * Simulates the given event occurring at the given state.
     * @param {CombatState} state 
     * @param {*} event 
     */
    static processEvent(state, event) {

        // TODO: read the event type and dispatch to relevant handlers. hit events, buff application, expiry, etc.

        // For example, to resolve a hit event we might do something like this
        const source = state.entities.get(event.sourceId);
        const target = state.entities.get(event.targetId);

        const receipt = Calculator.calculateHit(source, target, event.data);
        // etc, broadcasting relevant informaton, logging, all that
    }

    getStat(entityId, stat) {
        const statComponent = this.state.getComponent(entityId, 'StatComponent');
        return statComponent?.getStat(stat);
    }

    /**
     * Adds a event to the queue. Used by components to inject new events.
     * @param {SimEvent} event 
     */
    pushEvent(event) {
        this.eventQueue.push(event);
    }
}