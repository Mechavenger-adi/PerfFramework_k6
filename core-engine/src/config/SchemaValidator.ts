/**
 * SchemaValidator.ts
 * Phase 1 – JSON Schema validation using ajv.
 * Validates test plans and runtime settings against their contracts at startup.
 */

import Ajv, { ValidateFunction, ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ---------------------------------------------
// JSON Schemas
// ---------------------------------------------

const RUNTIME_SETTINGS_SCHEMA = {
  type: 'object',
  required: ['thinkTime', 'pacing', 'http', 'errorBehavior'],
  additionalProperties: false,
  properties: {
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
        timeseries: {
          type: 'object',
          additionalProperties: false,
          properties: {
            enabled: { type: 'boolean' },
            bucketSizeSeconds: { type: 'number', minimum: 1 },
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

const TEST_PLAN_SCHEMA = {
  type: 'object',
  required: ['name', 'environment', 'execution_mode', 'global_load_profile', 'user_journeys'],
  additionalProperties: true,
  properties: {
    name: { type: 'string', minLength: 1 },
    environment: { type: 'string', minLength: 1 },
    execution_mode: { type: 'string', enum: ['parallel', 'sequential', 'hybrid'] },
    global_load_profile: {
      type: 'object',
      required: ['executor'],
      properties: {
        executor: { type: 'string' },
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
        vus: { type: 'number', minimum: 1 },
        duration: { type: 'string' },
        iterations: { type: 'number', minimum: 1 },
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
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
    this.validateRuntimeSettings = this.ajv.compile(RUNTIME_SETTINGS_SCHEMA);
    this.validateTestPlan = this.ajv.compile(TEST_PLAN_SCHEMA);
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
      return `[${label}] ${field}: ${e.message}`;
    });

    return { valid: false, errors };
  }
}
