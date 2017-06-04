export interface Config {
    googleId: string;
    calendarGoogleId: string;
    summary: string;
    description: string;
    start: Date;
    end: Date;
    cancelled: boolean;
}
export declare class CalendarEventPlaceholder {
    date: Date;
    constructor(date: Date);
    toString(): string;
}
export default class CalendarEvent {
    config: Config;
    constructor(config: Config);
    getId(): string;
    getCalendarId(): string;
    isPast(): boolean;
    isToday(): boolean;
    toString(): string;
}
