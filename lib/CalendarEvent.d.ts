export interface EventData {
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
    data: EventData;
    constructor(data: EventData);
    readonly id: string;
    readonly calendarId: string;
    readonly summary: string;
    readonly description: string;
    readonly start: Date;
    readonly end: Date;
    isPast(): boolean;
    isToday(): boolean;
    toString(): string;
}
