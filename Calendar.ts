import * as moment from 'moment';
import {EventStorage} from './EventStorage';
import CalendarEvent, {CalendarEventPlaceholder} from './CalendarEvent';
import fetch from 'node-fetch';

export interface CalendarData {
  googleId: string,
  storage: EventStorage,
  apiKey: string
};

export interface RawEvent {
  [key: string]: any
};

const log = message => console.log(`[${moment().format()}] ${message}`);
const defaultWeekdays = [1, 2, 3, 4, 5, 6, 7];

class Day {
  date: moment.Moment;
  events: Array<CalendarEvent> = [];
  
  constructor(date: moment.Moment, events) {
    this.date = date.startOf('day');
    this.events = events;
  }

  toString() {
    return `${this.date.format()}: ${this.events.map(e => e.summary).join(', ')}`;
  }
}

export default class Calendar {
  data: CalendarData;
  
  constructor(data: CalendarData) {
    this.data = data;
  }

  parseDatetime(dateTime: any) {
    if (dateTime.date) {
      return moment(dateTime.date, 'YYYY-MM-DD');
    }
    return moment(dateTime.dateTime);
  }

  async upsertEvent(rawEvent: RawEvent) {
    const {storage, googleId} = this.data;
    const event = new CalendarEvent({
      googleId: rawEvent.id,
      calendarGoogleId: googleId,
      summary: rawEvent.summary,
      description: rawEvent.description,
      start: this.parseDatetime(rawEvent.start).toDate(),
      end: this.parseDatetime(rawEvent.end).toDate(),
      cancelled: rawEvent.status === 'cancelled'
    });
    const existing = await storage.findOne(event.id);
    if (existing) {
      await storage.update(event.id, event);
      return 'update';
    } else {
      await storage.create(event);
      return 'create';
    }
  }

  async startEventUpdates(intervalMinutes: number = 5) {
    log(`Updating "${this.data.googleId}" events...`);
    const [createdEvents, updatedEvents, failedUpserts] = await this.updateEvents();
    log(`Created ${createdEvents}, updated ${updatedEvents}, failed to upsert ${failedUpserts}.`);
    setTimeout(() => {
      this.startEventUpdates(intervalMinutes);
    }, intervalMinutes * 60 * 1000);
  }

  async updateEvents(fetchFn = fetch) {
    const {googleId, apiKey, storage} = this.data;
    const timeMin = encodeURIComponent(moment().add({days: -14}).format());
    const url = `https://www.googleapis.com/calendar/v3/calendars/${googleId}/events?key=${apiKey}&singleEvents=true&showDeleted=true&timeMin=${timeMin}`;
    try {
      const response = await fetchFn(url);
      const json = await response.json();
      if (json.error) {
        throw new Error(json.error.errors[0]);
      }

      let createdEvents = 0, updatedEvents = 0, failedUpserts = 0;
      for (const rawEvent of json.items) {
        try {
          const result = await this.upsertEvent(rawEvent);
          if (result === 'update') {
            updatedEvents++;
          } else {
            createdEvents++;
          }
        } catch (e) {
          failedUpserts++;
          console.error('Failed to upsert event:', rawEvent, e);
        }
      }
      return [createdEvents, updatedEvents, failedUpserts];
    } catch (e) {
      console.error('Failed to fetch events:', e);
    }
  }

  async getEvents(start: moment.Moment, end?: moment.Moment) {
    return this.data.storage.find(start.toDate(), end && end.toDate(), this.data.googleId);
  }

  getDatesByWeekOffsets(start: number, end?: number) {
    const now = moment();
    return [
      now.clone().add({weeks: start}).startOf('isoWeek'),
      end ? now.clone().add({weeks: end}).endOf('isoWeek') : null
    ];
  }

  async getWeeklyEvents(startOffsetWeeks: number, endOffsetWeeks?: number, weekdays: Array<number> = defaultWeekdays) {
    const [start, end] = this.getDatesByWeekOffsets(startOffsetWeeks, endOffsetWeeks);
    const events = await this.getEvents(start, end && end);
    const weeklyEvents = [];
    let previousWeekNumber, index = 0;
    for (const event of events) {
      const weekNumber = moment(event.start).week();
      
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

      const weekday = moment(event.start).isoWeekday();
      if (weekdays.indexOf(weekday) > -1) {
        weeklyEvents[index][weekday] = event;
      }
    }
    return weeklyEvents;
  }

  async getFilledCalendar(startOffsetWeeks: number, endOffsetWeeks: number, weekdays: Array<number> = defaultWeekdays) {
    const [start, end] = this.getDatesByWeekOffsets(startOffsetWeeks, endOffsetWeeks);
    const allEvents = await this.getEvents(start, end);

    const now = moment();
    const weeks = [];
    for (let i = 0; i < endOffsetWeeks - startOffsetWeeks; i++) {
      const days = weekdays.map(weekday => {
        const start = now.clone().add({weeks: startOffsetWeeks + i}).isoWeekday(weekday);
        const events = allEvents.filter(event => start.isSame(event.start, 'day'));
        return new Day(start, events);
      });
      weeks.push(days);
    }
    return weeks;
  }
}