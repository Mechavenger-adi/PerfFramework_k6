/**
 * templates.ts
 * Phase 3 – Template Library Discovery
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'jsonc-parser';

export function listTemplates(type: 'test-plans' | 'runtime-settings') {
  const templatesDir = path.resolve(process.cwd(), `templates/${type}`);
  if (!fs.existsSync(templatesDir)) {
    console.log(`\nNo templates found in ${templatesDir}\n`);
    return;
  }

  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.jsonc') || f.endsWith('.json'));
  if (files.length === 0) {
    console.log(`\nNo templates found in ${templatesDir}\n`);
    return;
  }

  console.log(`\nAvailable ${type === 'test-plans' ? 'Test Plan' : 'Runtime Settings'} Templates:\n`);
  
  for (const file of files) {
    const absPath = path.join(templatesDir, file);
    try {
      const content = parse(fs.readFileSync(absPath, 'utf-8'));
      const title = content?._meta?.title || file;
      const desc = content?._meta?.description || 'No description available.';
      console.log(`  \x1b[36m${file}\x1b[0m — ${title}`);
      console.log(`    ${desc}\n`);
    } catch {
      console.log(`  \x1b[36m${file}\x1b[0m — (failed to parse)`);
    }
  }
}

export function showTemplate(type: 'test-plans' | 'runtime-settings', name: string) {
  let fileName = name;
  if (!fileName.endsWith('.jsonc') && !fileName.endsWith('.json')) {
    fileName += '.jsonc';
  }

  const templatePath = path.resolve(process.cwd(), `templates/${type}`, fileName);
  if (!fs.existsSync(templatePath)) {
    // Try .json if .jsonc failed
    const altPath = path.resolve(process.cwd(), `templates/${type}`, name + '.json');
    if (fs.existsSync(altPath)) {
      console.log(fs.readFileSync(altPath, 'utf-8'));
      return;
    }
    console.error(`\n[FAIL] Template '${name}' not found in templates/${type}/\n`);
    process.exit(1);
  }

  console.log('\n' + fs.readFileSync(templatePath, 'utf-8') + '\n');
}
