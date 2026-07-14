/**
 * shareSetup.ts
 * Step 2 — controller shared-folder SUGGESTION (manual this phase; automation is
 * Phase-2, see EDD §Shared-Location Provisioning).
 *
 * When a machine acts as the distributed controller, the load generators drop their
 * results into the controller's own results folder over the network — so the
 * controller reads/merges locally. This helper only *tells the operator* how to share
 * that folder and what to hand the LGs (the UNC + K6_PERF_COLLECT_DIR line), plus a
 * firewall reachability hint. It deliberately does NOT create the share.
 */

import * as path from 'path';
import * as os from 'os';
import { Logger } from '../utils/logger';

export interface ShareSuggestionOptions {
  /** Results base dir to share; defaults to K6_RESULTS_BASE_DIR or 'results'. */
  resultsDir?: string;
  /** Windows share name to suggest (default 'k6results'). */
  shareName?: string;
  /** Controller host/IP shown in the UNC path (default OS hostname). */
  host?: string;
}

/** Resolve the results base dir the same way the run pipeline does. */
export function resolveResultsBaseDir(explicit?: string): string {
  const base = explicit || process.env.K6_RESULTS_BASE_DIR || 'results';
  return path.resolve(process.cwd(), base);
}

/** Print the (manual) steps to share the controller's results folder for collection. */
export function printControllerShareSuggestion(options: ShareSuggestionOptions = {}): void {
  const resultsDir = resolveResultsBaseDir(options.resultsDir);
  const shareName = options.shareName || 'k6results';
  const host = options.host || os.hostname();
  const unc = `\\\\${host}\\${shareName}`;

  Logger.header('Distributed controller — shared results folder');
  Logger.info("Load generators drop their results into THIS machine's results folder over the network.");
  Logger.info('This phase is manual — share the folder yourself (Phase-2 will automate this):');
  Logger.detail(`1. Folder to share:  ${resultsDir}`);
  Logger.detail('2. Share it (run as Administrator on this machine):');
  Logger.bullet(`PowerShell:  New-SmbShare -Name ${shareName} -Path "${resultsDir}" -ChangeAccess Everyone`);
  Logger.bullet(`or CMD:      net share ${shareName}="${resultsDir}" /GRANT:Everyone,CHANGE`);
  Logger.detail('3. On EACH load generator, point collect at the share:');
  Logger.bullet(`K6_PERF_COLLECT_DIR=${unc}`);
  Logger.detail('4. Verify a load generator can reach the share through the firewall (SMB/445):');
  Logger.bullet(`npm run cli -- probe --tcp ${host}:445`);
  Logger.warning('Tighten "Everyone,CHANGE" to the specific LG accounts/machines for a real environment.');
}
