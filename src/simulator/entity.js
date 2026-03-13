/**
 * Generic container for an actor in the simulation (playable character, enemy or otherwise).
 */
class Entity {    
    constructor(engine, instanceId, charId, name, team) {
        this.engine = engine;
        this.instanceId = instanceId;
        this.charId = charId;
        this.name = name;
        this.team = team;
        this.components = new Map();
    }

    addComponent(type, component) {
        this.components.set(type, component);
    }

    getComponent(type) {
        return this.components.get(type);
    }

    clone(newEngine) {
        const copy = new Entity(newEngine, this.instanceId, this.charId, this.name, this.team);
        for (const [type, component] of this.components) {
            copy.addComponent(type, component.clone(newEngine));
        }
        return copy;
    }
}