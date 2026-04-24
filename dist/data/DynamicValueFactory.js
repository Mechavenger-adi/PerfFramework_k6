"use strict";
/**
 * DynamicValueFactory.ts
 * Phase 1 – Built-in helpers for common dynamic data needs.
 * These are pure, stateless utility functions usable in any script.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicValueFactory = void 0;
class DynamicValueFactory {
    /**
     * Generate a timestamp string in a specified format.
     * Tokens: YYYY, MM, DD, HH, mm, ss, ms
     * Example: timestamp('YYYY-MM-DD_HH-mm-ss') -> '2026-03-21_14-30-00'
     */
    static timestamp(format = 'YYYY-MM-DD HH:mm:ss') {
        const now = new Date();
        return format
            .replace('YYYY', String(now.getFullYear()))
            .replace('MM', String(now.getMonth() + 1).padStart(2, '0'))
            .replace('DD', String(now.getDate()).padStart(2, '0'))
            .replace('HH', String(now.getHours()).padStart(2, '0'))
            .replace('mm', String(now.getMinutes()).padStart(2, '0'))
            .replace('ss', String(now.getSeconds()).padStart(2, '0'))
            .replace('ms', String(now.getMilliseconds()).padStart(3, '0'));
    }
    /**
     * Generate a UUID v4 (random).
     * Does not require external libraries — uses crypto.randomUUID when available.
     */
    static uuid() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback for older Node versions
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
    /**
     * Generate a random integer between min and max (inclusive).
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    /**
     * Generate a random alphanumeric string of a given length.
     */
    static randomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
    /**
     * Generate a random email address with a given prefix and domain.
     * Example: randomEmail('testuser', 'example.com') -> 'testuser_a3k2@example.com'
     */
    static randomEmail(prefix = 'user', domain = 'perf-test.local') {
        return `${prefix}_${this.randomString(6).toLowerCase()}@${domain}`;
    }
    /**
     * Generate a random phone number string matching a pattern.
     * '#' characters are replaced with random digits.
     * Example: randomPhone('+44 07### ######') -> '+44 07123 456789'
     */
    static randomPhone(pattern = '07########') {
        return pattern.replace(/#/g, () => String(Math.floor(Math.random() * 10)));
    }
    /**
     * Pick a random element from an array.
     */
    static pickRandom(items) {
        if (items.length === 0)
            throw new Error('[DynamicValueFactory] Cannot pick from an empty array.');
        return items[Math.floor(Math.random() * items.length)];
    }
    /**
     * Epoch timestamp in milliseconds.
     */
    static epochMs() {
        return Date.now();
    }
    /**
     * Epoch timestamp in seconds.
     */
    static epochSecs() {
        return Math.floor(Date.now() / 1000);
    }
}
exports.DynamicValueFactory = DynamicValueFactory;
//# sourceMappingURL=DynamicValueFactory.js.map