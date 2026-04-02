import { SLADefinition } from '../types/TestPlanSchema';

export class SLARegistry {
  private static registry: Map<string, SLADefinition> = new Map();

  /**
   * Register an SLA for a specific execution scenario or transaction.
   * Prefix transaction target names with 'txn_'.
   */
  static register(targetName: string, config: SLADefinition): void {
    this.registry.set(targetName, config);
  }

  static get(targetName: string): SLADefinition | undefined {
    return this.registry.get(targetName);
  }

  static getAll(): Record<string, SLADefinition> {
    const obj: Record<string, SLADefinition> = {};
    for (const [key, val] of this.registry.entries()) {
      obj[key] = val;
    }
    return obj;
  }
}
