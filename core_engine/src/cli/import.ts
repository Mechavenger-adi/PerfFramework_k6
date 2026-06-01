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
}

export interface ImportPostmanOptions {
  /** Path to a Postman v2.1 collection JSON file. Required. */
  file: string;
  /** Optional: only emit requests under this top-level folder name. */
  folder?: string;
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

  emitScript(team, scriptName, groups, allWarnings, requestCounter);
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
  emitScript(team, scriptName, result.groups, result.warnings, requestCount, {
    extraInitCode: result.extraInitCode,
    extraImports: result.extraImports,
    copiedFiles: result.copiedFiles,
    entryComments: result.entryComments,
    entryNames: result.entryNames,
  });
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
}

function emitScript(
  team: string,
  scriptName: string,
  groups: TransactionGroup[],
  warnings: string[],
  requestCount: number,
  extras: EmitScriptExtras = {},
): void {
  const scriptContent = ScriptGenerator.generate(groups, undefined, team, {
    extraInitCode: extras.extraInitCode,
    extraImports: extras.extraImports,
    entryComments: extras.entryComments,
    entryNames: extras.entryNames,
  });

  const suiteDir = path.join(process.cwd(), 'testSuites', team);
  const targetDir = path.join(suiteDir, 'tests');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const outName = scriptName.endsWith('.js') ? scriptName : `${scriptName}.js`;
  const outPath = path.join(targetDir, outName);

  if (fs.existsSync(outPath)) {
    console.error(
      `Error: ${path.relative(process.cwd(), outPath)} already exists. Choose a different script name or remove the existing file.`,
    );
    process.exit(1);
  }

  fs.writeFileSync(outPath, scriptContent, 'utf-8');

  console.log(`\n[PASS] Wrote ${path.relative(process.cwd(), outPath)}`);
  console.log(
    `       ${groups.length} transaction${groups.length === 1 ? '' : 's'}, ${requestCount} request${requestCount === 1 ? '' : 's'}.`,
  );

  if (extras.copiedFiles && extras.copiedFiles.length > 0) {
    console.log(`\nCopied ${extras.copiedFiles.length} file${extras.copiedFiles.length === 1 ? '' : 's'} into data/:`);
    for (const f of extras.copiedFiles) {
      console.log(`  • ${f.source}  →  ${f.destRelative}`);
    }
  }

  if (warnings.length > 0) {
    console.log('\nWarnings:');
    for (const w of warnings) {
      console.log(`  • ${w}`);
    }
  }

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
