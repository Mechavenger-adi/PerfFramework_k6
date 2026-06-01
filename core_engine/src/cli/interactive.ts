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
import { Logger } from '../utils/logger';
import { runInit } from './init';
import { runGenerate } from './generate';
import { runConvert } from './convert';
import { runGenerateByos } from './generate-byos';
import { runImportCurl, runImportPostman } from './import';
import { runValidate } from './validate';
import { listFeatures } from './features';
import { listTemplates } from './templates';
import { inspectConfig } from './config-inspect';

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
  | 'templates'
  | 'features'
  | 'config-inspect'
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
      { key: '10', label: 'List or show templates', choice: 'templates' },
      { key: '11', label: 'Inspect resolved config for a plan', choice: 'config-inspect' },
      { key: '12', label: 'List framework features', choice: 'features' },
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
    const ans = (await rl.question('\nSelect an option (number, or 0 to exit): ')).trim();
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
    case 'templates':      return wizardTemplates(rl);
    case 'features':       listFeatures(); return;
    case 'config-inspect': return wizardConfigInspect(rl);
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
  const team = await pickOrCreateTeam(rl);
  if (!team) return;
  const scriptName = await askScriptName(rl, harPath);
  if (!scriptName) return;
  await runGenerate(harPath, team, scriptName);
}

async function wizardConvert(rl: Interface): Promise<void> {
  Logger.header('Convert native k6 script → framework script');
  const inputPath = await pickFile(rl, '.js', 'k6 script');
  if (!inputPath) return;
  const team = await pickOrCreateTeam(rl);
  if (!team) return;
  const scriptName = await askScriptName(rl, inputPath);
  if (!scriptName) return;
  const inPlace = await confirm(rl, 'Overwrite the input file in place instead of writing a copy?', false);
  await runConvert(inputPath, team, scriptName, { inPlace });
}

async function wizardByos(rl: Interface): Promise<void> {
  Logger.header('Bring Your Own Script (BYOS)');
  const team = await pickOrCreateTeam(rl);
  if (!team) return;
  const scriptName = await askInput(rl, 'Script name (without .js):');
  if (!scriptName) return;
  runGenerateByos(team, scriptName);
}

async function wizardImportCurl(rl: Interface): Promise<void> {
  Logger.header('Create API test from cURL');
  const team = await pickOrCreateTeam(rl);
  if (!team) return;
  const scriptName = await askInput(rl, 'Script name (without .js):');
  if (!scriptName) return;

  // Three input modes: clipboard, file, paste. Default to clipboard since
  // "Copy as cURL" from a browser DevTools is the most common workflow.
  const source = await pickFromOptions(rl, 'Where is the curl coming from?', [
    { key: '1', label: 'Clipboard (paste browser "Copy as cURL")', value: 'clipboard' as const },
    { key: '2', label: 'File path (multi-curl supported; `# Name` lines set transaction names)', value: 'file' as const },
    { key: '3', label: 'Paste here (end with blank line)', value: 'paste' as const },
  ]);
  if (!source) return;

  if (source === 'clipboard') {
    await runImportCurl(team, scriptName, { clipboard: true });
    return;
  }
  if (source === 'file') {
    const filePath = await pickFile(rl, '.curl', 'curl file', /\.(curl|txt|sh)$/i);
    if (!filePath) return;
    await runImportCurl(team, scriptName, { file: filePath });
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
  await runImportCurl(team, scriptName, { curl: text });
}

async function wizardImportPostman(rl: Interface): Promise<void> {
  Logger.header('Create API test from Postman collection');
  const team = await pickOrCreateTeam(rl);
  if (!team) return;
  const scriptName = await askInput(rl, 'Script name (without .js):');
  if (!scriptName) return;
  const filePath = await pickFile(rl, '.postman_collection.json', 'Postman collection', /\.postman_collection\.json$/i);
  if (!filePath) return;

  // Optional folder filter. Parse just enough of the collection to list its
  // top-level folder names so the user can pick one without re-typing.
  let folder: string | undefined;
  const folderChoices = readTopLevelPostmanFolders(filePath);
  if (folderChoices.length > 0) {
    const want = await confirm(rl, 'Filter to a specific top-level folder?', false);
    if (want) {
      const picked = await pickFromOptions(
        rl,
        'Which folder?',
        folderChoices.map((name, idx) => ({ key: String(idx + 1), label: name, value: name })),
      );
      if (picked) folder = picked;
    }
  }
  await runImportPostman(team, scriptName, { file: filePath, folder });
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
  const { spawn } = await import('node:child_process');
  await new Promise<void>((resolve) => {
    const child = spawn(
      process.execPath,
      [process.argv[1], 'run', '--plan', planPath],
      { stdio: 'inherit' },
    );
    child.on('exit', () => resolve());
  });
}

async function wizardDebug(rl: Interface): Promise<void> {
  Logger.header('Debug replay');
  const scriptPath = await pickFile(rl, '.js', 'journey script');
  if (!scriptPath) return;
  // Same reasoning as `run` — debug spawns k6 and streams output; re-spawn
  // for clean stdio inheritance instead of trying to run it under readline.
  const { spawn } = await import('node:child_process');
  await new Promise<void>((resolve) => {
    const child = spawn(
      process.execPath,
      [process.argv[1], 'debug', '--script', scriptPath],
      { stdio: 'inherit' },
    );
    child.on('exit', () => resolve());
  });
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

async function wizardTemplates(rl: Interface): Promise<void> {
  Logger.header('Templates');
  const which = await pickFromOptions(rl, 'Which template type?', [
    { key: '1', label: 'Test plans', value: 'test_plans' as const },
    { key: '2', label: 'Runtime settings', value: 'runtime_settings' as const },
  ]);
  if (!which) return;
  listTemplates(which);
}

async function wizardConfigInspect(rl: Interface): Promise<void> {
  Logger.header('Inspect resolved config');
  const planPath = await pickPlan(rl);
  if (!planPath) return;
  inspectConfig(planPath, undefined, undefined, undefined);
}

// ---------------------------------------------------------------------------
// Shared helpers — workspace, teams, files, prompts
// ---------------------------------------------------------------------------

function isFrameworkWorkspace(): boolean {
  return (
    fs.existsSync(path.join(process.cwd(), 'config')) ||
    fs.existsSync(path.join(process.cwd(), 'testSuites'))
  );
}

/** List existing team folders under testSuites/ (one folder per team). */
function listExistingTeams(): string[] {
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
 * Pick an existing team or create a new one. New teams get the standard
 * `tests/`, `data/`, `recordings/` subfolders so subsequent actions
 * (Generate / Import / Convert) drop files into the right place.
 */
async function pickOrCreateTeam(rl: Interface): Promise<string | null> {
  const existing = listExistingTeams();
  if (existing.length === 0) {
    Logger.detail('No teams found under testSuites/ yet — let\'s create one.');
    return await createTeamInteractive(rl);
  }
  output.write('\nExisting teams:\n');
  existing.forEach((name, idx) => output.write(`  ${idx + 1}. ${name}\n`));
  output.write(`  ${existing.length + 1}. + Create a new team\n`);
  while (true) {
    const ans = (await rl.question('\nSelect team (number) or type a team name: ')).trim();
    if (!ans) return null;
    const asNum = Number(ans);
    if (Number.isInteger(asNum) && asNum >= 1 && asNum <= existing.length) {
      return existing[asNum - 1];
    }
    if (Number.isInteger(asNum) && asNum === existing.length + 1) {
      return await createTeamInteractive(rl);
    }
    // Treat free-text input as a team name; create if missing.
    if (existing.includes(ans)) return ans;
    const create = await confirm(rl, `Team "${ans}" doesn't exist. Create it?`, true);
    if (create) {
      ensureTeamScaffold(ans);
      return ans;
    }
  }
}

async function createTeamInteractive(rl: Interface): Promise<string | null> {
  const name = (await rl.question('Team name (folder under testSuites/): ')).trim();
  if (!name) return null;
  if (!/^[a-zA-Z0-9_\- ]+$/.test(name)) {
    Logger.warn('Team name should contain only letters, digits, underscores, hyphens, or spaces.');
    return null;
  }
  ensureTeamScaffold(name);
  return name;
}

/**
 * Create the standard team folder layout if it doesn't exist.
 * Idempotent — safe to call when the team already exists.
 */
function ensureTeamScaffold(teamName: string): void {
  const teamRoot = path.join(process.cwd(), 'testSuites', teamName);
  const subdirs = ['tests', 'data', 'recordings'];
  const created: string[] = [];
  for (const sub of subdirs) {
    const full = path.join(teamRoot, sub);
    if (!fs.existsSync(full)) {
      fs.mkdirSync(full, { recursive: true });
      created.push(`testSuites/${teamName}/${sub}/`);
    }
  }
  if (created.length > 0) {
    Logger.pass(`Created team "${teamName}":`);
    for (const c of created) Logger.detail(`  • ${c}`);
  } else {
    Logger.detail(`Team "${teamName}" already exists — using it.`);
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
    const ans = (await rl.question(`\nPick a ${label} (number or path): `)).trim();
    if (!ans) return null;
    const n = Number(ans);
    if (Number.isInteger(n) && n >= 1 && n <= found.length) return found[n - 1];
    if (Number.isInteger(n) && n === found.length + 1) {
      const manual = (await rl.question(`Path to ${label}: `)).trim();
      return manual || null;
    }
    // Free-text path
    return ans;
  }
  const manual = (await rl.question(`Path to ${label}: `)).trim();
  return manual || null;
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
    const ans = (await rl.question('Path to test plan JSON: ')).trim();
    return ans || null;
  }
  const plans = fs
    .readdirSync(plansDir)
    .filter((name) => name.endsWith('.json') || name.endsWith('.jsonc'))
    .sort();
  if (plans.length === 0) {
    const ans = (await rl.question('No plans found. Path to test plan JSON: ')).trim();
    return ans || null;
  }
  output.write('\nAvailable test plans:\n');
  plans.forEach((p, idx) => output.write(`  ${idx + 1}. ${p}\n`));
  output.write(`  ${plans.length + 1}. Enter a different path\n`);
  const ans = (await rl.question('\nPick a plan (number or path): ')).trim();
  if (!ans) return null;
  const n = Number(ans);
  if (Number.isInteger(n) && n >= 1 && n <= plans.length) {
    return path.join('config', 'test_plans', plans[n - 1]);
  }
  if (Number.isInteger(n) && n === plans.length + 1) {
    const manual = (await rl.question('Path to test plan JSON: ')).trim();
    return manual || null;
  }
  return ans;
}

/** Suggest a script name based on an input file path. */
async function askScriptName(rl: Interface, suggestFromPath: string): Promise<string | null> {
  const base = path.basename(suggestFromPath).replace(/\.[^.]+$/, '');
  const suggestion = base.replace(/[^a-zA-Z0-9_-]+/g, '_');
  const ans = (await rl.question(`Script name [${suggestion}]: `)).trim();
  return ans || suggestion || null;
}

/** Read top-level folder names from a Postman v2.1 collection for a quick filter pick. */
function readTopLevelPostmanFolders(filePath: string): string[] {
  try {
    const json = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as {
      item?: Array<{ name?: string; item?: unknown[] }>;
    };
    return (json.item ?? [])
      .filter((it) => Array.isArray(it.item))
      .map((it) => it.name ?? '')
      .filter(Boolean);
  } catch {
    return [];
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
  const ans = (await rl.question(label + ' ')).trim();
  return ans || null;
}

async function confirm(rl: Interface, question: string, defaultYes: boolean): Promise<boolean> {
  const hint = defaultYes ? 'Y/n' : 'y/N';
  const ans = (await rl.question(`${question} [${hint}] `)).trim().toLowerCase();
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
  for (const opt of options) {
    output.write(`  ${opt.key}. ${opt.label}\n`);
  }
  const valid = new Map(options.map((o) => [o.key, o]));
  while (true) {
    const ans = (await rl.question(`\n${prompt} (number, or blank to cancel): `)).trim();
    if (!ans) return null;
    const picked = valid.get(ans);
    if (picked) return picked.value;
    Logger.warn(`Invalid option "${ans}".`);
  }
}

function printBanner(): void {
  output.write('\n');
  Logger.header('k6 Performance Framework — Interactive Mode');
  Logger.detail('Direct CLI commands still work; this panel is for guided runs.');
  Logger.detail('Press 0, q, or Ctrl+C at any prompt to exit.\n');
}
