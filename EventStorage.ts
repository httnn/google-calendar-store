import * as moment from 'moment';
import CalendarEvent from './CalendarEvent';

export interface EventStorage {
  init(...args: Array<any>): Promise<void>;
  create(event: CalendarEvent): Promise<CalendarEvent>;
  update(eventId: string, event: CalendarEvent): Promise<CalendarEvent>;
  findOne(eventId: string): Promise<CalendarEvent | null>;
  find(start: moment.Moment, end: moment.Moment | void, calendarId?: string): Promise<Array<CalendarEvent>>;
};
