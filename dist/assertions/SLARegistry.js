"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLARegistry = void 0;
class SLARegistry {
    /**
     * Register an SLA for a specific execution scenario or transaction.
     * Use the transaction name directly (no prefix needed).
     */
    static register(targetName, config) {
        this.registry.set(targetName, config);
    }
    static get(targetName) {
        return this.registry.get(targetName);
    }
    static getAll() {
        const obj = {};
        for (const [key, val] of this.registry.entries()) {
            obj[key] = val;
        }
        return obj;
    }
}
exports.SLARegistry = SLARegistry;
SLARegistry.registry = new Map();
//# sourceMappingURL=SLARegistry.js.map