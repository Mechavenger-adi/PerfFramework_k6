"use strict";
/**
 * ProgressBar.ts
 * Phase-based terminal progress logger.
 * Prints start/done lines with elapsed time — works with blocking spawnSync.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressBar = void 0;
exports.createSpinner = createSpinner;
const isColorEnabled = process.env.NO_COLOR === undefined && process.stdout.isTTY !== false;
const ansi = {
    reset: isColorEnabled ? '\x1b[0m' : '',
    bold: isColorEnabled ? '\x1b[1m' : '',
    dim: isColorEnabled ? '\x1b[2m' : '',
    cyan: isColorEnabled ? '\x1b[36m' : '',
    green: isColorEnabled ? '\x1b[32m' : '',
    yellow: isColorEnabled ? '\x1b[33m' : '',
    red: isColorEnabled ? '\x1b[31m' : '',
};
class ProgressBar {
    constructor(label, total) {
        this.current = 0;
        this.label = label;
        this.total = Math.max(total, 1);
        this.startTime = Date.now();
        this.phaseStart = this.startTime;
    }
    /** Print the "starting" line */
    start() {
        this.phaseStart = Date.now();
        process.stderr.write(`  ${ansi.cyan}▸${ansi.reset} ${this.label}${ansi.dim}...${ansi.reset}\n`);
    }
    /** Update the label (prints a new phase start line) */
    update(current, label) {
        this.current = Math.min(current, this.total);
        if (label)
            this.label = label;
        this.phaseStart = Date.now();
        const counter = this.total > 1
            ? `${ansi.dim}[${this.current + 1}/${this.total}]${ansi.reset} `
            : '';
        process.stderr.write(`  ${ansi.cyan}▸${ansi.reset} ${counter}${this.label}${ansi.dim}...${ansi.reset}\n`);
    }
    /** Increment progress by 1 */
    tick(label) {
        this.current = Math.min(this.current + 1, this.total);
        if (label)
            this.label = label;
    }
    /** Print the "done" line with elapsed time */
    done(message) {
        const elapsed = this.formatElapsed(Date.now() - this.phaseStart);
        const doneMsg = message
            ? `  ${ansi.green}✔${ansi.reset} ${message} ${ansi.dim}(${elapsed})${ansi.reset}`
            : `  ${ansi.green}✔${ansi.reset} ${this.label} ${ansi.dim}(${elapsed})${ansi.reset}`;
        process.stderr.write(doneMsg + '\n');
    }
    /** Print a failure line */
    fail(message) {
        const elapsed = this.formatElapsed(Date.now() - this.phaseStart);
        const failMsg = message
            ? `  ${ansi.red}✖${ansi.reset} ${message} ${ansi.dim}(${elapsed})${ansi.reset}`
            : `  ${ansi.red}✖${ansi.reset} ${this.label} ${ansi.dim}(${elapsed})${ansi.reset}`;
        process.stderr.write(failMsg + '\n');
    }
    formatElapsed(ms) {
        if (ms < 1000)
            return `${ms}ms`;
        const s = Math.floor(ms / 1000);
        if (s < 60)
            return `${s}s`;
        return `${Math.floor(s / 60)}m ${s % 60}s`;
    }
}
exports.ProgressBar = ProgressBar;
/** Create a phase spinner for a single blocking operation */
function createSpinner(label) {
    return new ProgressBar(label, 1);
}
//# sourceMappingURL=ProgressBar.js.map