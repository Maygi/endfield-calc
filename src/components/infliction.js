import { BURST, REACTIONS } from "../data/arts.js";
import { ELEMENT } from "../data/constants.js";
import CombatState from "../simulator/combatstate";

export default class InflictionComponent {
    /**
     * 
     * @param {ELEMENT} element 
     * @param {number} stacks 
     */
    constructor(element = null, stacks = 0) {
        this.currentElement = null;
        this.stacks = 0;
    }

    /**
     * 
     * @param {ELEMENT} element 
     * @param {CombatState} state 
     */
    applyElement(element, state) {
        // if target has no current element
        if (!this.currentElement) {
            this.currentElement = element;
            this.stacks = 1;
            return;
        }

        // arts burst
        if (this.currentElement === element) {
            this.triggerBurst(state, element, this.stacks, BURST); // TODO: figure out what data exactly to put in BURST and what needs to be passed
            this.stacks = Math.min(this.stacks + 1, 4);
        } else {
            const reaction = REACTIONS[element];
            this.triggerReaction(state, this.stacks, reaction);
            this.clearAll();
        }
    }

    /**
     * Clears all inflictions.
     */
    clearAll() {
        this.currentElement = null;
        this.stacks = 0;
    }

    /**
     * Generates the relevant damage event packets from Burst triggers.
     * @param {CombatState} state 
     * @param {ELEMENT} element 
     * @param {number} stacks 
     * @param {*} data 
     * @returns 
     */
    triggerBurst(state, element, stacks, data) {

    }

    /**
     * 
     * @param {CombatState} state 
     * @param {number} stacks 
     * @param {*} data 
     */
    triggerReaction(state, stacks, data) {

    }
}