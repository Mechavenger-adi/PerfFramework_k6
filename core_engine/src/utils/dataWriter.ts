/**
 * dataWriter.ts
 * VU-safe runtime data writer (Proposal 7).
 *
 * k6 VUs cannot touch the filesystem, so writeData() emits a tagged line that
 * the framework runner tails live (LiveConsoleLogStream → FileWriteSink) and
 * writes to disk for you, under the current run's output directory. All VUs may
 * write the same file concurrently — the single runner-side consumer serializes
 * appends so they stay ordered and uncorrupted.
 */

// @ts-ignore - K6 runtime module
import exec from 'k6/execution';

/**
 * IPC tag prefix matched by the runner-side FileWriteSink in the k6 log stream.
 * MUST stay in sync with execution/FileWriteSink.ts.
 */
const FILE_TAG = '__K6PERF_FILE__';

export interface WriteDataOptions {
  /** 'append' (default) accumulates records; 'overwrite' replaces the file on each write. */
  mode?: 'append' | 'overwrite';
  /** 'utf8' (default) writes text; 'base64' decodes the data to bytes (binary). */
  encoding?: 'utf8' | 'base64';
  /** When true, the VU id is woven into the filename so each VU writes its own file. */
  perVU?: boolean;
}

/**
 * Write data to a file during the test. The file (and any missing parent
 * folders) is created automatically on first write.
 *
 * Path:
 *   - relative  → under the run's output directory (default home for artifacts)
 *   - absolute  → written verbatim to any location of your choice
 *
 *   writeData('created_ids.csv', `${id},${ts}\n`);             // → run output dir
 *   writeData('D:/exports/ids.csv', `${id}\n`);                // → your location
 *   writeData('snapshot.json', JSON.stringify(obj), { mode: 'overwrite' });
 *   writeData('out.bin', bytesBase64, { encoding: 'base64' });
 *   writeData('per_vu.log', line, { perVU: true });            // → per_vu.vu3.log, …
 */
export function writeData(file: string, data: string, opts?: WriteDataOptions): void {
  let f = String(file).replace(/\\/g, '/');

  if (opts?.perVU) {
    const id = exec.vu.idInInstance;
    const slash = f.lastIndexOf('/');
    const dot = f.lastIndexOf('.');
    f = dot > slash ? `${f.slice(0, dot)}.vu${id}${f.slice(dot)}` : `${f}.vu${id}`;
  }

  const payload = {
    f,
    m: opts?.mode === 'overwrite' ? 'w' : 'a',
    e: opts?.encoding === 'base64' ? 'base64' : 'utf8',
    d: String(data),
  };

  // One tagged line per call. JSON.stringify escapes newlines/quotes in the data
  // so it stays a single log line; the sink JSON-parses it back to the original.
  console.log(FILE_TAG + JSON.stringify(payload));
}
