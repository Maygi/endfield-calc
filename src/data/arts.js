import { ELEMENT } from "./constants.js";

/**
 * Reference data for Arts reactions and Bursts. Used by the InflictionComponent to produce relevant events. Reaction data is indexed by the incoming element.
 */
export const REACTIONS = {
    [ELEMENT.HEAT]: {
        name: 'COMBUSTION',
        
    },
    [ELEMENT.ELECTRIC]: {

    },
    [ELEMENT.CRYO]: {

    },
    [ELEMENT.NATURE]: {

    }
}

export const BURST = {
    mv: 1.6
}