/**
 * Represents a damage instance created by a SkillEvent.
 */
class Damage {
    constructor(time, skill, sourceId = null) {
        this.time = time;
        this.skill = skill;
        this.sourceId = sourceId;
    }
}

export { Damage };