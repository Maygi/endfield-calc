import { timeline } from '../main.js';
import { SKILL_TYPES } from '../character/skill.js';
import { Stats } from '../character/stats.js';

/**
 * Contains all the calculation "receipts" for any given SkillEvent, along with the buffs
 * and debuffs active at that time.
 */
class Calculation {
    constructor(charStats, enemyStats, buffEffects, debuffEffects) {
        this.charStats = charStats;
        this.enemyStats = enemyStats;

        //the original effect instances to get the source data
        this.buffEffectsSource = buffEffects;
        this.debuffEffectsSource = debuffEffects;

        //the definitions for effects
        this.buffEffects = buffEffects.flatMap(e => e.definition);
        this.debuffEffects = debuffEffects.flatMap(e => e.definition);
        
        const buffStats = new Stats();
        this.buffEffects.forEach(effect => buffStats.applyBuff(effect));
        this.buffedStats = charStats.add(buffStats);
        
        const debuffStats = new Stats();
        this.debuffEffects.forEach(effect => debuffStats.applyBuff(effect));
        this.debuffedStats = enemyStats.add(debuffStats);
        
        this.damageCalculations = [];
    }
    
    /**
     * Calculates damage for the given skillcast, storing it in the damageCalculations array.
     * @returns {DamageCalculation} The calculation object with full breakdown
     */
    calculateDamage(skill, staggered = false) {
        const calc = new DamageCalculation(
            skill, 
            this.buffedStats,
            this.debuffedStats,
            this.buffEffects,
            this.debuffEffects,
            staggered
        );
        
        this.damageCalculations.push(calc);
        return calc;
    }

    getEffectString() {
        const buffStrings = this.buffEffectsSource.map(e => `[${e.owner?.name || 'Unknown'}] ${e.definition.name} (${e.definition.getStatPath()} = ${e.definition.value})`);
        const debuffStrings = this.debuffEffectsSource.map(e => `[${e.owner?.name || 'Unknown'}] ${e.definition.name} (${e.definition.getStatPath()} = ${e.definition.value})`);
        return `Buffs: ${buffStrings.join(', ')}\nDebuffs: ${debuffStrings.join(', ')}`;
    }
}

/**
 * Represents a single damage calculation with full breakdown.
 */
class DamageCalculation {
    constructor(skill, buffedStats, debuffedStats, buffEffects, debuffEffects, staggered) {
        this.skill = skill;
        this.staggered = staggered;
        
        // Store references to all available buffs/debuffs
        this.allBuffEffects = buffEffects;
        this.allDebuffEffects = debuffEffects;
        
        // Use pre-calculated buffed stats
        this.buffedStats = buffedStats;
        this.debuffedStats = debuffedStats;
        
        // Calculate all components
        this.breakdown = this._calculateBreakdown();
        this.totalDamage = this._calculateTotal();
    }
    
    /**
     * Calculate all damage components and store them
     */
    _calculateBreakdown() {
        const skill = this.skill;
        const skillMv = skill.mv;
        const attack = this.buffedStats.getBaseAtk();
        const attackFlat = this.buffedStats.atk.flat;
        const attackPerc = this.buffedStats.atk.percentage;
        const attrBonus = this.buffedStats.attributes[skill.owner.mainAttribute] * 0.005 + 
                         this.buffedStats.attributes[skill.owner.secondaryAttribute] * 0.002;
        const vectorAttack = (attack * (1 + attackPerc) + attackFlat) * (1 + attrBonus);
        
        const dmgBonus = 1 + this.buffedStats.dmgBonus[skill.element] + 
                        this.buffedStats.dmgBonus[skill.type] + 
                        (this.staggered ? this.buffedStats.dmgBonus.staggered : 0);
        
        const dmgAmp = 1 + this.buffedStats.amp[skill.element];
        
        const critMultiplier = (this.buffedStats.critRate * (1 + this.buffedStats.critDmg)) + 
                              (1 - this.buffedStats.critRate);
        const finisherModifier = skill.type === SKILL_TYPES.FINISHER ? 1.75 : 1;

        // Enemy modifiers - track which debuffs contribute
        const dmgTakenModifier = 1 + this.debuffedStats.dmgTaken[skill.element];
        
        const resistanceModifier = 1 - this.debuffedStats.resistance[skill.element];
        const susceptibilityModifier = 1 + this.debuffedStats.susceptibility[skill.element];
        const staggerModifier = 1 + (this.staggered ? 0.3 : 0);
        const defenseModifier = 100 / (100 + this.debuffedStats.def);

        return {
            // base modifiers
            skillMv,
            attack,
            attackPerc,
            attackFlat,
            attrBonus,
            vectorAttack,
            
            // buff modifiers
            dmgBonus,
            dmgAmp,
            critRate: this.buffedStats.critRate,
            critDmg: this.buffedStats.critDmg,
            critMultiplier,
            finisherModifier,
            
            // enemy modifiers
            dmgTakenModifier,
            resistanceModifier,
            susceptibilityModifier,
            staggerModifier,
            defenseModifier
        };
    }
    
    /**
     * Calculate total damage
     */
    _calculateTotal() {
        const b = this.breakdown;
        return b.skillMv * b.vectorAttack * b.dmgBonus * b.dmgAmp * b.critMultiplier * 
               b.finisherModifier * b.dmgTakenModifier * b.resistanceModifier * 
               b.susceptibilityModifier * b.staggerModifier * b.defenseModifier;
    }
    
    /**
     * Generate a human-readable breakdown
     */
    toString() {
        const b = this.breakdown;
        const lines = [];
        
        lines.push(`=== Damage Calculation for ${this.skill.name} ===`);
        lines.push(`Total Damage: ${this.totalDamage.toFixed(0)}`);
        lines.push('');
        
        lines.push('Base Components:');
        lines.push(`  Skill MV: ${(b.skillMv * 100).toFixed(0)}%`);
        lines.push(`  Base ATK: ${b.attack.toFixed(2)}`);
        lines.push(`  ATK Increase: ${(b.attackPerc * 100).toFixed(2)}%`);
        lines.push(`  Flat ATK: ${b.attackFlat.toFixed(2)}`);
        lines.push(`  Attribute Bonus: ${(b.attrBonus * 100).toFixed(2)}%`);
        lines.push(`  Total Attack: ${b.vectorAttack.toFixed(2)}`);
        lines.push('');
        
        lines.push('Offensive Modifiers:');
        lines.push(`  DMG Bonus: ${((b.dmgBonus - 1) * 100).toFixed(2)}%`);
        lines.push(`  DMG AMP: ${((b.dmgAmp - 1) * 100).toFixed(2)}%`);
        
        lines.push(`  Crit Rate: ${(b.critRate * 100).toFixed(2)}%`);
        lines.push(`  Crit DMG: ${(b.critDmg * 100).toFixed(2)}%`);
        lines.push(`  Crit Multiplier: ${b.critMultiplier.toFixed(3)}`);
        lines.push(`  Finisher Modifier: ${b.finisherModifier.toFixed(2)}x`);
        lines.push('');
        
        lines.push('Enemy Modifiers:');
        lines.push(`  DMG Taken: ${((b.dmgTakenModifier - 1) * 100).toFixed(2)}%`);        
        lines.push(`  Resistance: ${((1 - b.resistanceModifier) * 100).toFixed(2)}%`);
        lines.push(`  Susceptibility: ${((b.susceptibilityModifier - 1) * 100).toFixed(2)}%`);
        lines.push(`  Stagger Modifier: ${this.staggered ? '+30%' : 'None'}`);
        lines.push(`  Defense Modifier: ${b.defenseModifier.toFixed(2)}`);
        
        return lines.join('\n');
    }
    
    /**
     * Get a compact summary for tooltips
     */
    getTooltipSummary() {
        return {
            damage: this.totalDamage.toFixed(0),
            skillName: this.skill.name,
            staggered: this.staggered
        };
    }
}

export { Calculation, DamageCalculation };