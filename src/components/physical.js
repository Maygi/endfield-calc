import { ELEMENT, EVENT_TYPE, PHYSICAL_STATUS } from "../data/constants";
import { PHYSICAL_REACTIONS } from "../data/physical";
import { ApplyStatusEvent, HitEvent } from "../simulator/events";
export default class PhysicalComponent {
    constructor(engine, entityId, stacks = 0) {
        this.engine = engine;
        this.entityId = entityId;
        this.stacks = stacks;
    }

    notify(state, event) {
        if (event.type === EVENT_TYPE.PHYSICAL_APPLICATION && event.targetId === this.entityId) {
            this.handleApplication(state, event);
        }
    }

    handleApplication(state, event) {
        const type = event.data.type; // is a PHYSICAL_STATUS
        const isForced = event.optionalData?.isForced || false;
        const currStacks = this.stacks;
        const dataDef = PHYSICAL_REACTIONS[type];

        if (!dataDef) return;

        // if there are currently no Vuln stacks
        if (currStacks === 0) {
            this.stacks = 1;

            // optionally consider applying Vuln as a status? might allow easier UI tracking

            if (!isForced) return;
        }

        // either Vuln stacks > 0, or application is forced
        let level = currStacks > 0 ? currStacks : 1; // treats the forced application case as an application case of level 1 debuff (can change if needed)

        if (currStacks > 0) {
            // update stack counts
            if (type === PHYSICAL_STATUS.LIFT || type === PHYSICAL_STATUS.KNOCK_DOWN) {
                this.stacks = Math.min(this.stacks + 1, 4);
            } else if (type === PHYSICAL_STATUS.BREACH || type === PHYSICAL_STATUS.CRUSH) {
                this.stacks = 0;
            }

            // resolve reaction damage
            const mv = Array.isArray(dataDef.mv) ? dataDef.mv[level - 1] : dataDef.mv;
            this.engine.pushEvent(new HitEvent(
                event.time, event.priority, event.sourceId, this.entityId, type, mv, ELEMENT.PHYSICAL, dataDef.stagger || 0
            ));
        }

        // apply resulting status
        this.engine.pushEvent(new ApplyStatusEvent(
            event.time, event.priority, event.sourceId, this.entityId, 'PHYSICAL', dataDef.statusName, { level }
        ))
    }

    clone() {
        return new PhysicalComponent(this.engine, this.entityId, this.stacks);
    }
}