/**
 * ProgressBar.ts
 * Phase-based terminal progress logger.
 * Prints start/done lines with elapsed time — works with blocking spawnSync.
 */
export declare class ProgressBar {
    private label;
    private total;
    current: number;
    private startTime;
    private phaseStart;
    constructor(label: string, total: number);
    /** Print the "starting" line */
    start(): void;
    /** Update the label (prints a new phase start line) */
    update(current: number, label?: string): void;
    /** Increment progress by 1 */
    tick(label?: string): void;
    /** Print the "done" line with elapsed time */
    done(message?: string): void;
    /** Print a failure line */
    fail(message?: string): void;
    private formatElapsed;
}
/** Create a phase spinner for a single blocking operation */
export declare function createSpinner(label: string): ProgressBar;
//# sourceMappingURL=ProgressBar.d.ts.map