import { transaction, k6Check } from '../../../dist/utils/transaction.js';
import { request } from '../../../dist/utils/request.js';
import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';
import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';
import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';
import { extractBoundary, extractHeader } from '../../../dist/index.js';

const env = getEnvContext('jpet_new', { baseUrl: 'https://jpetstore.aspectran.com' });

// ── auto-correlation captured variables (per-VU, module scope) ──
let c_state;
let c_location;
let c_billToFirstName;
let c_order;

const __journeyLifecycleStore = createJourneyLifecycleStore();

export function initPhase(ctx) {
  clearCookies();

  transaction('t01_launch', function () {
    const res1 = request('GET', `${env.baseUrl}/`, {
      name: "GET_root_1",
      headers: {
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "upgrade-insecure-requests": "1",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "sec-fetch-site": "none",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=0, i",
    },
      replay: {
        id: "req_1",
        recordingStartedAt: "2026-03-31T06:05:02.930Z",
      },
    });
    k6Check(res1, {
      "t01_launch - status is 200": (r) => r.status === 200,
    });

    const res2 = request('GET', `${env.baseUrl}/cdn-cgi/speculation`, {
      name: "GET_speculation_1",
      headers: {
      origin: "https://jpetstore.aspectran.com",
      "sec-ch-ua-platform": "\"Windows\"",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      accept: "*/*",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "speculationrules",
      referer: "https://jpetstore.aspectran.com/",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=4, i",
    },
      replay: {
        id: "req_2",
        recordingStartedAt: "2026-03-31T06:05:03.596Z",
      },
    });
    k6Check(res2, {
      "t01_launch - status is 200": (r) => r.status === 200,
    });
  });

  thinktime();

  transaction('t02_login', function () {
    const res1 = request('GET', `${env.baseUrl}/account/signonForm`, {
      name: "GET_signonForm_1",
      headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "upgrade-insecure-requests": "1",
      "sec-purpose": "prefetch",
      "sec-speculation-tags": "null",
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-site": "none",
      "sec-fetch-mode": "navigate",
      "sec-fetch-dest": "document",
      referer: "https://jpetstore.aspectran.com/",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=1, i",
    },
      replay: {
        id: "req_3",
        recordingStartedAt: "2026-03-31T06:09:09.849Z",
      },
    });
    k6Check(res1, {
      "t02_login - status is 503": (r) => r.status === 503,
    });

    const res2 = request('GET', `${env.baseUrl}/account/signonForm`, {
      name: "GET_signonForm_2",
      headers: {
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "upgrade-insecure-requests": "1",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document",
      referer: "https://jpetstore.aspectran.com/",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=0, i",
    },
      replay: {
        id: "req_4",
        recordingStartedAt: "2026-03-31T06:09:10.082Z",
      },
    });
    k6Check(res2, {
      "t02_login - status is 200": (r) => r.status === 200,
    });

    const res3 = request('GET', `${env.baseUrl}/cdn-cgi/speculation`, {
      name: "GET_speculation_1",
      headers: {
      origin: "https://jpetstore.aspectran.com",
      "sec-ch-ua-platform": "\"Windows\"",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      accept: "*/*",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "speculationrules",
      referer: "https://jpetstore.aspectran.com/account/signonForm",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=4, i",
    },
      replay: {
        id: "req_5",
        recordingStartedAt: "2026-03-31T06:09:10.579Z",
      },
    });
    k6Check(res3, {
      "t02_login - status is 200": (r) => r.status === 200,
    });

    const res4 = request('POST', `${env.baseUrl}/account/signon`, {
      name: "POST_signon_1",
      headers: {
      "content-length": "36",
      "cache-control": "max-age=0",
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      origin: "https://jpetstore.aspectran.com",
      "content-type": "application/x-www-form-urlencoded",
      "upgrade-insecure-requests": "1",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document",
      referer: "https://jpetstore.aspectran.com/account/signonForm",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=0, i",
    },
      body: "referer=&username=j2ee&password=j2ee",
      replay: {
        id: "req_6",
        recordingStartedAt: "2026-03-31T06:09:16.704Z",
      },
    });
    k6Check(res4, {
      "t02_login - status is 302": (r) => r.status === 302,
    });

    const res5 = request('GET', `${env.baseUrl}/`, {
      name: "GET_root_1",
      headers: {
      "cache-control": "max-age=0",
      "upgrade-insecure-requests": "1",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document",
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      referer: "https://jpetstore.aspectran.com/account/signonForm",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=0, i",
    },
      replay: {
        id: "req_7",
        recordingStartedAt: "2026-03-31T06:09:16.922Z",
      },
    });
    k6Check(res5, {
      "t02_login - status is 200": (r) => r.status === 200,
    });

    const res6 = request('GET', `${env.baseUrl}/cdn-cgi/speculation`, {
      name: "GET_speculation_2",
      headers: {
      origin: "https://jpetstore.aspectran.com",
      "sec-ch-ua-platform": "\"Windows\"",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      accept: "*/*",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "speculationrules",
      referer: "https://jpetstore.aspectran.com/",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=4, i",
    },
      replay: {
        id: "req_8",
        recordingStartedAt: "2026-03-31T06:09:17.117Z",
      },
    });
    k6Check(res6, {
      "t02_login - status is 200": (r) => r.status === 200,
    });
  });

}

export function actionPhase(ctx) {
  transaction('search_animal', function () {
    const res1 = request('GET', `${env.baseUrl}/catalog/searchProducts?keyword=dog`, {
      name: "GET_searchProducts_1",
      headers: {
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "upgrade-insecure-requests": "1",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document",
      referer: "https://jpetstore.aspectran.com/",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=0, i",
    },
      replay: {
        id: "req_9",
        recordingStartedAt: "2026-03-31T06:10:01.078Z",
      },
    });
    k6Check(res1, {
      "search_animal - status is 200": (r) => r.status === 200,
    });

    const res2 = request('GET', `${env.baseUrl}/cdn-cgi/speculation`, {
      name: "GET_speculation_1",
      headers: {
      origin: "https://jpetstore.aspectran.com",
      "sec-ch-ua-platform": "\"Windows\"",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      accept: "*/*",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "speculationrules",
      referer: "https://jpetstore.aspectran.com/catalog/searchProducts?keyword=dog",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=4, i",
    },
      replay: {
        id: "req_10",
        recordingStartedAt: "2026-03-31T06:10:01.272Z",
      },
    });
    k6Check(res2, {
      "search_animal - status is 200": (r) => r.status === 200,
    });
  });

  thinktime();

  transaction('select_product', function () {
    const res1 = request('GET', `${env.baseUrl}/products/K9-BD-01`, {
      name: "GET_K9_BD_01_1",
      headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "upgrade-insecure-requests": "1",
      "sec-purpose": "prefetch",
      "sec-speculation-tags": "null",
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-site": "none",
      "sec-fetch-mode": "navigate",
      "sec-fetch-dest": "document",
      referer: "https://jpetstore.aspectran.com/catalog/searchProducts?keyword=dog",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=1, i",
    },
      replay: {
        id: "req_11",
        recordingStartedAt: "2026-03-31T06:11:46.730Z",
      },
    });
    k6Check(res1, {
      "select_product - status is 503": (r) => r.status === 503,
    });

    const res2 = request('GET', `${env.baseUrl}/products/K9-BD-01`, {
      name: "GET_K9_BD_01_2",
      headers: {
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "upgrade-insecure-requests": "1",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document",
      referer: "https://jpetstore.aspectran.com/catalog/searchProducts?keyword=dog",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=0, i",
    },
      replay: {
        id: "req_12",
        recordingStartedAt: "2026-03-31T06:11:46.959Z",
      },
    });
    k6Check(res2, {
      "select_product - status is 200": (r) => r.status === 200,
    });

    const res3 = request('GET', `${env.baseUrl}/cdn-cgi/speculation`, {
      name: "GET_speculation_1",
      headers: {
      origin: "https://jpetstore.aspectran.com",
      "sec-ch-ua-platform": "\"Windows\"",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      accept: "*/*",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "speculationrules",
      referer: "https://jpetstore.aspectran.com/products/K9-BD-01",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=4, i",
    },
      replay: {
        id: "req_13",
        recordingStartedAt: "2026-03-31T06:11:47.464Z",
      },
    });
    k6Check(res3, {
      "select_product - status is 200": (r) => r.status === 200,
    });
  });

  thinktime();

  transaction('add_to_cart', function () {
    const res1 = request('GET', `${env.baseUrl}/cart/addItemToCart?itemId=EST-6`, {
      name: "GET_addItemToCart_1",
      headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "upgrade-insecure-requests": "1",
      "sec-purpose": "prefetch",
      "sec-speculation-tags": "null",
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-site": "none",
      "sec-fetch-mode": "navigate",
      "sec-fetch-dest": "document",
      referer: "https://jpetstore.aspectran.com/products/K9-BD-01",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=1, i",
    },
      replay: {
        id: "req_14",
        recordingStartedAt: "2026-03-31T06:12:11.127Z",
      },
    });
    k6Check(res1, {
      "add_to_cart - status is 503": (r) => r.status === 503,
    });

    const res2 = request('GET', `${env.baseUrl}/cart/addItemToCart?itemId=EST-6`, {
      name: "GET_addItemToCart_2",
      headers: {
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "upgrade-insecure-requests": "1",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document",
      referer: "https://jpetstore.aspectran.com/products/K9-BD-01",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=0, i",
    },
      replay: {
        id: "req_15",
        recordingStartedAt: "2026-03-31T06:12:11.354Z",
      },
    });
    c_location = trackCorrelation("c_location", extractHeader(res2, "location"), "res2.header:location");
    k6Check(res2, {
      "add_to_cart - status is 302": (r) => r.status === 302,
    });

    const res3 = request('GET', `${env.baseUrl}/cart/viewCart`, {
      name: "GET_viewCart_1",
      headers: {
      "upgrade-insecure-requests": "1",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document",
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      referer: "https://jpetstore.aspectran.com/products/K9-BD-01",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=0, i",
    },
      replay: {
        id: "req_16",
        recordingStartedAt: "2026-03-31T06:12:11.557Z",
      },
    });
    k6Check(res3, {
      "add_to_cart - status is 200": (r) => r.status === 200,
    });

    const res4 = request('GET', `${env.baseUrl}/cdn-cgi/speculation`, {
      name: "GET_speculation_1",
      headers: {
      origin: "https://jpetstore.aspectran.com",
      "sec-ch-ua-platform": "\"Windows\"",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      accept: "*/*",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "speculationrules",
      referer: "https://jpetstore.aspectran.com/cart/viewCart",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=4, i",
    },
      replay: {
        id: "req_17",
        recordingStartedAt: "2026-03-31T06:12:11.770Z",
      },
    });
    k6Check(res4, {
      "add_to_cart - status is 200": (r) => r.status === 200,
    });
  });

  thinktime();

  transaction('increase_quantity_to_2_and_proceed_to_checkout', function () {
    const res1 = request('POST', `${env.baseUrl}/cart/updateCartQuantities`, {
      name: "POST_updateCartQuantities_1",
      headers: {
      "content-length": "7",
      "sec-ch-ua-platform": "\"Windows\"",
      "hx-target": "jpetstore-content",
      "hx-current-url": `${c_location}`,
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      "hx-request": "true",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      "content-type": "application/x-www-form-urlencoded",
      accept: "*/*",
      origin: "https://jpetstore.aspectran.com",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      referer: `${c_location}`,
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=1, i",
    },
      body: "EST-6=2",
      replay: {
        id: "req_18",
        recordingStartedAt: "2026-03-31T06:12:54.690Z",
      },
    });
    k6Check(res1, {
      "increase_quantity_to_2_and_proceed_to_checkout - status is 200": (r) => r.status === 200,
    });

    const res2 = request('GET', `${env.baseUrl}/order/newOrderForm`, {
      name: "GET_newOrderForm_1",
      headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "upgrade-insecure-requests": "1",
      "sec-purpose": "prefetch",
      "sec-speculation-tags": "null",
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-site": "none",
      "sec-fetch-mode": "navigate",
      "sec-fetch-dest": "document",
      referer: "https://jpetstore.aspectran.com/cart/viewCart",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=1, i",
    },
      replay: {
        id: "req_19",
        recordingStartedAt: "2026-03-31T06:12:57.286Z",
      },
    });
    k6Check(res2, {
      "increase_quantity_to_2_and_proceed_to_checkout - status is 503": (r) => r.status === 503,
    });

    const res3 = request('GET', `${env.baseUrl}/order/newOrderForm`, {
      name: "GET_newOrderForm_2",
      headers: {
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "upgrade-insecure-requests": "1",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document",
      referer: "https://jpetstore.aspectran.com/cart/viewCart",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=0, i",
    },
      replay: {
        id: "req_20",
        recordingStartedAt: "2026-03-31T06:12:57.478Z",
      },
    });
    c_billToFirstName = trackCorrelation("c_billToFirstName", extractBoundary(res3, "name=\"billToFirstName\" value=\"", "\""), "res3.boundary:lb=name=\"billToFirstName\" value=\";;rb=\"");
    c_state = trackCorrelation("c_state", extractBoundary(res3, "name=\"billState\" value=\"", "\""), "res3.boundary:lb=name=\"billState\" value=\";;rb=\"");
    k6Check(res3, {
      "increase_quantity_to_2_and_proceed_to_checkout - status is 200": (r) => r.status === 200,
    });

    const res4 = request('GET', `${env.baseUrl}/cdn-cgi/speculation`, {
      name: "GET_speculation_1",
      headers: {
      origin: "https://jpetstore.aspectran.com",
      "sec-ch-ua-platform": "\"Windows\"",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      accept: "*/*",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "speculationrules",
      referer: "https://jpetstore.aspectran.com/order/newOrderForm",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=4, i",
    },
      replay: {
        id: "req_21",
        recordingStartedAt: "2026-03-31T06:12:57.674Z",
      },
    });
    k6Check(res4, {
      "increase_quantity_to_2_and_proceed_to_checkout - status is 200": (r) => r.status === 200,
    });
  });

  thinktime();

  transaction('click_continue', function () {
    const res1 = request('POST', `${env.baseUrl}/order/newOrder`, {
      name: "POST_newOrder_1",
      headers: {
      "content-length": "279",
      "cache-control": "max-age=0",
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      origin: "https://jpetstore.aspectran.com",
      "content-type": "application/x-www-form-urlencoded",
      "upgrade-insecure-requests": "1",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document",
      referer: "https://jpetstore.aspectran.com/order/newOrderForm",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=0, i",
    },
      body: `paymentForm=true&billingForm=true&cardType=Visa&creditCard=999999999999999&expiryDate=12%2F2019&billToFirstName=${c_billToFirstName}&billToLastName=UpdatedLast&billAddress1=New%20Address%201&billAddress2=New%20Address%202&billCity=NewCity&billState=${c_state}&billZip=54321&billCountry=Philippines`,
      replay: {
        id: "req_22",
        recordingStartedAt: "2026-03-31T06:13:28.272Z",
      },
    });
    k6Check(res1, {
      "click_continue - status is 200": (r) => r.status === 200,
    });
  });

  thinktime();

  transaction('click_confirm', function () {
    const res1 = request('POST', `${env.baseUrl}/order/submitOrder`, {
      name: "POST_submitOrder_1",
      headers: {
      "content-length": "14",
      "cache-control": "max-age=0",
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      origin: "https://jpetstore.aspectran.com",
      "content-type": "application/x-www-form-urlencoded",
      "upgrade-insecure-requests": "1",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document",
      referer: "https://jpetstore.aspectran.com/order/newOrder",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=0, i",
    },
      body: "confirmed=true",
      replay: {
        id: "req_23",
        recordingStartedAt: "2026-03-31T06:13:44.794Z",
      },
    });
    c_order = trackCorrelation("c_order", extractHeader(res1, "Location?orderId"), "res1.header:Location?orderId");
    k6Check(res1, {
      "click_confirm - status is 302": (r) => r.status === 302,
    });

    const res2 = request('GET', `${env.baseUrl}/order/viewOrder?orderId=${c_order}&submitted=true`, {
      name: "GET_viewOrder_1",
      headers: {
      "cache-control": "max-age=0",
      "upgrade-insecure-requests": "1",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document",
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      referer: "https://jpetstore.aspectran.com/order/newOrder",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=0, i",
    },
      replay: {
        id: "req_24",
        recordingStartedAt: "2026-03-31T06:13:45.039Z",
      },
    });
    k6Check(res2, {
      "click_confirm - status is 200": (r) => r.status === 200,
    });

    const res3 = request('GET', `${env.baseUrl}/cdn-cgi/speculation`, {
      name: "GET_speculation_1",
      headers: {
      origin: "https://jpetstore.aspectran.com",
      "sec-ch-ua-platform": "\"Windows\"",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      accept: "*/*",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "speculationrules",
      referer: "https://jpetstore.aspectran.com/order/viewOrder?orderId=100102&submitted=true",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=4, i",
    },
      replay: {
        id: "req_25",
        recordingStartedAt: "2026-03-31T06:13:45.343Z",
      },
    });
    k6Check(res3, {
      "click_confirm - status is 200": (r) => r.status === 200,
    });
  });

}

export function endPhase(ctx) {
  transaction('logout', function () {
    const res1 = request('GET', `${env.baseUrl}/account/signoff`, {
      name: "GET_signoff_1",
      headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "upgrade-insecure-requests": "1",
      "sec-purpose": "prefetch",
      "sec-speculation-tags": "null",
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-site": "none",
      "sec-fetch-mode": "navigate",
      "sec-fetch-dest": "document",
      referer: "https://jpetstore.aspectran.com/order/viewOrder?orderId=100102&submitted=true",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=1, i",
    },
      replay: {
        id: "req_26",
        recordingStartedAt: "2026-03-31T06:14:32.377Z",
      },
    });
    k6Check(res1, {
      "logout - status is 503": (r) => r.status === 503,
    });

    const res2 = request('GET', `${env.baseUrl}/account/signoff`, {
      name: "GET_signoff_2",
      headers: {
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "upgrade-insecure-requests": "1",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document",
      referer: "https://jpetstore.aspectran.com/order/viewOrder?orderId=100102&submitted=true",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=0, i",
    },
      replay: {
        id: "req_27",
        recordingStartedAt: "2026-03-31T06:14:32.604Z",
      },
    });
    k6Check(res2, {
      "logout - status is 302": (r) => r.status === 302,
    });

    const res3 = request('GET', `${env.baseUrl}/`, {
      name: "GET_root_1",
      headers: {
      "upgrade-insecure-requests": "1",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document",
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      referer: "https://jpetstore.aspectran.com/order/viewOrder?orderId=100102&submitted=true",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=0, i",
    },
      replay: {
        id: "req_28",
        recordingStartedAt: "2026-03-31T06:14:32.784Z",
      },
    });
    k6Check(res3, {
      "logout - status is 200": (r) => r.status === 200,
    });

    const res4 = request('GET', `${env.baseUrl}/cdn-cgi/speculation`, {
      name: "GET_speculation_1",
      headers: {
      origin: "https://jpetstore.aspectran.com",
      "sec-ch-ua-platform": "\"Windows\"",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      accept: "*/*",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "speculationrules",
      referer: "https://jpetstore.aspectran.com/",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=4, i",
    },
      replay: {
        id: "req_29",
        recordingStartedAt: "2026-03-31T06:14:32.983Z",
      },
    });
    k6Check(res4, {
      "logout - status is 200": (r) => r.status === 200,
    });
  });

}

export default function () {
  runJourneyLifecycle(__journeyLifecycleStore, { initPhase, actionPhase, endPhase });
}
