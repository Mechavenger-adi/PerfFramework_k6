/**
 * DynamicValueFactory.ts
 * Phase 1 – Built-in helpers for common dynamic data needs.
 * These are pure, stateless utility functions usable in any script.
 */
export declare class DynamicValueFactory {
    /**
     * Generate a timestamp string in a specified format.
     * Tokens: YYYY, MM, DD, HH, mm, ss, ms
     * Example: timestamp('YYYY-MM-DD_HH-mm-ss') -> '2026-03-21_14-30-00'
     */
    static timestamp(format?: string): string;
    /**
     * Generate a UUID v4 (random).
     * Does not require external libraries — uses crypto.randomUUID when available.
     */
    static uuid(): string;
    /**
     * Generate a random integer between min and max (inclusive).
     */
    static randomInt(min: number, max: number): number;
    /**
     * Generate a random alphanumeric string of a given length.
     */
    static randomString(length: number): string;
    /**
     * Generate a random email address with a given prefix and domain.
     * Example: randomEmail('testuser', 'example.com') -> 'testuser_a3k2@example.com'
     */
    static randomEmail(prefix?: string, domain?: string): string;
    /**
     * Generate a random phone number string matching a pattern.
     * '#' characters are replaced with random digits.
     * Example: randomPhone('+44 07### ######') -> '+44 07123 456789'
     */
    static randomPhone(pattern?: string): string;
    /**
     * Pick a random element from an array.
     */
    static pickRandom<T>(items: T[]): T;
    /**
     * Epoch timestamp in milliseconds.
     */
    static epochMs(): number;
    /**
     * Epoch timestamp in seconds.
     */
    static epochSecs(): number;
}
//# sourceMappingURL=DynamicValueFactory.d.ts.map