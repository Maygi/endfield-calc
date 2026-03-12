import { EVENT_TYPE } from "../data/constants";
import { Calculator } from "./calculation";
import CombatState from "./combatstate";
import { Registry } from "./registry";

export default class Engine {
    constructor(state) {
        this.state = state;
        this.registry = new Registry();
        this.subscriptions = new Map();
    }

    /**
     * Runs the simulation beginning at a particular combat state, up till a specified endTime.
     * @param {CombatState} state
     * @param {*} endTime Cannot be less than the currentTime of the state.
     */
    static simulateTo(state, endTime) {
        while (!state.eventQueue.isEmpty() && state.eventQueue.peek().time <= endTime) {
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

        switch (event.type) {
            case EVENT_TYPE.HIT:
                const source = state.entities.get(event.sourceId);
                const target = state.entities.get(event.targetId);
                if (source && target) {
                    Calculator.calculateHit(source, target, event.data);
                }
                break;
        }

        this.broadcast(state, event);
    }

    static broadcast(state, event) {
        const subscribers = state.subscriptions.get(event.type);
        if (!subscribers) return;

        for (const address of subscribers) {
            const [entityId, componentType] = address.split(':');
            const entity = state.entities.get(entityId);
            const component = entity?.components.get(componentType);

            if (component?.notify) {
                component.notify(state, event);
            }
        }
    }

    static subscribe(state, eventType, entityId, componentType) {
        if (!state.subscriptions.has(eventType)) {
            state.subscriptions.set(eventType, new Set());
        }
        const address = `${entityId}:${componentType}`;
        state.subscriptions.get(eventType).add(address);
    }

    static unsubscribe(state, eventType, entityId, componentType) {
        const subscribers = state.subscriptions.get(eventType);
        if (subscribers) {
            subscribers.delete(`${entityId}:${componentType}`);
        }
    }

    getStat(entityId, stat) {
        const entity = this.state.entities.get(entityId);
        const statComponent = entity?.components.get('Stats');
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