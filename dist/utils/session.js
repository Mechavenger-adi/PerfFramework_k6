"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvContext = getEnvContext;
exports.registerBaseUrl = registerBaseUrl;
exports.registerFrameworkEnvironmentUrls = registerFrameworkEnvironmentUrls;
exports.resolveFrameworkUrl = resolveFrameworkUrl;
exports.clearCookies = clearCookies;
exports.deleteCookie = deleteCookie;
// @ts-ignore - K6 runtime module
const http_1 = __importDefault(require("k6/http"));
// Registry of base URLs seen by this VU — used by clearCookies() to clear all.
const _registeredUrls = new Set();
/**
 * Get the environment context for a specific team.
 * Throws a descriptive error if the environment is missing and no fallback is provided.
 */
function getEnvContext(teamName, fallbackBaseUrl) {
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
    }
    catch (err) {
        if (fallbackBaseUrl) {
            return { baseUrl: fallbackBaseUrl };
        }
        throw err;
    }
}
function normalizeBaseUrl(url) {
    return url.replace(/\/+$/, '') + '/';
}
function isAbsoluteUrl(url) {
    return /^https?:\/\//i.test(url);
}
function parseJsonEnv(name, fallback) {
    const raw = __ENV[name];
    if (!raw) {
        return fallback;
    }
    try {
        return JSON.parse(raw);
    }
    catch {
        return fallback;
    }
}
function joinBaseAndPath(baseUrl, pathOrUrl) {
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
function getFrameworkBaseUrl() {
    const baseUrl = __ENV.K6_PERF_BASE_URL;
    return baseUrl ? normalizeBaseUrl(baseUrl) : undefined;
}
function getFrameworkServiceUrls() {
    return parseJsonEnv('K6_PERF_SERVICE_URLS', {});
}
/**
 * Register a base URL so clearCookies() can clear it without manual arguments.
 * Called automatically by the framework at script init; users can also call it
 * for additional hosts.
 *
 * @param url - A base URL (e.g., 'https://myapp.example.com/')
 */
function registerBaseUrl(url) {
    if (url)
        _registeredUrls.add(normalizeBaseUrl(url));
}
/**
 * @deprecated Use `getEnvContext` and register the `env.baseUrl` directly using `registerBaseUrl()`.
 * Register environment URLs from K6_PERF_* env vars, falling back to the
 * provided recorded URLs when runtime env URLs are unavailable.
 */
function registerFrameworkEnvironmentUrls(fallbackUrls = []) {
    const runtimeUrls = new Set();
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
function resolveFrameworkUrl(pathOrUrl, options = {}) {
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
function clearCookies(...urls) {
    const jar = http_1.default.cookieJar();
    const targets = urls.length > 0 ? urls : _registeredUrls;
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
function deleteCookie(url, name) {
    const jar = http_1.default.cookieJar();
    jar.delete(url, name);
}
//# sourceMappingURL=session.js.map