import { check, group } from 'k6';
import execution from "k6/execution";
import csv from "k6/experimental/csv";
import fs from "k6/experimental/fs";
import http from 'k6/http';
import { createJourneyLifecycleStore, runJourneyLifecycle } from '../../../dist/utils/lifecycle.js';
import { logExchange, trackCorrelation, trackDataRow } from '../../../dist/utils/replayLogger.js';
import { endTransaction, initTransactions, startTransaction } from '../../../dist/utils/transaction.js';

initTransactions([
  "t01_launch",
  "t02_login",
  "t03_search_animal",
  "t04_select_product",
  "t05_add_to_cart",
  "t06_increase_quantity_to_2_and_proceed_to_checkout",
  "t07_click_continue",
  "t08_click_confirm",
  "t09_logout"
]);

const FILES = {
  userdetails: await csv.parse(await fs.open("../Data/userdetails.csv"), {
    asObjects: true,
  }),

  pet: await csv.parse(await fs.open("../Data/pet.csv"), { asObjects: true }),
};

function getUniqueItem(array) {
  return array[execution.scenario.iterationInTest % array.length];
}
const __journeyLifecycleStore = createJourneyLifecycleStore();

export function initPhase(ctx) {
  let match;
  let regex;
  const correlation_vars = ctx.correlation;
  ctx.data.userdetails = ctx.data.userdetails || getUniqueItem(FILES["userdetails"]);
  ctx.data.pet = ctx.data.pet || getUniqueItem(FILES["pet"]);
  const userdetails = ctx.data.userdetails;
  trackDataRow("userdetails", userdetails);
  trackDataRow("pet", ctx.data.pet);

  group("t01_launch", function () {
      startTransaction('t01_launch');
  
      const request_1 = {
        id: "req_1",
        transaction: "t01_launch",
        recordingStartedAt: new Date().toISOString(),
        method: "GET",
        url: `https://jpetstore.aspectran.com/`,
        body: null,
        params: {
          headers: {
            "sec-ch-ua": `"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"`,
            "sec-ch-ua-mobile": `?0`,
            "sec-ch-ua-platform": `"Windows"`,
            "upgrade-insecure-requests": `1`,
            accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
            "sec-fetch-site": `none`,
            "sec-fetch-mode": `navigate`,
            "sec-fetch-user": `?1`,
            "sec-fetch-dest": `document`,
            "accept-encoding": `gzip, deflate, br, zstd`,
            "accept-language": `en-US,en;q=0.9`,
            priority: `u=0, i`,
            },
          cookies: {},
          redirects: 0,
          tags: {
            transaction: "t01_launch",
            har_entry_id: "req_1",
            recording_started_at: "converted"
          }
        }
      };
      const res_1 = http.get(request_1.url, request_1.params);
      logExchange(request_1, res_1);
  
      check(res_1, { "status equals 200": (r) => r.status === 200 });
      endTransaction('t01_launch');
    });

  group("t02_login", function () {
      startTransaction('t02_login');
  
      // const request_1 = {
      //   id: "req_2",
      //   transaction: "t02_login",
      //   recordingStartedAt: new Date().toISOString(),
      //   method: "GET",
      //   url: `https://jpetstore.aspectran.com/account/signonForm`,
      //   body: null,
      //   params: {
      //     headers: {
      //       accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
      //       "upgrade-insecure-requests": `1`,
      //       "sec-purpose": `prefetch`,
      //       "sec-speculation-tags": `null`,
      //       "sec-ch-ua": `"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"`,
      //       "sec-ch-ua-mobile": `?0`,
      //       "sec-ch-ua-platform": `"Windows"`,
      //       "sec-fetch-site": `none`,
      //       "sec-fetch-mode": `navigate`,
      //       "sec-fetch-dest": `document`,
      //       referer: `https://jpetstore.aspectran.com/`,
      //       "accept-encoding": `gzip, deflate, br, zstd`,
      //       "accept-language": `en-US,en;q=0.9`,
      //       priority: `u=1, i`,
      //       },
      //     cookies: {},
      //     redirects: 0,
      //     tags: {
      //       transaction: "t02_login",
      //       har_entry_id: "req_2",
      //       recording_started_at: "converted"
      //     }
      //   }
      // };
      // const res_1 = http.get(request_1.url, request_1.params);
      // logExchange(request_1, res_1);
  
      // check(res_1, { "status equals 503": (r) => r.status === 503 });
  
  
      const request_2 = {
        id: "req_3",
        transaction: "t02_login",
        recordingStartedAt: new Date().toISOString(),
        method: "GET",
        url: `https://jpetstore.aspectran.com/account/signonForm`,
        body: null,
        params: {
          headers: {
            "sec-ch-ua": `"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"`,
            "sec-ch-ua-mobile": `?0`,
            "sec-ch-ua-platform": `"Windows"`,
            "upgrade-insecure-requests": `1`,
            accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
            "sec-fetch-site": `same-origin`,
            "sec-fetch-mode": `navigate`,
            "sec-fetch-user": `?1`,
            "sec-fetch-dest": `document`,
            referer: `https://jpetstore.aspectran.com/`,
            "accept-encoding": `gzip, deflate, br, zstd`,
            "accept-language": `en-US,en;q=0.9`,
            priority: `u=0, i`,
            },
          cookies: {},
          redirects: 0,
          tags: {
            transaction: "t02_login",
            har_entry_id: "req_3",
            recording_started_at: "converted"
          }
        }
      };
      const res_2 = http.get(request_2.url, request_2.params);
      logExchange(request_2, res_2);
  
      check(res_2, { "status equals 200": (r) => r.status === 200 });
  
  
      const request_3 = {
        id: "req_4",
        transaction: "t02_login",
        recordingStartedAt: new Date().toISOString(),
        method: "POST",
        url: `https://jpetstore.aspectran.com/account/signon`,
        body: JSON.parse(
          `{"referer":"","username":"${userdetails["p_username"]}","password":"${userdetails["p_password"]}"}`,
        ),
        params: {
          headers: {
            "cache-control": `max-age=0`,
            "sec-ch-ua": `"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"`,
            "sec-ch-ua-mobile": `?0`,
            "sec-ch-ua-platform": `"Windows"`,
            origin: `https://jpetstore.aspectran.com`,
            "content-type": `application/x-www-form-urlencoded`,
            "upgrade-insecure-requests": `1`,
            accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
            "sec-fetch-site": `same-origin`,
            "sec-fetch-mode": `navigate`,
            "sec-fetch-user": `?1`,
            "sec-fetch-dest": `document`,
            referer: `https://jpetstore.aspectran.com/account/signonForm`,
            "accept-encoding": `gzip, deflate, br, zstd`,
            "accept-language": `en-US,en;q=0.9`,
            priority: `u=0, i`,
            },
          cookies: {},
          redirects: 0,
          tags: {
            transaction: "t02_login",
            har_entry_id: "req_4",
            recording_started_at: "converted"
          }
        }
      };
      const res_3 = http.post(request_3.url, request_3.body, request_3.params);
      logExchange(request_3, res_3);
  
      check(res_3, { "status equals 302": (r) => r.status === 302 });
  
  
      const request_4 = {
        id: "req_5",
        transaction: "t02_login",
        recordingStartedAt: new Date().toISOString(),
        method: "GET",
        url: `https://jpetstore.aspectran.com/`,
        body: null,
        params: {
          headers: {
            "cache-control": `max-age=0`,
            "upgrade-insecure-requests": `1`,
            accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
            "sec-fetch-site": `same-origin`,
            "sec-fetch-mode": `navigate`,
            "sec-fetch-user": `?1`,
            "sec-fetch-dest": `document`,
            "sec-ch-ua": `"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"`,
            "sec-ch-ua-mobile": `?0`,
            "sec-ch-ua-platform": `"Windows"`,
            referer: `https://jpetstore.aspectran.com/account/signonForm`,
            "accept-encoding": `gzip, deflate, br, zstd`,
            "accept-language": `en-US,en;q=0.9`,
            priority: `u=0, i`,
            },
          cookies: {},
          redirects: 0,
          tags: {
            transaction: "t02_login",
            har_entry_id: "req_5",
            recording_started_at: "converted"
          }
        }
      };
      const res_4 = http.get(request_4.url, request_4.params);
      logExchange(request_4, res_4);
  
      check(res_4, { "status equals 200": (r) => r.status === 200 });
      endTransaction('t02_login');
    });

}

export function actionPhase(ctx) {
  let match;
  let regex;
  const correlation_vars = ctx.correlation;
  ctx.data.userdetails = ctx.data.userdetails || getUniqueItem(FILES["userdetails"]);
  ctx.data.pet = ctx.data.pet || getUniqueItem(FILES["pet"]);
  const pet = ctx.data.pet;

  group("t03_search_animal", function () {
      startTransaction('t03_search_animal');
  
      const request_1 = {
        id: "req_6",
        transaction: "t03_search_animal",
        recordingStartedAt: new Date().toISOString(),
        method: "GET",
        url: `https://jpetstore.aspectran.com/catalog/searchProducts?keyword=${pet["p_pet"]}`,
        body: null,
        params: {
          headers: {
            "sec-ch-ua": `"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"`,
            "sec-ch-ua-mobile": `?0`,
            "sec-ch-ua-platform": `"Windows"`,
            "upgrade-insecure-requests": `1`,
            accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
            "sec-fetch-site": `same-origin`,
            "sec-fetch-mode": `navigate`,
            "sec-fetch-user": `?1`,
            "sec-fetch-dest": `document`,
            referer: `https://jpetstore.aspectran.com/`,
            "accept-encoding": `gzip, deflate, br, zstd`,
            "accept-language": `en-US,en;q=0.9`,
            priority: `u=0, i`,
            },
          cookies: {},
          redirects: 0,
          tags: {
            transaction: "t03_search_animal",
            har_entry_id: "req_6",
            recording_started_at: "converted"
          }
        }
      };
      const res_1 = http.get(request_1.url, request_1.params);
      logExchange(request_1, res_1);
  
      check(res_1, { "status equals 200": (r) => r.status === 200 });
  
      regex = new RegExp('href="/products/[^"]+">(.*?)</a></strong>');
      match = res_1.body ? res_1.body.match(regex) : null;
      if (match) {
        correlation_vars["correlation_0"] = trackCorrelation("correlation_0", match[1], "body");
      }
      endTransaction('t03_search_animal');
    });

  group("t04_select_product", function () {
      startTransaction('t04_select_product');
  
      // const request_1 = {
      //   id: "req_7",
      //   transaction: "select_product",
      //   recordingStartedAt: new Date().toISOString(),
      //   method: "GET",
      //   url: `https://jpetstore.aspectran.com/products/${correlation_vars["correlation_0"]}`,
      //   body: null,
      //   params: {
      //     headers: {
      //       accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
      //       "upgrade-insecure-requests": `1`,
      //       "sec-purpose": `prefetch`,
      //       "sec-speculation-tags": `null`,
      //       "sec-ch-ua": `"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"`,
      //       "sec-ch-ua-mobile": `?0`,
      //       "sec-ch-ua-platform": `"Windows"`,
      //       "sec-fetch-site": `none`,
      //       "sec-fetch-mode": `navigate`,
      //       "sec-fetch-dest": `document`,
      //       referer: `https://jpetstore.aspectran.com/catalog/searchProducts?keyword=dog`,
      //       "accept-encoding": `gzip, deflate, br, zstd`,
      //       "accept-language": `en-US,en;q=0.9`,
      //       priority: `u=1, i`,
      //       },
      //     cookies: {},
      //     redirects: 0,
      //     tags: {
      //       transaction: "select_product",
      //       har_entry_id: "req_7",
      //       recording_started_at: "converted"
      //     }
      //   }
      // };
      // const res_1 = http.get(request_1.url, request_1.params);
      // logExchange(request_1, res_1);
  
      // check(res_1, { "status equals 503": (r) => r.status === 503 });
  
  
      const request_2 = {
        id: "req_8",
        transaction: "t04_select_product",
        recordingStartedAt: new Date().toISOString(),
        method: "GET",
        url: `https://jpetstore.aspectran.com/products/${correlation_vars["correlation_0"]}`,
        body: null,
        params: {
          headers: {
            "sec-ch-ua": `"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"`,
            "sec-ch-ua-mobile": `?0`,
            "sec-ch-ua-platform": `"Windows"`,
            "upgrade-insecure-requests": `1`,
            accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
            "sec-fetch-site": `same-origin`,
            "sec-fetch-mode": `navigate`,
            "sec-fetch-user": `?1`,
            "sec-fetch-dest": `document`,
            referer: `https://jpetstore.aspectran.com/catalog/searchProducts?keyword=dog`,
            "accept-encoding": `gzip, deflate, br, zstd`,
            "accept-language": `en-US,en;q=0.9`,
            priority: `u=0, i`,
            },
          cookies: {},
          redirects: 0,
          tags: {
            transaction: "t04_select_product",
            har_entry_id: "req_8",
            recording_started_at: "converted"
          }
        }
      };
      const res_2 = http.get(request_2.url, request_2.params);
      logExchange(request_2, res_2);
  
      check(res_2, { "status equals 200": (r) => r.status === 200 });
      endTransaction('t04_select_product');
    });

  group("t05_add_to_cart", function () {
      startTransaction('t05_add_to_cart');
  
      // const request_1 = {
      //   id: "req_9",
      //   transaction: "add_to_cart",
      //   recordingStartedAt: new Date().toISOString(),
      //   method: "GET",
      //   url: `https://jpetstore.aspectran.com/cart/addItemToCart?itemId=EST-6`,
      //   body: null,
      //   params: {
      //     headers: {
      //       accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
      //       "upgrade-insecure-requests": `1`,
      //       "sec-purpose": `prefetch`,
      //       "sec-speculation-tags": `null`,
      //       "sec-ch-ua": `"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"`,
      //       "sec-ch-ua-mobile": `?0`,
      //       "sec-ch-ua-platform": `"Windows"`,
      //       "sec-fetch-site": `none`,
      //       "sec-fetch-mode": `navigate`,
      //       "sec-fetch-dest": `document`,
      //       referer: `https://jpetstore.aspectran.com/products/${correlation_vars["correlation_0"]}`,
      //       "accept-encoding": `gzip, deflate, br, zstd`,
      //       "accept-language": `en-US,en;q=0.9`,
      //       priority: `u=1, i`,
      //       },
      //     cookies: {},
      //     redirects: 0,
      //     tags: {
      //       transaction: "add_to_cart",
      //       har_entry_id: "req_9",
      //       recording_started_at: "converted"
      //     }
      //   }
      // };
      // const res_1 = http.get(request_1.url, request_1.params);
      // logExchange(request_1, res_1);
  
      // check(res_1, { "status equals 503": (r) => r.status === 503 });
  
  
      const request_2 = {
        id: "req_10",
        transaction: "t05_add_to_cart",
        recordingStartedAt: new Date().toISOString(),
        method: "GET",
        url: `https://jpetstore.aspectran.com/cart/addItemToCart?itemId=EST-6`,
        body: null,
        params: {
          headers: {
            "sec-ch-ua": `"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"`,
            "sec-ch-ua-mobile": `?0`,
            "sec-ch-ua-platform": `"Windows"`,
            "upgrade-insecure-requests": `1`,
            accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
            "sec-fetch-site": `same-origin`,
            "sec-fetch-mode": `navigate`,
            "sec-fetch-user": `?1`,
            "sec-fetch-dest": `document`,
            referer: `https://jpetstore.aspectran.com/products/${correlation_vars["correlation_0"]}`,
            "accept-encoding": `gzip, deflate, br, zstd`,
            "accept-language": `en-US,en;q=0.9`,
            priority: `u=0, i`,
            },
          cookies: {},
          redirects: 0,
          tags: {
            transaction: "t05_add_to_cart",
            har_entry_id: "req_10",
            recording_started_at: "converted"
          }
        }
      };
      const res_2 = http.get(request_2.url, request_2.params);
      logExchange(request_2, res_2);
  
      check(res_2, { "status equals 302": (r) => r.status === 302 });
  
  
      const request_3 = {
        id: "req_11",
        transaction: "t05_add_to_cart",
        recordingStartedAt: new Date().toISOString(),
        method: "GET",
        url: `https://jpetstore.aspectran.com/cart/viewCart`,
        body: null,
        params: {
          headers: {
            "upgrade-insecure-requests": `1`,
            accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
            "sec-fetch-site": `same-origin`,
            "sec-fetch-mode": `navigate`,
            "sec-fetch-user": `?1`,
            "sec-fetch-dest": `document`,
            "sec-ch-ua": `"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"`,
            "sec-ch-ua-mobile": `?0`,
            "sec-ch-ua-platform": `"Windows"`,
            referer: `https://jpetstore.aspectran.com/products/${correlation_vars["correlation_0"]}`,
            "accept-encoding": `gzip, deflate, br, zstd`,
            "accept-language": `en-US,en;q=0.9`,
            priority: `u=0, i`,
            },
          cookies: {},
          redirects: 0,
          tags: {
            transaction: "t05_add_to_cart",
            har_entry_id: "req_11",
            recording_started_at: "converted"
          }
        }
      };
      const res_3 = http.get(request_3.url, request_3.params);
      logExchange(request_3, res_3);
  
      check(res_3, { "status equals 200": (r) => r.status === 200 });
      endTransaction('t05_add_to_cart');
    });

  group("t06_increase_quantity_to_2_and_proceed_to_checkout", function () {
      startTransaction('t06_increase_quantity_to_2_and_proceed_to_checkout');
  
      const request_1 = {
        id: "req_12",
        transaction: "t06_increase_quantity_to_2_and_proceed_to_checkout",
        recordingStartedAt: new Date().toISOString(),
        method: "POST",
        url: `https://jpetstore.aspectran.com/cart/updateCartQuantities`,
        body: JSON.parse(`{"EST-6":"2"}`),
        params: {
          headers: {
            "sec-ch-ua-platform": `"Windows"`,
            "hx-target": `jpetstore-content`,
            "hx-current-url": `https://jpetstore.aspectran.com/cart/viewCart`,
            "sec-ch-ua": `"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"`,
            "sec-ch-ua-mobile": `?0`,
            "hx-request": `true`,
            "content-type": `application/x-www-form-urlencoded`,
            accept: `*/*`,
            origin: `https://jpetstore.aspectran.com`,
            "sec-fetch-site": `same-origin`,
            "sec-fetch-mode": `cors`,
            "sec-fetch-dest": `empty`,
            referer: `https://jpetstore.aspectran.com/cart/viewCart`,
            "accept-encoding": `gzip, deflate, br, zstd`,
            "accept-language": `en-US,en;q=0.9`,
            priority: `u=1, i`,
            },
          cookies: {},
          redirects: 0,
          tags: {
            transaction: "t06_increase_quantity_to_2_and_proceed_to_checkout",
            har_entry_id: "req_12",
            recording_started_at: "converted"
          }
        }
      };
      const res_1 = http.post(request_1.url, request_1.body, request_1.params);
      logExchange(request_1, res_1);
  
      check(res_1, { "status equals 200": (r) => r.status === 200 });
  
  
      // const request_2 = {
      //   id: "req_13",
      //   transaction: "increase_quantity_to_2_and_proceed_to_checkout",
      //   recordingStartedAt: new Date().toISOString(),
      //   method: "GET",
      //   url: `https://jpetstore.aspectran.com/order/newOrderForm`,
      //   body: null,
      //   params: {
      //     headers: {
      //       accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
      //       "upgrade-insecure-requests": `1`,
      //       "sec-purpose": `prefetch`,
      //       "sec-speculation-tags": `null`,
      //       "sec-ch-ua": `"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"`,
      //       "sec-ch-ua-mobile": `?0`,
      //       "sec-ch-ua-platform": `"Windows"`,
      //       "sec-fetch-site": `none`,
      //       "sec-fetch-mode": `navigate`,
      //       "sec-fetch-dest": `document`,
      //       referer: `https://jpetstore.aspectran.com/cart/viewCart`,
      //       "accept-encoding": `gzip, deflate, br, zstd`,
      //       "accept-language": `en-US,en;q=0.9`,
      //       priority: `u=1, i`,
      //       },
      //     cookies: {},
      //     redirects: 0,
      //     tags: {
      //       transaction: "increase_quantity_to_2_and_proceed_to_checkout",
      //       har_entry_id: "req_13",
      //       recording_started_at: "converted"
      //     }
      //   }
      // };
      // const res_2 = http.get(request_2.url, request_2.params);
      // logExchange(request_2, res_2);
  
      // check(res_2, { "status equals 503": (r) => r.status === 503 });
  
  
      const request_3 = {
        id: "req_14",
        transaction: "t06_increase_quantity_to_2_and_proceed_to_checkout",
        recordingStartedAt: new Date().toISOString(),
        method: "GET",
        url: `https://jpetstore.aspectran.com/order/newOrderForm`,
        body: null,
        params: {
          headers: {
            "sec-ch-ua": `"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"`,
            "sec-ch-ua-mobile": `?0`,
            "sec-ch-ua-platform": `"Windows"`,
            "upgrade-insecure-requests": `1`,
            accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
            "sec-fetch-site": `same-origin`,
            "sec-fetch-mode": `navigate`,
            "sec-fetch-user": `?1`,
            "sec-fetch-dest": `document`,
            referer: `https://jpetstore.aspectran.com/cart/viewCart`,
            "accept-encoding": `gzip, deflate, br, zstd`,
            "accept-language": `en-US,en;q=0.9`,
            priority: `u=0, i`,
            },
          cookies: {},
          redirects: 0,
          tags: {
            transaction: "t06_increase_quantity_to_2_and_proceed_to_checkout",
            har_entry_id: "req_14",
            recording_started_at: "converted"
          }
        }
      };
      const res_3 = http.get(request_3.url, request_3.params);
      logExchange(request_3, res_3);
  
      check(res_3, { "status equals 200": (r) => r.status === 200 });
      endTransaction('t06_increase_quantity_to_2_and_proceed_to_checkout');
    });

  group("t07_click_continue", function () {
      startTransaction('t07_click_continue');
  
      const request_1 = {
        id: "req_15",
        transaction: "t07_click_continue",
        recordingStartedAt: new Date().toISOString(),
        method: "POST",
        url: `https://jpetstore.aspectran.com/order/newOrder`,
        body: JSON.parse(
          `{"paymentForm":"true","billingForm":"true","cardType":"Visa","creditCard":"999999999999999","expiryDate":"12/2019","billToFirstName":"UpdatedFirst","billToLastName":"UpdatedLast","billAddress1":"New Address 1","billAddress2":"New Address 2","billCity":"NewCity","billState":"NewState","billZip":"54321","billCountry":"Philippines"}`,
        ),
        params: {
          headers: {
            "cache-control": `max-age=0`,
            "sec-ch-ua": `"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"`,
            "sec-ch-ua-mobile": `?0`,
            "sec-ch-ua-platform": `"Windows"`,
            origin: `https://jpetstore.aspectran.com`,
            "content-type": `application/x-www-form-urlencoded`,
            "upgrade-insecure-requests": `1`,
            accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
            "sec-fetch-site": `same-origin`,
            "sec-fetch-mode": `navigate`,
            "sec-fetch-user": `?1`,
            "sec-fetch-dest": `document`,
            referer: `https://jpetstore.aspectran.com/order/newOrderForm`,
            "accept-encoding": `gzip, deflate, br, zstd`,
            "accept-language": `en-US,en;q=0.9`,
            priority: `u=0, i`,
            },
          cookies: {},
          redirects: 0,
          tags: {
            transaction: "t07_click_continue",
            har_entry_id: "req_15",
            recording_started_at: "converted"
          }
        }
      };
      const res_1 = http.post(request_1.url, request_1.body, request_1.params);
      logExchange(request_1, res_1);
  
      check(res_1, { "status equals 200": (r) => r.status === 200 });
      endTransaction('t07_click_continue');
    });

  group("t08_click_confirm", function () {
      startTransaction('t08_click_confirm');
  
      const request_1 = {
        id: "req_16",
        transaction: "t08_click_confirm",
        recordingStartedAt: new Date().toISOString(),
        method: "POST",
        url: `https://jpetstore.aspectran.com/order/submitOrder`,
        body: JSON.parse(`{"confirmed":"true"}`),
        params: {
          headers: {
            "cache-control": `max-age=0`,
            "sec-ch-ua": `"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"`,
            "sec-ch-ua-mobile": `?0`,
            "sec-ch-ua-platform": `"Windows"`,
            origin: `https://jpetstore.aspectran.com`,
            "content-type": `application/x-www-form-urlencoded`,
            "upgrade-insecure-requests": `1`,
            accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
            "sec-fetch-site": `same-origin`,
            "sec-fetch-mode": `navigate`,
            "sec-fetch-user": `?1`,
            "sec-fetch-dest": `document`,
            referer: `https://jpetstore.aspectran.com/order/newOrder`,
            "accept-encoding": `gzip, deflate, br, zstd`,
            "accept-language": `en-US,en;q=0.9`,
            priority: `u=0, i`,
            },
          cookies: {},
          redirects: 0,
          tags: {
            transaction: "t08_click_confirm",
            har_entry_id: "req_16",
            recording_started_at: "converted"
          }
        }
      };
      const res_1 = http.post(request_1.url, request_1.body, request_1.params);
      logExchange(request_1, res_1);
  
      check(res_1, { "status equals 302": (r) => r.status === 302 });
  
      regex = new RegExp("orderId=(.*?)&submitted");
      match = res_1.headers["Location"] ? res_1.headers["Location"].match(regex) : null;
      if (match) {
        correlation_vars["correlation_1"] = trackCorrelation("correlation_1", match[1], "body");
      }
  
  
      const request_2 = {
        id: "req_17",
        transaction: "t08_click_confirm",
        recordingStartedAt: new Date().toISOString(),
        method: "GET",
        url: `https://jpetstore.aspectran.com/order/viewOrder?orderId=${correlation_vars["correlation_1"]}&submitted=true`,
        body: null,
        params: {
          headers: {
            "cache-control": `max-age=0`,
            "upgrade-insecure-requests": `1`,
            accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
            "sec-fetch-site": `same-origin`,
            "sec-fetch-mode": `navigate`,
            "sec-fetch-user": `?1`,
            "sec-fetch-dest": `document`,
            "sec-ch-ua": `"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"`,
            "sec-ch-ua-mobile": `?0`,
            "sec-ch-ua-platform": `"Windows"`,
            referer: `https://jpetstore.aspectran.com/order/newOrder`,
            "accept-encoding": `gzip, deflate, br, zstd`,
            "accept-language": `en-US,en;q=0.9`,
            priority: `u=0, i`,
            },
          cookies: {},
          redirects: 0,
          tags: {
            transaction: "t08_click_confirm",
            har_entry_id: "req_17",
            recording_started_at: "converted"
          }
        }
      };
      const res_2 = http.get(request_2.url, request_2.params);
      logExchange(request_2, res_2);
  
      check(res_2, { "status equals 200": (r) => r.status === 200 });
      endTransaction('t08_click_confirm');
    });

}

export function endPhase(ctx) {
  let match;
  let regex;
  const correlation_vars = ctx.correlation;

  group("t09_logout", function () {
      startTransaction('t09_logout');
  
      // const request_1 = {
      //   id: "req_18",
      //   transaction: "logout",
      //   recordingStartedAt: new Date().toISOString(),
      //   method: "GET",
      //   url: `https://jpetstore.aspectran.com/account/signoff`,
      //   body: null,
      //   params: {
      //     headers: {
      //       accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
      //       "upgrade-insecure-requests": `1`,
      //       "sec-purpose": `prefetch`,
      //       "sec-speculation-tags": `null`,
      //       "sec-ch-ua": `"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"`,
      //       "sec-ch-ua-mobile": `?0`,
      //       "sec-ch-ua-platform": `"Windows"`,
      //       "sec-fetch-site": `none`,
      //       "sec-fetch-mode": `navigate`,
      //       "sec-fetch-dest": `document`,
      //       referer: `https://jpetstore.aspectran.com/order/viewOrder?orderId=${correlation_vars["correlation_1"]}&submitted=true`,
      //       "accept-encoding": `gzip, deflate, br, zstd`,
      //       "accept-language": `en-US,en;q=0.9`,
      //       priority: `u=1, i`,
      //       },
      //     cookies: {},
      //     redirects: 0,
      //     tags: {
      //       transaction: "logout",
      //       har_entry_id: "req_18",
      //       recording_started_at: "converted"
      //     }
      //   }
      // };
      // const res_1 = http.get(request_1.url, request_1.params);
      // logExchange(request_1, res_1);
  
      // check(res_1, { "status equals 503": (r) => r.status === 503 });
  
  
      const request_2 = {
        id: "req_19",
        transaction: "t09_logout",
        recordingStartedAt: new Date().toISOString(),
        method: "GET",
        url: `https://jpetstore.aspectran.com/account/signoff`,
        body: null,
        params: {
          headers: {
            "sec-ch-ua": `"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"`,
            "sec-ch-ua-mobile": `?0`,
            "sec-ch-ua-platform": `"Windows"`,
            "upgrade-insecure-requests": `1`,
            accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
            "sec-fetch-site": `same-origin`,
            "sec-fetch-mode": `navigate`,
            "sec-fetch-user": `?1`,
            "sec-fetch-dest": `document`,
            referer: `https://jpetstore.aspectran.com/order/viewOrder?orderId=${correlation_vars["correlation_1"]}&submitted=true`,
            "accept-encoding": `gzip, deflate, br, zstd`,
            "accept-language": `en-US,en;q=0.9`,
            priority: `u=0, i`,
            },
          cookies: {},
          redirects: 0,
          tags: {
            transaction: "t09_logout",
            har_entry_id: "req_19",
            recording_started_at: "converted"
          }
        }
      };
      const res_2 = http.get(request_2.url, request_2.params);
      logExchange(request_2, res_2);
  
      check(res_2, { "status equals 302": (r) => r.status === 302 });
  
  
      const request_3 = {
        id: "req_20",
        transaction: "t09_logout",
        recordingStartedAt: new Date().toISOString(),
        method: "GET",
        url: `https://jpetstore.aspectran.com/`,
        body: null,
        params: {
          headers: {
            "upgrade-insecure-requests": `1`,
            accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
            "sec-fetch-site": `same-origin`,
            "sec-fetch-mode": `navigate`,
            "sec-fetch-user": `?1`,
            "sec-fetch-dest": `document`,
            "sec-ch-ua": `"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"`,
            "sec-ch-ua-mobile": `?0`,
            "sec-ch-ua-platform": `"Windows"`,
            referer: `https://jpetstore.aspectran.com/order/viewOrder?orderId=${correlation_vars["correlation_1"]}&submitted=true`,
            "accept-encoding": `gzip, deflate, br, zstd`,
            "accept-language": `en-US,en;q=0.9`,
            priority: `u=0, i`,
            },
          cookies: {},
          redirects: 0,
          tags: {
            transaction: "t09_logout",
            har_entry_id: "req_20",
            recording_started_at: "converted"
          }
        }
      };
      const res_3 = http.get(request_3.url, request_3.params);
      logExchange(request_3, res_3);
  
      check(res_3, { "status equals 200": (r) => r.status === 200 });
      endTransaction('t09_logout');
    });

}

export default function () {
  runJourneyLifecycle(__journeyLifecycleStore, { initPhase, actionPhase, endPhase });
}

