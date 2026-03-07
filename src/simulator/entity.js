/**
 * Generic container for an actor in the simulation (playable character, enemy or otherwise).
 */
class Entity {    
    constructor(instanceId, charId, name, team) {
        this.instanceId = instanceId;
        this.charId = charId;
        this.name = name;
        
        this.components = new Map();
    }

    addComponent(type, component) {
        component.owner = this;
        this.components.set(type, component);
    }

    getComponent(type) {
        this.components.get(type);
    }

    clone() {
        const copy = new Entity(this.name);
        for (const [type, component] of this.components) {
            copy.addComponent(this.name, component.clone());
        }
        return copy;
    }
}