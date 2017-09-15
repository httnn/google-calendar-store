# google-calendar-store
A library that fetches and stores events from Google calendars, and provides interfaces for querying events. Useful for displaying Google calendar events in custom ways.

## Install
`npm install google-calendar-store`

## Quick start
```js
// 1. Import relevant classes and moment.
import {Calendar, MemoryStorage} from 'google-calendar-store';
import moment from 'moment';

(async () => {
  // 2. Create storage engine.
  const storage = new MongoStorage();
  await storage.init();

  // 3. Create calendar.
  const calendar = new Calendar({
    googleId: 'GOOGLE CALENDAR ID HERE',
    apiKey: 'GOOGLE API KEY HERE',
    storage
  });

  // 4. Start fetching events every 5 minutes.
  calendar.startEventUpdates();

  // 5. Query events.
  const start = moment();
  const end = start.clone().add({months: 3});
  const weeks = await calendar.getFilledCalendar(start, end);

  // 6. Do something with events.
  for (const week of weeks) {
    for (const day of week.days) {
      for (const event of day.events) {
        console.log(event.description);
      }
    }
  }
})();
```

## API

### class Calendar
```ts
// Instantiates a new Calendar instance for a specific Google calendar.
const calendar = new Calendar({googleId: string, storage: EventStorage, apiKey: string})

// Fetches and updates events from Google, going back how every many years specified as the argument.
calendar.updateEvents(years?: number = 1)

// Fetches events every intervalMinutes minutes, the years argument is the same one as with updateEvents.
calendar.startEventUpdates(intervalMinutes: number = 5, years?: number): void

// Stops automatic updates initiated by startEventUpdates.
calendar.stopEventUpdates(): void

// Fetches events from the storage as specified by start and end times.
calendar.getEvents(start: Moment, end?: Moment): Promise<Array<CalendarEvent>>

// Returns a structure with an instance for every day within the range even if the day doesn't contain any events.
calendar.getFilledCalendar(start: number | Moment, end: number | Moment, weekdays: Array<number>): Promise<Array<Week>>
```

### class CalendarEvent
```ts
// Not meant to be instantiated anywhere else than in an EventStorage.

// Properties:
googleId: string;
calendarGoogleId: string;
summary: string;
description: string;
start: Date;
end: Date;
cancelled: boolean;

// Methods:
isPast(): boolean;
isToday(): boolean;
```

### class Day
```ts
// Not meant to be instantiated.

// Properties:
date: Moment;
events: Array<CalendarEvent> = [];

// Methods:
hasEvents(): boolean;
```

### class Week
```ts
// Not meant to be instantiated.

// Properties:
days: Array<Day>;

// Methods:
hasEvents(): boolean;
```

### class MongoStorage
```ts
const storage = new MongoStorage();

storage.init(url: string = process.env.MONGO_URL): Promise<void>;
```

### class MemoryStorage
```ts
// Used for debugging, use a proper storage driver for production use.

const storage = new MemoryStorage();
```




## Storage engines
This library comes equipped with two storage engines:
1. `MemoryStorage`, which stores events in memory.
2. `MongoStorage`, which stores events in MongoDB.

Creating a new MemoryStorage is easy, it just needs to implement the `EventStorage` interface.
