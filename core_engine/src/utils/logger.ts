/**
 * logger.ts
 * Phase 2 - Global Logger Utility
 * Provides a standardized, color-coded logging format across the framework.
 */

const isColorEnabled = process.env.NO_COLOR === undefined && process.stdout.isTTY !== false;

const ansi = {
  reset: isColorEnabled ? '\x1b[0m' : '',
  bold: isColorEnabled ? '\x1b[1m' : '',
  dim: isColorEnabled ? '\x1b[2m' : '',
  // Foreground
  red: isColorEnabled ? '\x1b[31m' : '',
  green: isColorEnabled ? '\x1b[32m' : '',
  yellow: isColorEnabled ? '\x1b[33m' : '',
  blue: isColorEnabled ? '\x1b[34m' : '',
  magenta: isColorEnabled ? '\x1b[35m' : '',
  cyan: isColorEnabled ? '\x1b[36m' : '',
  white: isColorEnabled ? '\x1b[37m' : '',
  gray: isColorEnabled ? '\x1b[90m' : '',
  // Background
  bgRed: isColorEnabled ? '\x1b[41m' : '',
  bgGreen: isColorEnabled ? '\x1b[42m' : '',
  bgYellow: isColorEnabled ? '\x1b[43m' : '',
};

const levelStyles: Record<string, { color: string; badge: string }> = {
  INFO:  { color: ansi.cyan,    badge: `${ansi.bold}${ansi.cyan}INFO ${ansi.reset}` },
  WARN:  { color: ansi.yellow,  badge: `${ansi.bold}${ansi.yellow}WARN ${ansi.reset}` },
  ERROR: { color: ansi.red,     badge: `${ansi.bold}${ansi.red}ERROR${ansi.reset}` },
  DEBUG: { color: ansi.magenta, badge: `${ansi.bold}${ansi.magenta}DEBUG${ansi.reset}` },
};

export class Logger {
  static info(message: string, context?: any): void {
    this.print('INFO', message, context);
  }

  static warn(message: string, context?: any): void {
    this.print('WARN', message, context);
  }

  static error(message: string, context?: any): void {
    this.print('ERROR', message, context);
  }

  static debug(message: string, context?: any): void {
    this.print('DEBUG', message, context);
  }

  /** Color-coded status line: [PASS] in green */
  static pass(message: string): void {
    console.log(`${ansi.bold}${ansi.green}[PASS]${ansi.reset}  ${message}`);
  }

  /** Color-coded status line: [FAIL] in red */
  static fail(message: string): void {
    console.error(`${ansi.bold}${ansi.red}[FAIL]${ansi.reset}  ${message}`);
  }

  /** Color-coded status line: [WARN] in yellow */
  static warning(message: string): void {
    console.warn(`${ansi.bold}${ansi.yellow}[WARN]${ansi.reset}  ${message}`);
  }

  /** Dim secondary info line with > prefix */
  static detail(message: string): void {
    console.log(`${ansi.dim}>  ${message}${ansi.reset}`);
  }

  /** Bold section header with box lines */
  static header(title: string): void {
    const line = '='.repeat(44);
    console.log(`\n${ansi.bold}${ansi.cyan}${line}${ansi.reset}`);
    console.log(`${ansi.bold}${ansi.cyan}|${title.padStart(22 + Math.ceil(title.length / 2)).padEnd(42)}|${ansi.reset}`);
    console.log(`${ansi.bold}${ansi.cyan}${line}${ansi.reset}\n`);
  }

  /** Bullet point for lists (failures, warnings) */
  static bullet(message: string, color: 'red' | 'yellow' | 'green' | 'cyan' = 'cyan'): void {
    const c = ansi[color];
    console.log(`   ${c}•${ansi.reset} ${message}`);
  }

  private static print(level: string, message: string, context?: any): void {
    const timestamp = new Date().toISOString();
    const style = levelStyles[level] ?? levelStyles.INFO;
    const ts = `${ansi.dim}${timestamp}${ansi.reset}`;
    const prefix = `${ansi.dim}[k6-perf]${ansi.reset} [${style.badge}] [${ts}]`;
    let logStr = `${prefix} ${style.color}${message}${ansi.reset}`;

    if (context !== undefined) {
      const ctxStr = typeof context === 'object' ? JSON.stringify(context) : context;
      logStr += ` ${ansi.dim}| Context: ${ctxStr}${ansi.reset}`;
    }

    if (level === 'ERROR') {
      console.error(logStr);
    } else if (level === 'WARN') {
      console.warn(logStr);
    } else {
      console.log(logStr);
    }
  }
}

export { ansi };

