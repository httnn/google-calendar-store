"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const CalendarEvent_1 = require("./CalendarEvent");
class MongoStorage {
    init(url = process.env.MONGO_URL) {
        return __awaiter(this, void 0, void 0, function* () {
            this.db = yield mongodb_1.MongoClient.connect(url);
            this.collection = this.db.collection('events');
        });
    }
    create(event) {
        return this.collection.insertOne(event.config);
    }
    update(eventId, event) {
        return this.collection.updateOne({ googleId: eventId }, event.config);
    }
    findOne(eventId) {
        return this.collection.findOne({ googleId: eventId });
    }
    find(start, end, calendarId) {
        return __awaiter(this, void 0, void 0, function* () {
            const items = yield this.collection.find({
                calendarGoogleId: calendarId,
                cancelled: false,
                start: { $gte: start },
                end: end ? { $lte: end } : undefined
            }, {
                sort: [['start', 'asc']]
            }).toArray();
            return items.map(i => new CalendarEvent_1.default(i));
        });
    }
}
exports.default = MongoStorage;
