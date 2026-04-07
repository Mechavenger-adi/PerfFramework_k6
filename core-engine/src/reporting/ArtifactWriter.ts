import * as fs from 'fs';
import * as path from 'path';

export class ArtifactWriter {
  static ensureDir(dirPath: string): void {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  static writeJson(filePath: string, data: unknown): void {
    this.ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  static writeNdjson(filePath: string, rows: Array<Record<string, unknown>>): void {
    this.ensureDir(path.dirname(filePath));
    const content = rows.map((row) => JSON.stringify(row)).join('\n');
    fs.writeFileSync(filePath, content ? `${content}\n` : '', 'utf-8');
  }
}
