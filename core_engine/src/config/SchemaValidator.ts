/**
 * SchemaValidator.ts
 * Phase 1 – JSON Schema validation using ajv.
 * Validates test plans and runtime settings against their contracts at startup.
 *
 * Schemas are loaded from config/schemas/*.schema.json (single source of truth)
 * with inline fallbacks for robustness. The $schema property is allowed in all
 * config files for editor IntelliSense (works in VS Code, JetBrains, Sublime LSP,
 * Neovim LSP, and any JSON Schema-aware editor).
 */

import Ajv, { ValidateFunction, ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs';
import * as path from 'path';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ---------------------------------------------
// Schema Loading
// ---------------------------------------------

/**
 * Attempt to load a JSON Schema from the config/schemas/ directory.
 * Returns undefined if the file doesn't exist (caller falls back to inline).
 */
function loadExternalSchema(schemaFileName: string): object | undefined {
  const candidates = [
    path.join(process.cwd(), 'config', 'schemas', schemaFileName),
    path.join(__dirname, '..', '..', '..', 'config', 'schemas', schemaFileName),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        return JSON.parse(fs.readFileSync(candidate, 'utf-8'));
      } catch {
        // Corrupted schema file — fall through to inline
      }
    }
  }
  return undefined;
}

// ---------------------------------------------
// Inline Fallback Schemas
// ---------------------------------------------

const RUNTIME_SETTINGS_SCHEMA_INLINE = {
  type: 'object',
  required: ['thinkTime', 'pacing', 'http', 'errorBehavior'],
  additionalProperties: false,
  properties: {
    $schema: { type: 'string' },
    _meta: { type: 'object', additionalProperties: true },
    thinkTime: {
      type: 'object',
      required: ['mode'],
      additionalProperties: false,
      properties: {
        mode: { type: 'string', enum: ['fixed', 'random'] },
        fixed: { type: 'number', minimum: 0 },
        min: { type: 'number', minimum: 0 },
        max: { type: 'number', minimum: 0 },
      },
    },
    pacing: {
      type: 'object',
      required: ['enabled'],
      additionalProperties: false,
      properties: {
        enabled: { type: 'boolean' },
        mode: { type: 'string', enum: ['fixed', 'random'] },
        fixed: { type: 'number', minimum: 0 },
        min: { type: 'number', minimum: 0 },
        max: { type: 'number', minimum: 0 },
        targetIntervalSeconds: { type: 'number', minimum: 0 },
      },
    },
    http: {
      type: 'object',
      required: ['timeoutSeconds', 'maxRedirects', 'throwOnError'],
      additionalProperties: false,
      properties: {
        timeoutSeconds: { type: 'number', minimum: 1 },
        maxRedirects: { type: 'number', minimum: 0 },
        throwOnError: { type: 'boolean' },
      },
    },
    errorBehavior: { type: 'string', enum: ['continue', 'stop_iteration', 'stop_vu', 'abort_test'] },
    reporting: {
      type: 'object',
      additionalProperties: false,
      properties: {
        transactionStats: {
          type: 'array',
          minItems: 1,
          items: { type: 'string', minLength: 1 },
        },
        includeTransactionTable: { type: 'boolean' },
        includeErrorTable: { type: 'boolean' },
        overrideExistingResults: { type: 'boolean' },
        timeseries: {
          type: 'object',
          additionalProperties: false,
          properties: {
            enabled: { type: 'boolean' },
            bucketSizeSeconds: { type: 'number', minimum: 1 },
            keepRawMetricsStream: { type: 'boolean' },
          },
        },
      },
    },
    errors: {
      type: 'object',
      additionalProperties: false,
      properties: {
        captureSnapshotOnFailure: { type: 'boolean' },
        maxSnapshotsPerRun: { type: 'number', minimum: 0 },
        includeRequestHeaders: { type: 'boolean' },
        includeRequestBody: { type: 'boolean' },
        includeResponseHeaders: { type: 'boolean' },
        includeResponseBody: { type: 'boolean' },
      },
    },
    monitoring: {
      type: 'object',
      additionalProperties: false,
      properties: {
        enabled: { type: 'boolean' },
        cpuWarningPercent: { type: 'number', minimum: 0, maximum: 100 },
        memoryWarningPercent: { type: 'number', minimum: 0, maximum: 100 },
        sampleIntervalSeconds: { type: 'number', minimum: 1 },
      },
    },
    debugMode: { type: 'boolean' },
  },
};

const TEST_PLAN_SCHEMA_INLINE = {
  type: 'object',
  required: ['name', 'environment', 'execution_mode', 'global_load_profile', 'user_journeys'],
  additionalProperties: true,
  properties: {
    $schema: { type: 'string' },
    _meta: { type: 'object', additionalProperties: true },
    name: { type: 'string', minLength: 1 },
    environment: { type: 'string', minLength: 1 },
    execution_mode: { type: 'string', enum: ['parallel', 'sequential', 'hybrid'] },
    global_load_profile: {
      type: 'object',
      required: ['executor'],
      properties: {
        executor: {
          type: 'string',
          enum: [
            'ramping-vus',
            'constant-vus',
            'ramping-arrival-rate',
            'constant-arrival-rate',
            'shared-iterations',
            'per-vu-iterations',
            'externally-controlled',
          ],
        },
        startVUs: { type: 'number', minimum: 0 },
        stages: {
          type: 'array',
          items: {
            type: 'object',
            required: ['duration', 'target'],
            properties: {
              duration: { type: 'string' },
              target: { type: 'number', minimum: 0 },
            },
          },
        },
        vus: { type: 'number', minimum: 0 },
        duration: { type: 'string' },
        maxDuration: { type: 'string' },
        iterations: { type: 'number', minimum: 1 },
        rate: { type: 'number', minimum: 1 },
        timeUnit: { type: 'string' },
        preAllocatedVUs: { type: 'number', minimum: 0 },
        maxVUs: { type: 'number', minimum: 1 },
      },
    },
    user_journeys: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['name', 'scriptPath'],
        properties: {
          name: { type: 'string', minLength: 1 },
          scriptPath: { type: 'string', minLength: 1 },
          recordingLogPath: { type: 'string', minLength: 1 },
          weight: { type: 'number', minimum: 0, maximum: 100 },
          vus: { type: 'number', minimum: 1 },
          tags: { type: 'object' },
        },
      },
    },
    max_total_vus: { type: 'number', minimum: 1 },
    debug: {
      type: 'object',
      required: ['enabled'],
      properties: {
        enabled: { type: 'boolean' },
        mode: { type: 'string', enum: ['diff'] },
        autoResolveRecordingLog: { type: 'boolean' },
        vus: { type: 'number', minimum: 1 },
        iterations: { type: 'number', minimum: 1 },
        reportDir: { type: 'string', minLength: 1 },
        failOnMissingRecordingLog: { type: 'boolean' },
      },
    },
  },
};

export class SchemaValidator {
  private readonly ajv: Ajv;
  private readonly validateRuntimeSettings: ValidateFunction;
  private readonly validateTestPlan: ValidateFunction;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, verbose: true });
    addFormats(this.ajv);

    // Prefer external schema files (rich descriptions for docs/tooling),
    // fall back to inline schemas if external files are unavailable.
    const runtimeSchema = loadExternalSchema('runtime_settings.schema.json') ?? RUNTIME_SETTINGS_SCHEMA_INLINE;
    const planSchema = loadExternalSchema('test_plan.schema.json') ?? TEST_PLAN_SCHEMA_INLINE;

    this.validateRuntimeSettings = this.ajv.compile(runtimeSchema);
    this.validateTestPlan = this.ajv.compile(planSchema);
  }

  validateRuntime(data: unknown): ValidationResult {
    return this.runValidation(this.validateRuntimeSettings, data, 'RuntimeSettings');
  }

  validatePlan(data: unknown): ValidationResult {
    return this.runValidation(this.validateTestPlan, data, 'TestPlan');
  }

  private runValidation(
    validate: ValidateFunction,
    data: unknown,
    label: string,
  ): ValidationResult {
    const valid = validate(data) as boolean;
    if (valid) return { valid: true, errors: [] };

    const errors = (validate.errors ?? []).map((e: ErrorObject) => {
      const field = e.instancePath || '(root)';

      // Enhanced enum error messages with allowed values
      if (e.keyword === 'enum' && e.params?.allowedValues) {
        const allowed = (e.params.allowedValues as string[]).join(' | ');
        return `[${label}] ${field}: ${e.message}. Allowed values: ${allowed}`;
      }

      // "Did you mean?" for misspelled additional properties
      if (e.keyword === 'additionalProperties' && e.params?.additionalProperty) {
        const misspelled = e.params.additionalProperty;
        const parentSchema = e.parentSchema as any;
        if (parentSchema?.properties) {
          const allowedProps = Object.keys(parentSchema.properties);
          let bestMatch = '';
          let lowestDist = Infinity;

          for (const prop of allowedProps) {
            const dist = levenshtein(misspelled, prop);
            if (dist < lowestDist) {
              lowestDist = dist;
              bestMatch = prop;
            }
          }

          if (lowestDist <= 3 && bestMatch) {
            return `[${label}] ${field}: unknown property "${misspelled}". Did you mean "${bestMatch}"?`;
          }
        }
        return `[${label}] ${field}: unknown property "${misspelled}".`;
      }

      // Better required field messages
      if (e.keyword === 'required' && e.params?.missingProperty) {
        const missing = e.params.missingProperty;
        const parentSchema = e.parentSchema as any;
        if (parentSchema?.properties) {
          const available = Object.keys(parentSchema.properties)
            .filter(p => p !== '$schema')
            .join(', ');
          return `[${label}] ${field}: missing required property "${missing}". Available fields: ${available}`;
        }
        return `[${label}] ${field}: missing required property "${missing}".`;
      }

      return `[${label}] ${field}: ${e.message}`;
    });

    return { valid: false, errors };
  }
}

// Simple Levenshtein distance for "Did you mean?" suggestions
function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[a.length][b.length];
}
