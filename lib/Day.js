"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Day {
    constructor(date, events) {
        this.events = [];
        this.date = date.startOf('day');
        this.events = events;
    }
    toString() {
        return `${this.date.format()}: ${this.events.map(e => e.summary).join(', ')}`;
    }
}
exports.default = Day;
;
