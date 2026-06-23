/**
 * CorrelationScanner.ts
 * Orchestrates the auto-correlation scan:
 *   ValueIndexer → LinkMatcher → CandidateScorer → ExtractorSynthesizer
 *
 * Pure and Node-side: takes a normalized `RecordingExchange[]` (the CLI builds
 * these from a HAR or a recording-log.json) and returns a reviewable
 * `CorrelationPlan`. Does not touch k6, the generator, or any existing flow.
 */

import * as fs from 'fs';
import * as path from 'path';
import { RecordingExchange, CorrelationPlan } from './CorrelationManifest';
import { ValueIndexer } from './ValueIndexer';
import { LinkMatcher } from './LinkMatcher';
import { CandidateScorer } from './CandidateScorer';
import { ExtractorSynthesizer } from './ExtractorSynthesizer';

export interface ScanOptions {
  /** Provenance string stored in the manifest (har path / recording-log path). */
  source?: string;
  /** Override the scorer config; defaults to config/correlation-rules/auto-correlation.defaults.json. */
  configPath?: string;
  /** Values from data files — excluded as parameterisation, not correlation. */
  knownParameterValues?: Set<string>;
}

const DEFAULT_CONFIG_PATH = path.join(
  'config', 'correlation-rules', 'auto-correlation.defaults.json',
);

export class CorrelationScanner {
  static scan(exchanges: RecordingExchange[], options: ScanOptions = {}): CorrelationPlan {
    const configPath = options.configPath ?? this.resolveDefaultConfigPath();

    const indexed = ValueIndexer.index(exchanges);
    const rawCandidates = LinkMatcher.match(indexed);
    const scored = CandidateScorer.score(rawCandidates, indexed, {
      configPath,
      knownParameterValues: options.knownParameterValues,
    });
    const candidates = ExtractorSynthesizer.synthesize(scored, exchanges);

    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      source: options.source,
      candidates,
    };
  }

  private static resolveDefaultConfigPath(): string | undefined {
    const abs = path.resolve(process.cwd(), DEFAULT_CONFIG_PATH);
    return fs.existsSync(abs) ? abs : undefined;
  }
}
