/**
 * interactive.ts — Interactive command panel for local DX.
 *
 * Launched when the user runs `k6-framework` / `npm run cli` with no
 * subcommand on a TTY. Walks users through framework features with menu-
 * driven prompts so they don't need to remember CLI flags.
 *
 * Architecture: thin orchestrator. Each menu action collects inputs via
 * `readline/promises` and delegates to the existing CLI handler
 * (`runGenerate`, `runConvert`, `runImportCurl`, `runImportPostman`,
 * `runGenerateByos`, `runInit`, `runValidate`, etc.). No business logic
 * lives here — that means every fix or new feature in a CLI handler
 * automatically flows into the panel.
 *
 * Direct CLI commands (`npm run cli generate ...`, `npm run import:curl ...`,
 * etc.) keep working unchanged; the panel is opt-in via TTY detection.
 *
 * See Proposal 4 in `ai_context/design-proposals.md`.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Interface, createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { Logger, ansi } from '../utils/logger';
import { runInit } from './init';
import { runGenerate } from './generate';
import { runConvert } from './convert';
import { runGenerateByos } from './generate-byos';
import { runImportCurl, runImportPostman } from './import';
import { runValidate } from './validate';
import { PostmanAdapter } from '../recording/PostmanAdapter';

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Launch the interactive command panel. Returns when the user picks "Exit"
 * or sends EOF (Ctrl+D). All input/output via process.stdin/stdout.
 *
 * Caller (in run.ts) should only invoke this when both stdin AND stdout are
 * TTYs — non-TTY contexts (CI, piped invocations) should fall through to the
 * existing help output so we never block scripted runs.
 */
export async function runInteractivePanel(): Promise<void> {
  printBanner();

  // Workspace check — offer to scaffold if the cwd doesn't look like a
  // framework project. Doing this once up front avoids running every author
  // action and getting cryptic "config not found" errors downstream.
  if (!isFrameworkWorkspace()) {
    Logger.warn(
      `This directory doesn't look like a k6-perf project yet (no config/ folder found).`,
    );
    const rl = createInterface({ input, output });
    try {
      const yes = await confirm(rl, 'Initialize a new project here?', true);
      if (yes) {
        runInit(process.cwd());
        Logger.detail('Project initialized. Continuing to the menu.\n');
      } else {
        Logger.detail(
          'OK — some actions may fail until you run `init` or move into a framework project directory.\n',
        );
      }
    } finally {
      rl.close();
    }
  }

  const rl = createInterface({ input, output });
  // Trap SIGINT so Ctrl+C returns control to the shell cleanly rather than
  // dropping an unhandled-rejection stack trace from an in-flight question.
  const onSigInt = (): void => {
    output.write('\n');
    rl.close();
    process.exit(0);
  };
  process.on('SIGINT', onSigInt);

  try {
    // Menu loop: each iteration shows the menu, runs one action, then returns
    // to the menu unless the action chose to exit. Exit also triggered by
    // EOF on stdin (Ctrl+D) — readline's `question` rejects in that case.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const choice = await showMenuAndPick(rl);
      if (choice === 'exit') break;
      try {
        await dispatch(choice, rl);
      } catch (err) {
        // Per-action errors shouldn't kill the panel — surface and resume.
        const msg = err instanceof Error ? err.message : String(err);
        Logger.fail(`Action failed: ${msg}`);
      }
      // Pause so the user can read output before the menu redraws.
      await rl.question('\n[Enter] back to menu  ');
    }
  } catch {
    // EOF on stdin or any unrecoverable readline error — exit cleanly.
  } finally {
    process.off('SIGINT', onSigInt);
    rl.close();
  }
}

// ---------------------------------------------------------------------------
// Menu & dispatch
// ---------------------------------------------------------------------------

type MenuChoice =
  | 'generate'
  | 'convert'
  | 'byos'
  | 'import-curl'
  | 'import-postman'
  | 'run'
  | 'debug'
  | 'validate'
  | 'init'
  | 'exit';

interface MenuItem {
  key: string;
  label: string;
  choice: MenuChoice;
}

const MENU_GROUPS: Array<{ heading: string; items: MenuItem[] }> = [
  {
    heading: 'Author',
    items: [
      { key: '1', label: 'Generate script from HAR recording', choice: 'generate' },
      { key: '2', label: 'Convert native k6 script → framework script', choice: 'convert' },
      { key: '3', label: 'Bring Your Own Script (BYOS scaffold)', choice: 'byos' },
      { key: '4', label: 'Create API test from cURL (clipboard or file)', choice: 'import-curl' },
      { key: '5', label: 'Create API test from Postman collection', choice: 'import-postman' },
    ],
  },
  {
    heading: 'Run',
    items: [
      { key: '6', label: 'Run a test plan', choice: 'run' },
      { key: '7', label: 'Debug replay (single-iteration HTML diff)', choice: 'debug' },
      { key: '8', label: 'Validate a test plan', choice: 'validate' },
    ],
  },
  {
    heading: 'Project',
    items: [
      { key: '9', label: 'Initialize a new project / scaffold', choice: 'init' },
    ],
  },
];

async function showMenuAndPick(rl: Interface): Promise<MenuChoice> {
  output.write('\n');
  Logger.header('k6-perf Interactive Command Panel');
  for (const group of MENU_GROUPS) {
    output.write(`  ${group.heading}\n`);
    for (const item of group.items) {
      output.write(`    ${item.key.padStart(2, ' ')}. ${item.label}\n`);
    }
  }
  output.write(`     0. Exit\n`);

  const flat = MENU_GROUPS.flatMap((g) => g.items);
  const valid = new Set(flat.map((i) => i.key));
  while (true) {
    const ans = (await rl.question(cq('\nSelect an option (number, or 0 to exit): '))).trim();
    if (ans === '' || ans === '0' || ans.toLowerCase() === 'q' || ans.toLowerCase() === 'exit') {
      return 'exit';
    }
    if (!valid.has(ans)) {
      Logger.warn(`Invalid selection "${ans}". Pick a number from the list (0 to exit).`);
      continue;
    }
    return flat.find((i) => i.key === ans)!.choice;
  }
}

async function dispatch(choice: MenuChoice, rl: Interface): Promise<void> {
  switch (choice) {
    case 'generate':       return wizardGenerate(rl);
    case 'convert':        return wizardConvert(rl);
    case 'byos':           return wizardByos(rl);
    case 'import-curl':    return wizardImportCurl(rl);
    case 'import-postman': return wizardImportPostman(rl);
    case 'run':            return wizardRun(rl);
    case 'debug':          return wizardDebug(rl);
    case 'validate':       return wizardValidate(rl);
    case 'init':           return wizardInit(rl);
    case 'exit':           return;
  }
}

// ---------------------------------------------------------------------------
// Per-action wizards — each one collects inputs and delegates to the matching
// CLI handler. No business logic.
// ---------------------------------------------------------------------------

async function wizardGenerate(rl: Interface): Promise<void> {
  Logger.header('Generate script from HAR');
  const harPath = await pickFile(rl, '.har', 'HAR file');
  if (!harPath) return;
  const team = await pickOrCreateProject(rl);
  if (!team) return;
  const scriptName = await askScriptName(rl, harPath);
  if (!scriptName) return;
  const target = await resolveScriptTarget(rl, team, scriptName);
  if (!target) return;
  await runGenerate(harPath, team, target.name, rl);
  await maybeKeepReferenceCopy(rl, harPath, team, 'HAR recording');
}

async function wizardConvert(rl: Interface): Promise<void> {
  Logger.header('Convert native k6 script → framework script');
  const inputPath = await pickFile(rl, '.js', 'k6 script');
  if (!inputPath) return;

  // Ask the destination question first, because it decides whether the team /
  // script-name prompts even apply. In-place conversion rewrites the original
  // file and must keep the team implied by that file's location — asking for a
  // (possibly different) team or name would silently discard those answers,
  // which is exactly the surprise users hit otherwise.
  const inPlace = await confirm(
    rl,
    'Overwrite the input file in place instead of writing a copy to another team?',
    false,
  );

  if (inPlace) {
    const team = teamFromPath(inputPath) ?? 'unknown_team';
    Logger.detail(
      `Converting in place — the file stays where it is, under team "${team}".`,
    );
    // scriptName is unused for in-place writes; pass the existing basename.
    const scriptName = path.basename(inputPath).replace(/\.js$/i, '');
    await runConvert(inputPath, team, scriptName, { inPlace: true, externalRl: rl });
    return;
  }

  // Copy mode: now the project + name are the destination for the new file.
  const team = await pickOrCreateProject(rl);
  if (!team) return;
  const scriptName = await askScriptName(rl, inputPath);
  if (!scriptName) return;
  const target = await resolveScriptTarget(rl, team, scriptName);
  if (!target) return;
  await runConvert(inputPath, team, target.name, { inPlace: false, externalRl: rl });
  await maybeKeepReferenceCopy(rl, inputPath, team, 'k6 script');
}

/**
 * Derive the team name from a path under testSuites/<team>/… . Mirrors the
 * regex ScriptConverter uses so an in-place conversion embeds the same team
 * context the file already lives in. Returns null when the path isn't inside a
 * testSuites/<team>/ folder (e.g. an external script).
 */
function teamFromPath(filePath: string): string | null {
  const match = path.resolve(filePath).match(/[\\/]testSuites[\\/]([^\\/]+)[\\/]/);
  return match ? match[1] : null;
}

async function wizardByos(rl: Interface): Promise<void> {
  Logger.header('Bring Your Own Script (BYOS)');
  const team = await pickOrCreateProject(rl);
  if (!team) return;
  const scriptName = await askInput(rl, 'Script name (without .js):');
  if (!scriptName) return;
  const target = await resolveScriptTarget(rl, team, scriptName);
  if (!target) return;
  runGenerateByos(team, target.name, { overwrite: target.overwrite });
}

async function wizardImportCurl(rl: Interface): Promise<void> {
  Logger.header('Create API test from cURL');
  const team = await pickOrCreateProject(rl);
  if (!team) return;
  const scriptName = await askInput(rl, 'Script name (without .js):');
  if (!scriptName) return;
  const target = await resolveScriptTarget(rl, team, scriptName);
  if (!target) return;
  const onConflict = target.overwrite ? 'overwrite' : 'error';

  // Three input modes: clipboard, file, paste. Default to clipboard since
  // "Copy as cURL" from a browser DevTools is the most common workflow.
  const source = await pickFromOptions(rl, 'Where is the curl coming from?', [
    { key: '1', label: 'Clipboard (paste browser "Copy as cURL")', value: 'clipboard' as const },
    { key: '2', label: 'File path (multi-curl supported; `# Name` lines set transaction names)', value: 'file' as const },
    { key: '3', label: 'Paste here (end with blank line)', value: 'paste' as const },
  ]);
  if (!source) return;

  if (source === 'clipboard') {
    output.write('\nCopy the cURL command to your clipboard now:\n');
    output.write('  • Browser DevTools → Network tab → right-click the request → Copy → "Copy as cURL".\n');
    output.write('  • Or copy any cURL command text from your terminal/editor.\n');
    // Confirm the copy happened before we read the clipboard, so we don't
    // silently parse whatever stale text was there from before.
    const copied = await confirm(rl, 'Have you copied the cURL to your clipboard?', false);
    if (!copied) {
      Logger.detail('No problem — copy the cURL first, then run this action again.');
      return;
    }
    await runImportCurl(team, target.name, { clipboard: true, onConflict });
    return;
  }
  if (source === 'file') {
    const filePath = await pickFile(rl, '.curl', 'curl file', /\.(curl|txt|sh)$/i);
    if (!filePath) return;
    await runImportCurl(team, target.name, { file: filePath, onConflict });
    return;
  }
  // paste mode — collect until blank line
  output.write('\nPaste your cURL command(s). Multi-line continuations (\\) are supported.\n');
  output.write('Prefix a block with `# Transaction name` to name each transaction.\n');
  output.write('End input with a blank line:\n\n');
  const text = await readUntilBlankLine(rl);
  if (!text.trim()) {
    Logger.warn('No input received.');
    return;
  }
  // Feed the pasted text through --curl. Note: import.ts now treats the
  // `--curl` source the same as `--stdin`/`--clipboard` — it runs
  // splitMultiCurlFile first, so leading `# name` comments are honored.
  await runImportCurl(team, target.name, { curl: text, onConflict });
}

async function wizardImportPostman(rl: Interface): Promise<void> {
  Logger.header('Create API test from Postman collection');
  const project = await pickOrCreateProject(rl);
  if (!project) return;
  const scriptName = await askInput(rl, 'Script name (used as-is for a combined script, or as a fallback base when splitting):');
  if (!scriptName) return;
  const filePath = await pickFile(rl, '.postman_collection.json', 'Postman collection', /\.postman_collection\.json$/i);
  if (!filePath) return;

  // Optional folder filter. Enumerate the FULL folder tree (any depth) so the
  // user can pick a nested folder without typing its path. The selected
  // folder's sanitized segment array is passed straight to the importer, which
  // includes that folder and its whole subtree.
  let folder: string[] | undefined;
  const folders = PostmanAdapter.listFolderPathsFromFile(filePath);
  if (folders.length > 0) {
    const want = await confirm(rl, 'Filter to a specific folder (includes its subfolders)?', false);
    if (want) {
      const picked = await pickFromOptions(
        rl,
        'Which folder?',
        folders.map((f, idx) => ({
          key: String(idx + 1),
          label: folderTreeLabel(f),
          value: f.sanitizedPath,
        })),
      );
      if (picked) folder = picked;
    }
  }

  // Per-API split: one script per individual request instead of one combined.
  const splitPerRequest = await confirm(
    rl,
    'Create a separate script for each API request (instead of one combined script)?',
    false,
  );

  let finalName = scriptName;
  let onConflict: 'error' | 'overwrite' | 'skip' = 'error';
  if (splitPerRequest) {
    // Split filenames are generated, so we can't pre-resolve one name — ask a
    // policy for how to treat any that already exist.
    const policy = await pickFromOptions(rl, 'If a generated script already exists, what should I do?', [
      { key: '1', label: 'Overwrite the existing file(s)', value: 'overwrite' as const },
      { key: '2', label: 'Skip the existing file(s), write the rest', value: 'skip' as const },
      { key: '3', label: 'Cancel', value: 'cancel' as const },
    ]);
    if (!policy || policy === 'cancel') return;
    onConflict = policy;
  } else {
    const target = await resolveScriptTarget(rl, project, scriptName);
    if (!target) return;
    finalName = target.name;
    onConflict = target.overwrite ? 'overwrite' : 'error';
  }

  await runImportPostman(project, finalName, { file: filePath, folder, splitPerRequest, onConflict });
}

async function wizardRun(rl: Interface): Promise<void> {
  Logger.header('Run a test plan');
  const planPath = await pickPlan(rl);
  if (!planPath) return;
  // Run is implemented inline in run.ts (it's the most complex action and
  // mixes many concerns — host monitor, live display, k6 spawn, reporting).
  // Re-spawn the CLI in `run --plan ...` mode so we get the exact behavior
  // of a direct invocation including the live transaction table. Running
  // inside the panel would have to disable that table to avoid scroll-region
  // confusion with the menu's redraws.
  await spawnSelf(['run', '--plan', planPath]);
}

async function wizardDebug(rl: Interface): Promise<void> {
  Logger.header('Debug replay');
  const scriptPath = await pickFile(rl, '.js', 'journey script');
  if (!scriptPath) return;
  // Same reasoning as `run` — debug spawns k6 and streams output; re-spawn
  // for clean stdio inheritance instead of trying to run it under readline.
  await spawnSelf(['debug', '--script', scriptPath]);
}

async function wizardValidate(rl: Interface): Promise<void> {
  Logger.header('Validate a test plan');
  const planPath = await pickPlan(rl);
  if (!planPath) return;
  runValidate({ planPath });
}

async function wizardInit(rl: Interface): Promise<void> {
  Logger.header('Initialize a new project');
  const cwd = process.cwd();
  const ans = await askInput(rl, `Target directory (Enter for current: ${cwd}):`);
  runInit(ans || cwd);
}

// ---------------------------------------------------------------------------
// Shared helpers — workspace, teams, files, prompts
// ---------------------------------------------------------------------------

/**
 * Is `absPath` located inside the current framework workspace (the cwd tree)?
 * Used to decide whether a source file is "already in the framework folder".
 */
function isInsideWorkspace(absPath: string): boolean {
  const rel = path.relative(process.cwd(), absPath);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

/**
 * After a generate/convert that consumed an external source file, offer to
 * keep a copy of the original in the team's recordings/ folder for reference.
 *
 * Skips silently when the source already lives inside the framework folder
 * (no point duplicating it) or when a copy with the same name is already
 * present. Best-effort: a failed copy warns but never aborts the wizard.
 */
async function maybeKeepReferenceCopy(
  rl: Interface,
  sourcePath: string,
  team: string,
  kindLabel: string,
): Promise<void> {
  const abs = path.resolve(process.cwd(), sourcePath);
  if (!fs.existsSync(abs)) return;
  // Already in the framework folder — nothing to preserve.
  if (isInsideWorkspace(abs)) return;

  const recordingsDir = path.join(process.cwd(), 'testSuites', team, 'recordings');
  const dest = path.join(recordingsDir, path.basename(abs));
  if (fs.existsSync(dest)) return; // a reference copy already exists

  const keep = await confirm(
    rl,
    `Keep a copy of the original ${kindLabel} in this project's recordings folder for reference?`,
    true,
  );
  if (!keep) return;

  try {
    fs.mkdirSync(recordingsDir, { recursive: true });
    fs.copyFileSync(abs, dest);
    Logger.pass(`Saved reference copy: ${path.relative(process.cwd(), dest)}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    Logger.warn(`Could not save reference copy: ${msg}`);
  }
}

/**
 * Re-invoke this same CLI as a child process with `subArgs`, inheriting stdio.
 * Used by the Run/Debug actions, which want the exact behavior (and live
 * transaction table) of a direct invocation rather than running under the
 * panel's readline loop.
 *
 * Must preserve the launching runtime: when the panel is started via tsx on
 * the TypeScript source (e.g. `tsx core_engine/src/cli/run.ts`), the entry
 * point is a `.ts` file that bare `node` cannot execute. Detect that and
 * re-run through node's tsx loader (`node --import tsx <entry>`); for a
 * compiled `.js` entry, spawn node directly.
 */
async function spawnSelf(subArgs: string[]): Promise<void> {
  const { spawn } = await import('node:child_process');
  const entry = process.argv[1];
  const isTsEntry = /\.(ts|mts|cts)$/i.test(entry);
  const nodeArgs = isTsEntry
    ? ['--import', 'tsx', entry, ...subArgs]
    : [entry, ...subArgs];
  await new Promise<void>((resolve) => {
    const child = spawn(process.execPath, nodeArgs, { stdio: 'inherit' });
    child.on('exit', () => resolve());
    child.on('error', (err) => {
      Logger.fail(`Failed to launch: ${err.message}`);
      resolve();
    });
  });
}

function isFrameworkWorkspace(): boolean {
  return (
    fs.existsSync(path.join(process.cwd(), 'config')) ||
    fs.existsSync(path.join(process.cwd(), 'testSuites'))
  );
}

/** List existing project folders under testSuites/ (one folder per project). */
function listExistingProjects(): string[] {
  const root = path.join(process.cwd(), 'testSuites');
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root)
    .filter((name) => {
      const full = path.join(root, name);
      try {
        return fs.statSync(full).isDirectory() && !name.startsWith('.');
      } catch {
        return false;
      }
    })
    .sort();
}

/**
 * Pick an existing project or create a new one. New projects get the standard
 * `tests/`, `data/`, `recordings/` subfolders so subsequent actions
 * (Generate / Import / Convert) drop files into the right place.
 */
async function pickOrCreateProject(rl: Interface): Promise<string | null> {
  const existing = listExistingProjects();
  if (existing.length === 0) {
    Logger.detail('No projects found under testSuites/ yet — let\'s create one.');
    return await createProjectInteractive(rl);
  }
  output.write('\nExisting projects:\n');
  existing.forEach((name, idx) => output.write(`  ${idx + 1}. ${name}\n`));
  output.write(`  ${existing.length + 1}. + Create a new project\n`);
  while (true) {
    const ans = (await rl.question(cq('\nSelect project (number) or type a project name: '))).trim();
    if (!ans) return null;
    const asNum = Number(ans);
    if (Number.isInteger(asNum) && asNum >= 1 && asNum <= existing.length) {
      return existing[asNum - 1];
    }
    if (Number.isInteger(asNum) && asNum === existing.length + 1) {
      return await createProjectInteractive(rl);
    }
    // Treat free-text input as a project name; create if missing.
    if (existing.includes(ans)) return ans;
    const create = await confirm(rl, `Project "${ans}" doesn't exist. Create it?`, true);
    if (create) {
      ensureProjectScaffold(ans);
      return ans;
    }
  }
}

async function createProjectInteractive(rl: Interface): Promise<string | null> {
  const name = (await rl.question(cq('Project name (folder under testSuites/): '))).trim();
  if (!name) return null;
  if (!/^[a-zA-Z0-9_\- ]+$/.test(name)) {
    Logger.warn('Project name should contain only letters, digits, underscores, hyphens, or spaces.');
    return null;
  }
  ensureProjectScaffold(name);
  return name;
}

/**
 * Create the standard project folder layout if it doesn't exist.
 * Idempotent — safe to call when the project already exists.
 */
function ensureProjectScaffold(projectName: string): void {
  const projectRoot = path.join(process.cwd(), 'testSuites', projectName);
  const subdirs = ['tests', 'data', 'recordings'];
  const created: string[] = [];
  for (const sub of subdirs) {
    const full = path.join(projectRoot, sub);
    if (!fs.existsSync(full)) {
      fs.mkdirSync(full, { recursive: true });
      created.push(`testSuites/${projectName}/${sub}/`);
    }
  }
  if (created.length > 0) {
    Logger.pass(`Created project "${projectName}":`);
    for (const c of created) Logger.detail(`  • ${c}`);
  } else {
    Logger.detail(`Project "${projectName}" already exists — using it.`);
  }
}

/**
 * File picker — searches cwd + immediate subdirs for files matching the
 * extension or regex, presents a numbered list, falls back to manual path
 * entry. Returns the (possibly relative) path the user picked, or null if
 * they bailed.
 */
async function pickFile(
  rl: Interface,
  defaultExt: string,
  label: string,
  matcher?: RegExp,
): Promise<string | null> {
  const re = matcher ?? new RegExp(`${defaultExt.replace('.', '\\.')}$`, 'i');
  const found = findFiles(process.cwd(), re, 2);
  if (found.length > 0) {
    output.write(`\nFound ${label}(s):\n`);
    found.forEach((f, idx) => output.write(`  ${idx + 1}. ${path.relative(process.cwd(), f)}\n`));
    output.write(`  ${found.length + 1}. Enter a different path manually\n`);
    output.write('  (You can paste a full path or a relative one — surrounding quotes are OK.)\n');
    const ans = cleanPath(await rl.question(cq(`\nPick a ${label} (number or path): `)));
    if (!ans) return null;
    const n = Number(ans);
    if (Number.isInteger(n) && n >= 1 && n <= found.length) return found[n - 1];
    if (Number.isInteger(n) && n === found.length + 1) {
      const manual = cleanPath(await rl.question(cq(`Path to ${label}: `)));
      return resolveUserPath(manual, label);
    }
    // Free-text path
    return resolveUserPath(ans, label);
  }
  const manual = cleanPath(await rl.question(`Path to ${label}: `));
  return resolveUserPath(manual, label);
}

/**
 * Normalize a user-typed path string. Trims whitespace and strips a single
 * layer of surrounding single/double quotes — Windows "Copy as path" and many
 * shells wrap pasted paths in `"..."`, which otherwise defeats absolute-path
 * detection (path.resolve would treat the quoted string as relative and join
 * it onto the cwd).
 */
function cleanPath(raw: string): string {
  let s = raw.trim();
  if (s.length >= 2) {
    const first = s[0];
    const last = s[s.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      s = s.slice(1, -1).trim();
    }
  }
  return s;
}

/**
 * Resolve a user-supplied file path (absolute or relative to cwd) and verify
 * it exists before handing it to a CLI handler. Returns null if the user
 * entered nothing; warns and returns null if the path can't be found so the
 * wizard can re-prompt rather than failing deep inside a handler.
 */
function resolveUserPath(raw: string, label: string): string | null {
  if (!raw) return null;
  const abs = path.resolve(process.cwd(), raw);
  if (!fs.existsSync(abs)) {
    Logger.warn(`${label} not found at: ${abs}`);
    return null;
  }
  return abs;
}

/**
 * Search the given directory recursively (limited depth) for files matching
 * the regex. Bounded to keep this from walking node_modules / .git / dist.
 */
function findFiles(root: string, re: RegExp, maxDepth: number): string[] {
  const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.tmp-init-check', 'results']);
  const results: string[] = [];
  const walk = (dir: string, depth: number): void => {
    if (depth > maxDepth) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
        walk(full, depth + 1);
      } else if (entry.isFile() && re.test(entry.name)) {
        results.push(full);
      }
    }
  };
  walk(root, 0);
  // Stable order: relative path, alphabetical.
  return results.sort((a, b) =>
    path.relative(root, a).localeCompare(path.relative(root, b)),
  );
}

/** Pick a test plan from `config/test_plans/`. */
async function pickPlan(rl: Interface): Promise<string | null> {
  const plansDir = path.join(process.cwd(), 'config', 'test_plans');
  if (!fs.existsSync(plansDir)) {
    Logger.warn('No config/test_plans/ folder found. Provide a path manually.');
    const manual = cleanPath(await rl.question(cq('Path to test plan JSON: ')));
    return resolveUserPath(manual, 'Test plan');
  }
  const plans = fs
    .readdirSync(plansDir)
    .filter((name) => name.endsWith('.json') || name.endsWith('.jsonc'))
    .sort();
  if (plans.length === 0) {
    const manual = cleanPath(await rl.question(cq('No plans found. Path to test plan JSON: ')));
    return resolveUserPath(manual, 'Test plan');
  }
  output.write('\nAvailable test plans:\n');
  plans.forEach((p, idx) => output.write(`  ${idx + 1}. ${p}\n`));
  output.write(`  ${plans.length + 1}. Enter a different path\n`);
  const ans = cleanPath(await rl.question(cq('\nPick a plan (number or path): ')));
  if (!ans) return null;
  const n = Number(ans);
  if (Number.isInteger(n) && n >= 1 && n <= plans.length) {
    return path.join('config', 'test_plans', plans[n - 1]);
  }
  if (Number.isInteger(n) && n === plans.length + 1) {
    const manual = cleanPath(await rl.question(cq('Path to test plan JSON: ')));
    return resolveUserPath(manual, 'Test plan');
  }
  return resolveUserPath(ans, 'Test plan');
}

/** Suggest a script name based on an input file path. */
async function askScriptName(rl: Interface, suggestFromPath: string): Promise<string | null> {
  const base = path.basename(suggestFromPath).replace(/\.[^.]+$/, '');
  const suggestion = base.replace(/[^a-zA-Z0-9_-]+/g, '_');
  const ans = (await rl.question(cq(`Script name [${suggestion}]: `))).trim();
  return ans || suggestion || null;
}

/**
 * Resolve a target script name against existing files in the project's
 * `tests/` folder. If the file already exists, ask whether to overwrite it,
 * save under a different name (re-checking that one too), or cancel. Returns
 * the chosen `{ name, overwrite }`, or null if the user cancelled.
 *
 * Shared by every authoring wizard (Generate / Convert / BYOS / cURL / Postman)
 * so the "already exists" experience is consistent across features.
 */
async function resolveScriptTarget(
  rl: Interface,
  project: string,
  scriptName: string,
): Promise<{ name: string; overwrite: boolean } | null> {
  let name = scriptName;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const file = name.endsWith('.js') ? name : `${name}.js`;
    const full = path.join(process.cwd(), 'testSuites', project, 'tests', file);
    if (!fs.existsSync(full)) return { name, overwrite: false };

    const choice = await pickFromOptions(
      rl,
      `"${file}" already exists in project "${project}". What would you like to do?`,
      [
        { key: '1', label: 'Overwrite the existing file', value: 'overwrite' as const },
        { key: '2', label: 'Save under a different name', value: 'rename' as const },
        { key: '3', label: 'Cancel', value: 'cancel' as const },
      ],
    );
    if (!choice || choice === 'cancel') return null;
    if (choice === 'overwrite') return { name, overwrite: true };

    const newName = await askInput(rl, 'New script name (without .js):');
    if (!newName) return null;
    name = newName;
  }
}

/** Read lines from stdin until a blank line is entered. */
async function readUntilBlankLine(rl: Interface): Promise<string> {
  const lines: string[] = [];
  // readline's `question` consumes one line; loop until a blank line.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const line = await rl.question('');
    if (line === '') break;
    lines.push(line);
  }
  return lines.join('\n');
}

async function askInput(rl: Interface, label: string): Promise<string | null> {
  const ans = (await rl.question(cq(label + ' '))).trim();
  return ans || null;
}

/** Wrap a question/prompt string in the panel's prompt color (cyan). */
function cq(text: string): string {
  return `${ansi.cyan}${text}${ansi.reset}`;
}

async function confirm(rl: Interface, question: string, defaultYes: boolean): Promise<boolean> {
  // Color-code the prompt: cyan question + a yellow [Y/n] hint with the
  // default choice capitalized, matching the rest of the panel's styling.
  const hint = defaultYes ? 'Y/n' : 'y/N';
  const styled = `${ansi.cyan}${question}${ansi.reset} ${ansi.bold}${ansi.yellow}[${hint}]${ansi.reset} `;
  const ans = (await rl.question(styled)).trim().toLowerCase();
  if (!ans) return defaultYes;
  return ans === 'y' || ans === 'yes';
}

interface OptionChoice<T> {
  key: string;
  label: string;
  value: T;
}

async function pickFromOptions<T>(
  rl: Interface,
  prompt: string,
  options: OptionChoice<T>[],
): Promise<T | null> {
  output.write('\n');
  // Right-align the keys so labels start in the same column regardless of
  // single- vs double-digit numbers (keeps indented trees readable).
  const keyWidth = Math.max(...options.map((o) => o.key.length));
  for (const opt of options) {
    output.write(`  ${opt.key.padStart(keyWidth)}. ${opt.label}\n`);
  }
  const valid = new Map(options.map((o) => [o.key, o]));
  while (true) {
    const ans = (await rl.question(cq(`\n${prompt} (number, or blank to cancel): `))).trim();
    if (!ans) return null;
    const picked = valid.get(ans);
    if (picked) return picked.value;
    Logger.warn(`Invalid option "${ans}".`);
  }
}

/**
 * Render a Postman folder as an indented tree row: top-level folders sit flush
 * left, nested folders are indented per level and prefixed with a `└─` branch
 * so the hierarchy is unmistakable in the numbered list.
 */
function folderTreeLabel(f: { rawPath: string[]; depth: number }): string {
  const leaf = f.rawPath[f.rawPath.length - 1];
  if (f.depth <= 1) return leaf;
  const indent = '   '.repeat(f.depth - 2);
  return `${indent}└─ ${leaf}`;
}

function printBanner(): void {
  output.write('\n');
  Logger.header('k6 Performance Framework — Interactive Mode');
  Logger.detail('Direct CLI commands still work; this panel is for guided runs.');
  Logger.detail('Press 0, q, or Ctrl+C at any prompt to exit.\n');
}
