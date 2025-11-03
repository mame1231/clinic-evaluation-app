import { google } from 'googleapis';

export class GoogleSheetsService {
  private sheets;
  private auth;

  constructor() {
    this.auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  async addLikeRecord(data: {
    date: Date;
    senderName: string;
    receiverName: string;
    comment: string;
  }) {
    try {
      const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
      
      if (!spreadsheetId) {
        console.error('Google Sheets ID not configured');
        return;
      }

      const values = [[
        data.date.toLocaleString('ja-JP'),
        data.senderName,
        data.receiverName,
        data.comment,
      ]];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sheet1!A:D',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });
    } catch (error) {
      console.error('Error writing to Google Sheets:', error);
      throw error;
    }
  }

  async deleteOldRecords(beforeDate: Date) {
    try {
      const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
      
      if (!spreadsheetId) {
        console.error('Google Sheets ID not configured');
        return;
      }

      // Get all data
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Sheet1!A:D',
      });

      const rows = response.data.values || [];
      const rowsToKeep = [rows[0]]; // Keep header row

      // Filter rows to keep only those after beforeDate
      for (let i = 1; i < rows.length; i++) {
        const dateStr = rows[i][0];
        const rowDate = new Date(dateStr);
        if (rowDate >= beforeDate) {
          rowsToKeep.push(rows[i]);
        }
      }

      // Clear and update sheet
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: 'Sheet1!A:D',
      });

      if (rowsToKeep.length > 0) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId,
          range: 'Sheet1!A:D',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: rowsToKeep },
        });
      }
    } catch (error) {
      console.error('Error deleting old records from Google Sheets:', error);
      throw error;
    }
  }
}