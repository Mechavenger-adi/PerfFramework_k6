"use strict";
/**
 * generate-byos.ts
 * Implements the CLI command to scaffold a Bring Your Own Script (BYOS) template.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runGenerateByos = runGenerateByos;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function runGenerateByos(teamName, scriptName, opts = {}) {
    const targetDir = path.join(process.cwd(), 'testSuites', teamName, 'tests');
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    const scriptPath = path.join(targetDir, `${scriptName}.js`);
    if (fs.existsSync(scriptPath) && !opts.overwrite) {
        console.error(`[FAIL]  Script already exists at: ${scriptPath}`);
        process.exit(1);
    }
    const template = `import { transaction, k6Check } from '../../../dist/utils/transaction.js';
import { request } from '../../../dist/utils/request.js';
import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';
import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';
// Optional explicit trackers (Proxy on ctx.* auto-registers in most cases):
// import { trackCorrelation, trackParameter, trackDataRow } from '../../../dist/utils/replayLogger.js';

const env = getEnvContext('${teamName}', { baseUrl: 'https://your-dev-environment.com/' });
const __journeyLifecycleStore = createJourneyLifecycleStore();

export function initPhase(ctx) {
  clearCookies();
}

export function actionPhase(ctx) {
  const correlation_vars = ctx.correlation;

  transaction('BYOS_Custom_Logic', () => {
    // ==========================================================
    //   PASTE YOUR GRAFANA STUDIO / CUSTOM K6 SCRIPT BELOW
    // ==========================================================
    //
    // FRAMEWORK RULES (do NOT use raw k6 APIs):
    //   • Use request() instead of http.get/post/etc. — auto-tags transaction,
    //     replay-logs in debug mode, snapshots failures.
    //   • Use k6Check() instead of native k6 check() — records the same metric
    //     PLUS applies the configured errorBehavior (continue / stop_iteration
    //     / stop_vu / abort_test) when a check fails.
    //   • Wrap each logical step in transaction('Name', () => { ... }) for
    //     hierarchical metrics and lifecycle gating.
    //   • Use thinktime() between transactions — honors runtime settings.
    //
    // Example:
    //   const res = request('GET', \\\`\\\${env.baseUrl}public/crocodiles/\\\`);
    //   k6Check(res, { 'status 200': (r) => r.status === 200 });
    //
    // For correlation, assign to ctx.correlation[...] (auto-tracked via Proxy):
    //   correlation_vars["authToken"] = res.json("token");
  });

  thinktime();
}

export function endPhase(ctx) {
}

export default function () {
  runJourneyLifecycle(__journeyLifecycleStore, { initPhase, actionPhase, endPhase });
}
`;
    fs.writeFileSync(scriptPath, template, 'utf8');
    console.log(`\n[PASS]  BYOS template created successfully at:`);
    console.log(`   ${scriptPath}\n`);
    console.log(`Open the file and paste your Grafana Studio script in the designated area.`);
}
