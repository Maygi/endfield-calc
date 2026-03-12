const ATTRIBUTES = {
  STRENGTH: "strength",
  AGILITY: "agility",
  INTELLECT: "intellect",
  WILL: "will",
};

const STATS = {
  HP: "hp",
  ATK: "atk",
  DEFENSE: "defense",
};

const OTHER_STATS = {
  CRITICAL_RATE: "criticalRate",
  CRITICAL_DMG: "criticalDmg",
  ARTS_INTENSITY: "artsIntensity",
  PHYSICAL_RESISTANCE: "physicalResistance",
  HEAT_RESISTANCE: "heatResistance",
  ELECTRIC_RESISTANCE: "electricResistance",
  CRYO_RESISTANCE: "cryoResistance",
  NATURE_RESISTANCE: "natureResistance",
  AETHER_RESISTANCE: "aetherResistance",
  TREATMENT_BONUS: "treatmentBonus",
  TREATMENT_RECEIVED_BONUS: "treatmentReceivedBonus",
  COMBO_SKILL_COOLDOWN_REDUCTION: "comboSkillCooldownReduction",
  ULTIMATE_GAIN_EFFICIENCY: "ultimateGainEfficiency",
  STAGGER_EFFICIENCY_BONUS: "staggerEfficiencyBonus",
  PHYSICAL_DMG_BONUS: "physicalDmgBonus",
  HEAT_DMG_BONUS: "heatDmgBonus",
  ELECTRIC_DMG_BONUS: "electricDmgBonus",
  CRYO_DMG_BONUS: "cryoDmgBonus",
  NATURE_DMG_BONUS: "natureDmgBonus",
  // AETHER_DMG_BONUS: "aetherDmgBonus",
  BATTLE_SKILL_DMG_BONUS: "battleSkillDmgBonus",
};

// not in operator game UI description, but provided by gear in game
const GEAR_STATS = {
  BASIC_ATTACK_DMG_BONUS: "basicAttackDmgBonus",
  COMBO_SKILL_DMG_BONUS: "comboSkillDmgBonus",
  ULTIMATE_DMG_BONUS: "ultimateDmgBonus",
  STAGGERED_DMG_BONUS: "staggeredDmgBonus", // "Damage Bonus vs. Staggered"
  ARTS_DMG_BONUS: "artsDmgBonus", // "Arts Damage Dealt Bonus"
  FINAL_DMG_REDUCTION: "finalDmgReduction",
};

export { ATTRIBUTES, STATS, OTHER_STATS, GEAR_STATS };
