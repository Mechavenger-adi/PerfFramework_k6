import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { initTransactions, startTransaction, endTransaction } from '../../../core-engine/src/utils/transaction.js';
import { logExchange, trackCorrelation, trackParameter } from '../../../core-engine/src/utils/replayLogger.js';
import execution from 'k6/execution';

initTransactions([
  "t01_launch",
  "t02_login",
  "search_animal",
  "select_product",
  "add_to_cart",
  "increase_quantity_to_2_and_proceed_to_checkout",
  "click_continue",
  "click_confirm",
  "logout"
]);

export default function () {

  // =========================================================
  // vuser_init: Runs ONLY on the first iteration for this VU
  // =========================================================
  if (execution.vu.iterationInInstance === 0) {
  group('t01_launch', function () {
    startTransaction('t01_launch');
    // har_entry: req_1
    const request_1 = {
      id: "req_1",
      transaction: "t01_launch",
      recordingStartedAt: "2026-03-31T06:05:02.930Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "t01_launch",
          har_entry_id: "req_1",
          recording_started_at: "2026-03-31T06:05:02.930Z"
        },
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
          priority: "u=0, i"
        }
      }
    };
    const res_1 = http.get(request_1.url, request_1.params);
    logExchange(request_1, res_1);
    check(res_1, {
      "t01_launch - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_2
    const request_2 = {
      id: "req_2",
      transaction: "t01_launch",
      recordingStartedAt: "2026-03-31T06:05:03.596Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/images/logo-topbar.gif",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "t01_launch",
          har_entry_id: "req_2",
          recording_started_at: "2026-03-31T06:05:03.596Z"
        },
        headers: {
          "sec-ch-ua-platform": "\"Windows\"",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
          "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
          "sec-ch-ua-mobile": "?0",
          accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "no-cors",
          "sec-fetch-dest": "image",
          referer: "https://jpetstore.aspectran.com/",
          "accept-encoding": "gzip, deflate, br, zstd",
          "accept-language": "en-US,en;q=0.9",
          priority: "u=2, i"
        }
      }
    };
    const res_2 = http.get(request_2.url, request_2.params);
    logExchange(request_2, res_2);
    check(res_2, {
      "t01_launch - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_3
    const request_3 = {
      id: "req_3",
      transaction: "t01_launch",
      recordingStartedAt: "2026-03-31T06:05:03.596Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/images/splash.gif",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "t01_launch",
          har_entry_id: "req_3",
          recording_started_at: "2026-03-31T06:05:03.596Z"
        },
        headers: {
          "sec-ch-ua-platform": "\"Windows\"",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
          "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
          "sec-ch-ua-mobile": "?0",
          accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "no-cors",
          "sec-fetch-dest": "image",
          referer: "https://jpetstore.aspectran.com/",
          "accept-encoding": "gzip, deflate, br, zstd",
          "accept-language": "en-US,en;q=0.9",
          priority: "u=2, i"
        }
      }
    };
    const res_3 = http.get(request_3.url, request_3.params);
    logExchange(request_3, res_3);
    check(res_3, {
      "t01_launch - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_4
    const request_4 = {
      id: "req_4",
      transaction: "t01_launch",
      recordingStartedAt: "2026-03-31T06:05:03.596Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/cdn-cgi/speculation",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "t01_launch",
          har_entry_id: "req_4",
          recording_started_at: "2026-03-31T06:05:03.596Z"
        },
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
          priority: "u=4, i"
        }
      }
    };
    const res_4 = http.get(request_4.url, request_4.params);
    logExchange(request_4, res_4);
    check(res_4, {
      "t01_launch - status is 200": (r) => r.status === 200,
    });
    endTransaction('t01_launch');
  });

  sleep(1);

  group('t02_login', function () {
    startTransaction('t02_login');
    // har_entry: req_5
    const request_1 = {
      id: "req_5",
      transaction: "t02_login",
      recordingStartedAt: "2026-03-31T06:09:09.849Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/account/signonForm",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "t02_login",
          har_entry_id: "req_5",
          recording_started_at: "2026-03-31T06:09:09.849Z"
        },
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
          priority: "u=1, i"
        }
      }
    };
    const res_1 = http.get(request_1.url, request_1.params);
    logExchange(request_1, res_1);
    check(res_1, {
      "t02_login - status is 503": (r) => r.status === 503,
    });

    // har_entry: req_6
    const request_2 = {
      id: "req_6",
      transaction: "t02_login",
      recordingStartedAt: "2026-03-31T06:09:10.082Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/account/signonForm",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "t02_login",
          har_entry_id: "req_6",
          recording_started_at: "2026-03-31T06:09:10.082Z"
        },
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
          priority: "u=0, i"
        }
      }
    };
    const res_2 = http.get(request_2.url, request_2.params);
    logExchange(request_2, res_2);
    check(res_2, {
      "t02_login - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_7
    const request_3 = {
      id: "req_7",
      transaction: "t02_login",
      recordingStartedAt: "2026-03-31T06:09:10.579Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/cdn-cgi/speculation",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "t02_login",
          har_entry_id: "req_7",
          recording_started_at: "2026-03-31T06:09:10.579Z"
        },
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
          priority: "u=4, i"
        }
      }
    };
    const res_3 = http.get(request_3.url, request_3.params);
    logExchange(request_3, res_3);
    check(res_3, {
      "t02_login - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_8
    const request_4 = {
      id: "req_8",
      transaction: "t02_login",
      recordingStartedAt: "2026-03-31T06:09:16.704Z",
      method: "POST",
      url: "https://jpetstore.aspectran.com/account/signon",
      body: "referer=&username=j2ee&password=j2ee",
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "t02_login",
          har_entry_id: "req_8",
          recording_started_at: "2026-03-31T06:09:16.704Z"
        },
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
          priority: "u=0, i"
        }
      }
    };
    const res_4 = http.post(request_4.url, request_4.body, request_4.params);
    logExchange(request_4, res_4);
    check(res_4, {
      "t02_login - status is 302": (r) => r.status === 302,
    });

    // har_entry: req_9
    const request_5 = {
      id: "req_9",
      transaction: "t02_login",
      recordingStartedAt: "2026-03-31T06:09:16.922Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "t02_login",
          har_entry_id: "req_9",
          recording_started_at: "2026-03-31T06:09:16.922Z"
        },
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
          priority: "u=0, i"
        }
      }
    };
    const res_5 = http.get(request_5.url, request_5.params);
    logExchange(request_5, res_5);
    check(res_5, {
      "t02_login - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_10
    const request_6 = {
      id: "req_10",
      transaction: "t02_login",
      recordingStartedAt: "2026-03-31T06:09:17.113Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/images/banner_dogs.gif",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "t02_login",
          har_entry_id: "req_10",
          recording_started_at: "2026-03-31T06:09:17.113Z"
        },
        headers: {
          "sec-ch-ua-platform": "\"Windows\"",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
          "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
          "sec-ch-ua-mobile": "?0",
          accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "no-cors",
          "sec-fetch-dest": "image",
          referer: "https://jpetstore.aspectran.com/",
          "accept-encoding": "gzip, deflate, br, zstd",
          "accept-language": "en-US,en;q=0.9",
          priority: "u=2, i"
        }
      }
    };
    const res_6 = http.get(request_6.url, request_6.params);
    logExchange(request_6, res_6);
    check(res_6, {
      "t02_login - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_11
    const request_7 = {
      id: "req_11",
      transaction: "t02_login",
      recordingStartedAt: "2026-03-31T06:09:17.117Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/cdn-cgi/speculation",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "t02_login",
          har_entry_id: "req_11",
          recording_started_at: "2026-03-31T06:09:17.117Z"
        },
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
          priority: "u=4, i"
        }
      }
    };
    const res_7 = http.get(request_7.url, request_7.params);
    logExchange(request_7, res_7);
    check(res_7, {
      "t02_login - status is 200": (r) => r.status === 200,
    });
    endTransaction('t02_login');
  });

  sleep(1);
  } // <-- End of vuser_init block

  // =========================================================
  // Action: Runs repeatedly during the test duration
  // =========================================================

  group('search_animal', function () {
    startTransaction('search_animal');
    // har_entry: req_12
    const request_1 = {
      id: "req_12",
      transaction: "search_animal",
      recordingStartedAt: "2026-03-31T06:10:01.078Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/catalog/searchProducts?keyword=dog",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "search_animal",
          har_entry_id: "req_12",
          recording_started_at: "2026-03-31T06:10:01.078Z"
        },
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
          priority: "u=0, i"
        }
      }
    };
    const res_1 = http.get(request_1.url, request_1.params);
    logExchange(request_1, res_1);
    check(res_1, {
      "search_animal - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_13
    const request_2 = {
      id: "req_13",
      transaction: "search_animal",
      recordingStartedAt: "2026-03-31T06:10:01.272Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/cdn-cgi/speculation",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "search_animal",
          har_entry_id: "req_13",
          recording_started_at: "2026-03-31T06:10:01.272Z"
        },
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
          priority: "u=4, i"
        }
      }
    };
    const res_2 = http.get(request_2.url, request_2.params);
    logExchange(request_2, res_2);
    check(res_2, {
      "search_animal - status is 200": (r) => r.status === 200,
    });
    endTransaction('search_animal');
  });

  sleep(1);

  group('select_product', function () {
    startTransaction('select_product');
    // har_entry: req_14
    const request_1 = {
      id: "req_14",
      transaction: "select_product",
      recordingStartedAt: "2026-03-31T06:11:46.730Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/products/K9-BD-01",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "select_product",
          har_entry_id: "req_14",
          recording_started_at: "2026-03-31T06:11:46.730Z"
        },
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
          priority: "u=1, i"
        }
      }
    };
    const res_1 = http.get(request_1.url, request_1.params);
    logExchange(request_1, res_1);
    check(res_1, {
      "select_product - status is 503": (r) => r.status === 503,
    });

    // har_entry: req_15
    const request_2 = {
      id: "req_15",
      transaction: "select_product",
      recordingStartedAt: "2026-03-31T06:11:46.959Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/products/K9-BD-01",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "select_product",
          har_entry_id: "req_15",
          recording_started_at: "2026-03-31T06:11:46.959Z"
        },
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
          priority: "u=0, i"
        }
      }
    };
    const res_2 = http.get(request_2.url, request_2.params);
    logExchange(request_2, res_2);
    check(res_2, {
      "select_product - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_16
    const request_3 = {
      id: "req_16",
      transaction: "select_product",
      recordingStartedAt: "2026-03-31T06:11:47.464Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/cdn-cgi/speculation",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "select_product",
          har_entry_id: "req_16",
          recording_started_at: "2026-03-31T06:11:47.464Z"
        },
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
          priority: "u=4, i"
        }
      }
    };
    const res_3 = http.get(request_3.url, request_3.params);
    logExchange(request_3, res_3);
    check(res_3, {
      "select_product - status is 200": (r) => r.status === 200,
    });
    endTransaction('select_product');
  });

  sleep(1);

  group('add_to_cart', function () {
    startTransaction('add_to_cart');
    // har_entry: req_17
    const request_1 = {
      id: "req_17",
      transaction: "add_to_cart",
      recordingStartedAt: "2026-03-31T06:12:11.127Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/cart/addItemToCart?itemId=EST-6",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "add_to_cart",
          har_entry_id: "req_17",
          recording_started_at: "2026-03-31T06:12:11.127Z"
        },
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
          priority: "u=1, i"
        }
      }
    };
    const res_1 = http.get(request_1.url, request_1.params);
    logExchange(request_1, res_1);
    check(res_1, {
      "add_to_cart - status is 503": (r) => r.status === 503,
    });

    // har_entry: req_18
    const request_2 = {
      id: "req_18",
      transaction: "add_to_cart",
      recordingStartedAt: "2026-03-31T06:12:11.354Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/cart/addItemToCart?itemId=EST-6",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "add_to_cart",
          har_entry_id: "req_18",
          recording_started_at: "2026-03-31T06:12:11.354Z"
        },
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
          priority: "u=0, i"
        }
      }
    };
    const res_2 = http.get(request_2.url, request_2.params);
    logExchange(request_2, res_2);
    check(res_2, {
      "add_to_cart - status is 302": (r) => r.status === 302,
    });

    // har_entry: req_19
    const request_3 = {
      id: "req_19",
      transaction: "add_to_cart",
      recordingStartedAt: "2026-03-31T06:12:11.557Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/cart/viewCart",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "add_to_cart",
          har_entry_id: "req_19",
          recording_started_at: "2026-03-31T06:12:11.557Z"
        },
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
          priority: "u=0, i"
        }
      }
    };
    const res_3 = http.get(request_3.url, request_3.params);
    logExchange(request_3, res_3);
    check(res_3, {
      "add_to_cart - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_20
    const request_4 = {
      id: "req_20",
      transaction: "add_to_cart",
      recordingStartedAt: "2026-03-31T06:12:11.770Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/cdn-cgi/speculation",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "add_to_cart",
          har_entry_id: "req_20",
          recording_started_at: "2026-03-31T06:12:11.770Z"
        },
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
          priority: "u=4, i"
        }
      }
    };
    const res_4 = http.get(request_4.url, request_4.params);
    logExchange(request_4, res_4);
    check(res_4, {
      "add_to_cart - status is 200": (r) => r.status === 200,
    });
    endTransaction('add_to_cart');
  });

  sleep(1);

  group('increase_quantity_to_2_and_proceed_to_checkout', function () {
    startTransaction('increase_quantity_to_2_and_proceed_to_checkout');
    // har_entry: req_21
    const request_1 = {
      id: "req_21",
      transaction: "increase_quantity_to_2_and_proceed_to_checkout",
      recordingStartedAt: "2026-03-31T06:12:54.690Z",
      method: "POST",
      url: "https://jpetstore.aspectran.com/cart/updateCartQuantities",
      body: "EST-6=2",
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "increase_quantity_to_2_and_proceed_to_checkout",
          har_entry_id: "req_21",
          recording_started_at: "2026-03-31T06:12:54.690Z"
        },
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
          priority: "u=1, i"
        }
      }
    };
    const res_1 = http.post(request_1.url, request_1.body, request_1.params);
    logExchange(request_1, res_1);
    check(res_1, {
      "increase_quantity_to_2_and_proceed_to_checkout - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_22
    const request_2 = {
      id: "req_22",
      transaction: "increase_quantity_to_2_and_proceed_to_checkout",
      recordingStartedAt: "2026-03-31T06:12:57.286Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/order/newOrderForm",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "increase_quantity_to_2_and_proceed_to_checkout",
          har_entry_id: "req_22",
          recording_started_at: "2026-03-31T06:12:57.286Z"
        },
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
          priority: "u=1, i"
        }
      }
    };
    const res_2 = http.get(request_2.url, request_2.params);
    logExchange(request_2, res_2);
    check(res_2, {
      "increase_quantity_to_2_and_proceed_to_checkout - status is 503": (r) => r.status === 503,
    });

    // har_entry: req_23
    const request_3 = {
      id: "req_23",
      transaction: "increase_quantity_to_2_and_proceed_to_checkout",
      recordingStartedAt: "2026-03-31T06:12:57.478Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/order/newOrderForm",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "increase_quantity_to_2_and_proceed_to_checkout",
          har_entry_id: "req_23",
          recording_started_at: "2026-03-31T06:12:57.478Z"
        },
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
          priority: "u=0, i"
        }
      }
    };
    const res_3 = http.get(request_3.url, request_3.params);
    logExchange(request_3, res_3);
    check(res_3, {
      "increase_quantity_to_2_and_proceed_to_checkout - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_24
    const request_4 = {
      id: "req_24",
      transaction: "increase_quantity_to_2_and_proceed_to_checkout",
      recordingStartedAt: "2026-03-31T06:12:57.674Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/cdn-cgi/speculation",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "increase_quantity_to_2_and_proceed_to_checkout",
          har_entry_id: "req_24",
          recording_started_at: "2026-03-31T06:12:57.674Z"
        },
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
          priority: "u=4, i"
        }
      }
    };
    const res_4 = http.get(request_4.url, request_4.params);
    logExchange(request_4, res_4);
    check(res_4, {
      "increase_quantity_to_2_and_proceed_to_checkout - status is 200": (r) => r.status === 200,
    });
    endTransaction('increase_quantity_to_2_and_proceed_to_checkout');
  });

  sleep(1);

  group('click_continue', function () {
    startTransaction('click_continue');
    // har_entry: req_25
    const request_1 = {
      id: "req_25",
      transaction: "click_continue",
      recordingStartedAt: "2026-03-31T06:13:28.272Z",
      method: "POST",
      url: "https://jpetstore.aspectran.com/order/newOrder",
      body: "paymentForm=true&billingForm=true&cardType=Visa&creditCard=999999999999999&expiryDate=12%2F2019&billToFirstName=UpdatedFirst&billToLastName=UpdatedLast&billAddress1=New%20Address%201&billAddress2=New%20Address%202&billCity=NewCity&billState=NewState&billZip=54321&billCountry=Philippines",
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "click_continue",
          har_entry_id: "req_25",
          recording_started_at: "2026-03-31T06:13:28.272Z"
        },
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
          priority: "u=0, i"
        }
      }
    };
    const res_1 = http.post(request_1.url, request_1.body, request_1.params);
    logExchange(request_1, res_1);
    check(res_1, {
      "click_continue - status is 200": (r) => r.status === 200,
    });
    endTransaction('click_continue');
  });

  sleep(1);

  group('click_confirm', function () {
    startTransaction('click_confirm');
    // har_entry: req_26
    const request_1 = {
      id: "req_26",
      transaction: "click_confirm",
      recordingStartedAt: "2026-03-31T06:13:44.794Z",
      method: "POST",
      url: "https://jpetstore.aspectran.com/order/submitOrder",
      body: "confirmed=true",
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "click_confirm",
          har_entry_id: "req_26",
          recording_started_at: "2026-03-31T06:13:44.794Z"
        },
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
          priority: "u=0, i"
        }
      }
    };
    const res_1 = http.post(request_1.url, request_1.body, request_1.params);
    logExchange(request_1, res_1);
    check(res_1, {
      "click_confirm - status is 302": (r) => r.status === 302,
    });

    // har_entry: req_27
    const request_2 = {
      id: "req_27",
      transaction: "click_confirm",
      recordingStartedAt: "2026-03-31T06:13:45.039Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/order/viewOrder?orderId=100102&submitted=true",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "click_confirm",
          har_entry_id: "req_27",
          recording_started_at: "2026-03-31T06:13:45.039Z"
        },
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
          priority: "u=0, i"
        }
      }
    };
    const res_2 = http.get(request_2.url, request_2.params);
    logExchange(request_2, res_2);
    check(res_2, {
      "click_confirm - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_28
    const request_3 = {
      id: "req_28",
      transaction: "click_confirm",
      recordingStartedAt: "2026-03-31T06:13:45.343Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/cdn-cgi/speculation",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "click_confirm",
          har_entry_id: "req_28",
          recording_started_at: "2026-03-31T06:13:45.343Z"
        },
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
          priority: "u=4, i"
        }
      }
    };
    const res_3 = http.get(request_3.url, request_3.params);
    logExchange(request_3, res_3);
    check(res_3, {
      "click_confirm - status is 200": (r) => r.status === 200,
    });
    endTransaction('click_confirm');
  });

  sleep(1);

  // =========================================================
  // vuser_end: The Logout Challenge
  // IMPORTANT: Unlike LoadRunner, k6 has NO native hook to run code when a VU ramps down.
  // The VU will simply be interrupted when the test duration ends. 
  // Best practice: Let sessions expire naturally on the server.
  // If using a fixed-iteration executor, you could wrap this in:
  // if (execution.vu.iterationInInstance === TOTAL_ITERATIONS - 1) {
  // =========================================================

  group('logout', function () {
    startTransaction('logout');
    // har_entry: req_29
    const request_1 = {
      id: "req_29",
      transaction: "logout",
      recordingStartedAt: "2026-03-31T06:14:32.377Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/account/signoff",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "logout",
          har_entry_id: "req_29",
          recording_started_at: "2026-03-31T06:14:32.377Z"
        },
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
          priority: "u=1, i"
        }
      }
    };
    const res_1 = http.get(request_1.url, request_1.params);
    logExchange(request_1, res_1);
    check(res_1, {
      "logout - status is 503": (r) => r.status === 503,
    });

    // har_entry: req_30
    const request_2 = {
      id: "req_30",
      transaction: "logout",
      recordingStartedAt: "2026-03-31T06:14:32.604Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/account/signoff",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "logout",
          har_entry_id: "req_30",
          recording_started_at: "2026-03-31T06:14:32.604Z"
        },
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
          priority: "u=0, i"
        }
      }
    };
    const res_2 = http.get(request_2.url, request_2.params);
    logExchange(request_2, res_2);
    check(res_2, {
      "logout - status is 302": (r) => r.status === 302,
    });

    // har_entry: req_31
    const request_3 = {
      id: "req_31",
      transaction: "logout",
      recordingStartedAt: "2026-03-31T06:14:32.784Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "logout",
          har_entry_id: "req_31",
          recording_started_at: "2026-03-31T06:14:32.784Z"
        },
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
          priority: "u=0, i"
        }
      }
    };
    const res_3 = http.get(request_3.url, request_3.params);
    logExchange(request_3, res_3);
    check(res_3, {
      "logout - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_32
    const request_4 = {
      id: "req_32",
      transaction: "logout",
      recordingStartedAt: "2026-03-31T06:14:32.983Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/cdn-cgi/speculation",
      body: null,
      params: {
        cookies: {},
        redirects: 0,
        tags: {
          transaction: "logout",
          har_entry_id: "req_32",
          recording_started_at: "2026-03-31T06:14:32.983Z"
        },
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
          priority: "u=4, i"
        }
      }
    };
    const res_4 = http.get(request_4.url, request_4.params);
    logExchange(request_4, res_4);
    check(res_4, {
      "logout - status is 200": (r) => r.status === 200,
    });
    endTransaction('logout');
  });

}
