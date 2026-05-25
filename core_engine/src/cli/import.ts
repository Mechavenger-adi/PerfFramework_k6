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
  /** Inline curl string. Mutually exclusive with `file`. */
  curl?: string;
  /** Path to a file containing one or more curl blocks. Mutually exclusive with `curl`. */
  file?: string;
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
  if ((!opts.curl && !opts.file) || (opts.curl && opts.file)) {
    console.error('Error: exactly one of --curl or --file must be provided.');
    process.exit(1);
  }

  const blocks = opts.file
    ? readFromFile(opts.file)
    : [{ curlText: opts.curl!, transactionName: opts.transactionName }];

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

  const result = PostmanAdapter.parseFile(absolute, { folderFilter: opts.folder });

  if (result.groups.length === 0) {
    console.error('Error: no requests found in the Postman collection (after optional --folder filter).');
    process.exit(1);
  }

  const requestCount = result.groups.reduce((sum, g) => sum + g.entries.length, 0);
  emitScript(team, scriptName, result.groups, result.warnings, requestCount);
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function emitScript(
  team: string,
  scriptName: string,
  groups: TransactionGroup[],
  warnings: string[],
  requestCount: number,
): void {
  const scriptContent = ScriptGenerator.generate(groups, undefined, team);

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
