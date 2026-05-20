// @ts-ignore - K6 runtime module
import http from 'k6/http';

declare const __ENV: Record<string, string | undefined>;

// Registry of base URLs seen by this VU — used by clearCookies() to clear all.
const _registeredUrls = new Set<string>();

// The first URL registered (primary base URL) — used by resolvePath() when no env var is set.
let _primaryBaseUrl: string | undefined;

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
 * Throws a descriptive error if the environment is missing and no fallback is provided.
 */
export function getEnvContext(teamName: string, fallbackBaseUrl?: string): TeamEnvironmentOverride {
  if (!__ENV.K6_PERF_TEAM_ENVIRONMENTS) {
    if (fallbackBaseUrl) {
      return { baseUrl: fallbackBaseUrl };
    }
    const envFileName = __ENV.K6_PERF_ENVIRONMENT ? `${__ENV.K6_PERF_ENVIRONMENT}.json` : 'the loaded environment config';
    throw new Error(`Environment config missing for '${teamName}' in ${envFileName} and no fallback provided. Please run via k6-perf CLI or provide a fallback.`);
  }

  try {
    const allEnvs = JSON.parse(__ENV.K6_PERF_TEAM_ENVIRONMENTS);
    const teamEnv = allEnvs[teamName];
    if (teamEnv && teamEnv.baseUrl) {
      return teamEnv;
    }
    if (fallbackBaseUrl) {
      return { baseUrl: fallbackBaseUrl };
    }
    const envFileName = __ENV.K6_PERF_ENVIRONMENT ? `${__ENV.K6_PERF_ENVIRONMENT}.json` : 'the loaded environment config';
    throw new Error(`Environment config missing for '${teamName}' in ${envFileName} and no fallback provided.`);
  } catch (err) {
    if (fallbackBaseUrl) {
      return { baseUrl: fallbackBaseUrl };
    }
    throw err;
  }
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '') + '/';
}

function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function parseJsonEnv<T>(name: string, fallback: T): T {
  const raw = __ENV[name];
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function joinBaseAndPath(baseUrl: string, pathOrUrl: string): string {
  const normalizedBase = normalizeBaseUrl(baseUrl);

  if (!pathOrUrl) {
    return normalizedBase;
  }

  if (pathOrUrl.startsWith('/')) {
    return normalizedBase.replace(/\/$/, '') + pathOrUrl;
  }

  if (pathOrUrl.startsWith('?') || pathOrUrl.startsWith('#')) {
    return normalizedBase.replace(/\/$/, '') + '/' + pathOrUrl;
  }

  return normalizedBase + pathOrUrl;
}

function getFrameworkBaseUrl(): string | undefined {
  const baseUrl = __ENV.K6_PERF_BASE_URL;
  return baseUrl ? normalizeBaseUrl(baseUrl) : undefined;
}

function getFrameworkServiceUrls(): Record<string, string> {
  return parseJsonEnv<Record<string, string>>('K6_PERF_SERVICE_URLS', {});
}

/**
 * Register a base URL so clearCookies() can clear it without manual arguments.
 * Called automatically by the framework at script init; users can also call it
 * for additional hosts.
 *
 * @param url - A base URL (e.g., 'https://myapp.example.com/')
 */
export function registerBaseUrl(url: string): void {
  if (url) {
    const normalized = normalizeBaseUrl(url);
    _registeredUrls.add(normalized);
    if (!_primaryBaseUrl) {
      _primaryBaseUrl = normalized;
    }
  }
}

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
export function resolvePath(pathOrUrl: string, service?: string): string {
  if (!pathOrUrl || isAbsoluteUrl(pathOrUrl)) {
    return pathOrUrl;
  }

  if (service) {
    const serviceUrls = getFrameworkServiceUrls();
    if (serviceUrls[service]) {
      return joinBaseAndPath(serviceUrls[service], pathOrUrl);
    }
  }

  const envBaseUrl = getFrameworkBaseUrl();
  if (envBaseUrl) {
    return joinBaseAndPath(envBaseUrl, pathOrUrl);
  }

  if (_primaryBaseUrl) {
    return joinBaseAndPath(_primaryBaseUrl, pathOrUrl);
  }

  return pathOrUrl;
}

/**
 * @deprecated Use `getEnvContext` and register the `env.baseUrl` directly using `registerBaseUrl()`.
 * Register environment URLs from K6_PERF_* env vars, falling back to the
 * provided recorded URLs when runtime env URLs are unavailable.
 */
export function registerFrameworkEnvironmentUrls(fallbackUrls: string[] = []): void {
  const runtimeUrls = new Set<string>();
  const baseUrl = getFrameworkBaseUrl();
  if (baseUrl) {
    runtimeUrls.add(baseUrl);
  }

  for (const serviceUrl of Object.values(getFrameworkServiceUrls())) {
    if (serviceUrl) {
      runtimeUrls.add(normalizeBaseUrl(serviceUrl));
    }
  }

  const urlsToRegister = runtimeUrls.size > 0 ? [...runtimeUrls] : fallbackUrls;
  for (const url of urlsToRegister) {
    registerBaseUrl(url);
  }
}

/**
 * @deprecated Use `${env.baseUrl}/path` literals with `getEnvContext()` instead.
 * Resolve a relative request path against the framework-injected base URL.
 * Falls back to a recorded base URL when env injection is not available.
 */
export function resolveFrameworkUrl(pathOrUrl: string, options: ResolveFrameworkUrlOptions = {}): string {
  if (!pathOrUrl) {
    return pathOrUrl;
  }

  if (isAbsoluteUrl(pathOrUrl)) {
    return pathOrUrl;
  }

  const serviceUrls = getFrameworkServiceUrls();
  const candidateBaseUrl = options.service
    ? serviceUrls[options.service]
    : getFrameworkBaseUrl();
  const fallbackBaseUrl = options.fallbackBaseUrl;

  if (candidateBaseUrl) {
    return joinBaseAndPath(candidateBaseUrl, pathOrUrl);
  }

  if (fallbackBaseUrl) {
    return joinBaseAndPath(fallbackBaseUrl, pathOrUrl);
  }

  return pathOrUrl;
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
