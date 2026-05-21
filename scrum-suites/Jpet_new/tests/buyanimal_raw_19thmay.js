import { check } from 'k6';
import { transaction } from '../../../dist/utils/transaction.js';
import { request } from '../../../dist/utils/request.js';
import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';
import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';
import { clearCookies, registerBaseUrl, getEnvContext } from '../../../dist/utils/session.js';

const env = getEnvContext('jpet_new', 'https://jpetstore.aspectran.com/');
registerBaseUrl(env.baseUrl);

const __journeyLifecycleStore = createJourneyLifecycleStore();

export function initPhase(ctx) {
  clearCookies();

  transaction('t01_launch', function () {
    const res1 = request('GET', "/", {
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
        harEntryId: "req_1",
        recordingStartedAt: "2026-03-31T06:05:02.930Z",
      },
    });
    check(res1, {
      "t01_launch - status is 200": (r) => r.status === 200,
    });

    const res2 = request('GET', "/cdn-cgi/speculation", {
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
        harEntryId: "req_2",
        recordingStartedAt: "2026-03-31T06:05:03.596Z",
      },
    });
    check(res2, {
      "t01_launch - status is 200": (r) => r.status === 200,
    });
  });

  thinktime();

  transaction('t02_login', function () {
    const res1 = request('GET', "/account/signonForm", {
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
        harEntryId: "req_3",
        recordingStartedAt: "2026-03-31T06:09:09.849Z",
      },
    });
    check(res1, {
      "t02_login - status is 503": (r) => r.status === 503,
    });

    const res2 = request('GET', "/account/signonForm", {
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
        harEntryId: "req_4",
        recordingStartedAt: "2026-03-31T06:09:10.082Z",
      },
    });
    check(res2, {
      "t02_login - status is 200": (r) => r.status === 200,
    });

    const res3 = request('GET', "/cdn-cgi/speculation", {
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
        harEntryId: "req_5",
        recordingStartedAt: "2026-03-31T06:09:10.579Z",
      },
    });
    check(res3, {
      "t02_login - status is 200": (r) => r.status === 200,
    });

    const res4 = request('POST', "/account/signon", {
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
        harEntryId: "req_6",
        recordingStartedAt: "2026-03-31T06:09:16.704Z",
      },
    });
    check(res4, {
      "t02_login - status is 302": (r) => r.status === 302,
    });

    const res5 = request('GET', "/", {
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
        harEntryId: "req_7",
        recordingStartedAt: "2026-03-31T06:09:16.922Z",
      },
    });
    check(res5, {
      "t02_login - status is 200": (r) => r.status === 200,
    });

    const res6 = request('GET', "/cdn-cgi/speculation", {
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
        harEntryId: "req_8",
        recordingStartedAt: "2026-03-31T06:09:17.117Z",
      },
    });
    check(res6, {
      "t02_login - status is 200": (r) => r.status === 200,
    });
  });

}

export function actionPhase(ctx) {
  transaction('search_animal', function () {
    const res1 = request('GET', "/catalog/searchProducts?keyword=dog", {
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
        harEntryId: "req_1",
        recordingStartedAt: "2026-03-31T06:10:01.078Z",
      },
    });
    check(res1, {
      "search_animal - status is 200": (r) => r.status === 200,
    });

    const res2 = request('GET', "/cdn-cgi/speculation", {
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
        harEntryId: "req_2",
        recordingStartedAt: "2026-03-31T06:10:01.272Z",
      },
    });
    check(res2, {
      "search_animal - status is 200": (r) => r.status === 200,
    });
  });

  thinktime();

  transaction('select_product', function () {
    const res1 = request('GET', "/products/K9-BD-01", {
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
        harEntryId: "req_3",
        recordingStartedAt: "2026-03-31T06:11:46.730Z",
      },
    });
    check(res1, {
      "select_product - status is 503": (r) => r.status === 503,
    });

    const res2 = request('GET', "/products/K9-BD-01", {
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
        harEntryId: "req_4",
        recordingStartedAt: "2026-03-31T06:11:46.959Z",
      },
    });
    check(res2, {
      "select_product - status is 200": (r) => r.status === 200,
    });

    const res3 = request('GET', "/cdn-cgi/speculation", {
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
        harEntryId: "req_5",
        recordingStartedAt: "2026-03-31T06:11:47.464Z",
      },
    });
    check(res3, {
      "select_product - status is 200": (r) => r.status === 200,
    });
  });

  thinktime();

  transaction('add_to_cart', function () {
    const res1 = request('GET', "/cart/addItemToCart?itemId=EST-6", {
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
        harEntryId: "req_6",
        recordingStartedAt: "2026-03-31T06:12:11.127Z",
      },
    });
    check(res1, {
      "add_to_cart - status is 503": (r) => r.status === 503,
    });

    const res2 = request('GET', "/cart/addItemToCart?itemId=EST-6", {
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
        harEntryId: "req_7",
        recordingStartedAt: "2026-03-31T06:12:11.354Z",
      },
    });
    check(res2, {
      "add_to_cart - status is 302": (r) => r.status === 302,
    });

    const res3 = request('GET', "/cart/viewCart", {
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
        harEntryId: "req_8",
        recordingStartedAt: "2026-03-31T06:12:11.557Z",
      },
    });
    check(res3, {
      "add_to_cart - status is 200": (r) => r.status === 200,
    });

    const res4 = request('GET', "/cdn-cgi/speculation", {
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
        harEntryId: "req_9",
        recordingStartedAt: "2026-03-31T06:12:11.770Z",
      },
    });
    check(res4, {
      "add_to_cart - status is 200": (r) => r.status === 200,
    });
  });

  thinktime();

  transaction('increase_quantity_to_2_and_proceed_to_checkout', function () {
    const res1 = request('POST', "/cart/updateCartQuantities", {
      headers: {
      "content-length": "7",
      "sec-ch-ua-platform": "\"Windows\"",
      "hx-target": "jpetstore-content",
      "hx-current-url": "https://jpetstore.aspectran.com/cart/viewCart",
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
      referer: "https://jpetstore.aspectran.com/cart/viewCart",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=1, i",
    },
      body: "EST-6=2",
      replay: {
        harEntryId: "req_10",
        recordingStartedAt: "2026-03-31T06:12:54.690Z",
      },
    });
    check(res1, {
      "increase_quantity_to_2_and_proceed_to_checkout - status is 200": (r) => r.status === 200,
    });

    const res2 = request('GET', "/order/newOrderForm", {
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
        harEntryId: "req_11",
        recordingStartedAt: "2026-03-31T06:12:57.286Z",
      },
    });
    check(res2, {
      "increase_quantity_to_2_and_proceed_to_checkout - status is 503": (r) => r.status === 503,
    });

    const res3 = request('GET', "/order/newOrderForm", {
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
        harEntryId: "req_12",
        recordingStartedAt: "2026-03-31T06:12:57.478Z",
      },
    });
    check(res3, {
      "increase_quantity_to_2_and_proceed_to_checkout - status is 200": (r) => r.status === 200,
    });

    const res4 = request('GET', "/cdn-cgi/speculation", {
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
        harEntryId: "req_13",
        recordingStartedAt: "2026-03-31T06:12:57.674Z",
      },
    });
    check(res4, {
      "increase_quantity_to_2_and_proceed_to_checkout - status is 200": (r) => r.status === 200,
    });
  });

  thinktime();

  transaction('click_continue', function () {
    const res1 = request('POST', "/order/newOrder", {
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
      body: "paymentForm=true&billingForm=true&cardType=Visa&creditCard=999999999999999&expiryDate=12%2F2019&billToFirstName=UpdatedFirst&billToLastName=UpdatedLast&billAddress1=New%20Address%201&billAddress2=New%20Address%202&billCity=NewCity&billState=NewState&billZip=54321&billCountry=Philippines",
      replay: {
        harEntryId: "req_14",
        recordingStartedAt: "2026-03-31T06:13:28.272Z",
      },
    });
    check(res1, {
      "click_continue - status is 200": (r) => r.status === 200,
    });
  });

  thinktime();

  transaction('click_confirm', function () {
    const res1 = request('POST', "/order/submitOrder", {
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
        harEntryId: "req_15",
        recordingStartedAt: "2026-03-31T06:13:44.794Z",
      },
    });
    check(res1, {
      "click_confirm - status is 302": (r) => r.status === 302,
    });

    const res2 = request('GET', "/order/viewOrder?orderId=100102&submitted=true", {
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
        harEntryId: "req_16",
        recordingStartedAt: "2026-03-31T06:13:45.039Z",
      },
    });
    check(res2, {
      "click_confirm - status is 200": (r) => r.status === 200,
    });

    const res3 = request('GET', "/cdn-cgi/speculation", {
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
        harEntryId: "req_17",
        recordingStartedAt: "2026-03-31T06:13:45.343Z",
      },
    });
    check(res3, {
      "click_confirm - status is 200": (r) => r.status === 200,
    });
  });

}

export function endPhase(ctx) {
  transaction('logout', function () {
    const res1 = request('GET', "/account/signoff", {
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
        harEntryId: "req_1",
        recordingStartedAt: "2026-03-31T06:14:32.377Z",
      },
    });
    check(res1, {
      "logout - status is 503": (r) => r.status === 503,
    });

    const res2 = request('GET', "/account/signoff", {
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
        harEntryId: "req_2",
        recordingStartedAt: "2026-03-31T06:14:32.604Z",
      },
    });
    check(res2, {
      "logout - status is 302": (r) => r.status === 302,
    });

    const res3 = request('GET', "/", {
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
        harEntryId: "req_3",
        recordingStartedAt: "2026-03-31T06:14:32.784Z",
      },
    });
    check(res3, {
      "logout - status is 200": (r) => r.status === 200,
    });

    const res4 = request('GET', "/cdn-cgi/speculation", {
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
        harEntryId: "req_4",
        recordingStartedAt: "2026-03-31T06:14:32.983Z",
      },
    });
    check(res4, {
      "logout - status is 200": (r) => r.status === 200,
    });
  });

}

export default function () {
  runJourneyLifecycle(__journeyLifecycleStore, { initPhase, actionPhase, endPhase });
}
