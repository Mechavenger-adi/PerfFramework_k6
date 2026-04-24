// @ts-ignore - K6 runtime module
import http from 'k6/http';

// Registry of base URLs seen by this VU — used by clearCookies() to clear all.
const _registeredUrls = new Set<string>();

/**
 * Register a base URL so clearCookies() can clear it without manual arguments.
 * Called automatically by the framework at script init; users can also call it
 * for additional hosts.
 *
 * @param url - A base URL (e.g., 'https://myapp.example.com/')
 */
export function registerBaseUrl(url: string): void {
  if (url) _registeredUrls.add(url);
}

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
export function clearCookies(...urls: string[]): void {
  const jar = http.cookieJar();
  const targets: Iterable<string> = urls.length > 0 ? urls : _registeredUrls;
  for (const url of targets) {
    jar.clear(url);
  }
}

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
export function deleteCookie(url: string, name: string): void {
  const jar = http.cookieJar();
  jar.delete(url, name);
}
