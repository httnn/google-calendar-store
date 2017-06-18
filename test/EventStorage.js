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
  end: now.add({day: 1}).toDate(),
  cancelled: false
};

storages.forEach(storageCreator => {
  describe(storageCreator.name, () => {
    let storage;
    beforeEach(async done => {
      storage = await storageCreator.create();
      done();
    });

    const createBaseEvent = () => storage.create(new CalendarEvent(baseEvent));

    it('creates an event', async () => {
      await createBaseEvent();
      const events = await storage.find('calendarGoogleId');
      expect(events.length).to.equal(1);
      expect(events[0].summary).to.equal('summary');
    });

    it('finds one event by id', async () => {
      await createBaseEvent();
      const event = await storage.findOne('one');
      expect(event.summary).to.equal('summary');
    });

    it('updates an event', async () => {
      await createBaseEvent();
      const secondEvent = new CalendarEvent(Object.assign({}, baseEvent, {googleId: 'two'}));
      await storage.create(secondEvent);
      secondEvent.data.summary = 'summary two';
      await storage.update('two', secondEvent);
      const events = await storage.find('calendarGoogleId');
      expect(events.length).to.equal(2);
      const eventTwo = await storage.findOne('two');
      expect(eventTwo.summary).to.equal('summary two');
    });

    it('finds events by calendarId', () => {

    });

    it('finds events by start date', () => {

    });

    it('finds events by end date', () => {

    });

    it('finds events by start and end date', () => {

    });

    it('does not return cancelled events', () => {

    });

    it('sorts events by date', () => {

    });
  });
});