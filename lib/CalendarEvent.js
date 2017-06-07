"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
;
class CalendarEventPlaceholder {
    constructor(date) {
        this.date = date;
    }
    toString() {
        return `[${moment(this.date).format()}] PLACEHOLDER`;
    }
}
exports.CalendarEventPlaceholder = CalendarEventPlaceholder;
class CalendarEvent {
    constructor(data) {
        this.data = data;
    }
    get id() { return this.data.googleId; }
    get calendarId() { return this.data.calendarGoogleId; }
    get summary() { return this.data.summary; }
    get description() { return this.data.description; }
    get start() { return this.data.start; }
    get end() { return this.data.end; }
    isPast() {
        return moment(this.start).isBefore(moment(), 'day');
    }
    isToday() {
        return moment(this.start).isSame(moment(), 'day');
    }
    toString() {
        return `[${moment(this.start).format()}]: "${this.summary}"`;
    }
}
exports.default = CalendarEvent;
