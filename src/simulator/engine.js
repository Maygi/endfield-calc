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
     * Adds a event to the state's queue. Used by components to inject new events.
     * @param {SimEvent} event 
     */
    pushEvent(event) {
        // UI hooks go here

        if (event.time < this.state.currentTime) {
            console.error(`Cannot push event into the past!`);
        }

        this.state.eventQueue.push(event);
    }

    /**
     * Runs the simulation beginning at a particular combat state, up till a specified endTime.
     * @param {CombatState} state
     * @param {*} endTime Cannot be less than the currentTime of the state.
     */
    simulateTo(state, endTime) {
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
    advanceTime(state, time) {
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
    processEvent(state, event) {
        const source = this.state.entities.get(event.sourceId);
        const target = this.state.entities.get(event.targetId);

        switch (event.type) {
            case EVENT_TYPE.HIT:
                if (source && target) Calculator.calculateHit(source, target, event.data);
                break;
            
            case EVENT_TYPE.ARTS_INFLICTION:
                target?.getComponent('Infliction')?.applyElement(event.data.element, state, event);
                break;

            case EVENT_TYPE.PHYSICAL_APPLICATION:
                target?.getComponent('Physical')?.handleApplication(state, event);
                break;

            case EVENT_TYPE.STATUS_APPLICATION:
            case EVENT_TYPE.STATUS_EXPIRATION:
            case EVENT_TYPE.STATUS_TICK:
                target?.getComponent('Status')?.handleEvent(state, event);
                break;

            case EVENT_TYPE.SKILL_EVENT:
                target?.getComponent('Ability')?.handleEvent(state, event);
                break;

            case EVENT_TYPE.STATE_UPDATE:
                this.state.handleStateUpdate(event);
                break;
        }

        this.broadcast(state, event);
    }

    broadcast(state, event) {
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

    subscribe(state, eventType, entityId, componentType) {
        if (!state.subscriptions.has(eventType)) {
            state.subscriptions.set(eventType, new Set());
        }
        const address = `${entityId}:${componentType}`;
        state.subscriptions.get(eventType).add(address);
    }

    unsubscribe(state, eventType, entityId, componentType) {
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
}