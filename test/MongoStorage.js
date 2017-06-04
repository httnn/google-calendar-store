const moment = require('moment');
const {Calendar, MongoStorage} = require('../lib');

const apiKey = process.env.API_KEY;
const googleId = '79s01e4s5i9pf1u0jr0kvtfjk4@group.calendar.google.com';

describe('MongoStorage', () => {
  let storage, calendar;
  before(done => {
    storage = new MongoStorage();
    calendar = new Calendar({googleId, apiKey, storage});
    storage.init('mongodb://localhost/calendarservice').then(done);
  });

  it('asd', () =>
    calendar.getWeeklyEvents(moment()).then(console.log)
  );
});