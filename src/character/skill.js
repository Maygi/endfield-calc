import { globalSkillLevel } from "../config.js";

const SKILL_TYPES = {
    BASIC: 'basicAttack',
    COMBO: 'comboSkill',
    SKILL: 'battleSkill',
    ULTIMATE: 'ultimate'
}

class Skill {
    constructor(scope, name, element, mv, cd, duration, stagger, effects, energyCost = 0) {
        this.owner = null;
        this.scope = scope;
        this.name = name;
        this.element = element;
        this.mv = getSkillMultiplier(mv);
        this.cd = cd;
        this.duration = duration;
        this.stagger = stagger;
        this.effects = effects;
        this.energyCost = energyCost;
        this.type = SKILL_TYPES.SKILL;
    }
}

function getSkillMultiplier(mv) {
  if (globalSkillLevel <= 9) {
    return mv * (1 + 0.10 * (globalSkillLevel - 1));
  }

  // mastery level skills (1-3) have additional scaling
  let multiplier = 1.8;

  if (globalSkillLevel >= 10) multiplier += 0.125;
  if (globalSkillLevel >= 11) multiplier += 0.15;
  if (globalSkillLevel >= 12) multiplier += 0.175;

  return mv * multiplier;
}

class Finisher extends Skill {
    constructor(scope, name, element, mv, cd, duration, stagger, effects, energyCost = 0) {
        super(scope, name, element, mv, cd, duration, stagger, effects, energyCost);
        this.type = SKILL_TYPES.FINISHER; //finisher still counts as basic, but is subject to other bonuses
    };
}

class Basic extends Skill {
    constructor(scope, name, element, mv, cd, duration, stagger, effects, energyCost = 0) {
        super(scope, name, element, mv, cd, duration, stagger, effects, energyCost);
        this.type = SKILL_TYPES.BASIC;
    };
}

class Combo extends Skill {
    constructor(scope, name, element, mv, cd, duration, stagger, effects, energyCost = 0) {
        super(scope, name, element, mv, cd, duration, stagger, effects, energyCost);
        this.type = SKILL_TYPES.COMBO;
    };
}

class Ultimate extends Skill {
    constructor(scope, name, element, mv, cd, duration, stagger, effects, energyCost = 0) {
        super(scope, name, element, mv, cd, duration, stagger, effects, energyCost);
        this.type = SKILL_TYPES.ULTIMATE;
    };
}

export { Skill, Finisher, Basic, Combo, Ultimate, SKILL_TYPES };