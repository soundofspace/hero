import * as Fs from 'fs';
import * as Path from 'path';

const dbDir = Path.resolve(__dirname, '../../data');
if (!Fs.existsSync(dbDir)) Fs.mkdirSync(dbDir);

export default abstract class BaseDb<T> {
  protected readonly allData: T;
  private readonly path: string;

  protected constructor(readonly tableName: string, defaultData: T) {
    this.path = `${dbDir}/${tableName}.json`;
    if (Fs.existsSync(this.path)) {
      this.allData = JSON.parse(Fs.readFileSync(this.path, 'utf-8'));
    } else {
      this.allData = defaultData;
      this.persist();
    }
    console.log(`Loaded ${tableName} DB: ${this.path}`);
  }

  public persist() {
    Fs.writeFileSync(this.path, JSON.stringify(this.allData, null, 2));
  }
}
