/**
 * Pure math functions. The actual damage computation is here, give it the relevant information for calculation.
 */
export const Calculator = {

    /**
     * Computes damage for a single hit from one source to one target.
     * @param {Entity} source
     * @param {Entity} target
     * @param {*} data 
     * @returns {*} A receipt of the calculation, containing any and all relevant information to update subsequent state resources, and to display to the user.
     */
    calculateHit(source, target, data) {
        const stats = source.getComponent('Stats');
        // TODO: computation logic, im not familiar enough with the formulae :( just copy over Maygi's stuff in her calculation.js probably.
    }
}