import { CHARACTER_INDEX } from '../data/characters/index.js';

/**
 * Instantiates a character Entity using the stored data if a valid name is given.
 * @param {string} charId Name of character as listed in the index.
 */
function createCharacter(charName) {
    const kit = CHARACTER_INDEX[charName];
    if (!kit) throw new Error(`Character ${charName} not found!`);

    const character = new Entity(charName);
    
    character.addComponent('Stats', new StatsComponent(kit.baseStats));
    character.addComponent('Skills', new AbilityComponent(kit.skills));
    character.addComponent('Triggers', new TriggerComponent(kit.triggers));

    return character;
}