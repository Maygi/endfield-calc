export const ELEMENT = Object.freeze({
    PHYSICAL: 'PHYSICAL',
    HEAT: 'HEAT',
    ELECTRIC: 'ELECTRIC',
    CRYO: 'CRYO',
    NATURE: 'NATURE',
    AETHER: 'AETHER'
});

export const PHYSICAL_STATUS = Object.freeze({
    LIFT: 'LIFT',
    KNOCK_DOWN: 'KNOCK_DOWN',
    CRUSH: 'CRUSH',
    BREACH: 'BREACH'
});

export const BUFF_TYPE = Object.freeze({
    ATK: 'atk',
    DMG_BONUS: 'dmgBonus',
    DMG_TAKEN: 'dmgTaken',
    CRIT_RATE: 'critRate',
    CRIT_DMG: 'critDmg',
    SUSCEPTIBILITY: 'susceptibility',
    DMG_AMP: 'dmgAmp',
    ARTS_INTENSITY: 'artsIntensity',
    RESISTANCE: 'resistance',
    DEFENSE: 'defense'
});

export const ATTRIBUTE = Object.freeze({
    STRENGTH: 'STRENGTH',
    AGILITY: 'AGILITY',
    INTELLECT: 'INTELLECT',
    WILL: 'WILL'
});

export const EVENT_TYPE = Object.freeze({
    HIT: 'HIT',
    ARTS_INFLICTION: 'ARTS_INFLICTION',
    PHYSICAL_APPLICATION: 'PHYSICAL_APPLICATION',
    STATUS_APPLICATION: 'STATUS_APPLICATION',
    STATUS_EXPIRATION: 'STATUS_EXPIRATION',
    STATUS_TICK: 'STATUS_TICK',
    SKILL_EVENT: 'SKILL_EVENT',
    STATE_UPDATE: 'STATE_UPDATE'
})

export const ABILITY_TYPE = Object.freeze({
    BASIC: 'BASIC',
    FINAL: 'FINAL',
    DIVE: 'DIVE',
    FINISHER: 'FINISHER',
    BATTLE_SKILL: 'BATTLE_SKILL',
    COMBO_SKILL: 'COMBO_SKILL',
    ULTIMATE: 'ULTIMATE'
})

export const TEAM = Object.freeze({
    PLAYER: 'PLAYER',
    ENEMY: 'ENEMY',
    GLOBAL: 'GLOBAL'
})