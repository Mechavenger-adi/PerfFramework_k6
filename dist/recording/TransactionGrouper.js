"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionGrouper = void 0;
class TransactionGrouper {
    /**
     * Group HAR entries by 'pageref' to define transaction boundaries.
     * If 'pageref' is missing, it creates fallback groups to ensure everything is captured.
     */
    static group(entries) {
        const groups = new Map();
        let orphanCounter = 0;
        for (const entry of entries) {
            // Normalize group name: Replace spaces/special chars with underscores if necessary
            const rawRef = entry.pageref || `Group_${++orphanCounter}`;
            const safeRef = rawRef.replace(/[^a-zA-Z0-9_]/g, '_');
            if (!groups.has(safeRef)) {
                groups.set(safeRef, []);
            }
            groups.get(safeRef).push(entry);
        }
        return Array.from(groups.entries()).map(([name, groupEntries]) => ({
            name,
            entries: groupEntries
        }));
    }
}
exports.TransactionGrouper = TransactionGrouper;
//# sourceMappingURL=TransactionGrouper.js.map