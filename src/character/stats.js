/**
 * Represents a character's stats with utility methods
 */
class Stats {
    constructor() {
        this.hp = 0;
        this.atk = {
            weapon: 0,
            operator: 0,
            percentage: 0,
            flat: 0
        };
        this.attributes = {
            strength: 0,
            agility: 0,
            intellect: 0,
            will: 0
        };
        this.def = 0;
        this.critRate = 0;
        this.critDmg = 0;
        this.artsIntensity = 0;
        this.treatmentBonus = 0;
        this.treatmentReceivedBonus = 0;
        this.comboSkillCooldownReduction = 0;
        this.ultimateGainEfficiency = 0;
        this.staggerEfficiencyBonus = 0;
        
        this.resistance = {
            physical: 0,
            heat: 0,
            electric: 0,
            cryo: 0,
            nature: 0,
            aether: 0
        };

        this.dmgTaken = {
            physical: 0,
            heat: 0,
            electric: 0,
            cryo: 0,
            nature: 0,
            aether: 0
        };

        this.susceptibility = {
            physical: 0,
            heat: 0,
            electric: 0,
            cryo: 0,
            nature: 0,
            aether: 0
        };

        this.amp = {
            physical: 0,
            heat: 0,
            electric: 0,
            cryo: 0,
            nature: 0,
            aether: 0
        };
        
        this.dmgBonus = {
            physical: 0,
            heat: 0,
            electric: 0,
            cryo: 0,
            nature: 0,
            aether: 0,
            basicAttack: 0,
            battleSkill: 0,
            comboSkill: 0,
            ultimate: 0,
            staggered: 0
        };

        // enemy parameters
        this.staggerLimit = 0;
    }
    
    /**
     * Apply initial stats from character template
     * @param {object} templateStats - Stats from character template
     */
    applyTemplate(templateStats) {
        if (templateStats.hp !== undefined) this.hp = templateStats.hp;
        
        if (templateStats.atk !== undefined) {
            if (typeof templateStats.atk === 'number') {
                this.atk.operator = templateStats.atk;
            } else {
                Object.assign(this.atk, templateStats.atk);
            }
        }
        
        if (templateStats.attributes) Object.assign(this.attributes, templateStats.attributes);
        if (templateStats.def !== undefined) this.def = templateStats.def;
        if (templateStats.critRate !== undefined) this.critRate = templateStats.critRate;
        if (templateStats.critDmg !== undefined) this.critDmg = templateStats.critDmg;
        if (templateStats.artsIntensity !== undefined) this.artsIntensity = templateStats.artsIntensity;
        if (templateStats.treatmentBonus !== undefined) this.treatmentBonus = templateStats.treatmentBonus;
        if (templateStats.treatmentReceivedBonus !== undefined) this.treatmentReceivedBonus = templateStats.treatmentReceivedBonus;
        if (templateStats.comboSkillCooldownReduction !== undefined) this.comboSkillCooldownReduction = templateStats.comboSkillCooldownReduction;
        if (templateStats.ultimateGainEfficiency !== undefined) this.ultimateGainEfficiency = templateStats.ultimateGainEfficiency;
        if (templateStats.staggerEfficiencyBonus !== undefined) this.staggerEfficiencyBonus = templateStats.staggerEfficiencyBonus;
        if (templateStats.resistance) Object.assign(this.resistance, templateStats.resistance);
        if (templateStats.dmgBonus) Object.assign(this.dmgBonus, templateStats.dmgBonus);
        if  (templateStats.staggerLimit) this.staggerLimit = templateStats.staggerLimit;
    }

    /**
     * Get a stat value by path
     * @param {string} path - Dot notation path (e.g., "atk.operator", "critRate")
     */
    get(path) {
        const keys = path.split('.');
        let value = this;
        for (const key of keys) {
            value = value[key];
            if (value === undefined) return undefined;
        }
        return value;
    }

    /**
     * Set a stat value by path
     * @param {string} path - Dot notation path
     * @param {number} value - New value
     */
    set(path, value) {
        const keys = path.split('.');
        let target = this;
        
        for (let i = 0; i < keys.length - 1; i++) {
            target = target[keys[i]];
        }
        
        target[keys[keys.length - 1]] = value;
    }

    /**
     * Apply a buff to this stat object
     * @param {BuffEffect} buff The BuffEffect to apply.
     */
    applyBuff(buff) {
        const statPath = buff.getStatPath();
        const currentValue = this.get(statPath);
        
        if (currentValue === undefined) {
            console.warn(`Invalid stat path: ${statPath}`);
            return;
        }

        let newValue;
        newValue = currentValue + buff.value;

        this.set(statPath, newValue);
    }

    /**
     * Create a deep copy of this Stats object
     */
    clone() {
        const cloned = new Stats();
        Object.assign(cloned, JSON.parse(JSON.stringify(this)));
        return cloned;
    }

    /**
     * The total ATK vector affected by ATK %.
     */
    getBaseAtk() {
        return this.atk.weapon + this.atk.operator;
    }

    /**
     * Adds the other stats object to the original, returning a new object with the combined values.
     * Does not modify either of the original Stats objects.
     * @param {Stats} other - Stats object to add
     * @returns {Stats} Returns this for chaining
     */
    add(other) {
        const result = new Stats();
        
        // Simple numeric properties
        result.hp = this.hp + other.hp;
        result.def = this.def + other.def;
        result.critRate = this.critRate + other.critRate;
        result.critDmg = this.critDmg + other.critDmg;
        result.artsIntensity = this.artsIntensity + other.artsIntensity;
        result.treatmentBonus = this.treatmentBonus + other.treatmentBonus;
        result.treatmentReceivedBonus = this.treatmentReceivedBonus + other.treatmentReceivedBonus;
        result.comboSkillCooldownReduction = this.comboSkillCooldownReduction + other.comboSkillCooldownReduction;
        result.ultimateGainEfficiency = this.ultimateGainEfficiency + other.ultimateGainEfficiency;
        result.staggerEfficiencyBonus = this.staggerEfficiencyBonus + other.staggerEfficiencyBonus;
        result.staggerLimit = this.staggerLimit + other.staggerLimit;

        // Attributes
        result.attributes.strength = this.attributes.strength + other.attributes.strength;
        result.attributes.agility = this.attributes.agility + other.attributes.agility;
        result.attributes.intellect = this.attributes.intellect + other.attributes.intellect;
        result.attributes.will = this.attributes.will + other.attributes.will;
        
        // ATK object
        result.atk.weapon = this.atk.weapon + other.atk.weapon;
        result.atk.operator = this.atk.operator + other.atk.operator;
        result.atk.percentage = this.atk.percentage + other.atk.percentage;
        result.atk.flat = this.atk.flat + other.atk.flat;
        
        // Resistance object
        for (const element in this.resistance) {
            result.resistance[element] = this.resistance[element] + other.resistance[element];
        }
        
        // Susceptibility object
        for (const element in this.susceptibility) {
            result.susceptibility[element] = this.susceptibility[element] + other.susceptibility[element];
        }
        
        // DMG Taken object
        for (const element in this.dmgTaken) {
            result.dmgTaken[element] = this.dmgTaken[element] + other.dmgTaken[element];
        }
        
        // AMP object
        for (const element in this.amp) {
            result.amp[element] = this.amp[element] + other.amp[element];
        }
        
        // DMG Bonus object
        for (const type in this.dmgBonus) {
            result.dmgBonus[type] = this.dmgBonus[type] + other.dmgBonus[type];
        }
        
        return result;
    }

    /**
     * Create a new Stats object that is the sum of two Stats objects
     * @param {Stats} stats1 
     * @param {Stats} stats2 
     * @returns {Stats} New Stats object with combined values
     */
    static combine(stats1, stats2) {
        const result = stats1.clone();
        result.add(stats2);
        return result;
    }

    /**
     * Convert stats to a readable string format
     * @param {boolean} includeZeros - Whether to include stats with zero values
     * @returns {string} Formatted stats string
     */
    toString(includeZeros = false) {
        const lines = [];
        
        // Helper function to format numbers
        const formatValue = (value) => {
            if (typeof value === 'number') {
                // Format percentages (values between 0 and 1 that aren't whole numbers)
                if (value > 0 && value < 1 && value % 1 !== 0) {
                    return `${(value * 100).toFixed(2)}%`;
                }
                // Format regular numbers
                return value.toFixed(2);
            }
            return value;
        };

        // Attributes
        const hasAttributes = Object.values(this.attributes).some(v => v !== 0);
        if (includeZeros || hasAttributes) {
            lines.push('Attributes:');
            for (const [attr, value] of Object.entries(this.attributes)) {
                if (includeZeros || value !== 0) {
                    lines.push(`  ${attr.charAt(0).toUpperCase() + attr.slice(1)}: ${formatValue(value)}`);
                }
            }
            lines.push(''); // Empty line for spacing
        }
        
        // Simple stats
        if (includeZeros || this.hp !== 0) lines.push(`HP: ${formatValue(this.hp)}`);
        if (includeZeros || this.def !== 0) lines.push(`DEF: ${formatValue(this.def)}`);
        if (includeZeros || this.critRate !== 0) lines.push(`Crit Rate: ${formatValue(this.critRate)}`);
        if (includeZeros || this.critDmg !== 0) lines.push(`Crit DMG: ${formatValue(this.critDmg)}`);
        if (includeZeros || this.artsIntensity !== 0) lines.push(`Arts Intensity: ${formatValue(this.artsIntensity)}`);
        if (includeZeros || this.treatmentBonus !== 0) lines.push(`Treatment Bonus: ${formatValue(this.treatmentBonus)}`);
        if (includeZeros || this.treatmentReceivedBonus !== 0) lines.push(`Treatment Received Bonus: ${formatValue(this.treatmentReceivedBonus)}`);
        if (includeZeros || this.comboSkillCooldownReduction !== 0) lines.push(`Combo Skill CDR: ${formatValue(this.comboSkillCooldownReduction)}`);
        if (includeZeros || this.ultimateGainEfficiency !== 0) lines.push(`Ultimate Gain Efficiency: ${formatValue(this.ultimateGainEfficiency)}`);
        if (includeZeros || this.staggerEfficiencyBonus !== 0) lines.push(`Stagger Efficiency Bonus: ${formatValue(this.staggerEfficiencyBonus)}`);
        
        // ATK breakdown
        const atkTotal = this.getBaseAtk();
        if (includeZeros || atkTotal !== 0) {
            lines.push(`\nATK: ${formatValue(atkTotal)}`);
            if (includeZeros || this.atk.weapon !== 0) lines.push(`  Weapon: ${formatValue(this.atk.weapon)}`);
            if (includeZeros || this.atk.operator !== 0) lines.push(`  Operator: ${formatValue(this.atk.operator)}`);
            if (includeZeros || this.atk.flat !== 0) lines.push(`  Flat: ${formatValue(this.atk.flat)}`);
            if (includeZeros || this.atk.percentage !== 0) lines.push(`  Percentage: ${formatValue(this.atk.percentage)}`);
        }

        // DMG Amp
        const hasAmp = Object.values(this.amp).some(v => v !== 0);
        if (includeZeros || hasAmp) {
            lines.push('\nDMG Amp:');
            for (const [element, value] of Object.entries(this.amp)) {
                if (includeZeros || value !== 0) {
                    lines.push(`  ${element.charAt(0).toUpperCase() + element.slice(1)}: ${formatValue(value)}`);
                }
            }
        }

        // DMG Bonus
        const hasDmgBonus = Object.values(this.dmgBonus).some(v => v !== 0);
        if (includeZeros || hasDmgBonus) {
            lines.push('\nDMG Bonus:');
            for (const [type, value] of Object.entries(this.dmgBonus)) {
                if (includeZeros || value !== 0) {
                    const label = type.replace(/([A-Z])/g, ' $1').trim();
                    lines.push(`  ${label.charAt(0).toUpperCase() + label.slice(1)}: ${formatValue(value)}`);
                }
            }
        }
        
        // Resistance
        const hasResistance = Object.values(this.resistance).some(v => v !== 0);
        if (includeZeros || hasResistance) {
            lines.push('\nResistance:');
            for (const [element, value] of Object.entries(this.resistance)) {
                if (includeZeros || value !== 0) {
                    lines.push(`  ${element.charAt(0).toUpperCase() + element.slice(1)}: ${formatValue(value)}`);
                }
            }
        }

        // Susceptibility
        const hasSusceptibility = Object.values(this.susceptibility).some(v => v !== 0);
        if (includeZeros || hasSusceptibility) {
            lines.push('\nSusceptibility:');
            for (const [element, value] of Object.entries(this.susceptibility)) {
                if (includeZeros || value !== 0) {
                    lines.push(`  ${element.charAt(0).toUpperCase() + element.slice(1)}: ${formatValue(value)}`);
                }
            }
        }

        // DMG Taken
        const hasDmgTaken = Object.values(this.dmgTaken).some(v => v !== 0);
        if (includeZeros || hasDmgTaken) {
            lines.push('\nDMG Taken:');
            for (const [element, value] of Object.entries(this.dmgTaken)) {
                if (includeZeros || value !== 0) {
                    lines.push(`  ${element.charAt(0).toUpperCase() + element.slice(1)}: ${formatValue(value)}`);
                }
            }
        }
        
        return lines.join('\n');
    }
}



export { Stats };