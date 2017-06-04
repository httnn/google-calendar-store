import * as moment from 'moment';

interface Config {
  googleId: string,
  calendarGoogleId: string,
  summary: string,
  description: string,
  start: moment.Moment,
  end: moment.Moment,
  cancelled: boolean
};

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
    return this.config.start.isBefore(moment());
  }

  isToday() {
    return this.config.start.isSame(moment(), 'day');
  }
}