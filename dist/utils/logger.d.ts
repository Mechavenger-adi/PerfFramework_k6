/**
 * logger.ts
 * Phase 2 - Global Logger Utility
 * Provides a standardized, color-coded logging format across the framework.
 */
declare const ansi: {
    reset: string;
    bold: string;
    dim: string;
    red: string;
    green: string;
    yellow: string;
    blue: string;
    magenta: string;
    cyan: string;
    white: string;
    gray: string;
    bgRed: string;
    bgGreen: string;
    bgYellow: string;
};
export declare class Logger {
    static info(message: string, context?: any): void;
    static warn(message: string, context?: any): void;
    static error(message: string, context?: any): void;
    static debug(message: string, context?: any): void;
    /** Color-coded status line: [PASS] in green */
    static pass(message: string): void;
    /** Color-coded status line: [FAIL] in red */
    static fail(message: string): void;
    /** Color-coded status line: [WARN] in yellow */
    static warning(message: string): void;
    /** Dim secondary info line with > prefix */
    static detail(message: string): void;
    /** Bold section header with box lines */
    static header(title: string): void;
    /** Bullet point for lists (failures, warnings) */
    static bullet(message: string, color?: 'red' | 'yellow' | 'green' | 'cyan'): void;
    private static print;
}
export { ansi };
//# sourceMappingURL=logger.d.ts.map