/**
 * Priority Queue for events. Min heap by event time. Supports the usual heap operations push, pop, peek, size, isEmpty. Additionally supports a clone method that copies its contents.
 * * Assumes contained events have a event.time field to sort by.
 */
export default class EventQueue {
    constructor(events = []) {
        this.heap = [];
        if (events.length > 0) {
            events.forEach(e => this.push(e));
        }
    }

    push(event) {
        this.heap.push(event);
        this.#bubbleUp();
    }

    pop() {
        if (this.size === 0) return null;
        if (this.size === 1) return this.heap.pop();
        const top = heap[0];
        heap[0] = this.heap.pop();
        this.#bubbleDown();
        return top;
    }

    peek() { return this.heap[0]; }
    size() { return this.heap.length; }
    isEmpty() { return this.heap.length === 0; }

    #bubbleUp() {
        let curr = this.size() - 1;
        while (curr > 0) {
            let parent = (curr - 1) >> 1;
            if (this.heap[curr].time < this.heap[parent].time) {
                [this.heap[curr], this.heap[parent]] = [this.heap[parent], this.heap[curr]];
            } else break;
        }
    }

    #bubbleDown() {
        let curr = 0;
        while (true) {
            let left = (curr << 1) + 1;
            let right = (curr << 1) + 2;
            let smallest = curr;

            if (left < this.size() && this.heap[left].time < this.heap[curr].time) { smallest = left; }
            if (right < this.size() && this.heap[right].time < this.heap[curr].time) { smallest = right; }

            if (smallest !== curr) {
                [this.heap[curr], this.heap[smallest]] = [this.heap[smallest], this.heap[curr]];
                curr = smallest;
            } else break;
        }
    }

    clone() {
        copy = new EventQueue();
        copy.heap = this.heap.map(e => ({ ...e }));
        return copy;
    }
}