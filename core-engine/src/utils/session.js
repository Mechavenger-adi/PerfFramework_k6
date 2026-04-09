import http from 'k6/http';

// Registry of base URLs seen by this VU — used by clearCookies() to clear all.
const _registeredUrls = new Set();

/**
 * Register a base URL so clearCookies() can clear it without manual arguments.
 * Called automatically by the framework at script init; users can also call it
 * for additional hosts.
 *
 * @param {string} url - A base URL (e.g., 'https://myapp.example.com/')
 */
export function registerBaseUrl(url) {
  if (url) _registeredUrls.add(url);
}

/**
 * Clear all cookies from the VU's cookie jar.
 * - With no arguments: clears cookies for ALL registered base URLs.
 * - With arguments: clears cookies for the given URLs only.
 *
 * Usage:
 *   import { clearCookies } from '../../../core-engine/src/utils/session.js';
 *   clearCookies();                          // clear all registered URLs
 *   clearCookies('https://myapp.example.com/'); // clear specific URL
 */
export function clearCookies(...urls) {
  const jar = http.cookieJar();
  const targets = urls.length > 0 ? urls : _registeredUrls;
  for (const url of targets) {
    jar.clear(url);
  }
}

/**
 * Delete a specific named cookie for a URL from the VU's cookie jar.
 *
 * @param {string} url - The URL the cookie belongs to.
 * @param {string} name - The cookie name to delete.
 *
 * Usage:
 *   import { deleteCookie } from '../../../core-engine/src/utils/session.js';
 *   deleteCookie('https://myapp.example.com/', 'JSESSIONID');
 */
export function deleteCookie(url, name) {
  const jar = http.cookieJar();
  jar.delete(url, name);
}
