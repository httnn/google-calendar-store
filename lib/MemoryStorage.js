"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
class MemoryStorage {
    constructor() {
        this.events = [];
    }
    init() {
        return Promise.resolve();
    }
    findOne(eventId) {
        const e = this.events.find(e => e.getId() === eventId);
        return Promise.resolve(e);
    }
    update(eventId, event) {
        const index = this.events.findIndex(e => e.getId() === eventId);
        this.events[index] = event;
        return Promise.resolve(event);
    }
    create(event) {
        this.events.push(event);
        return Promise.resolve(event);
    }
    find(start, end, calendarId) {
        const results = this.events.filter(e => moment(e.config.start).isSameOrAfter(start)
            && moment(e.config.end).isSameOrBefore(end)
            && (!calendarId || e.config.calendarGoogleId === calendarId));
        return Promise.resolve(results);
    }
}
exports.default = MemoryStorage;
;
