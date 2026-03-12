import EventQueue from "./eventqueue.js";

export default class CombatState {
    constructor() {
        this.currentTime = 0;
        this.sp = 200;
        this.eventQueue = new EventQueue();

        /** @type {Map<string, Entity>} */
        this.entities = new Map();

        /** @type {Map<string, Set<string>>} */
        this.subscriptions = new Map();
    }

    clone() {
        const copy = new CombatState();
        copy.currentTime = this.currentTime;
        copy.eventQueue = this.eventQueue.clone();
        for (const [id, entity] of this.entities) {
            copy.entities.set(id, entity.clone());
        }
        for (const [type, listeners] of this.subscriptions) {
            copy.subscriptions.set(type, new Set(listeners))
        }
        return copy;
    }
}