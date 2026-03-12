import { EVENT_TYPE, MODIFIER_TYPE, RESOURCE, STAT } from "../data/constants";
import { ApplyStatusEvent } from "../simulator/events";

/**
 * Manages resources pertaining to the entity it is attached to. For playable characters, things like HP and Ult Energy. For enemies, things like Stagger.
 */
export class ResourceComponent {
    constructor(engine, entityId, initial) {
        this.engine = engine;
        this.entityId = entityId;

        this.resources = { ...initial };

        this.isDead = false;
        this.isStaggered = false;
    }

    handleEvent(state, event) {
        if (event.type === EVENT_TYPE.STATE_UPDATE && event.targetId === this.entityId) {
            if (event.data.modifierType === MODIFIER_TYPE.DELTA && this.resources[event.data.property] !== undefined) {
                this.modifyResource(event);
            }
        }
    }

    modifyResource(event) {
        const { stat, delta, modifierType, modifierId, isRemoval } = event;

        if (this.isDead && event.data.property === STAT.HP && delta < 0) return;

        let currentValue = this.resources[stat];
        let newValue = currentValue + delta;

        let maxLimit = Infinity;
        switch (stat) {
            case RESOURCE.HP:
                maxLimit = this.engine.getStat(this.entityId, STAT.HP);
                break;
            case RESOURCE.ULT_ENERGY:
                maxLimit = this.engine.getStat(this.entityId, STAT.ULT_ENERGY);
                break;
            case RESOURCE.STAGGER:
                maxLimit = this.engine.getStat(this.entityId, STAT.STAGGER);
                break;
        }

        // clamp
        newValue = Math.max(0, Math.min(maxLimit, newValue));

        this.checkThresholds(stat, newValue, maxLimit, event);
    }

    checkThresholds(stat, value, max, event) {
        // death
        if (property === RESOURCE.HP && value <= 0 && !this.isDead) {
            this.isDead = true;
            return;
        }

        // stagger break
        if (property === RESOURCE.STAGGER) {
            if (value >= max && !this.isStaggered) {
                this.isStaggered = true;

                this.engine.pushEvent(
                    new ApplyStatusEvent(event.time, 0, event.sourceId, this.entityId, 'STAGGER', 'SYSTEM')
                );
            }
        }
    }

    getResource(resource) {
        return this.resources[resource];
    }

    clone() {
        
    }
}