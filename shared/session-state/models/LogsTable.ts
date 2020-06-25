import BaseTable from '../lib/BaseTable';
import { Database as SqliteDatabase } from 'better-sqlite3';

export default class LogsTable extends BaseTable<ILogRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'PageLogs', [
      ['frameId', 'TEXT'],
      ['type', 'TEXT'],
      ['message', 'TEXT'],
      ['timestamp', 'TEXT'],
      ['location', 'TEXT'],
    ]);
  }

  public insert(frameId: string, type: string, message: string, date: Date, location?: string) {
    return this.pendingInserts.push([frameId, type, message, date.toISOString(), location]);
  }
}

export interface ILogRecord {
  frameId: string;
  type: string;
  message: string;
  timestamp: string;
  location?: string;
}
