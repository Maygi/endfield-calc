import { EVENT_TYPE, MODIFIER_TYPE, STAT, STATUS_TYPE } from "./constants";

export const PHYSICAL_REACTIONS = {
    KNOCK_DOWN: {
        mv: 1.2,
        stagger: 10,
        statusName: 'KNOCKED_DOWN'
    },
    LIFT: {
        mv: 1.2,
        stagger: 10,
        statusName: 'LIFTED'
    },
    BREACH: {
        mv: [1.0, 1.5, 2.0, 2.5],
        stagger: 0,
        statusName: 'BREACHED'
    },
    CRUSH: {
        mv: [3.0, 4.5, 6.0, 7.5],
        stagger: 0,
        statusName: 'CRUSHED'
    }
};

export const PHYSICAL_STATUSES = {
    VULNERABLE: {
        name: 'VULNERABLE',
        duration: Infinity,
        tags: new Set([STATUS_TYPE.INDEFINITE])
    },
    KNOCKED_DOWN: {
        name: 'KNOCKED_DOWN',
        duration: 1,
        tags: new Set([STATUS_TYPE.TIMED])
    },
    LIFTED: {
        name: 'LIFTED',
        duration: 1,
        tags: new Set([STATUS_TYPE.TIMED])
    },
    CRUSHED: {
        name: 'CRUSHED',
        duration: 0, // nothing currently visually applies a 'Crushed' debuff, but this seems like the logical extension to me
        tags: new Set([STATUS_TYPE.TIMED])
    },
    BREACHED: {
        name: 'BREACHED',
        durationArr: [12, 18, 24, 30],
        statModified: STAT.DMG_TAKEN,
        values: [0.12, 0.16, 0.2, 0.24],

        onApply: (state, instance, event, def) => {
            const level = instance.data.level - 1;
            return [{
                type: EVENT_TYPE.STATE_UPDATE,
                time: event.time,
                sourceId: event.sourceId,
                targetId: event.targetId,
                data: {
                    property: def.statModified,
                    value: def.values[level],
                    modifierType: MODIFIER_TYPE.FLAT,
                    modifierId: instance.instanceId,
                    isRemoval: false
                }
            }];
        },

        onRefresh: (state, instance, event, def) => {
            const oldLevel = instance.data.level - 1;
            const newLevel = event.optionalData.level - 1;

            instance.data.level = event.optionalData.level;

            return [
                {
                    type: EVENT_TYPE.STATE_UPDATE,
                    time: event.time,
                    sourceId: event.sourceId,
                    targetId: event.targetId,
                    data: {
                        property: def.statModified,
                        value: def.values[oldLevel],
                        modifierType: MODIFIER_TYPE.FLAT,
                        modifierId: instance.instanceId,
                        isRemoval: true
                    }
                },
                {
                    type: EVENT_TYPE.STATE_UPDATE,
                    time: event.time,
                    sourceId: event.sourceId,
                    targetId: event.targetId,
                    data: {
                        property: def.statModified,
                        value: def.values[newLevel],
                        modifierType: MODIFIER_TYPE.FLAT,
                        modifierId: instance.instanceId,
                        isRemoval: false
                    }
                }
            ];
        },

        onRemove: (state, instance, event, def) => {
            const level = instance.data.level - 1;
            return [{
                type: EVENT_TYPE.STATE_UPDATE,
                time: event.time,
                sourceId: event.sourceId,
                targetId: event.targetId,
                data: {
                    property: def.statModified,
                    value: def.values[level],
                    modifierType: MODIFIER_TYPE.FLAT,
                    modifierId: instance.instanceId,
                    isRemoval: true
                }
            }]
        },

        tags: new Set([STATUS_TYPE.STAT_MODIFIER, STATUS_TYPE.TIMED])
    }
};