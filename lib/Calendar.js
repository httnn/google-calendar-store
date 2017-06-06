"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
const CalendarEvent_1 = require("./CalendarEvent");
const node_fetch_1 = require("node-fetch");
;
;
const log = message => console.log(`[${moment().format()}] ${message}`);
class Calendar {
    constructor(config) {
        this.config = config;
    }
    parseDatetime(dateTime) {
        if (dateTime.date) {
            return moment(dateTime.date, 'YYYY-MM-DD');
        }
        return moment(dateTime.dateTime);
    }
    upsertEvent(rawEvent) {
        return __awaiter(this, void 0, void 0, function* () {
            const { storage, googleId } = this.config;
            const event = new CalendarEvent_1.default({
                googleId: rawEvent.id,
                calendarGoogleId: googleId,
                summary: rawEvent.summary,
                description: rawEvent.description,
                start: this.parseDatetime(rawEvent.start).toDate(),
                end: this.parseDatetime(rawEvent.end).toDate(),
                cancelled: rawEvent.status === 'cancelled'
            });
            const existing = yield storage.findOne(event.getId());
            if (existing) {
                yield storage.update(event.getId(), event);
                return 'update';
            }
            else {
                yield storage.create(event);
                return 'create';
            }
        });
    }
    startEventUpdates(intervalMinutes = 5) {
        return __awaiter(this, void 0, void 0, function* () {
            log(`Updating "${this.config.googleId}" events...`);
            const [createdEvents, updatedEvents, failedUpserts] = yield this.updateEvents();
            log(`Created ${createdEvents}, updated ${updatedEvents}, failed to upsert ${failedUpserts}.`);
            setTimeout(() => {
                this.startEventUpdates(intervalMinutes);
            }, intervalMinutes * 60 * 1000);
        });
    }
    updateEvents(fetchFn = node_fetch_1.default) {
        return __awaiter(this, void 0, void 0, function* () {
            const { googleId, apiKey, storage } = this.config;
            const timeMin = encodeURIComponent(moment().add({ days: -14 }).format());
            const url = `https://www.googleapis.com/calendar/v3/calendars/${googleId}/events?key=${apiKey}&singleEvents=true&showDeleted=true&timeMin=${timeMin}`;
            try {
                const response = yield fetchFn(url);
                const json = yield response.json();
                if (json.error) {
                    throw new Error(json.error.errors[0]);
                }
                let createdEvents = 0, updatedEvents = 0, failedUpserts = 0;
                for (const rawEvent of json.items) {
                    try {
                        const result = yield this.upsertEvent(rawEvent);
                        if (result === 'update') {
                            updatedEvents++;
                        }
                        else {
                            createdEvents++;
                        }
                    }
                    catch (e) {
                        failedUpserts++;
                        console.error('Failed to upsert event:', rawEvent, e);
                    }
                }
                return [createdEvents, updatedEvents, failedUpserts];
            }
            catch (e) {
                console.error('Failed to fetch events:', e);
            }
        });
    }
    getEvents(start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.config.storage.find(start.toDate(), end && end.toDate(), this.config.googleId);
        });
    }
    getWeeklyEvents(start, end, weekdays = [1, 2, 3, 4, 5, 6, 7]) {
        return __awaiter(this, void 0, void 0, function* () {
            const events = (yield this.getEvents(start, end && end)).sort((a, b) => a > b ? 1 : -1);
            const weeklyEvents = [];
            let previousWeekNumber, index = 0;
            for (const event of events) {
                const weekNumber = moment(event.config.start).week();
                if (!previousWeekNumber) {
                    previousWeekNumber = weekNumber;
                }
                if (weekNumber !== previousWeekNumber) {
                    index++;
                    previousWeekNumber = weekNumber;
                }
                if (!weeklyEvents[index]) {
                    weeklyEvents[index] = {};
                }
                const weekday = moment(event.config.start).isoWeekday();
                if (weekdays.indexOf(weekday) > -1) {
                    weeklyEvents[index][weekday] = event;
                }
            }
            return weeklyEvents;
        });
    }
    getFilledCalendar(startOffsetWeeks, endOffsetWeeks, weekdays = [1, 2, 3, 4, 5, 6, 7]) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = moment();
            const start = now.clone().add({ weeks: startOffsetWeeks });
            const end = now.clone().add({ weeks: endOffsetWeeks });
            const allEvents = yield this.getEvents(start, end);
            const weeks = [];
            for (let i = 0; i < endOffsetWeeks - startOffsetWeeks; i++) {
                const events = weekdays.map(weekday => {
                    const start = now.clone().add({ weeks: startOffsetWeeks + i }).isoWeekday(weekday);
                    const event = allEvents.find(event => start.isSame(event.config.start, 'day'));
                    if (event) {
                        return event;
                    }
                    else {
                        return new CalendarEvent_1.CalendarEventPlaceholder(start.toDate());
                    }
                });
                weeks.push(events);
            }
            return weeks;
        });
    }
}
exports.default = Calendar;
