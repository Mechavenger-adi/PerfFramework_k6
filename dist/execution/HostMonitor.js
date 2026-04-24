"use strict";
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
exports.HostMonitor = void 0;
const os = __importStar(require("os"));
const ErrorRuntime_1 = require("../runtime/ErrorRuntime");
class HostMonitor {
    static async captureSnapshot() {
        const first = this.readCpuTimes();
        await this.delay(250);
        const second = this.readCpuTimes();
        const idle = second.idle - first.idle;
        const total = second.total - first.total;
        const cpuPercent = total > 0 ? Number((((total - idle) / total) * 100).toFixed(2)) : 0;
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const memoryPercent = totalMem > 0 ? Number((((totalMem - freeMem) / totalMem) * 100).toFixed(2)) : 0;
        return {
            ts: new Date().toISOString(),
            cpuPercent,
            memoryPercent,
            agent: this.buildAgentContext(),
        };
    }
    static buildWarnings(runId, config, snapshots) {
        if (!config.enabled) {
            return [];
        }
        const warnings = [];
        for (const snapshot of snapshots) {
            if (snapshot.cpuPercent >= config.cpuWarningPercent) {
                warnings.push(ErrorRuntime_1.ErrorRuntime.buildWarningEvent(runId, 'high_cpu_warning', `CPU crossed warning threshold (${snapshot.cpuPercent}%)`, {
                    agent: snapshot.agent,
                    metric: {
                        name: 'cpuPercent',
                        value: snapshot.cpuPercent,
                        threshold: config.cpuWarningPercent,
                    },
                }));
            }
            if (snapshot.memoryPercent >= config.memoryWarningPercent) {
                warnings.push(ErrorRuntime_1.ErrorRuntime.buildWarningEvent(runId, 'high_memory_warning', `Memory crossed warning threshold (${snapshot.memoryPercent}%)`, {
                    agent: snapshot.agent,
                    metric: {
                        name: 'memoryPercent',
                        value: snapshot.memoryPercent,
                        threshold: config.memoryWarningPercent,
                    },
                }));
            }
        }
        return warnings;
    }
    static startPeriodicSampling(config, snapshots) {
        if (!config.enabled) {
            return {
                stop: async () => { },
            };
        }
        let stopped = false;
        let pending = Promise.resolve();
        const intervalMs = Math.max((config.sampleIntervalSeconds || 10) * 1000, 1000);
        const tick = () => {
            if (stopped) {
                return;
            }
            pending = this.captureSnapshot()
                .then((snapshot) => {
                snapshots.push(snapshot);
            })
                .catch(() => {
                // Monitoring must never break the run path.
            });
        };
        const timer = setInterval(tick, intervalMs);
        timer.unref?.();
        return {
            stop: async () => {
                stopped = true;
                clearInterval(timer);
                await pending;
            },
        };
    }
    static buildAgentContext() {
        return {
            host: os.hostname(),
            pid: process.pid,
            jobId: process.env.BUILD_BUILDID || process.env.GITHUB_RUN_ID || process.env.CI_JOB_ID,
            containerId: process.env.HOSTNAME,
        };
    }
    static readCpuTimes() {
        const cpus = os.cpus();
        let idle = 0;
        let total = 0;
        for (const cpu of cpus) {
            idle += cpu.times.idle;
            total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
        }
        return { idle, total };
    }
    static delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.HostMonitor = HostMonitor;
//# sourceMappingURL=HostMonitor.js.map