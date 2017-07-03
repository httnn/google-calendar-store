const {expect} = require('chai');
const moment = require('moment');
const {Calendar, MemoryStorage, MongoStorage, CalendarEvent} = require('../lib');

const storages = [
  {
    name: 'MongoStorage',
    async create() {
      const storage = new MongoStorage();
      await storage.init('mongodb://localhost/calendarservice');
      await storage.collection.deleteMany();
      return storage;
    }
  },
  {
    name: 'MemoryStorage',
    async create() {
      return new MemoryStorage();
    }
  }
];

const now = moment();
const baseEvent = {
  googleId: 'one',
  calendarGoogleId: 'calendarGoogleId',
  summary: 'summary',
  description: 'description',
  start: now.toDate(),
  cancelled: false
};

storages.forEach(storageCreator => {
  describe(storageCreator.name, () => {
    let storage;
    beforeEach(async done => {
      storage = await storageCreator.create();
      done();
    });

    const createEvent = (data = {}) => {
      const eventData = Object.assign({}, baseEvent, data);
      eventData.end = moment(eventData.start).clone().add({day: 1}).toDate();
      return storage.create(new CalendarEvent(eventData));
    };

    it('creates an event', async () => {
      await createEvent();
      const events = await storage.find('calendarGoogleId');
      expect(events).to.have.lengthOf(1);
      expect(events[0].summary).to.eq('summary');
    });

    it('finds one event by id', async () => {
      await createEvent();
      const event = await storage.findOne('one');
      expect(event.summary).to.eq('summary');
    });

    it('findOne returns CalendarEvent', async () => {
      await createEvent();
      const event = await storage.findOne('one');
      expect(event).to.be.an.instanceOf(CalendarEvent);
    });

    it('findOne does not return CalendarEvent', async () => {
      await createEvent();
      const event = await storage.findOne('two');
      expect(event).to.be.null;
    });

    it('find returns array of CalendarEvent', async () => {
      await createEvent();
      const events = await storage.find();
      expect(events).to.have.lengthOf(1);
      expect(events[0]).to.be.an.instanceOf(CalendarEvent);
    });

    it('updates an event', async () => {
      await createEvent();
      const secondEvent = new CalendarEvent(Object.assign({}, baseEvent, {googleId: 'two'}));
      await storage.create(secondEvent);
      secondEvent.data.summary = 'summary two';
      await storage.update('two', secondEvent);
      const events = await storage.find('calendarGoogleId');
      expect(events).to.have.lengthOf(2);
      const eventTwo = await storage.findOne('two');
      expect(eventTwo.summary).to.eq('summary two');
    });

    it('finds events by calendarId', async () => {
      await createEvent();
      await createEvent({calendarGoogleId: 'cal2', summary: 'second'});
      const events = await storage.find('cal2');
      expect(events).to.have.lengthOf(1);
      expect(events[0].summary).to.eq('second');
    });

    it('finds events by start date', async () => {
      await createEvent({summary: 'past', start: now.clone().add({day: -1}).toDate()});
      await createEvent({summary: 'future', start: now.clone().add({day: 1}).toDate()});
      const events = await storage.find('calendarGoogleId', now.toDate());
      expect(events).to.have.lengthOf(1);
      expect(events[0].summary).to.eq('future');
    });

    it('finds events by end date', async () => {
      await createEvent({summary: 'past', start: now.clone().add({day: -1}).toDate()});
      await createEvent({summary: 'future', start: now.clone().add({day: 1}).toDate()});
      const events = await storage.find('calendarGoogleId', null, now.toDate());
      expect(events).to.have.lengthOf(1);
      expect(events[0].summary).to.eq('past');
    });

    it('finds events by start and end date', async () => {
      const start = now.clone().add({day: -1});
      const end = now.clone().add({day: 1});
      await createEvent({summary: 'past', start: start.toDate()});
      await createEvent({summary: 'now 1'});
      await createEvent({summary: 'now 2'});
      await createEvent({summary: 'future', start: end.toDate()});
      const events = await storage.find('calendarGoogleId', start.clone().add({minute: 1}).toDate(), end.toDate());
      expect(events).to.have.lengthOf(2);
      expect(events[0].summary).to.eq('now 1');
      expect(events[1].summary).to.eq('now 2');
    });

    it('does not return cancelled events', async () => {
      await createEvent({summary: 'active'});
      await createEvent({cancelled: true, summary: 'cancelled'});
      const events = await storage.find();
      expect(events).to.have.lengthOf(1);
      expect(events[0].summary).to.eq('active');
    });

    it('sorts events by date', () => {

    });
  });
});