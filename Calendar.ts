import * as moment from 'moment';
import {EventStorage} from './EventStorage';
import CalendarEvent from './CalendarEvent';
import fetch from 'node-fetch';

interface Config {
  name: string,
  googleId: string,
  storage: EventStorage,
  apiKey: string
};

interface RawEvent {
  [key: string]: any
};

const log = message => console.log(moment().format() + message);

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
      start: this.parseDatetime(rawEvent.start),
      end: this.parseDatetime(rawEvent.end),
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
    log(`Updating "${this.config.name}" events...`);
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

  async getWeeklyEvents(start: moment.Moment, end: moment.Moment | void, weekdays: Array<number> = [0,1,2,3,4,5,6]) {
    const events = await this.config.storage.find(start, end, this.config.googleId);
    const weeklyEvents = [];
    let previousWeekNumber, index = 0;
    for (const event of events) {
      const weekNumber = event.config.start.week();
      
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

      const weekday = event.config.start.weekday();
      if (weekdays.indexOf(weekday) > -1) {
        weeklyEvents[index][weekday] = event;
      }
    }
    return weeklyEvents;
  }

  async getFilledCalendar(startOffsetWeeks: number, endOffsetWeeks: number, weekdays: Array<number> = [0,1,2,3,4,5,6]) {
    const now = moment();
    const start = now.add({weeks: startOffsetWeeks});
    const end = now.add({weeks: endOffsetWeeks});
    const weeklyEvents = await this.getWeeklyEvents(start, end);

    const weeks = [];
    for (let i = 0; i < endOffsetWeeks - startOffsetWeeks; i++) {
      const events = weekdays.map(weekday => {
        const event = weeklyEvents[i][weekday];
        if (event) {
          return event;
        } else {
          const start = now.add({weeks: startOffsetWeeks + i}).weekday(weekday);
          return {start};
        }
      });
      weeks.push(events);
    }
  }
}