import * as moment from 'moment';
import { EventStorage } from './EventStorage';
import CalendarEvent from './CalendarEvent';
export interface CalendarData {
    googleId: string;
    storage: EventStorage;
    apiKey: string;
}
export interface RawEvent {
    [key: string]: any;
}
export default class Calendar {
    data: CalendarData;
    constructor(data: CalendarData);
    parseDatetime(dateTime: any): moment.Moment;
    upsertEvent(rawEvent: RawEvent): Promise<"update" | "create">;
    startEventUpdates(intervalMinutes?: number): Promise<void>;
    updateEvents(fetchFn?: any): Promise<number[]>;
    getEvents(start: moment.Moment, end?: moment.Moment): Promise<CalendarEvent[]>;
    getDatesByWeekOffsets(start: number, end?: number): moment.Moment[];
    getWeeklyEvents(startOffsetWeeks: number, endOffsetWeeks?: number, weekdays?: Array<number>): Promise<any[]>;
    getFilledCalendar(startOffsetWeeks: number, endOffsetWeeks: number, weekdays?: Array<number>): Promise<any[]>;
}
