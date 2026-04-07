import * as fs from 'fs';
import * as path from 'path';
import { ScriptConverter } from '../recording/ScriptConverter';
import { Logger } from '../utils/logger';

/**
 * CLI handler for `convert` command.
 * Converts a conventional k6 script into a framework-compatible script
 * with logExchange calls, request definition objects, and transaction wrappers.
 */
export function runConvert(
  inputPath: string,
  teamName: string,
  scriptName: string,
  options: { inPlace?: boolean },
): void {
  const absoluteInput = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(absoluteInput)) {
    Logger.fail(`Input script not found: ${absoluteInput}`);
    process.exit(1);
  }

  Logger.header('k6 Performance Framework – CONVERT');
  Logger.detail(`Input : ${absoluteInput}`);

  const converted = ScriptConverter.convertFile(absoluteInput);

  if (options.inPlace) {
    fs.writeFileSync(absoluteInput, converted, 'utf-8');
    Logger.pass(`Converted in-place: ${absoluteInput}`);
    return;
  }

  // Write to scrum-suites/<team>/tests/<name>.js
  const suiteDir = path.join(process.cwd(), 'scrum-suites', teamName);
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
