import * as moment from 'moment';

import {MongoClient} from 'mongodb';
import {EventStorage} from './EventStorage';
import CalendarEvent from './CalendarEvent';

export default class MongoStorage implements EventStorage {
  db: any;
  collection: any;

  async init(url: string) {
    this.db = await MongoClient.connect(url);
    this.collection = this.db.collection('events');
  }

  create(event: CalendarEvent) {
    return this.collection.insertOne(event.config);
  }

  update(eventId: string, event: CalendarEvent) {
    return this.collection.updateOne(
      {googleId: event.getId()},
      event
    );
  }

  findOne(eventId) {
    return this.collection.findOne({googleId: eventId});
  }

  async find(start: moment.Moment, end: moment.Moment, calendarId?: string) {
    return [];
  }
}