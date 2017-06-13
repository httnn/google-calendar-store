import * as moment from 'moment';
import CalendarEvent from './CalendarEvent';
import {EventStorage} from './EventStorage';

export default class MemoryStorage implements EventStorage {
  events: Array<CalendarEvent>;

  constructor() {
    this.events = [];
  }

  init() {
    return Promise.resolve();
  }

  findOne(eventId) {
    const e = this.events.find(e => e.id === eventId);
    return Promise.resolve(e);
  }

  update(eventId, event) {
    const index = this.events.findIndex(e => e.id === eventId);
    this.events[index] = event;
    return Promise.resolve(event);
  }

  create(event) {
    this.events.push(event);
    return Promise.resolve(event);
  }

  find(start, end, calendarId) {
    const results = this.events.filter(e =>
      moment(e.start).isSameOrAfter(start)
      && moment(e.end).isSameOrBefore(end)
      && (!calendarId || e.calendarId === calendarId)
    );
    return Promise.resolve(results);
  }
};
