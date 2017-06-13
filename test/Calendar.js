const {expect} = require('chai');
const moment = require('moment');

const {Calendar, MemoryStorage} = require('../lib');

const googleId = process.env.CALENDAR_ID;
const apiKey = process.env.API_KEY;

const storage = new MemoryStorage();
const calendar = new Calendar({apiKey, storage, googleId});
(async () => {
  while (true) {
    await calendar.updateEvents();
    console.log(storage.events.join('\n'));
    await new Promise(ok => setTimeout(ok, 10000));
  }
})();