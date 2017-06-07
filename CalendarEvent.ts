import * as moment from 'moment';

export interface EventData {
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
  data: EventData;

  constructor(data: EventData) {
    this.data = data;
  }

  get id() { return this.data.googleId; }
  get calendarId() { return this.data.calendarGoogleId; }
  get summary() { return this.data.summary; }
  get description() { return this.data.description; }
  get start() { return this.data.start; }
  get end() { return this.data.end; }

  isPast() {
    return moment(this.start).isBefore(moment(), 'day');
  }

  isToday() {
    return moment(this.start).isSame(moment(), 'day');
  }

  toString() {
    return `[${moment(this.start).format()}]: "${this.summary}"`;
  }
}