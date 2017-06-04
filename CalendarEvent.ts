import * as moment from 'moment';

export interface Config {
  googleId: string,
  calendarGoogleId: string,
  summary: string,
  description: string,
  start: Date,
  end: Date,
  cancelled: boolean
};

export class CalendarEventPlaceholder {
  date: Date;

  constructor(date: Date) {
    this.date = date;
  }

  toString() {
    return `[${moment(this.date).format()}] PLACEHOLDER`;
  }
}

export default class CalendarEvent {
  config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  getId() {
    return this.config.googleId;
  }

  getCalendarId() {
    return this.config.calendarGoogleId;
  }

  isPast() {
    return moment(this.config.start).isBefore(moment());
  }

  isToday() {
    return moment(this.config.start).isSame(moment(), 'day');
  }

  toString() {
    return `[${moment(this.config.start).format()}]: "${this.config.summary}"`;
  }
}