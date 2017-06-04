import CalendarEvent from './CalendarEvent';
import { EventStorage } from './EventStorage';
export default class MemoryStorage implements EventStorage {
    events: Array<CalendarEvent>;
    constructor();
    init(): Promise<void>;
    findOne(eventId: any): Promise<CalendarEvent>;
    update(eventId: any, event: any): Promise<any>;
    create(event: any): Promise<any>;
    find(start: any, end: any, calendarId: any): Promise<CalendarEvent[]>;
}
