# google-calendar-store
A library that fetches and stores events from Google calendars, and provides interfaces for querying events. Useful for displaying Google calendar events in custom ways.

## Install
`npm install google-calendar-store`

## Quick start
```js
// 1. Import relevant classes.
import {Calendar, MemoryStorage} from 'google-calendar-store';

// 2. Create storage engine.
const storage = new MemoryStorage();

// 3. Create calendar.
const calendar = new Calendar({
  googleId: 'GOOGLE CALENDAR ID HERE',
  apiKey: 'GOOGLE API KEY HERE',
  storage
});

// 4. Start fetching events every 5 minutes.
calendar.startEventUpdates();

// 5. Query events.
calendar.getWeeklyEvents(0, 4);
```

## Storage engines
This library comes equipped with two storage engines:
1. `MemoryStorage`, which stores events in memory.
2. `MongoStorage`, which stores events in MongoDB.

Creating a new MemoryStorage is easy, it just needs to implement the `EventStorage` interface.
