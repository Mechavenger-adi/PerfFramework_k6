import * as fs from 'fs';
import * as path from 'path';
import { HARParser } from '../recording/HARParser';
import { TransactionGrouper } from '../recording/TransactionGrouper';
import { ScriptGenerator } from '../recording/ScriptGenerator';

export function runGenerate(harPath: string, teamName: string, outName: string) {
  const absoluteHarPath = path.resolve(process.cwd(), harPath);
  if (!fs.existsSync(absoluteHarPath)) {
    console.error(`HAR file not found: ${absoluteHarPath}`);
    process.exit(1);
  }

  console.log(`Loading HAR from: ${absoluteHarPath}`);
  
  // Using sensible defaults for refinement
  const entries = HARParser.parse(absoluteHarPath, { excludeStaticAssets: true });
  const groups = TransactionGrouper.group(entries);
  const scriptContent = ScriptGenerator.generate(groups);

  const targetDir = path.join(process.cwd(), 'scrum-suites', teamName, 'tests');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const scriptName = outName.endsWith('.js') ? outName : `${outName}.js`;
  const outPath = path.join(targetDir, scriptName);
  
  fs.writeFileSync(outPath, scriptContent);
  console.log(`[PASS] Generated k6 script from HAR at: ${outPath}`);
}
