import * as moment from 'moment';
import CalendarEvent from './CalendarEvent';
export default class Day {
    date: moment.Moment;
    events: Array<CalendarEvent>;
    constructor(date: moment.Moment, events: any);
    toString(): string;
}
