import * as moment from 'moment';
import {stringify} from 'querystring';
import {EventStorage} from './EventStorage';
import CalendarEvent, {CalendarEventPlaceholder} from './CalendarEvent';
import fetch from 'node-fetch';

import Week from './Week';
import Day from './Day';

const log = message => console.log(`[${moment().format()}] ${message}`);
const defaultWeekdays = [1, 2, 3, 4, 5, 6, 7];

class EventFetchError extends Error {
  response: any;
  constructor(message, response) {
    super(message);
    this.name = 'EventFetchError';
    this.response = response;
  }
}

export interface RawEvent {
  [key: string]: any
};

export interface CalendarData {
  googleId: string,
  storage: EventStorage,
  apiKey: string
};

export default class Calendar {
  data: CalendarData;
  syncToken: string;
  eventUpdateTimeout: NodeJS.Timer;
  
  constructor(data: CalendarData) {
    this.data = {...data};
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

  async startEventUpdates(intervalMinutes: number = 5, years?: number) {
    await this.updateEvents(years);
    this.eventUpdateTimeout = setTimeout(() => {
      this.startEventUpdates(intervalMinutes, years);
    }, intervalMinutes * 60 * 1000);
  }

  stopEventUpdates() {
    clearTimeout(this.eventUpdateTimeout);
  }

  async fetchEvents(years: number = 1, fetchFn = fetch) {
    const {googleId, apiKey} = this.data;
    const timeMin = moment().add({year: -years}).format();
    let items = [], pageToken;
    while (true) {
      const query = {
        key: apiKey,
        singleEvents: true,
        showDeleted: true,
        timeMin,
        pageToken,
        syncToken: this.syncToken
      };
      if (this.syncToken) {
        delete query.timeMin;
      } else {
        delete query.syncToken;
      }
      const url = `https://www.googleapis.com/calendar/v3/calendars/${googleId}/events?${stringify(query)}`;
      const response = await fetchFn(url);
      const json = await response.json();
      if (!response.ok) {
        throw new EventFetchError(`Failed to fetch events for ${this.data.googleId}`, json);
      }
      if (json.items) {
        items = items.concat(json.items);
      }
      if (json.nextPageToken) {
        pageToken = json.nextPageToken;
      } else {
        this.syncToken = json.nextSyncToken;
        break;
      }
    }
    return items;
  }

  async updateEvents(years?: number) {
    log(`Updating "${this.data.googleId}" events...`);
    const {storage} = this.data;
    try {
      const events = await this.fetchEvents(years);
      let createdEvents = 0, updatedEvents = 0, failedUpserts = 0;
      for (const rawEvent of events) {
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
      log(`Created ${createdEvents}, updated ${updatedEvents}, failed to upsert ${failedUpserts}.`);
    } catch (e) {
      console.error('Failed to fetch events:', e);
    }
  }

  async getEvents(start: moment.Moment, end?: moment.Moment) {
    return this.data.storage.find(this.data.googleId, start.toDate(), end && end.toDate());
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

  async getFilledCalendar(start: number | moment.Moment, end: number | moment.Moment, weekdays: Array<number> = defaultWeekdays): Promise<Array<Week>> {
    let allEvents, weekCount, startWeek;
    if (typeof start === 'number' && typeof end === 'number') {
      const [s, e] = this.getDatesByWeekOffsets(start, end);
      weekCount = end - start;
      startWeek = s;
      allEvents = await this.getEvents(s, e);
    } else if (moment.isMoment(start) && moment.isMoment(end)) {
      weekCount = end.diff(start, 'weeks') + 1;
      allEvents = await this.getEvents(start, end);
      startWeek = start;
    } else {
      throw new Error('start and end have to be numbers or moments!');
    }

    const weeks = [];
    for (let i = 0; i < weekCount; i++) {
      const days = weekdays.map(weekday => {
        const start = startWeek.clone().add({weeks: i}).isoWeekday(weekday);
        const events = allEvents.filter(event => start.isSame(event.start, 'day'));
        return new Day(start, events);
      });
      weeks.push(new Week(days));
    }
    return weeks;
  }
}
