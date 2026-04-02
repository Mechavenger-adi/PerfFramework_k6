import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { initTransactions, startTransaction, endTransaction } from '../../../core-engine/src/utils/transaction.js';
import { logReplayExchange } from '../../../core-engine/src/utils/replayLogger.js';

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
  group('t01_launch', function () {
    startTransaction('t01_launch');
    // har_entry: req_4
    const request_1 = {
      id: "req_4",
      transaction: "t01_launch",
      recordingStartedAt: "2026-03-31T06:05:02.930Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/",
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "t01_launch",
          har_entry_id: "req_4",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_1.id,
      transaction: request_1.transaction,
      method: request_1.method,
      url: request_1.url,
      tags: request_1.params.tags,
    }));
    const res_1 = http.get(request_1.url, request_1.params);
    logReplayExchange(
      {
        harEntryId: request_1.id,
        transaction: request_1.transaction,
        recordingStartedAt: request_1.recordingStartedAt,
        method: request_1.method,
        url: request_1.url,
        tags: request_1.params.tags,
      },
      {
        headers: request_1.params.headers || {},
        variableEvents: request_1.variableEvents,
        body: request_1.body,
      },
      res_1,
    );
    check(res_1, {
      "t01_launch - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_8
    const request_2 = {
      id: "req_8",
      transaction: "t01_launch",
      recordingStartedAt: "2026-03-31T06:05:03.596Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/cdn-cgi/speculation",
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "t01_launch",
          har_entry_id: "req_8",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_2.id,
      transaction: request_2.transaction,
      method: request_2.method,
      url: request_2.url,
      tags: request_2.params.tags,
    }));
    const res_2 = http.get(request_2.url, request_2.params);
    logReplayExchange(
      {
        harEntryId: request_2.id,
        transaction: request_2.transaction,
        recordingStartedAt: request_2.recordingStartedAt,
        method: request_2.method,
        url: request_2.url,
        tags: request_2.params.tags,
      },
      {
        headers: request_2.params.headers || {},
        variableEvents: request_2.variableEvents,
        body: request_2.body,
      },
      res_2,
    );
    check(res_2, {
      "t01_launch - status is 200": (r) => r.status === 200,
    });
    endTransaction('t01_launch');
  });

  sleep(1);

  group('t02_login', function () {
    startTransaction('t02_login');
    // har_entry: req_37
    const request_1 = {
      id: "req_37",
      transaction: "t02_login",
      recordingStartedAt: "2026-03-31T06:09:09.849Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/account/signonForm",
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "t02_login",
          har_entry_id: "req_37",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_1.id,
      transaction: request_1.transaction,
      method: request_1.method,
      url: request_1.url,
      tags: request_1.params.tags,
    }));
    const res_1 = http.get(request_1.url, request_1.params);
    logReplayExchange(
      {
        harEntryId: request_1.id,
        transaction: request_1.transaction,
        recordingStartedAt: request_1.recordingStartedAt,
        method: request_1.method,
        url: request_1.url,
        tags: request_1.params.tags,
      },
      {
        headers: request_1.params.headers || {},
        variableEvents: request_1.variableEvents,
        body: request_1.body,
      },
      res_1,
    );
    check(res_1, {
      "t02_login - status is 503": (r) => r.status === 503,
    });

    // har_entry: req_38
    const request_2 = {
      id: "req_38",
      transaction: "t02_login",
      recordingStartedAt: "2026-03-31T06:09:10.082Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/account/signonForm",
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "t02_login",
          har_entry_id: "req_38",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_2.id,
      transaction: request_2.transaction,
      method: request_2.method,
      url: request_2.url,
      tags: request_2.params.tags,
    }));
    const res_2 = http.get(request_2.url, request_2.params);
    logReplayExchange(
      {
        harEntryId: request_2.id,
        transaction: request_2.transaction,
        recordingStartedAt: request_2.recordingStartedAt,
        method: request_2.method,
        url: request_2.url,
        tags: request_2.params.tags,
      },
      {
        headers: request_2.params.headers || {},
        variableEvents: request_2.variableEvents,
        body: request_2.body,
      },
      res_2,
    );
    check(res_2, {
      "t02_login - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_39
    const request_3 = {
      id: "req_39",
      transaction: "t02_login",
      recordingStartedAt: "2026-03-31T06:09:10.579Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/cdn-cgi/speculation",
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "t02_login",
          har_entry_id: "req_39",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_3.id,
      transaction: request_3.transaction,
      method: request_3.method,
      url: request_3.url,
      tags: request_3.params.tags,
    }));
    const res_3 = http.get(request_3.url, request_3.params);
    logReplayExchange(
      {
        harEntryId: request_3.id,
        transaction: request_3.transaction,
        recordingStartedAt: request_3.recordingStartedAt,
        method: request_3.method,
        url: request_3.url,
        tags: request_3.params.tags,
      },
      {
        headers: request_3.params.headers || {},
        variableEvents: request_3.variableEvents,
        body: request_3.body,
      },
      res_3,
    );
    check(res_3, {
      "t02_login - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_41
    const request_4 = {
      id: "req_41",
      transaction: "t02_login",
      recordingStartedAt: "2026-03-31T06:09:16.704Z",
      method: "POST",
      url: "https://jpetstore.aspectran.com/account/signon",
      body: "referer=&username=j2ee&password=j2ee",
      variableEvents: [],
      params: {
        tags: {
          transaction: "t02_login",
          har_entry_id: "req_41",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_4.id,
      transaction: request_4.transaction,
      method: request_4.method,
      url: request_4.url,
      tags: request_4.params.tags,
    }));
    const res_4 = http.post(request_4.url, request_4.body, request_4.params);
    logReplayExchange(
      {
        harEntryId: request_4.id,
        transaction: request_4.transaction,
        recordingStartedAt: request_4.recordingStartedAt,
        method: request_4.method,
        url: request_4.url,
        tags: request_4.params.tags,
      },
      {
        headers: request_4.params.headers || {},
        variableEvents: request_4.variableEvents,
        body: request_4.body,
      },
      res_4,
    );
    check(res_4, {
      "t02_login - status is 302": (r) => r.status === 302,
    });

    // har_entry: req_42
    const request_5 = {
      id: "req_42",
      transaction: "t02_login",
      recordingStartedAt: "2026-03-31T06:09:16.922Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/",
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "t02_login",
          har_entry_id: "req_42",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_5.id,
      transaction: request_5.transaction,
      method: request_5.method,
      url: request_5.url,
      tags: request_5.params.tags,
    }));
    const res_5 = http.get(request_5.url, request_5.params);
    logReplayExchange(
      {
        harEntryId: request_5.id,
        transaction: request_5.transaction,
        recordingStartedAt: request_5.recordingStartedAt,
        method: request_5.method,
        url: request_5.url,
        tags: request_5.params.tags,
      },
      {
        headers: request_5.params.headers || {},
        variableEvents: request_5.variableEvents,
        body: request_5.body,
      },
      res_5,
    );
    check(res_5, {
      "t02_login - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_44
    const request_6 = {
      id: "req_44",
      transaction: "t02_login",
      recordingStartedAt: "2026-03-31T06:09:17.117Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/cdn-cgi/speculation",
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "t02_login",
          har_entry_id: "req_44",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_6.id,
      transaction: request_6.transaction,
      method: request_6.method,
      url: request_6.url,
      tags: request_6.params.tags,
    }));
    const res_6 = http.get(request_6.url, request_6.params);
    logReplayExchange(
      {
        harEntryId: request_6.id,
        transaction: request_6.transaction,
        recordingStartedAt: request_6.recordingStartedAt,
        method: request_6.method,
        url: request_6.url,
        tags: request_6.params.tags,
      },
      {
        headers: request_6.params.headers || {},
        variableEvents: request_6.variableEvents,
        body: request_6.body,
      },
      res_6,
    );
    check(res_6, {
      "t02_login - status is 200": (r) => r.status === 200,
    });
    endTransaction('t02_login');
  });

  sleep(1);

  group('search_animal', function () {
    startTransaction('search_animal');
    // har_entry: req_47
    const request_1 = {
      id: "req_47",
      transaction: "search_animal",
      recordingStartedAt: "2026-03-31T06:10:01.078Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/catalog/searchProducts?keyword=dog",
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "search_animal",
          har_entry_id: "req_47",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_1.id,
      transaction: request_1.transaction,
      method: request_1.method,
      url: request_1.url,
      tags: request_1.params.tags,
    }));
    const res_1 = http.get(request_1.url, request_1.params);
    logReplayExchange(
      {
        harEntryId: request_1.id,
        transaction: request_1.transaction,
        recordingStartedAt: request_1.recordingStartedAt,
        method: request_1.method,
        url: request_1.url,
        tags: request_1.params.tags,
      },
      {
        headers: request_1.params.headers || {},
        variableEvents: request_1.variableEvents,
        body: request_1.body,
      },
      res_1,
    );
    check(res_1, {
      "search_animal - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_48
    const request_2 = {
      id: "req_48",
      transaction: "search_animal",
      recordingStartedAt: "2026-03-31T06:10:01.272Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/cdn-cgi/speculation",
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "search_animal",
          har_entry_id: "req_48",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_2.id,
      transaction: request_2.transaction,
      method: request_2.method,
      url: request_2.url,
      tags: request_2.params.tags,
    }));
    const res_2 = http.get(request_2.url, request_2.params);
    logReplayExchange(
      {
        harEntryId: request_2.id,
        transaction: request_2.transaction,
        recordingStartedAt: request_2.recordingStartedAt,
        method: request_2.method,
        url: request_2.url,
        tags: request_2.params.tags,
      },
      {
        headers: request_2.params.headers || {},
        variableEvents: request_2.variableEvents,
        body: request_2.body,
      },
      res_2,
    );
    check(res_2, {
      "search_animal - status is 200": (r) => r.status === 200,
    });
    endTransaction('search_animal');
  });

  sleep(1);

  group('select_product', function () {
    startTransaction('select_product');
    // har_entry: req_50
    const request_1 = {
      id: "req_50",
      transaction: "select_product",
      recordingStartedAt: "2026-03-31T06:11:46.730Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/products/K9-BD-01",
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "select_product",
          har_entry_id: "req_50",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_1.id,
      transaction: request_1.transaction,
      method: request_1.method,
      url: request_1.url,
      tags: request_1.params.tags,
    }));
    const res_1 = http.get(request_1.url, request_1.params);
    logReplayExchange(
      {
        harEntryId: request_1.id,
        transaction: request_1.transaction,
        recordingStartedAt: request_1.recordingStartedAt,
        method: request_1.method,
        url: request_1.url,
        tags: request_1.params.tags,
      },
      {
        headers: request_1.params.headers || {},
        variableEvents: request_1.variableEvents,
        body: request_1.body,
      },
      res_1,
    );
    check(res_1, {
      "select_product - status is 503": (r) => r.status === 503,
    });

    // har_entry: req_51
    const request_2 = {
      id: "req_51",
      transaction: "select_product",
      recordingStartedAt: "2026-03-31T06:11:46.959Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/products/K9-BD-01",
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "select_product",
          har_entry_id: "req_51",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_2.id,
      transaction: request_2.transaction,
      method: request_2.method,
      url: request_2.url,
      tags: request_2.params.tags,
    }));
    const res_2 = http.get(request_2.url, request_2.params);
    logReplayExchange(
      {
        harEntryId: request_2.id,
        transaction: request_2.transaction,
        recordingStartedAt: request_2.recordingStartedAt,
        method: request_2.method,
        url: request_2.url,
        tags: request_2.params.tags,
      },
      {
        headers: request_2.params.headers || {},
        variableEvents: request_2.variableEvents,
        body: request_2.body,
      },
      res_2,
    );
    check(res_2, {
      "select_product - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_52
    const request_3 = {
      id: "req_52",
      transaction: "select_product",
      recordingStartedAt: "2026-03-31T06:11:47.464Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/cdn-cgi/speculation",
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "select_product",
          har_entry_id: "req_52",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_3.id,
      transaction: request_3.transaction,
      method: request_3.method,
      url: request_3.url,
      tags: request_3.params.tags,
    }));
    const res_3 = http.get(request_3.url, request_3.params);
    logReplayExchange(
      {
        harEntryId: request_3.id,
        transaction: request_3.transaction,
        recordingStartedAt: request_3.recordingStartedAt,
        method: request_3.method,
        url: request_3.url,
        tags: request_3.params.tags,
      },
      {
        headers: request_3.params.headers || {},
        variableEvents: request_3.variableEvents,
        body: request_3.body,
      },
      res_3,
    );
    check(res_3, {
      "select_product - status is 200": (r) => r.status === 200,
    });
    endTransaction('select_product');
  });

  sleep(1);

  group('add_to_cart', function () {
    startTransaction('add_to_cart');
    // har_entry: req_53
    const request_1 = {
      id: "req_53",
      transaction: "add_to_cart",
      recordingStartedAt: "2026-03-31T06:12:11.127Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/cart/addItemToCart?itemId=EST-6",
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "add_to_cart",
          har_entry_id: "req_53",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_1.id,
      transaction: request_1.transaction,
      method: request_1.method,
      url: request_1.url,
      tags: request_1.params.tags,
    }));
    const res_1 = http.get(request_1.url, request_1.params);
    logReplayExchange(
      {
        harEntryId: request_1.id,
        transaction: request_1.transaction,
        recordingStartedAt: request_1.recordingStartedAt,
        method: request_1.method,
        url: request_1.url,
        tags: request_1.params.tags,
      },
      {
        headers: request_1.params.headers || {},
        variableEvents: request_1.variableEvents,
        body: request_1.body,
      },
      res_1,
    );
    check(res_1, {
      "add_to_cart - status is 503": (r) => r.status === 503,
    });

    // har_entry: req_54
    const request_2 = {
      id: "req_54",
      transaction: "add_to_cart",
      recordingStartedAt: "2026-03-31T06:12:11.354Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/cart/addItemToCart?itemId=EST-6",
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "add_to_cart",
          har_entry_id: "req_54",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_2.id,
      transaction: request_2.transaction,
      method: request_2.method,
      url: request_2.url,
      tags: request_2.params.tags,
    }));
    const res_2 = http.get(request_2.url, request_2.params);
    logReplayExchange(
      {
        harEntryId: request_2.id,
        transaction: request_2.transaction,
        recordingStartedAt: request_2.recordingStartedAt,
        method: request_2.method,
        url: request_2.url,
        tags: request_2.params.tags,
      },
      {
        headers: request_2.params.headers || {},
        variableEvents: request_2.variableEvents,
        body: request_2.body,
      },
      res_2,
    );
    check(res_2, {
      "add_to_cart - status is 302": (r) => r.status === 302,
    });

    // har_entry: req_55
    const request_3 = {
      id: "req_55",
      transaction: "add_to_cart",
      recordingStartedAt: "2026-03-31T06:12:11.557Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/cart/viewCart",
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "add_to_cart",
          har_entry_id: "req_55",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_3.id,
      transaction: request_3.transaction,
      method: request_3.method,
      url: request_3.url,
      tags: request_3.params.tags,
    }));
    const res_3 = http.get(request_3.url, request_3.params);
    logReplayExchange(
      {
        harEntryId: request_3.id,
        transaction: request_3.transaction,
        recordingStartedAt: request_3.recordingStartedAt,
        method: request_3.method,
        url: request_3.url,
        tags: request_3.params.tags,
      },
      {
        headers: request_3.params.headers || {},
        variableEvents: request_3.variableEvents,
        body: request_3.body,
      },
      res_3,
    );
    check(res_3, {
      "add_to_cart - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_56
    const request_4 = {
      id: "req_56",
      transaction: "add_to_cart",
      recordingStartedAt: "2026-03-31T06:12:11.770Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/cdn-cgi/speculation",
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "add_to_cart",
          har_entry_id: "req_56",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_4.id,
      transaction: request_4.transaction,
      method: request_4.method,
      url: request_4.url,
      tags: request_4.params.tags,
    }));
    const res_4 = http.get(request_4.url, request_4.params);
    logReplayExchange(
      {
        harEntryId: request_4.id,
        transaction: request_4.transaction,
        recordingStartedAt: request_4.recordingStartedAt,
        method: request_4.method,
        url: request_4.url,
        tags: request_4.params.tags,
      },
      {
        headers: request_4.params.headers || {},
        variableEvents: request_4.variableEvents,
        body: request_4.body,
      },
      res_4,
    );
    check(res_4, {
      "add_to_cart - status is 200": (r) => r.status === 200,
    });
    endTransaction('add_to_cart');
  });

  sleep(1);

  group('increase_quantity_to_2_and_proceed_to_checkout', function () {
    startTransaction('increase_quantity_to_2_and_proceed_to_checkout');
    // har_entry: req_58
    const request_1 = {
      id: "req_58",
      transaction: "increase_quantity_to_2_and_proceed_to_checkout",
      recordingStartedAt: "2026-03-31T06:12:54.690Z",
      method: "POST",
      url: "https://jpetstore.aspectran.com/cart/updateCartQuantities",
      body: "EST-6=2",
      variableEvents: [],
      params: {
        tags: {
          transaction: "increase_quantity_to_2_and_proceed_to_checkout",
          har_entry_id: "req_58",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_1.id,
      transaction: request_1.transaction,
      method: request_1.method,
      url: request_1.url,
      tags: request_1.params.tags,
    }));
    const res_1 = http.post(request_1.url, request_1.body, request_1.params);
    logReplayExchange(
      {
        harEntryId: request_1.id,
        transaction: request_1.transaction,
        recordingStartedAt: request_1.recordingStartedAt,
        method: request_1.method,
        url: request_1.url,
        tags: request_1.params.tags,
      },
      {
        headers: request_1.params.headers || {},
        variableEvents: request_1.variableEvents,
        body: request_1.body,
      },
      res_1,
    );
    check(res_1, {
      "increase_quantity_to_2_and_proceed_to_checkout - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_60
    const request_2 = {
      id: "req_60",
      transaction: "increase_quantity_to_2_and_proceed_to_checkout",
      recordingStartedAt: "2026-03-31T06:12:57.286Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/order/newOrderForm",
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "increase_quantity_to_2_and_proceed_to_checkout",
          har_entry_id: "req_60",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_2.id,
      transaction: request_2.transaction,
      method: request_2.method,
      url: request_2.url,
      tags: request_2.params.tags,
    }));
    const res_2 = http.get(request_2.url, request_2.params);
    logReplayExchange(
      {
        harEntryId: request_2.id,
        transaction: request_2.transaction,
        recordingStartedAt: request_2.recordingStartedAt,
        method: request_2.method,
        url: request_2.url,
        tags: request_2.params.tags,
      },
      {
        headers: request_2.params.headers || {},
        variableEvents: request_2.variableEvents,
        body: request_2.body,
      },
      res_2,
    );
    check(res_2, {
      "increase_quantity_to_2_and_proceed_to_checkout - status is 503": (r) => r.status === 503,
    });

    // har_entry: req_61
    const request_3 = {
      id: "req_61",
      transaction: "increase_quantity_to_2_and_proceed_to_checkout",
      recordingStartedAt: "2026-03-31T06:12:57.478Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/order/newOrderForm",
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "increase_quantity_to_2_and_proceed_to_checkout",
          har_entry_id: "req_61",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_3.id,
      transaction: request_3.transaction,
      method: request_3.method,
      url: request_3.url,
      tags: request_3.params.tags,
    }));
    const res_3 = http.get(request_3.url, request_3.params);
    logReplayExchange(
      {
        harEntryId: request_3.id,
        transaction: request_3.transaction,
        recordingStartedAt: request_3.recordingStartedAt,
        method: request_3.method,
        url: request_3.url,
        tags: request_3.params.tags,
      },
      {
        headers: request_3.params.headers || {},
        variableEvents: request_3.variableEvents,
        body: request_3.body,
      },
      res_3,
    );
    check(res_3, {
      "increase_quantity_to_2_and_proceed_to_checkout - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_62
    const request_4 = {
      id: "req_62",
      transaction: "increase_quantity_to_2_and_proceed_to_checkout",
      recordingStartedAt: "2026-03-31T06:12:57.674Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/cdn-cgi/speculation",
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "increase_quantity_to_2_and_proceed_to_checkout",
          har_entry_id: "req_62",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_4.id,
      transaction: request_4.transaction,
      method: request_4.method,
      url: request_4.url,
      tags: request_4.params.tags,
    }));
    const res_4 = http.get(request_4.url, request_4.params);
    logReplayExchange(
      {
        harEntryId: request_4.id,
        transaction: request_4.transaction,
        recordingStartedAt: request_4.recordingStartedAt,
        method: request_4.method,
        url: request_4.url,
        tags: request_4.params.tags,
      },
      {
        headers: request_4.params.headers || {},
        variableEvents: request_4.variableEvents,
        body: request_4.body,
      },
      res_4,
    );
    check(res_4, {
      "increase_quantity_to_2_and_proceed_to_checkout - status is 200": (r) => r.status === 200,
    });
    endTransaction('increase_quantity_to_2_and_proceed_to_checkout');
  });

  sleep(1);

  group('click_continue', function () {
    startTransaction('click_continue');
    // har_entry: req_64
    const request_1 = {
      id: "req_64",
      transaction: "click_continue",
      recordingStartedAt: "2026-03-31T06:13:28.272Z",
      method: "POST",
      url: "https://jpetstore.aspectran.com/order/newOrder",
      body: "paymentForm=true&billingForm=true&cardType=Visa&creditCard=999999999999999&expiryDate=12%2F2019&billToFirstName=UpdatedFirst&billToLastName=UpdatedLast&billAddress1=New%20Address%201&billAddress2=New%20Address%202&billCity=NewCity&billState=NewState&billZip=54321&billCountry=Philippines",
      variableEvents: [],
      params: {
        tags: {
          transaction: "click_continue",
          har_entry_id: "req_64",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_1.id,
      transaction: request_1.transaction,
      method: request_1.method,
      url: request_1.url,
      tags: request_1.params.tags,
    }));
    const res_1 = http.post(request_1.url, request_1.body, request_1.params);
    logReplayExchange(
      {
        harEntryId: request_1.id,
        transaction: request_1.transaction,
        recordingStartedAt: request_1.recordingStartedAt,
        method: request_1.method,
        url: request_1.url,
        tags: request_1.params.tags,
      },
      {
        headers: request_1.params.headers || {},
        variableEvents: request_1.variableEvents,
        body: request_1.body,
      },
      res_1,
    );
    check(res_1, {
      "click_continue - status is 200": (r) => r.status === 200,
    });
    endTransaction('click_continue');
  });

  sleep(1);

  group('click_confirm', function () {
    startTransaction('click_confirm');
    // har_entry: req_65
    const request_1 = {
      id: "req_65",
      transaction: "click_confirm",
      recordingStartedAt: "2026-03-31T06:13:44.794Z",
      method: "POST",
      url: "https://jpetstore.aspectran.com/order/submitOrder",
      body: "confirmed=true",
      variableEvents: [],
      params: {
        tags: {
          transaction: "click_confirm",
          har_entry_id: "req_65",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_1.id,
      transaction: request_1.transaction,
      method: request_1.method,
      url: request_1.url,
      tags: request_1.params.tags,
    }));
    const res_1 = http.post(request_1.url, request_1.body, request_1.params);
    logReplayExchange(
      {
        harEntryId: request_1.id,
        transaction: request_1.transaction,
        recordingStartedAt: request_1.recordingStartedAt,
        method: request_1.method,
        url: request_1.url,
        tags: request_1.params.tags,
      },
      {
        headers: request_1.params.headers || {},
        variableEvents: request_1.variableEvents,
        body: request_1.body,
      },
      res_1,
    );
    check(res_1, {
      "click_confirm - status is 302": (r) => r.status === 302,
    });

    // har_entry: req_66
    const request_2 = {
      id: "req_66",
      transaction: "click_confirm",
      recordingStartedAt: "2026-03-31T06:13:45.039Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/order/viewOrder?orderId=100102&submitted=true",
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "click_confirm",
          har_entry_id: "req_66",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_2.id,
      transaction: request_2.transaction,
      method: request_2.method,
      url: request_2.url,
      tags: request_2.params.tags,
    }));
    const res_2 = http.get(request_2.url, request_2.params);
    logReplayExchange(
      {
        harEntryId: request_2.id,
        transaction: request_2.transaction,
        recordingStartedAt: request_2.recordingStartedAt,
        method: request_2.method,
        url: request_2.url,
        tags: request_2.params.tags,
      },
      {
        headers: request_2.params.headers || {},
        variableEvents: request_2.variableEvents,
        body: request_2.body,
      },
      res_2,
    );
    check(res_2, {
      "click_confirm - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_67
    const request_3 = {
      id: "req_67",
      transaction: "click_confirm",
      recordingStartedAt: "2026-03-31T06:13:45.343Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/cdn-cgi/speculation",
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "click_confirm",
          har_entry_id: "req_67",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_3.id,
      transaction: request_3.transaction,
      method: request_3.method,
      url: request_3.url,
      tags: request_3.params.tags,
    }));
    const res_3 = http.get(request_3.url, request_3.params);
    logReplayExchange(
      {
        harEntryId: request_3.id,
        transaction: request_3.transaction,
        recordingStartedAt: request_3.recordingStartedAt,
        method: request_3.method,
        url: request_3.url,
        tags: request_3.params.tags,
      },
      {
        headers: request_3.params.headers || {},
        variableEvents: request_3.variableEvents,
        body: request_3.body,
      },
      res_3,
    );
    check(res_3, {
      "click_confirm - status is 200": (r) => r.status === 200,
    });
    endTransaction('click_confirm');
  });

  sleep(1);

  group('logout', function () {
    startTransaction('logout');
    // har_entry: req_68
    const request_1 = {
      id: "req_68",
      transaction: "logout",
      recordingStartedAt: "2026-03-31T06:14:32.377Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/account/signoff",
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "logout",
          har_entry_id: "req_68",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_1.id,
      transaction: request_1.transaction,
      method: request_1.method,
      url: request_1.url,
      tags: request_1.params.tags,
    }));
    const res_1 = http.get(request_1.url, request_1.params);
    logReplayExchange(
      {
        harEntryId: request_1.id,
        transaction: request_1.transaction,
        recordingStartedAt: request_1.recordingStartedAt,
        method: request_1.method,
        url: request_1.url,
        tags: request_1.params.tags,
      },
      {
        headers: request_1.params.headers || {},
        variableEvents: request_1.variableEvents,
        body: request_1.body,
      },
      res_1,
    );
    check(res_1, {
      "logout - status is 503": (r) => r.status === 503,
    });

    // har_entry: req_69
    const request_2 = {
      id: "req_69",
      transaction: "logout",
      recordingStartedAt: "2026-03-31T06:14:32.604Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/account/signoff",
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "logout",
          har_entry_id: "req_69",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_2.id,
      transaction: request_2.transaction,
      method: request_2.method,
      url: request_2.url,
      tags: request_2.params.tags,
    }));
    const res_2 = http.get(request_2.url, request_2.params);
    logReplayExchange(
      {
        harEntryId: request_2.id,
        transaction: request_2.transaction,
        recordingStartedAt: request_2.recordingStartedAt,
        method: request_2.method,
        url: request_2.url,
        tags: request_2.params.tags,
      },
      {
        headers: request_2.params.headers || {},
        variableEvents: request_2.variableEvents,
        body: request_2.body,
      },
      res_2,
    );
    check(res_2, {
      "logout - status is 302": (r) => r.status === 302,
    });

    // har_entry: req_70
    const request_3 = {
      id: "req_70",
      transaction: "logout",
      recordingStartedAt: "2026-03-31T06:14:32.784Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/",
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "logout",
          har_entry_id: "req_70",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_3.id,
      transaction: request_3.transaction,
      method: request_3.method,
      url: request_3.url,
      tags: request_3.params.tags,
    }));
    const res_3 = http.get(request_3.url, request_3.params);
    logReplayExchange(
      {
        harEntryId: request_3.id,
        transaction: request_3.transaction,
        recordingStartedAt: request_3.recordingStartedAt,
        method: request_3.method,
        url: request_3.url,
        tags: request_3.params.tags,
      },
      {
        headers: request_3.params.headers || {},
        variableEvents: request_3.variableEvents,
        body: request_3.body,
      },
      res_3,
    );
    check(res_3, {
      "logout - status is 200": (r) => r.status === 200,
    });

    // har_entry: req_71
    const request_4 = {
      id: "req_71",
      transaction: "logout",
      recordingStartedAt: "2026-03-31T06:14:32.983Z",
      method: "GET",
      url: "https://jpetstore.aspectran.com/cdn-cgi/speculation",
      body: null,
      variableEvents: [],
      params: {
        tags: {
          transaction: "logout",
          har_entry_id: "req_71",
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
    console.log('[k6-perf][replay] ' + JSON.stringify({
      harEntryId: request_4.id,
      transaction: request_4.transaction,
      method: request_4.method,
      url: request_4.url,
      tags: request_4.params.tags,
    }));
    const res_4 = http.get(request_4.url, request_4.params);
    logReplayExchange(
      {
        harEntryId: request_4.id,
        transaction: request_4.transaction,
        recordingStartedAt: request_4.recordingStartedAt,
        method: request_4.method,
        url: request_4.url,
        tags: request_4.params.tags,
      },
      {
        headers: request_4.params.headers || {},
        variableEvents: request_4.variableEvents,
        body: request_4.body,
      },
      res_4,
    );
    check(res_4, {
      "logout - status is 200": (r) => r.status === 200,
    });
    endTransaction('logout');
  });

}
