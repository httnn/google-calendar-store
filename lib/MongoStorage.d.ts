import { EventStorage } from './EventStorage';
import CalendarEvent from './CalendarEvent';
export default class MongoStorage implements EventStorage {
    db: any;
    collection: any;
    init(url?: string): Promise<void>;
    create(event: CalendarEvent): any;
    update(eventId: string, event: CalendarEvent): any;
    findOne(eventId: any): any;
    find(start: any, end: any, calendarId: any): Promise<any>;
}
