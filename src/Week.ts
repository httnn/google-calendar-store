import Day from './Day';

export default class Week {
  days: Array<Day> = [];

  constructor(days: Array<Day>) {
    this.days = days.sort((a, b) => a.date.diff(b.date));
  }

  hasEvents() {
    return this.days.some(day => day.hasEvents());
  }

  toString() {
    return `WEEK:\n${this.days.join('\n')}`;
  }
}
