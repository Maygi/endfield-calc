/**
 * Manages the Physical status(es) on an enemy. Vulnerability stacks, as well as Lift, Knock Down, Crush and Breach.
 */
export default class PhysicalComponent {
    constructor(stacks) {
        this.owner = null;
        this.stacks = stacks; // number of vuln stacks
    }

    applyLift(event) {
        if (stacks === 0) {
            stacks++;
        } else {
            if (stacks < 4) stacks++;
            
        }
    }

    applyKnockDown(event) {

    }

    applyCrush(event) {

    }

    applyBreach(event) {

    }

    clone() {
        copy = new PhysicalComponent(this.stacks);
        copy.owner = this.owner;
        return copy;
    }
}