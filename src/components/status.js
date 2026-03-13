import { EVENT_TYPE } from "../data/constants";
import CombatState from "../simulator/combatstate";
import Engine from "../simulator/engine";
import { EndStatusEvent } from "../simulator/events";
import { Registry } from "../simulator/registry";
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
        this.activeSubscriptions = new Map();
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

    applyStatus(event, statusKey) {
        const data = event.data;
        const def = Registry.getStatusDefinition(data.namespace, data.statusName);
        if (!def) return;

        let duration = Infinity;
        if (def.duration) {
            duration = def.duration;
        } else if (def.durationArr) { // supports an array of durations too. in this case, define a status 'level' in optional data, 1-indexed.
            duration = def.durationArr[event.optionalData.level - 1];
        } else {
            // then assume the application event is the one that passes duration, in optionalData
            duration = event.optionalData.duration;
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

        if (def.triggers) {
            this.#registerStatusTriggers(this.engine.state, instanceId, def.triggers);
        }

        this.scheduleExpiration(instance, duration);
    }

    refreshStatus(instance, event) {
        const data = event.data;
        const def =  Registry.getStatusDefinition(instance.namespace, instance.statusName);
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

        const def = Registry.getStatusDefinition(instance.namespace, instance.statusName);

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

        const def = Registry.getStatusDefinition(instance.namespace, instance.statusName);
        if (def?.onRemove) {
            this.executeAndPush(def.onRemove, instance, event, def);
        }

        if (def?.triggers) {
            this.#unregisterStatusTriggers(this.engine.state, instance.instanceId, def.triggers);
        }
    }

    executeAndPush(func, instance, event, def) {
        const effects = func(this.engine.state, instance, event, def);
        if (effects) {
            for (const event of effects) {
                this.engine.pushEvent(event);
            }
        }
    }

    notify(state, event) {
        const subscribingInstances = this.activeSubscriptions.get(event.type);
        if (!subscribingInstances) return;

        for (const instanceId of subscribingInstances) {
            const instance = this.statusById.get(instanceId);
            if (!instance) continue;

            const def = Registry.getStatusDefinition(instance.namespace, instance.statusName);
            if (!def || !def.triggers || !def.triggers[event.type]) continue;

            const effects = def.triggers[event.type](state, instance, event, def);

            if (effects) {
                for (const event of effects) {
                    this.engine.pushEvent(event);
                }
            }
        }
    }

    /**
     * Private method to support subscribing statuses to triggers, and handling the component's overall subscription to the engine.
     * @param {CombatState} state 
     * @param {string} instanceId 
     * @param {*} triggers 
     */
    #registerStatusTriggers(state, instanceId, triggers) {
        for (const eventType of Object.keys(triggers)) {
            if (!this.activeSubscriptions.has(eventType)) {
                this.activeSubscriptions.set(eventType, new Set());
                this.engine.subscribe(state, eventType, this.entityId, 'StatusComponent');
            }
            this.activeSubscriptions.get(eventType).add(instanceId);
        }
    }

    /**
     * Private method to support unsubscribing statuses from triggers, and when there are no more subscribing status instances for a event type, handling the component's unsubscription from the engine.
     * @param {CombatState} state 
     * @param {string} instanceId 
     * @param {*} triggers 
     */
    #unregisterStatusTriggers(state, instanceId, triggers) {
        for (const eventType of Object.keys(triggers)) {
            const subscribingInstances = this.activeSubscriptions.get(eventType);
            if (subscribingInstances) {
                subscribingInstances.delete(instanceId);

                if (subscribingInstances.size === 0) {
                    this.activeSubscriptions.delete(eventType);
                    this.engine.unsubscribe(state, eventType, this.entityId, 'StatusComponent');
                }
            }
        }
    }

    clone(newEngine) {
        const copy = new StatusComponent(newEngine, this.entityId);
        copy.#statusCounter = this.#statusCounter;
        const instanceMapping = new Map();
        for (const [id, instance] of this.statusById) {
            const instanceClone = { ...instance };
            copy.statusById.set(id, instanceClone);
            instanceMapping.set(instance, instanceClone);
        }
        for (const [key, instance] of this.statusByKey) {
            copy.statusByKey.set(key, instanceMapping.get(instance));
        }
        for (const [time, instances] of this.pendingExpirations) {
            copy.pendingExpirations.set(time, new Set(instances));
        }
        for (const [eventType, instances] of this.activeSubscriptions) {
            copy.activeSubscriptions.set(eventType, new Set(instances));
        }
        return copy;
    }
}