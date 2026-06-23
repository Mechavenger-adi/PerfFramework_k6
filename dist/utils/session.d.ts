interface ResolveFrameworkUrlOptions {
    fallbackBaseUrl?: string;
    service?: string;
}
export interface TeamEnvironmentOverride {
    baseUrl: string;
    serviceUrls?: Record<string, string>;
    custom?: Record<string, string | number | boolean>;
}
/**
 * Get the environment context for a specific team.
 *
 * @param teamName - Must match the key in testSuites of the loaded environment file.
 * @param fallback - Full fallback environment used when the CLI has not injected env config
 *                   (e.g., standalone k6 run). Explicitly typed as TeamEnvironmentOverride so
 *                   it is clear which fields (baseUrl, serviceUrls, custom) are being overridden.
 *
 * Example:
 *   const env = getEnvContext('jpet_new', { baseUrl: 'https://jpetstore.aspectran.com' });
 */
export declare function getEnvContext(teamName: string, fallback?: TeamEnvironmentOverride): TeamEnvironmentOverride;
/**
 * Register a base URL so clearCookies() can clear it without manual arguments.
 * Called automatically by the framework at script init; users can also call it
 * for additional hosts.
 *
 * @param url - A base URL (e.g., 'https://myapp.example.com/')
 */
export declare function registerBaseUrl(url: string): void;
/**
 * Resolve a relative path or absolute URL to a full URL.
 *
 * Resolution priority:
 * 1. Absolute URLs → returned unchanged
 * 2. Named service → K6_PERF_SERVICE_URLS[service]
 * 3. K6_PERF_BASE_URL env var (set by CLI)
 * 4. First URL registered via registerBaseUrl() (standalone execution fallback)
 * 5. Path returned as-is if no base is available
 *
 * This is the URL resolution contract used by request().
 */
export declare function resolvePath(pathOrUrl: string, service?: string): string;
/**
 * @deprecated Use `getEnvContext` and register the `env.baseUrl` directly using `registerBaseUrl()`.
 * Register environment URLs from K6_PERF_* env vars, falling back to the
 * provided recorded URLs when runtime env URLs are unavailable.
 */
export declare function registerFrameworkEnvironmentUrls(fallbackUrls?: string[]): void;
/**
 * @deprecated Use `${env.baseUrl}/path` literals with `getEnvContext()` instead.
 * Resolve a relative request path against the framework-injected base URL.
 * Falls back to a recorded base URL when env injection is not available.
 */
export declare function resolveFrameworkUrl(pathOrUrl: string, options?: ResolveFrameworkUrlOptions): string;
/**
 * Clear all cookies from the VU's cookie jar.
 * - With no arguments: clears cookies for ALL registered base URLs.
 * - With arguments: clears cookies for the given URLs only.
 *
 * Usage:
 *   import { clearCookies } from '../../../dist/utils/session.js';
 *   clearCookies();                          // clear all registered URLs
 *   clearCookies('https://myapp.example.com/'); // clear specific URL
 */
export declare function clearCookies(...urls: string[]): void;
/**
 * Delete a specific named cookie for a URL from the VU's cookie jar.
 *
 * @param url - The URL the cookie belongs to.
 * @param name - The cookie name to delete.
 *
 * Usage:
 *   import { deleteCookie } from '../../../dist/utils/session.js';
 *   deleteCookie('https://myapp.example.com/', 'JSESSIONID');
 */
export declare function deleteCookie(url: string, name: string): void;
export {};
