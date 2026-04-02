/**
 * TestPlanLoader.ts
 * Phase 1 – Loads and parses a test plan JSON file.
 * Delegates schema validation to SchemaValidator.
 */

import * as fs from 'fs';
import * as path from 'path';
import { TestPlan } from '../types/TestPlanSchema';
import { SchemaValidator } from '../config/SchemaValidator';

export class TestPlanLoader {
  private readonly schemaValidator: SchemaValidator;

  constructor() {
    this.schemaValidator = new SchemaValidator();
  }

  /**
   * Load and validate a test plan from a JSON file.
   * Throws with a descriptive message on parse failure or schema violations.
   */
  load(planFilePath: string): TestPlan {
    const abs = path.resolve(process.cwd(), planFilePath);

    if (!fs.existsSync(abs)) {
      throw new Error(`[TestPlanLoader] Test plan file not found: ${abs}`);
    }

    let raw: unknown;
    try {
      raw = JSON.parse(fs.readFileSync(abs, 'utf-8'));
    } catch (err) {
      throw new Error(
        `[TestPlanLoader] Failed to parse JSON at ${abs}: ${(err as Error).message}`,
      );
    }

    const result = this.schemaValidator.validatePlan(raw);
    if (!result.valid) {
      throw new Error(
        `[TestPlanLoader] Test plan schema validation failed:\n${result.errors.join('\n')}`,
      );
    }

    return raw as TestPlan;
  }
}
