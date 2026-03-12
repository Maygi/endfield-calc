import { EVENT_TYPE } from "../data/constants";
import CombatState from "../simulator/combatstate";
import Engine from "../simulator/engine";
import { EndStatusEvent } from "../simulator/events";
export class StatusComponent {
    // for ID assignment
    #statusCounter = 0;

    /**
     * @param {Engine} engine 
     * @param {string} entityId
     */
    constructor(engine, entityId) {
        this.engine = engine;
        this.entityId = entityId;

        this.statusByKey = new Map();
        this.statusById = new Map();
        this.pendingExpirations = new Map();
    }

    // event handler
    handleEvent(state, event) {
        if (event.targetId === this.entityId) {
            switch (event.type) {
                case EVENT_TYPE.STATUS_APPLICATION:
                    const statusKey = `${event.data.namespace}_${event.data.statusName}`;
                    if (this.statusByKey.has(statusKey)) {
                        this.refreshStatus(this.statusByKey.get(statusKey), event);
                    } else {
                        this.applyStatus(event, statusKey);
                    }
                    break;
                case EVENT_TYPE.STATUS_TICK:
                    this.tickStatus(event);
                    break;
                case EVENT_TYPE.STATUS_EXPIRATION:
                    this.removeStatus(event);
                    break;
            }
        }
    }

    // trigger listener
    notify(event) {

    }

    applyStatus(event, statusKey) {
        const data = event.data;
        const def = this.engine.registry.getStatusDefinition(data.namespace, data.statusName);
        if (!def) return;

        let duration = Infinity;
        if (def.duration) {
            duration = def.duration;
        } else if (def.durationArr) { // supports an array of durations too. in this case, define a status 'level' in optional data, 1-indexed.
            duration = def.durationArr[event.optionalData.level - 1];
        }

        const instanceId = `${this.entityId}_status_${this.#statusCounter++}`;

        const instance = {
            instanceId,
            statusKey,
            statusName: data.statusName,
            namespace: data.namespace,
            sourceId: event.sourceId,
            targetId: event.targetId,
            startTime: event.time,
            endTime: event.time + duration,
            data: {
                level: event.optionalData?.level || 1
            }
        }

        this.statusByKey.set(statusKey, instance);
        this.statusById.set(instanceId, instance);

        if (def.onApply) {
            this.executeAndPush(def.onApply, instance, event, def);
        }

        this.scheduleExpiration(instance, duration);
    }

    refreshStatus(instance, event) {
        const data = event.data;
        const def = this.engine.registry.getStatusDefinition(instance.namespace, instance.statusName);
        if (!def) return;

        if (event.optionalData?.level) {
            instance.data.level = event.optionalData.level;
        }

        let duration = Infinity;
        if (def.duration) {
            duration = def.duration;
        } else if (def.durationArr) {
            duration = def.durationArr[event.optionalData.level - 1];
        }

        instance.endTime = event.time + duration;

        if (def.onRefresh) {
            this.executeAndPush(def.onRefresh, instance, event, def);
        }

        this.scheduleExpiration(instance, duration);
    }

    scheduleExpiration(instance, duration) {
        // check and invalidate any existing expirations
        const existingExpiration = this.pendingExpirations.get(instance.instanceId);
        if (existingExpiration) {
            existingExpiration.data.isValid = false;
        }

        // infinite duration status dont need to schedule anything
        if (duration === Infinity) return;

        const expirationEvent = new EndStatusEvent(
            instance.endTime, 0, instance.sourceId, instance.targetId, instance.instanceId, true
        );

        this.pendingExpirations.set(instanceId, expirationEvent);

        this.engine.pushEvent(expirationEvent);
    }

     tickStatus(event) {
        const instance = this.statusById.get(event.data.statusId);
        if (!instance) return;

        const def = this.engine.registry.getStatusDefinition(instance.namespace, instance.statusName);

        if (def?.onTick) {
            this.executeAndPush(def.onTick, instance, event, def);
        }
     }

     removeStatus(event) {
        const instance = this.statusById.get(event.data.statusId);
        if (!instance) return;

        const pendingExpiration = this.pendingExpirations.get(instance.instanceId);
        if (pendingExpiration) {
            pendingExpiration.isValid = false;
        }

        this.pendingExpirations.delete(instanceId);
        this.statusByKey.delete(instance.statusKey);
        this.statusById.delete(instance.instanceId);

        const def = this.engine.registry.getStatusDefinition(instance.namespace, instance.statusName);
        if (def?.onRemove) {
            this.executeAndPush(def.onRemove, instance, event, def);
        }
     }

    
}