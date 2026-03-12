import EventQueue from "./eventqueue.js";

export default class CombatState {
    constructor() {
        this.currentTime = 0;
        this.sp = 200;
        this.maxSP = 300;
        this.eventQueue = new EventQueue();

        /** @type {Map<string, Entity>} */
        this.entities = new Map();

        /** @type {Map<string, Set<string>>} */
        this.subscriptions = new Map();
    }

    getEntity(entityId) {
        return this.entities.get(entityId);
    }

    getEntitiesByTeam(teamType) {
        const result = [];
        for (const entity of this.entities.values()) {
            if (entity.team === teamType) result.push(entity);
        }
        return result;
    }

    getSP() {
        return this.sp;
    }

    modifySP(delta) {
        this.sp = Math.max(0, Math.min(this.maxSP, this.sp + delta));
    }

    handleStateUpdate(event) {
        if (event.data.property === 'SP') {
            this.modifySP(event.data.value);
            return;
        }

        const target = this.entities.get(event.targetId);
        if (target?.getComponent('Stats')) {
            target?.getComponent('Stats').handleEvent(this, event);
        }
    }

    clone(newEngine) {
        const copy = new CombatState();
        copy.currentTime = this.currentTime;
        copy.sp = this.sp;

        copy.eventQueue = this.eventQueue.clone();

        for (const [id, entity] of this.entities) {
            copy.entities.set(id, entity.clone(newEngine));
        }

        for (const [type, listeners] of this.subscriptions) {
            copy.subscriptions.set(type, new Set(listeners))
        }
        
        return copy;
    }
}