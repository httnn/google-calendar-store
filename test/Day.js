const {expect} = require('chai');
const Day = require('../lib/Day').default;
const moment = require('moment');

describe('Day', () => {
  it('truncates date to start of day', () => {
    const date = moment('Tue, 13 Jun 2017 18:25:30 GMT');
    const day = new Day(date, []);
    expect(day.date.format()).to.equal('2017-06-13T00:00:00+03:00');
  });
});