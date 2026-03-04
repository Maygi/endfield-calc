import { Character } from './character/character.js';
import { Timeline } from './timeline/timeline.js';
import { SkillEvent } from './events/skillevent.js';
import { Stats } from './character/stats.js';
import { CHARACTER_TEMPLATES } from './constants/data.js';

const char1 = new Character('AVYWENNA');
const enemyStats = new Stats();
enemyStats.applyTemplate(CHARACTER_TEMPLATES.BOSS.baseStats);

let currentTime = 1; // timeline dynamic position
let timeline = new Timeline();

let testCombo = new SkillEvent(currentTime, char1.abilities.combo);
let testUlt = new SkillEvent(currentTime + 3, char1.abilities.ultimate);
let testSkill = new SkillEvent(currentTime + 10, char1.abilities.skill);

timeline.addEvent(testCombo);
timeline.addEvent(testUlt);
timeline.addEvent(testSkill);

console.log(char1.baseStats.toString());

timeline.printAll();

timeline.moveEvent(testUlt.id, 2);

timeline.printAll();

export { timeline, enemyStats };