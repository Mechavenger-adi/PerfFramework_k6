import * as fs from 'fs';
import * as path from 'path';
import { Interface, createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { HARParser } from '../recording/HARParser';
import { DomainFilter } from '../recording/DomainFilter';
import { TransactionGrouper } from '../recording/TransactionGrouper';
import { LifecycleSelection, ScriptGenerator } from '../recording/ScriptGenerator';
import { ExchangeLogBuilder } from '../debug/ExchangeLog';
import { RecordingLogResolver } from '../debug/RecordingLogResolver';
import { promptForLifecycleSelection } from './LifecyclePrompt';

export async function runGenerate(harPath: string, teamName: string, outName: string): Promise<void> {
  const absoluteHarPath = path.resolve(process.cwd(), harPath);
  if (!fs.existsSync(absoluteHarPath)) {
    console.error(`HAR file not found: ${absoluteHarPath}`);
    process.exit(1);
  }

  console.log(`Loading HAR from: ${absoluteHarPath}`);

  const discoveredEntries = HARParser.readEntries(absoluteHarPath);
  const domainStats = DomainFilter.summarize(discoveredEntries);
  const rl = createInterface({ input, output });
  let allowedDomains: string[];
  let excludeStaticAssets: boolean;
  let lifecycleSelection: LifecycleSelection = { initGroups: [], endGroups: [] };
  let groups;
  try {
    allowedDomains = await promptForDomains(rl, domainStats);
    excludeStaticAssets = await promptForStaticAssetPreference(rl);
    const entries = HARParser.parse(absoluteHarPath, {
      allowedDomains,
      excludeStaticAssets,
    });
    groups = TransactionGrouper.group(entries);
    lifecycleSelection = await promptForLifecycleSelection(rl, groups.map((group) => group.name));
  } finally {
    rl.close();
  }
  const scriptContent = ScriptGenerator.generate(groups, lifecycleSelection);
  const recordingLog = ExchangeLogBuilder.fromGroups(groups);

  const suiteDir = path.join(process.cwd(), 'scrum-suites', teamName);
  const targetDir = path.join(suiteDir, 'tests');
  const recordingDir = path.join(suiteDir, 'recordings');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  if (!fs.existsSync(recordingDir)) {
    fs.mkdirSync(recordingDir, { recursive: true });
  }

  const scriptName = outName.endsWith('.js') ? outName : `${outName}.js`;
  const outPath = path.join(targetDir, scriptName);
  const recordingLogName = `${path.parse(scriptName).name}.recording-log.json`;
  const recordingLogPath = path.join(recordingDir, recordingLogName);

  fs.writeFileSync(outPath, scriptContent);
  fs.writeFileSync(recordingLogPath, JSON.stringify(recordingLog, null, 2), 'utf-8');
  RecordingLogResolver.upsertRegistryEntry(recordingDir, {
    scriptPath: path.relative(process.cwd(), outPath),
    recordingLogPath: path.relative(process.cwd(), recordingLogPath),
    sourceHarPath: path.relative(process.cwd(), absoluteHarPath),
    generatedAt: new Date().toISOString(),
  });
  console.log(`[PASS] Selected domains: ${allowedDomains.join(', ')}`);
  console.log(`[PASS] Static assets: ${excludeStaticAssets ? 'excluded' : 'included'}`);
  console.log(`[PASS] Generated k6 script from HAR at: ${outPath}`);
  console.log(`[PASS] Generated recording log at: ${recordingLogPath}`);
  console.log(`[PASS] Updated recording registry in: ${recordingDir}`);
}

async function promptForDomains(
  rl: Interface,
  domainStats: Array<{ host: string; count: number }>,
): Promise<string[]> {
  if (domainStats.length === 0) {
    throw new Error('No request domains were found in the HAR file.');
  }

  console.log('\nDiscovered domains in HAR:');
  domainStats.forEach((domain, index) => {
    console.log(`  ${index + 1}. ${domain.host} (${domain.count} request${domain.count === 1 ? '' : 's'})`);
  });

  const answer = await rl.question(
    '\nEnter the domain numbers or host names to include (comma-separated, or "all"): ',
  );

  const trimmed = answer.trim();
  if (!trimmed) {
    return [domainStats[0].host];
  }

  if (trimmed.toLowerCase() === 'all') {
    return domainStats.map((domain) => domain.host);
  }

  const selections = trimmed.split(',').map((token) => token.trim()).filter(Boolean);
  const chosen = new Set<string>();

  for (const selection of selections) {
    const asNumber = Number(selection);
    if (!Number.isNaN(asNumber) && Number.isInteger(asNumber)) {
      const domain = domainStats[asNumber - 1];
      if (!domain) {
        throw new Error(`Invalid domain selection index: ${selection}`);
      }
      chosen.add(domain.host);
      continue;
    }

    const directMatch = domainStats.find((domain) => domain.host === selection);
    if (!directMatch) {
      throw new Error(`Unknown domain selection: ${selection}`);
    }
    chosen.add(directMatch.host);
  }

  if (chosen.size === 0) {
    throw new Error('At least one domain must be selected.');
  }

  return Array.from(chosen);
}

async function promptForStaticAssetPreference(rl: Interface): Promise<boolean> {
  const answer = await rl.question(
    'Do you want to include static assets such as css, js, images, and fonts? [y/N]: ',
  );
  const normalized = answer.trim().toLowerCase();
  const includeStatic = normalized === 'y' || normalized === 'yes';
  return !includeStatic;
}
