import { ApplyStatusEvent, EndStatusEvent, HitEvent, PhysicalEvent, StateUpdateEvent } from "../../simulator/events";
import { ABILITY_TYPE, ELEMENT, EVENT_TYPE, MODIFIER_TYPE, PHYSICAL_STATUS, STAT, STATUS_TYPE, TEAM } from "../constants";

// mv scaler helper
const standardScaler = (base, level) => {
    const multiplier = level > 9 ? 0.8 : (level - 1) * 0.1;
    if (level > 9) multiplier += 0.125;
    if (level > 10) multiplier += 0.15;
    if (level > 11) multiplier += 0.175;
    return base * (1 + multiplier);
}

export const Endministrator = {
    name: 'Endministrator',
    element: ELEMENT.PHYSICAL,

    // placeholder values
    baseStats: {
        [STAT.HP]: 1000,
        [STAT.ATK]: 100,
        // ... etc.
    },

    // skill definitions
    skills: {
        [ABILITY_TYPE.BASIC]: {
            name: 'Destructive Sequence',
            gcd: 0,
            cooldown: (level) => 0, // batk no cooldowns
            spCost: (level) => 0, // batk no sp cost
            // multi-hit example for illustration
            execute: (time, level, config, sourceId, targetId) => {
                return [
                    // a bunch of hitevents. numbers are all placeholders.
                    new HitEvent(time + 0.2, 0, sourceId, targetId, ABILITY_TYPE.BASIC, standardScaler(1, level), ELEMENT.PHYSICAL, 0),
                    new HitEvent(time + 0.3, 0, sourceId, targetId, ABILITY_TYPE.BASIC, standardScaler(0.6, level), ELEMENT.PHYSICAL, 0),
                    new HitEvent(time + 0.45, 0, sourceId, targetId, ABILITY_TYPE.BASIC, standardScaler(0.5, level), ELEMENT.PHYSICAL, 0),
                    new HitEvent(time + 0.8, 0, sourceId, targetId, ABILITY_TYPE.BASIC, standardScaler(1.2, level), ELEMENT.PHYSICAL, 0),
                    new HitEvent(time + 1.5, 0, sourceId, targetId, ABILITY_TYPE.FINAL, standardScaler(1.5, level), ELEMENT.PHYSICAL, 5) // final strike
                ];
            }
        },
        [ABILITY_TYPE.BATTLE_SKILL]: {
            name: 'Constructive Sequence',
            gcd: 0,
            spCost: 100,
            execute: (time, level, config, sourceId, targetId) => {
                return [
                    // subtracts SP, applies a hit and a Crush. again, assume numbers are placeholders
                    new StateUpdateEvent(time, 0, sourceId, null, 'SP', -100, MODIFIER_TYPE.FLAT, null, false), // hmm. havent really thought about this one.
                    new HitEvent(time + 0.5, 0, sourceId, targetId, ABILITY_TYPE.BATTLE_SKILL, standardScaler(1, level), ELEMENT.PHYSICAL, 0),
                    new PhysicalEvent(time + 0.5, 1, sourceId, targetId, PHYSICAL_STATUS.CRUSH)
                ];
            }
        },
        [ABILITY_TYPE.COMBO_SKILL]: {
            name: 'Sealing Sequence',
            gcd: 0,
            cooldown: 16,
            // just as example, for things that don't scale linearly
            levels: {
                1: { sealDuration: 4 },
                10: { sealDuration: 4.5 }
            },
            // this is a helper to fallback to threshold values like sealDuration above
            getValue: (level, key) => {
                const keys = Object.keys(Endministrator.skills[ABILITY_TYPE.COMBO_SKILL].levels).map(Number).sort((a, b) => b - a);
                const match = keys.find(k => k <= level) || 1;
                return Endministrator.skills[ABILITY_TYPE.COMBO_SKILL].levels[match][key];
            },
            execute: (time, level, config, sourceId, targetId) => {
                const sealDuration = Endministrator.skills[ABILITY_TYPE.COMBO_SKILL].getValue(level, 'sealDuration');
                return [
                    // a hit and a seal
                    new HitEvent(time + 0.2, 0, sourceId, targetId, ABILITY_TYPE.COMBO_SKILL, standardScaler(0.45, level), ELEMENT.PHYSICAL, 0),
                    new ApplyStatusEvent(time + 0.2, 1, sourceId, targetId, 'ENDMINISTRATOR', 'ORIGINIUM_CRYSTAL', { duration: sealDuration }) // note we can pass the duration here or the level and calc the duration on application instead
                ]
            }
        },
        [ABILITY_TYPE.ULTIMATE]: {
            name: 'Bombardment Sequence',
            gcd: 0,
            cooldown: 20,
            execute: (time, level, config, sourceId, targetId) => {
                return [
                    // this just deals a hit. the consumption of crystal check is done by the crystal status itself.
                    new HitEvent(time + 0.5, 0, sourceId, targetId, ABILITY_TYPE.ULTIMATE, standardScaler(3.56, level), ELEMENT.PHYSICAL, 0)
                ];
            }
        }
    },

    statuses: {
        'ORIGINIUM_CRYSTAL': {
            name: 'Originium Crystal',
            // duration passed via event, omit
            tags: new Set([STATUS_TYPE.TIMED, STATUS_TYPE.TRIGGER]),
            onApply: (state, instance, event, def) => {
                // the idea here is that each entity would store the level of their talents in a config field
                const config = state.entities.get(instance.sourceId).config;
                // talent 2: realspace stasis - crystals increase phys dmg taken
                if (config.talents.realspaceStasis > 0) {
                    const value = config.talents.realspaceStasis === 1 ? 0.1 : 0.2;
                    return [new StateUpdateEvent(event.time, 0, instance.sourceId, instance.targetId, STAT.DMG_TAKEN, value, MODIFIER_TYPE.FLAT, instance.instanceId, false)];
                }
                return [];
            },
            onRemove: (state, instance, event, def) => {
                const config = state.entities.get(instance.sourceId).config;
                if (config.talents.realspaceStasis > 0) {
                    const value = config.talents.realspaceStasis === 1 ? 0.1 : 0.2;
                    return [new StateUpdateEvent(event.time, 0, instance.sourceId, instance.targetId, STAT.DMG_TAKEN, value, MODIFIER_TYPE.FLAT, instance.instanceId, true)];
                }
                return [];
            },
            triggers: {
                [EVENT_TYPE.PHYSICAL_APPLICATION]: (state, instance, event, def) => def._consumeCrystal(state, instance, event, false),
                [EVENT_TYPE.HIT]: (state, instance, event, def) => {
                    if (event.sourceId === instance.sourceId && event.data.hitType === ABILITY_TYPE.ULTIMATE) {
                        return def._consumeCrystal(state, instance, event, true);
                    }
                    return [];
                }
            },
            _consumeCrystal: (state, instance, event, isUltimate) => {
                const sourceConfig = state.entities.get(instance.sourceId).config;
                const eventsToPush = [];

                // need to consume the crystal no matter what, so
                eventsToPush.push(new EndStatusEvent(event.time, 0, instance.sourceId, instance.targetId, instance.instanceId, true));

                // deal the extra hit of damage
                const mv = isUltimate ? 2.67 : 1.78;
                const level = isUltimate ? sourceConfig.levels[ABILITY_TYPE.ULTIMATE] : sourceConfig.levels[ABILITY_TYPE.COMBO_SKILL];
                eventsToPush.push(new HitEvent(event.time, 1, instance.sourceId, instance.targetId, 'ORIGINIUM_CRYSTAL_SHATTER', standardScaler(mv, level), ELEMENT.PHYSICAL, 0));

                // check for talent 1 to apply buff
                if (sourceConfig.talents.essenceDisintegration > 0) {
                    const buffValue = sourceConfig.talents.essenceDisintegration === 1 ? 0.15 : 0.3;
                    eventsToPush.push(new ApplyStatusEvent(event.time, 2, instance.sourceId, instance.targetId, 'ENDMINISTRATOR', 'ESSENCE_DISINTEGRATION_BUFF', {value: buffValue}));

                    if (sourceConfig.potentials >= 2) {
                        // kind of pseudocode-y but idea is there
                        for (teammate of state.entities.get(TEAM.PLAYER)) {
                            eventsToPush.push(new ApplyStatusEvent(event.time, 2, instance.sourceId, teammate.id, 'ENDMINISTRATOR', 'ESSENCE_DISINTEGRATION_BUFF', {value: buffValue / 2}));
                        }
                    }
                }

                // check for potentials
                if (sourceConfig.potentials >= 1 && event.data.type === PHYSICAL_STATUS.CRUSH) {
                     eventsToPush.push(new StateUpdateEvent(event.time, 3, instance.sourceId, instance.sourceId, STAT.SP, 50, MODIFIER_TYPE.FLAT, null, false));
                }

                return eventsToPush;
            }
        },
        'ESSENCE_DISINTEGRATION_BUFF': {
            name: 'Essence Disintegration',
            duration: 15,
            tags: new Set([STATUS_TYPE.TIMED, STATUS_TYPE.STAT_MODIFIER]),
            onApply: (state, instance, event, def) => [new StateUpdateEvent(event.time, 0, instance.sourceId, instance.targetId, STAT.ATK, event.optionalData.value, MODIFIER_TYPE.PERCENTAGE, instance.instanceId, false)],
            onRemove: (state, instance, event, def) => [new StateUpdateEvent(event.time, 0, instance.sourceId, instance.targetId, STAT.ATK, event.optionalData.value, MODIFIER_TYPE.PERCENTAGE, instance.instanceId, true)],
        }
    }
}