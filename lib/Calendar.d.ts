/// <reference types="node" />
import * as moment from 'moment';
import { EventStorage } from './EventStorage';
import CalendarEvent from './CalendarEvent';
export interface RawEvent {
    [key: string]: any;
}
export interface CalendarData {
    googleId: string;
    storage: EventStorage;
    apiKey: string;
}
export default class Calendar {
    data: CalendarData;
    syncToken: string;
    eventUpdateTimeout: NodeJS.Timer;
    constructor(data: CalendarData);
    parseDatetime(dateTime: any): moment.Moment;
    upsertEvent(rawEvent: RawEvent): Promise<"update" | "create">;
    startEventUpdates(intervalMinutes?: number): Promise<void>;
    stopEventUpdates(): void;
    fetchEvents(fetchFn?: any): Promise<any[]>;
    updateEvents(): Promise<void>;
    getEvents(start: moment.Moment, end?: moment.Moment): Promise<CalendarEvent[]>;
    getDatesByWeekOffsets(start: number, end?: number): moment.Moment[];
    getWeeklyEvents(startOffsetWeeks: number, endOffsetWeeks?: number, weekdays?: Array<number>): Promise<any[]>;
    getFilledCalendar(startOffsetWeeks: number, endOffsetWeeks: number, weekdays?: Array<number>): Promise<any[]>;
}
