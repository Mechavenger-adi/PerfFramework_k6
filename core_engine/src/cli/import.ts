/**
 * import.ts — `import curl|postman` CLI commands.
 *
 * Phases 1 (cURL) and 2 (Postman) of the Request Import feature. See
 * `ai_context/design-proposals.md` → "Request Import" for scope and design.
 *
 * Both subcommands funnel adapter output (TransactionGroup[]) through the
 * existing ScriptGenerator. The shared `emitScript` helper handles file
 * writing, warning display, and next-steps messaging.
 */

import * as fs from 'fs';
import * as path from 'path';
import { CurlAdapter, ParsedCurlBlock } from '../recording/CurlAdapter';
import { PostmanAdapter } from '../recording/PostmanAdapter';
import { ScriptGenerator } from '../recording/ScriptGenerator';
import { TransactionGroup } from '../recording/TransactionGrouper';

/**
 * What to do when a target script file already exists:
 *  - 'error'     : print an error and exit (default; CLI behavior).
 *  - 'overwrite' : replace the existing file.
 *  - 'skip'      : leave the existing file untouched (used for per-request
 *                  splits where only some names collide).
 */
export type ConflictPolicy = 'error' | 'overwrite' | 'skip';

export interface ImportCurlOptions {
  /** Inline curl string (shell-quoting required). Mutually exclusive with other sources. */
  curl?: string;
  /** Path to a file containing one or more curl blocks. Mutually exclusive with other sources. */
  file?: string;
  /** Read the curl from stdin. Pipe-friendly. Mutually exclusive with other sources. */
  stdin?: boolean;
  /** Read the curl from the OS clipboard. Works directly with browser "Copy as cURL". Mutually exclusive with other sources. */
  clipboard?: boolean;
  /** Optional override for the transaction name when importing a single curl. */
  transactionName?: string;
  /** What to do if the target script already exists. Defaults to 'error'. */
  onConflict?: ConflictPolicy;
}

export interface ImportPostmanOptions {
  /** Path to a Postman v2.1 collection JSON file. Required. */
  file: string;
  /**
   * Optional folder filter. Accepts a nested path (`"API/Auth"`) or an array
   * of folder segments (`["API", "Auth"]`); the chosen folder and its whole
   * subtree are imported.
   */
  folder?: string | string[];
  /**
   * When true, emit one script per individual request (API) instead of a
   * single combined script. Files are named `<folder>_<request>.js`, escalating
   * up the folder path only as needed to stay collision-free.
   */
  splitPerRequest?: boolean;
  /** What to do if a target script already exists. Defaults to 'error'. */
  onConflict?: ConflictPolicy;
}

export async function runImportCurl(
  team: string,
  scriptName: string,
  opts: ImportCurlOptions,
): Promise<void> {
  const sources = [opts.curl, opts.file, opts.stdin, opts.clipboard].filter(Boolean);
  if (sources.length === 0) {
    console.error(
      'Error: exactly one input source is required: --curl, --file, --stdin, or --clipboard.',
    );
    process.exit(1);
  }
  if (sources.length > 1) {
    console.error('Error: only one input source allowed (--curl / --file / --stdin / --clipboard).');
    process.exit(1);
  }

  let blocks: ParsedCurlBlock[];
  if (opts.file) {
    blocks = readFromFile(opts.file);
  } else if (opts.stdin) {
    const text = await readStdin();
    if (!text.trim()) {
      console.error('Error: --stdin specified but no input received.');
      process.exit(1);
    }
    blocks = CurlAdapter.splitMultiCurlFile(text);
    // If splitMultiCurlFile didn't find a `#`-comment, treat the whole input
    // as one block (covers the common "single curl from clipboard" case).
    if (blocks.length === 0 && text.trim()) {
      blocks = [{ curlText: text.trim(), transactionName: opts.transactionName }];
    }
  } else if (opts.clipboard) {
    const text = readClipboard();
    if (!text.trim()) {
      console.error(
        'Error: clipboard is empty or could not be read. Copy your cURL command first, then re-run.',
      );
      process.exit(1);
    }
    blocks = CurlAdapter.splitMultiCurlFile(text);
    if (blocks.length === 0 && text.trim()) {
      blocks = [{ curlText: text.trim(), transactionName: opts.transactionName }];
    }
  } else {
    // --curl '<string>' mode. Run the same multi-block splitter the
    // file/stdin/clipboard paths use so a leading `# Transaction name`
    // comment is honored even when the user passes the curl inline. Without
    // this branch the `#` line stayed inside the curl block and the
    // transaction was named "transaction_1" with the `#` line treated as
    // raw curl input.
    blocks = CurlAdapter.splitMultiCurlFile(opts.curl!);
    if (blocks.length === 0 && opts.curl!.trim()) {
      blocks = [{ curlText: opts.curl!.trim(), transactionName: opts.transactionName }];
    } else if (opts.transactionName && blocks.length === 1 && !blocks[0].transactionName) {
      // Honor --transaction-name when the input has no `# Name` comment.
      blocks[0].transactionName = opts.transactionName;
    }
  }

  if (blocks.length === 0) {
    console.error('Error: no curl commands found in input.');
    process.exit(1);
  }

  const groups: TransactionGroup[] = [];
  const allWarnings: string[] = [];
  let requestCounter = 0;

  for (let blockIdx = 0; blockIdx < blocks.length; blockIdx++) {
    const block = blocks[blockIdx];
    const transactionName = block.transactionName ?? `transaction_${blockIdx + 1}`;
    const safeGroupName = transactionName.replace(/[^a-zA-Z0-9_]/g, '_');

    requestCounter++;
    const result = CurlAdapter.parse(
      block.curlText,
      `req_${requestCounter}`,
      safeGroupName,
    );

    for (const w of result.warnings) {
      allWarnings.push(`[block ${blockIdx + 1}] ${w}`);
    }

    groups.push({ name: safeGroupName, entries: [result.entry] });
  }

  emitScript(team, scriptName, groups, allWarnings, requestCounter, { onConflict: opts.onConflict });
}

export async function runImportPostman(
  team: string,
  scriptName: string,
  opts: ImportPostmanOptions,
): Promise<void> {
  if (!opts.file) {
    console.error('Error: --file <collection.json> is required.');
    process.exit(1);
  }

  const absolute = path.resolve(process.cwd(), opts.file);
  if (!fs.existsSync(absolute)) {
    console.error(`Error: Postman collection not found: ${absolute}`);
    process.exit(1);
  }

  // Files referenced by `body.mode = file` or formdata-file fields land in
  // testSuites/<team>/data/ so the generated script can `open()` them via a
  // path relative to the script's location (`../data/<filename>`).
  const dataDir = path.join(process.cwd(), 'testSuites', team, 'data');
  const result = PostmanAdapter.parseFile(absolute, { folderFilter: opts.folder, dataDir });

  if (result.groups.length === 0) {
    console.error('Error: no requests found in the Postman collection (after optional --folder filter).');
    process.exit(1);
  }

  const requestCount = result.groups.reduce((sum, g) => sum + g.entries.length, 0);
  const extras: EmitScriptExtras = {
    extraInitCode: result.extraInitCode,
    extraImports: result.extraImports,
    copiedFiles: result.copiedFiles,
    entryComments: result.entryComments,
    entryNames: result.entryNames,
    entryFolders: result.entryFolders,
    onConflict: opts.onConflict,
  };

  if (opts.splitPerRequest) {
    emitScriptsPerRequest(team, scriptName, result.groups, result.warnings, extras);
    return;
  }

  emitScript(team, scriptName, result.groups, result.warnings, requestCount, extras);
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

interface EmitScriptExtras {
  /** Optional module-scope code (e.g. file `open()` bindings). */
  extraInitCode?: string;
  /** Optional extra imports the init code needs. */
  extraImports?: string[];
  /** Files the adapter successfully copied into testSuites/<team>/data/. */
  copiedFiles?: { source: string; destRelative: string }[];
  /** Per-entry comment blocks (Postman pre-request / test scripts → notes). */
  entryComments?: Map<string, { before: string[]; after: string[] }>;
  /** Per-entry metric name tags (Postman item names). */
  entryNames?: Map<string, string>;
  /** Per-entry sanitized folder path (for collision-safe split filenames). */
  entryFolders?: Map<string, string[]>;
  /** What to do if the target script already exists. Defaults to 'error'. */
  onConflict?: ConflictPolicy;
}

/**
 * Generate the script content for `groups` and write it to
 * testSuites/<team>/tests/<scriptName>.js. Returns the absolute path written,
 * or null when the file already existed and the conflict policy is 'skip'.
 * With the default 'error' policy an existing file prints an error and exits;
 * 'overwrite' replaces it. Performs no success logging — callers own messaging.
 */
function writeScriptFile(
  team: string,
  scriptName: string,
  groups: TransactionGroup[],
  extras: EmitScriptExtras = {},
): string | null {
  const targetDir = path.join(process.cwd(), 'testSuites', team, 'tests');
  const outName = scriptName.endsWith('.js') ? scriptName : `${scriptName}.js`;
  const outPath = path.join(targetDir, outName);
  const policy = extras.onConflict ?? 'error';

  if (fs.existsSync(outPath)) {
    if (policy === 'skip') return null;
    if (policy === 'error') {
      console.error(
        `Error: ${path.relative(process.cwd(), outPath)} already exists. Choose a different script name or remove the existing file.`,
      );
      process.exit(1);
    }
    // 'overwrite' falls through to the write below.
  }

  const scriptContent = ScriptGenerator.generate(groups, undefined, team, {
    extraInitCode: extras.extraInitCode,
    extraImports: extras.extraImports,
    entryComments: extras.entryComments,
    entryNames: extras.entryNames,
  });

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.writeFileSync(outPath, scriptContent, 'utf-8');
  return outPath;
}

function emitScript(
  team: string,
  scriptName: string,
  groups: TransactionGroup[],
  warnings: string[],
  requestCount: number,
  extras: EmitScriptExtras = {},
): void {
  const outPath = writeScriptFile(team, scriptName, groups, extras);
  if (outPath === null) {
    const outName = scriptName.endsWith('.js') ? scriptName : `${scriptName}.js`;
    console.log(`\n[SKIP] ${outName} already exists — left it unchanged.`);
    return;
  }

  console.log(`\n[PASS] Wrote ${path.relative(process.cwd(), outPath)}`);
  console.log(
    `       ${groups.length} transaction${groups.length === 1 ? '' : 's'}, ${requestCount} request${requestCount === 1 ? '' : 's'}.`,
  );

  printCopiedFiles(extras.copiedFiles);
  printWarnings(warnings);
  printNextSteps();
}

/**
 * Emit one script per individual request (API). Each script holds a single
 * transaction with one request. Filenames are `<folder>_<request>`, using only
 * as many trailing folder segments as needed to stay unique within this run
 * (see {@link buildSplitName}).
 */
function emitScriptsPerRequest(
  team: string,
  baseName: string,
  groups: TransactionGroup[],
  warnings: string[],
  extras: EmitScriptExtras = {},
): void {
  const entryFolders = extras.entryFolders ?? new Map<string, string[]>();
  const entryNames = extras.entryNames ?? new Map<string, string>();
  const entryComments = extras.entryComments ?? new Map<string, { before: string[]; after: string[] }>();

  const usedNames = new Set<string>();
  const written: string[] = [];
  const skipped: string[] = [];

  for (const group of groups) {
    for (const entry of group.entries) {
      const folderSegs = entryFolders.get(entry.id) ?? [];
      const requestName = entryNames.get(entry.id) ?? entry.id;
      const scriptName = buildSplitName(folderSegs, requestName, usedNames, baseName);
      // For a per-request script the transaction is named with the full folder
      // path AND the request name (e.g. `Parent_Child_login`), not just the
      // folder path — so a single-request script reads unambiguously.
      const transactionName = [...folderSegs, requestName].join('_') || group.name;

      // Slice per-entry extras. Only carry file init/imports into a script that
      // actually references a file binding, so request scripts without uploads
      // stay clean.
      const comment = entryComments.get(entry.id);
      const perComments: Map<string, { before: string[]; after: string[] }> = comment
        ? new Map([[entry.id, comment]])
        : new Map();
      const perNames = new Map<string, string>([[entry.id, requestName]]);
      const usesFile = !!entry.postData?.expression && /__file_|http\.file\(/.test(entry.postData.expression);

      const outPath = writeScriptFile(team, scriptName, [{ name: transactionName, entries: [entry] }], {
        extraInitCode: usesFile ? extras.extraInitCode : undefined,
        extraImports: usesFile ? extras.extraImports : undefined,
        entryComments: perComments,
        entryNames: perNames,
        onConflict: extras.onConflict,
      });
      if (outPath === null) {
        skipped.push(`${scriptName}.js`);
      } else {
        written.push(path.relative(process.cwd(), outPath));
      }
    }
  }

  console.log(
    `\n[PASS] Wrote ${written.length} script${written.length === 1 ? '' : 's'} (one per request) into testSuites/${team}/tests/:`,
  );
  for (const rel of written) {
    console.log(`  • ${rel}`);
  }
  if (skipped.length > 0) {
    console.log(`\n[SKIP] ${skipped.length} script${skipped.length === 1 ? '' : 's'} already existed and ${skipped.length === 1 ? 'was' : 'were'} left unchanged:`);
    for (const s of skipped) {
      console.log(`  • ${s}`);
    }
  }

  printCopiedFiles(extras.copiedFiles);
  printWarnings(warnings);
  printNextSteps();
}

/**
 * Build a collision-safe filename for a per-request split script. Starts from
 * `<immediateParentFolder>_<request>` and walks up the folder path one segment
 * at a time until the name is unique, falling back to a numeric suffix.
 */
function buildSplitName(
  folderSegs: string[],
  requestName: string,
  used: Set<string>,
  baseName: string,
): string {
  const start = folderSegs.length > 0 ? 1 : 0;
  for (let take = start; take <= folderSegs.length; take++) {
    const segs = take > 0 ? folderSegs.slice(folderSegs.length - take) : [];
    const name = sanitizeFileStem([...segs, requestName].join('_'));
    if (name && !used.has(name)) {
      used.add(name);
      return name;
    }
  }
  // Exhausted the folder path — fall back to the user's base name + index.
  const stem = sanitizeFileStem([...folderSegs, requestName].join('_')) || baseName;
  let n = 2;
  let name = `${stem}_${n}`;
  while (used.has(name)) {
    name = `${stem}_${++n}`;
  }
  used.add(name);
  return name;
}

function sanitizeFileStem(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function printCopiedFiles(copiedFiles: EmitScriptExtras['copiedFiles']): void {
  if (!copiedFiles || copiedFiles.length === 0) return;
  console.log(`\nCopied ${copiedFiles.length} file${copiedFiles.length === 1 ? '' : 's'} into data/:`);
  for (const f of copiedFiles) {
    console.log(`  • ${f.source}  →  ${f.destRelative}`);
  }
}

function printWarnings(warnings: string[]): void {
  if (warnings.length === 0) return;
  console.log('\nWarnings:');
  for (const w of warnings) {
    console.log(`  • ${w}`);
  }
}

function printNextSteps(): void {
  console.log('\nNext steps:');
  console.log('  1. Review the generated script and adjust k6Check() assertions.');
  console.log('  2. Add this script to a test plan (config/test_plans/*.json) under journeys.');
  console.log('  3. Validate: node dist/cli/run.js validate --plan config/test_plans/load_test.json');
}

function readFromFile(filePath: string): ParsedCurlBlock[] {
  const absolute = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absolute)) {
    console.error(`Error: curl file not found: ${absolute}`);
    process.exit(1);
  }
  const content = fs.readFileSync(absolute, 'utf-8');
  return CurlAdapter.splitMultiCurlFile(content);
}

/**
 * Read all of stdin until EOF and return as UTF-8 string. Use with pipes or
 * redirects (`cmd | npm run import:curl … --stdin`,
 * `npm run import:curl … --stdin < file.curl`).
 */
async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    console.error(
      'Error: --stdin requires piped input (e.g. `cmd | npm run import:curl … --stdin` or `… --stdin < file.curl`).',
    );
    process.exit(1);
  }
  return await new Promise<string>((resolve, reject) => {
    let buf = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk: string) => { buf += chunk; });
    process.stdin.on('end', () => resolve(buf));
    process.stdin.on('error', reject);
  });
}

/**
 * Read text from the OS clipboard by shelling out to the platform-native
 * command. No external npm dependency required.
 *   - Windows : `powershell -NoProfile -Command Get-Clipboard -Raw`
 *   - macOS   : `pbpaste`
 *   - Linux   : `xclip -selection clipboard -o`, falling back to `xsel`
 * Returns empty string on failure (caller handles the empty-input case).
 */
function readClipboard(): string {
  const { execSync } = require('child_process') as typeof import('child_process');
  const opts: import('child_process').ExecSyncOptionsWithStringEncoding = {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'ignore'],
    maxBuffer: 32 * 1024 * 1024, // 32 MiB — browser curls with big cookies fit comfortably
  };
  try {
    if (process.platform === 'win32') {
      return execSync('powershell -NoProfile -Command "Get-Clipboard -Raw"', opts);
    }
    if (process.platform === 'darwin') {
      return execSync('pbpaste', opts);
    }
    // Linux / other POSIX: try xclip first, then xsel.
    try {
      return execSync('xclip -selection clipboard -o', opts);
    } catch {
      return execSync('xsel --clipboard --output', opts);
    }
  } catch (err) {
    console.error(
      `Error: failed to read system clipboard: ${(err as Error).message}\n` +
      `  • Windows: PowerShell must be available on PATH\n` +
      `  • Linux  : install xclip or xsel\n` +
      `Fall back to --file or --stdin if this persists.`,
    );
    return '';
  }
}
