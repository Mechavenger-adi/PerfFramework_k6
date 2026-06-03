import * as fs from 'fs';
import * as path from 'path';
import { Interface, createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { ScriptConverter } from '../recording/ScriptConverter';
import { LifecycleSelection } from '../recording/ScriptGenerator';
import { Logger } from '../utils/logger';
import { promptForLifecycleSelection } from './LifecyclePrompt';

/**
 * CLI handler for `convert` command.
 * Converts a conventional k6 script into a framework-compatible script
 * with logExchange calls, request definition objects, and transaction wrappers.
 */
export async function runConvert(
  inputPath: string,
  teamName: string,
  scriptName: string,
  options: { inPlace?: boolean; externalRl?: Interface },
): Promise<void> {
  const absoluteInput = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(absoluteInput)) {
    Logger.fail(`Input script not found: ${absoluteInput}`);
    process.exit(1);
  }

  Logger.header('k6 Performance Framework – CONVERT');
  Logger.detail(`Input : ${absoluteInput}`);

  const source = fs.readFileSync(absoluteInput, 'utf-8');
  const groupNames = ScriptConverter.extractGroupNames(source);
  let lifecycleSelection: LifecycleSelection = { initGroups: [], endGroups: [] };

  if (process.stdin.isTTY && process.stdout.isTTY) {
    // Reuse the caller's readline interface when supplied (the interactive
    // panel). A second interface on the same stdin double-echoes keystrokes.
    const rl = options.externalRl ?? createInterface({ input, output });
    const ownsRl = options.externalRl === undefined;
    try {
      lifecycleSelection = await promptForLifecycleSelection(rl, groupNames);
    } finally {
      if (ownsRl) rl.close();
    }
  }

  const converted = ScriptConverter.convert(source, teamName, lifecycleSelection);

  if (options.inPlace) {
    fs.writeFileSync(absoluteInput, converted, 'utf-8');
    Logger.pass(`Converted in-place: ${absoluteInput}`);
    return;
  }

  // Write to testSuites/<team>/tests/<name>.js
  const suiteDir = path.join(process.cwd(), 'testSuites', teamName);
  const targetDir = path.join(suiteDir, 'tests');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const outFileName = scriptName.endsWith('.js') ? scriptName : `${scriptName}.js`;
  const outPath = path.join(targetDir, outFileName);

  fs.writeFileSync(outPath, converted, 'utf-8');
  Logger.pass(`Converted script written to: ${outPath}`);
  Logger.detail(`Team  : ${teamName}`);
  Logger.detail(`Script: ${outFileName}\n`);
}
