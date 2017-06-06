import * as moment from 'moment';
import {EventStorage} from './EventStorage';
import CalendarEvent, {CalendarEventPlaceholder} from './CalendarEvent';
import fetch from 'node-fetch';

export interface Config {
  googleId: string,
  storage: EventStorage,
  apiKey: string
};

export interface RawEvent {
  [key: string]: any
};

const log = message => console.log(`[${moment().format()}] ${message}`);

export default class Calendar {
  config: Config;
  
  constructor(config: Config) {
    this.config = config;
  }

  parseDatetime(dateTime: any) {
    if (dateTime.date) {
      return moment(dateTime.date, 'YYYY-MM-DD');
    }
    return moment(dateTime.dateTime);
  }

  async upsertEvent(rawEvent: RawEvent) {
    const {storage, googleId} = this.config;
    const event = new CalendarEvent({
      googleId: rawEvent.id,
      calendarGoogleId: googleId,
      summary: rawEvent.summary,
      description: rawEvent.description,
      start: this.parseDatetime(rawEvent.start).toDate(),
      end: this.parseDatetime(rawEvent.end).toDate(),
      cancelled: rawEvent.status === 'cancelled'
    });
    const existing = await storage.findOne(event.getId());
    if (existing) {
      await storage.update(event.getId(), event);
      return 'update';
    } else {
      await storage.create(event);
      return 'create';
    }
  }

  async startEventUpdates(intervalMinutes: number = 5) {
    log(`Updating "${this.config.googleId}" events...`);
    const [createdEvents, updatedEvents, failedUpserts] = await this.updateEvents();
    log(`Created ${createdEvents}, updated ${updatedEvents}, failed to upsert ${failedUpserts}.`);
    setTimeout(() => {
      this.startEventUpdates(intervalMinutes);
    }, intervalMinutes * 60 * 1000);
  }

  async updateEvents(fetchFn = fetch) {
    const {googleId, apiKey, storage} = this.config;
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
    return this.config.storage.find(start.toDate(), end && end.toDate(), this.config.googleId);
  }

  async getWeeklyEvents(start: moment.Moment, end?: moment.Moment, weekdays: Array<number> = [1,2,3,4,5,6,7]) {
    const events = (await this.getEvents(start, end && end)).sort((a, b) => a > b ? 1 : -1);
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
  }

  async getFilledCalendar(startOffsetWeeks: number, endOffsetWeeks: number, weekdays: Array<number> = [1,2,3,4,5,6,7]) {
    const now = moment();
    const start = now.clone().add({weeks: startOffsetWeeks}).startOf('isoWeek');
    const end = now.clone().add({weeks: endOffsetWeeks}).endOf('isoWeek');
    const allEvents = await this.getEvents(start, end);

    const weeks = [];
    for (let i = 0; i < endOffsetWeeks - startOffsetWeeks; i++) {
      const events = weekdays.map(weekday => {
        const start = now.clone().add({weeks: startOffsetWeeks + i}).isoWeekday(weekday);
        const event = allEvents.find(event => start.isSame(event.config.start, 'day'));
        if (event) {
          return event;
        } else {
          return new CalendarEventPlaceholder(start.toDate());
        }
      });
      weeks.push(events);
    }
    return weeks;
  }
}