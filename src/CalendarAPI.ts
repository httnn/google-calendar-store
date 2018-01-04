import * as google from 'googleapis';
const calendarAPI = google.calendar('v3');

export default class CalendarAPI {
  private jwtClient: any;

  constructor(clientEmail: string, privateKey: string) {
    this.jwtClient = new google.auth.JWT(
      clientEmail,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/calendar'],
      null
    );
  }

  getEvents(query): Promise<any> {
    return new Promise((resolve, reject) => {
      this.jwtClient.authorize((err, tokens) => {
        if (err) {
          reject(err);
        } else {
          calendarAPI.events.list({
            auth: this.jwtClient,
            ...query
          }, (err, resp) => {
            if (err) {
              reject(err);
            } else {
              resolve(resp);
            }
          });
        }
      });
    });    
  }
}
