import { CHARACTER_TEMPLATES } from '../constants/data.js';
import { Stats } from './stats.js';
import { SKILL_TYPES } from './skill.js';

const ELEMENTS = ['Physical', 'Heat', 'Electric', 'Cryo', 'Nature', 'Aether'];
const DMG_BONUS_TYPES = ['Physical', 'Heat', 'Electric', 'Cryo', 'Nature', 'Aether', 'Basic Attack',
    'Battle Skill', 'Combo Skill', 'Ultimate', 'Staggered'];
const ATK_TYPES = ['Weapon', 'Operator', 'Percentage', 'Flat'];

//deprecated, may remove
const STAT_MAP = new Map([
    ['HP', 0],
    ['ATK', new Map(ATK_TYPES.map(type => [type, 0]))],
    ['DEF', 0],
    ['Crit Rate', .05],
    ['Crit DMG', 0.5],
    ['Arts Intensity', 0],
    ['Treatment Bonus', 0],
    ['Treatment Received Bonus', 0],
    ['Combo Skill Cooldown Reduction', 0],
    ['Ultimate Gain Efficiency', 0],
    ['Stagger Efficiency Bonus', 0],
    ['Resistance', new Map(ELEMENTS.map(el => [el, 0]))],
    ['DMG Bonus', new Map(DMG_BONUS_TYPES.map(el => [el, 0]))],
]);

class Character {
    // constructor accepts an optional single string (template name) or nothing
    constructor(charName) {
        this.name = null;
        this.weapon = null;
        this.element = null;
        this.class = null;
        this.mainAttribute = null;
        this.secondaryAttribute = null;
        this.ultiEnergy = 0;
        this.abilities = {
            basic: null,
            finisher: null,
            skill: null,
            combo: null,
            ultimate: null
        };
        
        this.baseStats = new Stats();

        if (charName) {
            // If CHARACTER_TEMPLATES exists and contains charName, apply it; otherwise just set the name
            if (typeof CHARACTER_TEMPLATES !== 'undefined' && CHARACTER_TEMPLATES[charName]) {
                this.applyTemplate(CHARACTER_TEMPLATES[charName]);
            } else {
                this.name = charName;
            }
        }
    }

    applyTemplate(tmpl) {
        if (tmpl.name) this.name = tmpl.name;
        if (tmpl.weapon) this.weapon = tmpl.weapon;
        if (tmpl.element) this.element = tmpl.element;
        if (tmpl.class) this.class = tmpl.class;
        if (tmpl.mainAttribute) this.mainAttribute = tmpl.mainAttribute;
        if (tmpl.secondaryAttribute) this.secondaryAttribute = tmpl.secondaryAttribute;
        if (tmpl.ultiEnergy) this.ultiEnergy = tmpl.ultiEnergy;

        this.baseStats.applyTemplate(tmpl.baseStats || {});

        // assign this character's name as the owner for any Skill objects
        const setSkillOwner = (obj) => {
            if (!obj || typeof obj !== 'object') return;

            // Detect skill objects by their `type` field (Skill, Basic, Combo, Ultimate, Finisher)
            if (obj.type && (obj.type === SKILL_TYPES.SKILL || obj.type === SKILL_TYPES.BASIC || obj.type === SKILL_TYPES.COMBO || obj.type === SKILL_TYPES.ULTIMATE || obj.type === SKILL_TYPES.FINISHER)) {
                obj.owner = this;
                // If the skill has nested effects, recurse into them
                if (Array.isArray(obj.effects)) {
                    for (const e of obj.effects) setSkillOwner(e);
                }
                return;
            }

            // DormantEffect / Effect-like objects may contain a nested `effect` or an array of effects
            if (obj.effect) setSkillOwner(obj.effect);
            if (Array.isArray(obj)) {
                for (const item of obj) setSkillOwner(item);
            } else {
                for (const [, val] of Object.entries(obj)) setSkillOwner(val);
            }
        };

        // Walk the template and set skill owners where applicable
        for (const [, val] of Object.entries(tmpl)) {
            setSkillOwner(val);
        }

        if (tmpl.basic) this.abilities.basic = tmpl.basic;
        if (tmpl.finisher) this.abilities.finisher = tmpl.finisher;
        if (tmpl.skill) this.abilities.skill = tmpl.skill;
        if (tmpl.combo) this.abilities.combo = tmpl.combo;
        if (tmpl.ultimate) this.abilities.ultimate = tmpl.ultimate;
    }
}

export { Character };