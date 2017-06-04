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
    constructor(config) {
        this.config = config;
    }
    getId() {
        return this.config.googleId;
    }
    getCalendarId() {
        return this.config.calendarGoogleId;
    }
    isPast() {
        return moment(this.config.start).isBefore(moment());
    }
    isToday() {
        return moment(this.config.start).isSame(moment(), 'day');
    }
    toString() {
        return `[${moment(this.config.start).format()}]: "${this.config.summary}"`;
    }
}
exports.default = CalendarEvent;
