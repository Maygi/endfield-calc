/**
 * Manages resources pertaining to the entity it is attached to. For playable characters, things like HP and Ult Energy. For enemies, things like Stagger.
 */
export default class ResourceComponent {
    constructor(data) {
        this.owner = null;
        this.hp = data.hp ?? 1000;
        this.energy = data.energy ?? 0;
        this.stagger = data.stagger ?? 0; 
        this.staggerMax = data.staggerMax ?? 100;
    }

    clone() {
        const copy = new ResourceComponent({
            hp: this.hp,
            energy: this.energy,
            stagger: this.stagger,
            staggerMax: this.staggerMax
        });
        copy.owner = this.owner;
        return copy;
    }
}