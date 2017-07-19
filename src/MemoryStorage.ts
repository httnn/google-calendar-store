import * as moment from 'moment';
import CalendarEvent from './CalendarEvent';
import {EventStorage} from './EventStorage';

export default class MemoryStorage implements EventStorage {
  events: Array<CalendarEvent>;

  constructor() {
    this.events = [];
  }

  async init() {}

  async findOne(eventId) {
    const e = this.events.find(e => e.id === eventId);
    return e || null;
  }

  async update(eventId, event) {
    const index = this.events.findIndex(e => e.id === eventId);
    this.events[index] = event;
    return event;
  }

  async create(event) {
    this.events.push(event);
    return event;
  }

  async find(calendarId, start, end) {
    const results = this.events.filter(e =>
      (!start || moment(e.start).isSameOrAfter(start))
      && (!end || moment(e.start).isSameOrBefore(end))
      && (!calendarId || e.calendarId === calendarId)
      && !e.cancelled
    );
    return results;
  }
};
