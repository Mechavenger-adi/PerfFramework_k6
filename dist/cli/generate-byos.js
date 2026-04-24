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
function runGenerateByos(teamName, scriptName) {
    const targetDir = path.join(process.cwd(), 'scrum-suites', teamName, 'tests');
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    const scriptPath = path.join(targetDir, `${scriptName}.js`);
    if (fs.existsSync(scriptPath)) {
        console.error(`[FAIL]  Script already exists at: ${scriptPath}`);
        process.exit(1);
    }
    const template = `import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { initTransactions, startTransaction, endTransaction } from '../../../dist/utils/transaction.js';
import { createJourneyLifecycleStore, runJourneyLifecycle } from '../../../dist/utils/lifecycle.js';
import { logExchange } from '../../../dist/utils/replayLogger.js';

initTransactions(['BYOS_Custom_Logic']);
const lifecycleStore = createJourneyLifecycleStore();

export function initPhase(ctx) {
}

export function actionPhase(ctx) {
  group('BYOS Custom Logic', function () {
    startTransaction('BYOS_Custom_Logic');
    
    // ==========================================================
    //   PASTE YOUR GRAFANA STUDIO / CUSTOM K6 SCRIPT BELOW  
    // ==========================================================

    /* 
    const res = http.get('https://test-api.k6.io/public/crocodiles/');
    check(res, { 'status 200': (r) => r.status === 200 });
    */

    // ==========================================================
    //   PASTE YOUR GRAFANA STUDIO / CUSTOM K6 SCRIPT ABOVE  
    // ==========================================================

    endTransaction('BYOS_Custom_Logic');
  });

  sleep(1); // think time between business steps if needed
}

export function endPhase(ctx) {
}

export default function () {
  runJourneyLifecycle(lifecycleStore, { initPhase, actionPhase, endPhase });
}
`;
    fs.writeFileSync(scriptPath, template, 'utf8');
    console.log(`\n[PASS]  BYOS template created successfully at:`);
    console.log(`   ${scriptPath}\n`);
    console.log(`Open the file and paste your Grafana Studio script in the designated area.`);
}
//# sourceMappingURL=generate-byos.js.map