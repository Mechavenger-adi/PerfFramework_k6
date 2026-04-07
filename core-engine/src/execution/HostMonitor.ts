import * as os from 'os';
import { MonitoringConfig } from '../types/ConfigContracts';
import { AgentContext, WarningEvent } from '../types/EventContracts';
import { ErrorRuntime } from '../runtime/ErrorRuntime';

export interface HostSnapshot {
  ts: string;
  cpuPercent: number;
  memoryPercent: number;
  agent: AgentContext;
}

export class HostMonitor {
  static async captureSnapshot(): Promise<HostSnapshot> {
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

  static buildWarnings(runId: string, config: MonitoringConfig, snapshots: HostSnapshot[]): WarningEvent[] {
    if (!config.enabled) {
      return [];
    }

    const warnings: WarningEvent[] = [];
    for (const snapshot of snapshots) {
      if (snapshot.cpuPercent >= config.cpuWarningPercent) {
        warnings.push(ErrorRuntime.buildWarningEvent(runId, 'high_cpu_warning', `CPU crossed warning threshold (${snapshot.cpuPercent}%)`, {
          agent: snapshot.agent,
          metric: {
            name: 'cpuPercent',
            value: snapshot.cpuPercent,
            threshold: config.cpuWarningPercent,
          },
        }));
      }

      if (snapshot.memoryPercent >= config.memoryWarningPercent) {
        warnings.push(ErrorRuntime.buildWarningEvent(runId, 'high_memory_warning', `Memory crossed warning threshold (${snapshot.memoryPercent}%)`, {
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

  static startPeriodicSampling(
    config: MonitoringConfig,
    snapshots: HostSnapshot[],
  ): { stop: () => Promise<void> } {
    if (!config.enabled) {
      return {
        stop: async () => {},
      };
    }

    let stopped = false;
    let pending: Promise<void> = Promise.resolve();
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

  private static buildAgentContext(): AgentContext {
    return {
      host: os.hostname(),
      pid: process.pid,
      jobId: process.env.BUILD_BUILDID || process.env.GITHUB_RUN_ID || process.env.CI_JOB_ID,
      containerId: process.env.HOSTNAME,
    };
  }

  private static readCpuTimes(): { idle: number; total: number } {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;
    for (const cpu of cpus) {
      idle += cpu.times.idle;
      total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
    }
    return { idle, total };
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
