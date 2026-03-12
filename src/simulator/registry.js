export class Registry {
    constructor() {
        this.statusDefinitions = new Map();

        this.initalize();
    }

    initialize() {
        
    }

    getStatusDefinition(namespace, statusName) {
        const namespaceData = this.statusDefinitions.get(namespace);
        if (!namespaceData) {
            console.warn(`Registry error: Namespace ${namespace} not found.`);
            return null;
        }

        const definition = namespaceData[statusName];
        if (!definition) {
            console.warn(`Registry error: Status ${statusName} not found in namespace ${namespace}.`);
            return null;
        }

        return definition;
    }
}