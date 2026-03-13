import { Basic, Combo, Skill, Ultimate } from '../character/skill.js';
import { BuffEffect, StackingBuffEffect } from '../events/effects/buffeffect.js';
import { DormantEffect } from '../events/effects/dormanteffect.js';

const ELEMENT = {
    Physical: 'physical',
    Heat: 'heat',
    Electric: 'electric',
    Cryo: 'cryo',
    Nature: 'nature',
    Aether: 'aether'
}

const BUFF_TYPES = {
    ATK: 'atk',
    DMG_BONUS: 'dmgBonus',
    DMG_TAKEN: 'dmgTaken',
    CRIT_BONUS: 'critRate',
    CRITD_BONUS: 'critDmg',
    SUSCEPTIBILITY: 'susceptibility',
    DMG_AMP: 'dmgAmp',
    ARTS_INTENSITY: 'artsIntensity',
    RESISTANCE: 'resistance'
}

const SCOPE = {
    SELF: 'Self',
    GLOBAL: 'Global',
    ENEMY: 'Enemy'
}

const ATTRIBUTES = {
    STRENGTH: 'strength',
    AGILITY: 'agility',
    INTELLECT: 'intellect',
    WILL: 'will'
}

const CHARACTER_TEMPLATES = {
    AVYWENNA: {
        name: 'Avywenna',
        weapon: 'Polearm',
        element: ELEMENT.Electric,
        class: 'Striker',
        mainAttribute: ATTRIBUTES.WILL,
        secondaryAttribute: ATTRIBUTES.AGILITY,
        ultiEnergy: 100,
        baseStats: {
            attributes: { strength: 107, agility: 106, intellect: 110, will: 148 + 60 },
            hp: 5495,
            atk: {
                operator: 312,
                weapon: 0,
                percentage: 0,
                flat: 0
            },
            critRate: 0.05,
            critDmg: 0.5
        },
        basic: new Basic(SCOPE.SELF, 'Thunderlance: Blitz', ELEMENT.Physical, 0.17 + 0.22 + 0.21 + 0.30 + 0.50, 0, 3.5, 17, []),
        finisher: new Basic(SCOPE.SELF, 'Thunderlance: Finisher', ELEMENT.Physical, 4.00, 0, 1.5, 17, []),
        skill: new Skill(SCOPE.SELF, 'Thunderlance: Interdiction', ELEMENT.Electric, 0.67, 0, 1, 10, []),
        combo: new Combo(SCOPE.SELF, 'Thunderlance: Strike', ELEMENT.Electric, 1.69, 13, 1, 10, [
            new DormantEffect(SCOPE.SELF, 'Thunderlance', 30,
                new Skill(SCOPE.SELF, 'Thunderlance', ELEMENT.Electric, 0.75 * 3, 0, 0, 5 * 3, []),
                'Thunderlance: Interdiction'),
        ]),
        ultimate: new Ultimate(SCOPE.SELF, 'Thunderlance: Final Shock', ELEMENT.Electric, 4.22, 10, 1, 15, [
            new BuffEffect(SCOPE.ENEMY, 'Electric Susceptibility', 10, 0.10, BUFF_TYPES.SUSCEPTIBILITY, ELEMENT.Electric),
            new DormantEffect(SCOPE.SELF, 'Thunderlance Ex', 30,
                new Skill(SCOPE.SELF, 'Thunderlance Ex', ELEMENT.Electric, 1.92, 0, 10, [
                    //todo: electric infliction
                ]), 'Thunderlance: Interdiction'),
        ], 100)
    },
    BOSS: {
        name: 'Boss Enemy',
        baseStats: {
            hp: 100000,
            def: 100,
            staggerLimit: 100,
        }
    }
};

export { ELEMENT, BUFF_TYPES, CHARACTER_TEMPLATES, SCOPE };