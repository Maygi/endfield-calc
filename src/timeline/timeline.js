/**
 * A container of a timeline of events.
 * Events are stored in terms of their true time value.
 */
class Timeline {
    constructor(id) { 
        this.id = id;
        this.events = [];
    }

    printAll() {
        for (const event of this.events) {
            console.log(event.getInfo());
        }
    }

    /**
     * 
     * @param newEvent The newest event to add. Only events after will be recalculated.
     */
    updateEvents(newEvent) {
        const index = this.#findInsertIndex(newEvent.time);
        this.addEvent(newEvent);
    }

    isStaggered(time) {
        return false; //todo: implement stagger logic
    }
    moveEvent(eventId, newTime) {
        const eventIndex = this.events.findIndex(e => e.id === eventId);
        if (eventIndex === -1) {
            console.error(`Event with id ${eventId} not found.`);
            return;
        }
        const event = this.events[eventIndex];

        for (const dormantEffect of event.dormantEffects) {
            dormantEffect.clearTriggeredEffects(this);
        }
        
        // ALSO: Clear any dormant effects on OTHER events that triggered on THIS event
        for (const otherEvent of this.events) {
            if (otherEvent.id === eventId) continue;
            for (const dormantEffect of otherEvent.dormantEffects) {
                if (dormantEffect.triggeredEvents.has(eventId)) {
                    dormantEffect.triggeredEvents.delete(eventId);
                    console.log(`  Cleared ${otherEvent.skill.name}'s dormant effect trigger on ${event.skill.name}`);
                }
            }
        }

        this.events.splice(eventIndex, 1);
        event.move(newTime);
        this.updateEvents(event);
    }

    /**
     * Insert an event, maintaining chronological order.
     * @param {Object} event - An object with at least a 'time' property.
     */
    addEvent(newEvent) {
        const index = this.#findInsertIndex(newEvent.time);
        let activeEffects = [];
        this.events.splice(index, 0, newEvent);
        for (const event of this.events) {
            activeEffects.push(...event.effects);
            // if a previous event has dormant effects and is before the new event, check to see if the new event triggers it
            if (event.hasDormantEffects() && newEvent.time >= event.time) {
                event.checkDormantEffects(newEvent);
            }
            // if the new event has dormant effects, check later events to see if they trigger
            if (newEvent.hasDormantEffects() && event.time >= newEvent.time) {
                newEvent.checkDormantEffects(event);
            }
            // if an existing event happens later, recalculate it in case of new effects being added
            event.recalculate(activeEffects);
        }
    }

    /**
     * Returns all events with time <= targetTime
     */
    getEventsUpTo(targetTime) {
        const index = this.#findInsertIndex(targetTime);
        return this.events.slice(0, index);
    }

    /**
     * Returns all events within [start, end)
     */
    getEventsInRange(startTime, endTime) {
        const startIndex = this.#findInsertIndex(startTime);
        const endIndex = this.#findInsertIndex(endTime);
        return this.events.slice(startIndex, endIndex);
    }

    /**
     * Binary search insertion point
     */
    #findInsertIndex(time) {
        let low = 0;
        let high = this.events.length;

        while (low < high) {
            const mid = (low + high) >> 1;
            if (this.events[mid].time <= time) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }

        return low;
    }
}

export { Timeline };