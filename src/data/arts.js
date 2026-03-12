import { ELEMENT, EVENT_TYPE, MODIFIER_TYPE, STAT, STATUS_TYPE } from "./constants.js";

/**
 * Reference data for Arts reactions and Bursts. Used by the InflictionComponent to produce relevant events.
 */
export const REACTIONS = {
    initialDmg: {
        mv: [1.6, 2.4, 3.2, 4],
        stagger: 0
    },
    debuff: {
        [ELEMENT.HEAT]: {
            name: 'COMBUSTION',
            duration: 10,
            tickInterval: 1,
            tickMVs: [0.24, 0.36, 0.48, 0.6],

            // its a dot, so schedule a status tick
            // as long as the status has the tag TIMED, no need to schedule the expiry event. status component will do that check.
            onApply: (state, instance, event, def) => {
                return [
                    {
                        type: EVENT_TYPE.STATUS_TICK,
                        time: event.time + def.tickInterval,
                        sourceId: event.sourceId,
                        targetId: event.targetId,
                        data: { statusId: instance.statusId }
                    }
                ]
            },

            // if a status is able to be refreshed at all, this must be present.
            // statuscomponent will handle the duration extension, include a body here only if there are effects other than that.
            onRefresh: (state, instance, event, def) => { return []; },

            // in order to reach this call in the first place, this status is active in the status component.
            // so, we do not have to validate that this status has not yet expired
            onTick: (state, instance, event, def) => {
                const level = instance.data.stacks - 1;
                const finalMV = def.tickMVs[level];

                return [
                    {
                        type: EVENT_TYPE.HIT,
                        time: event.time,
                        sourceId: event.sourceId,
                        targetId: event.targetId,
                        data: {
                            hitType: 'COMBUSTION',
                            mv: finalMV,
                            element: ELEMENT.HEAT,
                            stagger: 0
                        }
                    },
                    {
                        type: EVENT_TYPE.STATUS_TICK,
                        time: event.time + def.tickInterval,
                        sourceId: event.sourceId,
                        targetId: event.targetId,
                        data: { statusId: instance.statusId }
                    }
                ];
            },

            tags: new Set([STATUS_TYPE.TICKING, STATUS_TYPE.TIMED])
        },
        [ELEMENT.ELECTRIC]: {
            name: 'ELECTRIFICATION',
            duration: [12, 18, 24, 30],
            statModified: STAT.FRAGILITY,
            values: [0.12, 0.16, 0.2, 0.24],

            onApply: (state, instance, event, def) => {
                const level = instance.data.stacks - 1;
                return [
                    {
                        type: EVENT_TYPE.STATE_UPDATE,
                        time: event.time,
                        sourceId: event.sourceId,
                        targetId: event.targetId,
                        data: {
                            property: def.statModified,
                            value: def.values[level],
                            modifierType: MODIFIER_TYPE.FLAT,
                            modifierId: instance.statusId,
                            isRemoval: false
                        }
                    }
                ]
            },

            // update the effect level to match the new one? check if this is how the mechanic actually works lol idk :P but for illustration purposes:
            onRefresh: (state, instance, event, def) => {
                instance.data.stacks = event.optionalData.stacks;

                return [
                    // remove the old debuff
                    def.onExpire(state, instance, event, def)[0],
                    // apply the new one
                    def.onApply(state, instance, event, def)[0]
                ]
            },

            onExpire: (state, instance, event, def) => {
                // need to remove that stat change
                return [
                    {
                        type: EVENT_TYPE.STATE_UPDATE,
                        time: event.time,
                        sourceId: event.sourceId,
                        targetId: event.targetId,
                        data: {
                            property: def.statModified,
                            value: def.values[level],
                            modifierType: MODIFIER_TYPE.FLAT,
                            modifierId: instance.statusId,
                            isRemoval: true
                        }
                    }
                ]
            },

            tags: new Set([STATUS_TYPE.STAT_MODIFIER, STATUS_TYPE.TIMED])
        },
        [ELEMENT.CRYO]: {
            name: 'SOLIDIFICATION',
            duration: [6, 7, 8, 9],
            mvs: [2.4, 3.6, 4.8, 6],

            // solidification by itself doesnt do anything (not gonna think about the whole 'enemy cannot move' part of it atm, probably just set some flag in statecomponent? todo i guess)

            // trigger for shatter
            triggers: {
                [EVENT_TYPE.PHYSICAL_APPLICATION]: (state, instance, event, def) => {
                    const level = instance.data.stacks - 1;
                    const finalMv = def.mvs[level];

                    // trigger condition is application of Vulnerable or any Physical Status. so, all and only all PhysicalApplication events will trigger this.
                    return [
                        {
                            type: EVENT_TYPE.STATUS_EXPIRATION,
                            time: event.time,
                            sourceId: instance.sourceId,
                            targetId: instance.targetId,
                            statusId: instance.statusId,
                            metadata: { reason: 'SHATTER_PROC' }
                        },
                        {
                            type: EVENT_TYPE.HIT,
                            time: event.time,
                            sourceId: event.sourceId,
                            targetId: instance.targetId, // should be the same as event.targetId
                            data: {
                                hitType: 'SHATTER',
                                mv: finalMv,
                                element: ELEMENT.PHYSICAL,
                                stagger: 0
                            }
                        }
                    ];
                }
            },
            tags: new Set([STATUS_TYPE.TRIGGER, STATUS_TYPE.TIMED])
        },
        [ELEMENT.NATURE]: {
            name: 'CORROSION',
            duration: 15,
            initial: [-3.6, -4.8, -6, -7.2],
            scale: [-0.84, -1.12, -1.4, -1.68],
            cap: [-12, -16, -20, -24],

            onApply: (state, instance, event, def) => {
                const level = instance.data.stacks - 1;
                const initialShred = def.initial[level];

                instance.data.currentShred = initialShred;

                // status change to apply the res shred
                return [
                    {
                        type: EVENT_TYPE.STATE_UPDATE,
                        time: event.time,
                        sourceId: event.sourceId,
                        targetId: event.targetId,
                        data: {
                            property: STAT.RESISTANCE,
                            value: initialShred,
                            modifierType: MODIFIER_TYPE.FLAT,
                            modifierId: instance.statusId,
                            isRemoval: false
                        }
                    }
                ];
            },

            onExpire: (state, instance, event, def) => {
                return [
                    {
                        type: EVENT_TYPE.STATE_UPDATE,
                        time: event.time,
                        sourceId: event.sourceId,
                        targetId: event.targetId,
                        data: {
                            property: STAT.RESISTANCE,
                            value: initialShred,
                            modifierType: MODIFIER_TYPE.FLAT,
                            modifierId: instance.statusId,
                            isRemoval: true
                        }
                    }
                ]
            },

            // corrosion only extends duration, does not override previous level.
            onRefresh: (state, instance, event, def) => { return []; },

            // check to see if the stat needs to update
            triggers: {
                [EVENT_TYPE.HIT]: (state, instance, event, def) => {
                    if (instance.data.isCapped) {return;}

                    const level = instance.data.stacks - 1;
                    const elapsedTime = state.time - instance.startTime;
                    const currShred = Math.min(def.cap[level], def.initial[level] + elapsedTime * def.scale[level]);

                    if (elapsedTime >= 10) {
                        instance.data.isCapped = true;
                    }

                    instance.data.lastUpdate = currShred;

                    return [
                        def.onExpire(state, instance, event, def),
                        
                        {
                            type: EVENT_TYPE.STATE_UPDATE,
                            time: event.time,
                            sourceId: event.sourceId,
                            targetId: event.targetId,
                            data: {
                                property: STAT.RESISTANCE,
                                value: initialShred,
                                modifierType: MODIFIER_TYPE.FLAT,
                                modifierId: instance.statusId,
                                isRemoval: false
                            }
                        }
                    ]
                }
            }
        }
    }
}

export const BURST = {
    type: 'ARTS_BURST',
    mv: 1.6,
    stagger: 0
}