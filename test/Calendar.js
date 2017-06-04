const {expect} = require('chai');
const moment = require('moment');

const {Calendar, MemoryStorage} = require('../lib');

const googleId = '79s01e4s5i9pf1u0jr0kvtfjk4@group.calendar.google.com';
const apiKey = 'APIKEY';

const events = [
  {
    status: 'confirmed',
    id: 'event1Id',
    summary: 'Event 1 Summary',
    description: 'Event 1 Description',
    start: {
      date: '2017-05-31'
    },
    end: {
      date: '2017-06-01'
    }
  },
  {
    status: 'confirmed',
    id: 'event2Id',
    summary: 'Event 2 Summary',
    description: 'Event 2 Description',
    start: {
      dateTime: '2017-10-02T15:00:00Z'
    },
    end: {
      date: '2017-06-01'
    }
  },
  {
    status: 'cancelled',
    id: 'event3Id',
    summary: 'Event 3 Summary',
    description: 'Event 3 Description',
    start: {
      date: '2017-05-31'
    },
    end: {
      date: '2017-06-01'
    }
  }
];

const mockFetch = events => () => Promise.resolve({
  json: () => Promise.resolve({items: events})
});

describe('Calendar', () => {
  let storage, calendar;
  beforeEach(() => {
    storage = new MemoryStorage();
    calendar = new Calendar({apiKey, storage, googleId, name: 'calendar'});
  });

  describe('events update', () => {
    it('fetches from right url', () =>
      calendar.updateEvents(url => {
        expect(url).to.include(`https://www.googleapis.com/calendar/v3/calendars/${googleId}/events?key=${apiKey}&singleEvents=true&showDeleted=true&timeMin=`);
        return Promise.resolve({json: () => ({items: []})});
      })
    );

    it('increases event count by right amount', () =>
      calendar.updateEvents(mockFetch(events)).then(() => {
        expect(storage.events.length).to.equal(3);
      })
    );

    it('parses event date correctly', () =>
      calendar.updateEvents(mockFetch(events)).then(() => {
        expect(moment(storage.events[0].config.start).format('YYYY-MM-DD')).to.equal('2017-05-31');
        expect(moment(storage.events[1].config.start).format('YYYY-MM-DD')).to.equal('2017-10-02');
      })
    );

    it('updates changed events', () =>
      calendar.updateEvents(mockFetch(events)).then(() => {
        const newEvents = JSON.parse(JSON.stringify(events));
        newEvents[1].summary = 'updated summary';
        return calendar.updateEvents(mockFetch(newEvents));
      }).then(() => {
        expect(storage.events[1].config.summary).to.equal('updated summary');
      })
    );
  });

  describe('events query', () => {

  });
  
});