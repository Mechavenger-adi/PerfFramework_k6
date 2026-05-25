/**
 * new.ts
 * Phase 5 – Basic interactive wizard for 'new' command
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

export function runNewWizard() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n============================================');
  console.log('|     K6-PerfFramework Config Wizard       |');
  console.log('============================================\n');

  rl.question('What would you like to create? (1: test-plan, 2: runtime_settings): ', (typeChoice) => {
    const typeStr = typeChoice.trim() === '2' ? 'runtime_settings' : 'test_plans';
    
    const templatesDir = path.resolve(process.cwd(), `templates/${typeStr}`);
    if (!fs.existsSync(templatesDir)) {
      console.log(`\n[FAIL] No templates found in ${templatesDir}\n`);
      rl.close();
      return;
    }

    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.jsonc') || f.endsWith('.json'));
    console.log(`\nAvailable ${typeStr} templates:`);
    files.forEach((f, idx) => {
      console.log(`  ${idx + 1}. ${f}`);
    });

    rl.question(`\nEnter template number (1-${files.length}): `, (templateChoice) => {
      const idx = parseInt(templateChoice.trim()) - 1;
      if (isNaN(idx) || idx < 0 || idx >= files.length) {
        console.log('\n[FAIL] Invalid template choice.\n');
        rl.close();
        return;
      }
      
      const selectedTemplate = files[idx];
      
      rl.question('Enter filename to save as (e.g., my-load_test.jsonc): ', (filename) => {
        let finalName = filename.trim() || `my-${typeStr}-1.jsonc`;
        if (!finalName.endsWith('.json') && !finalName.endsWith('.jsonc')) {
          finalName += '.jsonc';
        }
        
        const destDir = path.resolve(process.cwd(), `config/${typeStr}`);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        
        const destPath = path.join(destDir, finalName);
        const srcPath = path.join(templatesDir, selectedTemplate);
        
        fs.copyFileSync(srcPath, destPath);
        console.log(`\n[PASS] Successfully created ${path.relative(process.cwd(), destPath)} from template '${selectedTemplate}'.\n`);
        rl.close();
      });
    });
  });
}
