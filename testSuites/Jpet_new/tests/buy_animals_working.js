import { sleep } from 'k6';
import { transaction, k6Check } from '../../../dist/utils/transaction.js';
import { request } from '../../../dist/utils/request.js';
import { trackCorrelation, trackParameter, trackDataRow } from '../../../dist/utils/replayLogger.js';
import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';
import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';
import execution from "k6/execution";
import csv from "k6/experimental/csv";
import fs from "k6/experimental/fs";
const FILES = {
  userdetails: await csv.parse(await fs.open("../Data/userdetails.csv"), {
    asObjects: true,
  }),

  pet: await csv.parse(await fs.open("../Data/pet.csv"), { asObjects: true }),
};

function getUniqueItem(array) {
  return array[execution.scenario.iterationInTest % array.length];
}let match;
let regex;

const __journeyLifecycleStore = createJourneyLifecycleStore();

export function initPhase(ctx) {
  clearCookies();

  const correlation_vars = ctx.correlation;
  trackDataRow("userdetails", getUniqueItem(FILES["userdetails"]));
  trackDataRow("pet", getUniqueItem(FILES["pet"]));
}

export function actionPhase(ctx) {
  const correlation_vars = ctx.correlation;

  transaction('t01_launch', function() {
  
      const res_1 = request('GET', `${env.baseUrl}/`, {
        name: "GET_root_1",
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
        replay: { id: "req_1", recordingStartedAt: 'converted' },
      });
  
      k6Check(res_1, { "status equals 200": (r) => r.status === 200 });
    });

  thinktime(1);

  transaction('t02_login', function() {
  
      const res_1 = request('GET', `${env.baseUrl}/account/signonForm`, {
        name: "GET_signonForm_1",
        headers: {
          accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
          "upgrade-insecure-requests": `1`,
          "sec-purpose": `prefetch`,
          "sec-speculation-tags": `null`,
          "sec-ch-ua": `"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"`,
          "sec-ch-ua-mobile": `?0`,
          "sec-ch-ua-platform": `"Windows"`,
          "sec-fetch-site": `none`,
          "sec-fetch-mode": `navigate`,
          "sec-fetch-dest": `document`,
          referer: `https://jpetstore.aspectran.com/`,
          "accept-encoding": `gzip, deflate, br, zstd`,
          "accept-language": `en-US,en;q=0.9`,
          priority: `u=1, i`,
          },
        replay: { id: "req_2", recordingStartedAt: 'converted' },
      });
  
      k6Check(res_1, { "status equals 503": (r) => r.status === 503 });
  
  
      const res_2 = request('GET', `${env.baseUrl}/account/signonForm`, {
        name: "GET_signonForm_2",
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
        replay: { id: "req_3", recordingStartedAt: 'converted' },
      });
  
      k6Check(res_2, { "status equals 200": (r) => r.status === 200 });
  
  
      const res_3 = request('POST', `${env.baseUrl}/account/signon`, {
        name: "POST_signon_1",
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
        body: JSON.parse(
          `{"referer":"","username":"${getUniqueItem(FILES["userdetails"])["p_username"]}","password":"${getUniqueItem(FILES["userdetails"])["p_password"]}"}`,
        ),
        replay: { id: "req_4", recordingStartedAt: 'converted' },
      });
  
      k6Check(res_3, { "status equals 302": (r) => r.status === 302 });
  
  
      const res_4 = request('GET', `${env.baseUrl}/`, {
        name: "GET_root_2",
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
        replay: { id: "req_5", recordingStartedAt: 'converted' },
      });
  
      k6Check(res_4, { "status equals 200": (r) => r.status === 200 });
    });

  thinktime(1);

  transaction('search_animal', function() {
  
      const res_1 = request('GET', `${env.baseUrl}/catalog/searchProducts?keyword=${getUniqueItem(FILES["pet"])["p_pet"]}`, {
        name: "GET_searchProducts_1",
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
        replay: { id: "req_6", recordingStartedAt: 'converted' },
      });
  
      k6Check(res_1, { "status equals 200": (r) => r.status === 200 });
  
      regex = new RegExp('href="/products/[^"]+">(.*?)</a></strong>');
      match = res_1.body.match(regex);
      if (match) {
        correlation_vars["correlation_0"] = trackCorrelation("correlation_0", trackCorrelation("correlation_0", match[1], "body"), "body");
      }
    });

  thinktime(1);

  transaction('select_product', function() {
  
      const res_1 = request('GET', `${env.baseUrl}/products/${correlation_vars["correlation_0"]}`, {
        name: "GET_correlation_vars_correlat_1",
        headers: {
          accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
          "upgrade-insecure-requests": `1`,
          "sec-purpose": `prefetch`,
          "sec-speculation-tags": `null`,
          "sec-ch-ua": `"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"`,
          "sec-ch-ua-mobile": `?0`,
          "sec-ch-ua-platform": `"Windows"`,
          "sec-fetch-site": `none`,
          "sec-fetch-mode": `navigate`,
          "sec-fetch-dest": `document`,
          referer: `https://jpetstore.aspectran.com/catalog/searchProducts?keyword=dog`,
          "accept-encoding": `gzip, deflate, br, zstd`,
          "accept-language": `en-US,en;q=0.9`,
          priority: `u=1, i`,
          },
        replay: { id: "req_7", recordingStartedAt: 'converted' },
      });
  
      k6Check(res_1, { "status equals 503": (r) => r.status === 503 });
  
  
      const res_2 = request('GET', `${env.baseUrl}/products/${correlation_vars["correlation_0"]}`, {
        name: "GET_correlation_vars_correlat_2",
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
        replay: { id: "req_8", recordingStartedAt: 'converted' },
      });
  
      k6Check(res_2, { "status equals 200": (r) => r.status === 200 });
    });

  thinktime(1);

  transaction('add_to_cart', function() {
  
      const res_1 = request('GET', `${env.baseUrl}/cart/addItemToCart?itemId=EST-6`, {
        name: "GET_addItemToCart_1",
        headers: {
          accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
          "upgrade-insecure-requests": `1`,
          "sec-purpose": `prefetch`,
          "sec-speculation-tags": `null`,
          "sec-ch-ua": `"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"`,
          "sec-ch-ua-mobile": `?0`,
          "sec-ch-ua-platform": `"Windows"`,
          "sec-fetch-site": `none`,
          "sec-fetch-mode": `navigate`,
          "sec-fetch-dest": `document`,
          referer: `https://jpetstore.aspectran.com/products/${correlation_vars["correlation_0"]}`,
          "accept-encoding": `gzip, deflate, br, zstd`,
          "accept-language": `en-US,en;q=0.9`,
          priority: `u=1, i`,
          },
        replay: { id: "req_9", recordingStartedAt: 'converted' },
      });
  
      k6Check(res_1, { "status equals 503": (r) => r.status === 503 });
  
  
      const res_2 = request('GET', `${env.baseUrl}/cart/addItemToCart?itemId=EST-6`, {
        name: "GET_addItemToCart_2",
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
        replay: { id: "req_10", recordingStartedAt: 'converted' },
      });
  
      k6Check(res_2, { "status equals 302": (r) => r.status === 302 });
  
  
      const res_3 = request('GET', `${env.baseUrl}/cart/viewCart`, {
        name: "GET_viewCart_1",
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
        replay: { id: "req_11", recordingStartedAt: 'converted' },
      });
  
      k6Check(res_3, { "status equals 200": (r) => r.status === 200 });
    });

  thinktime(1);

  transaction('increase_quantity_to_2_and_proceed_to_checkout', function() {
  
      const res_1 = request('POST', `${env.baseUrl}/cart/updateCartQuantities`, {
        name: "POST_updateCartQuantities_1",
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
        body: JSON.parse(`{"EST-6":"2"}`),
        replay: { id: "req_12", recordingStartedAt: 'converted' },
      });
  
      k6Check(res_1, { "status equals 200": (r) => r.status === 200 });
  
  
      const res_2 = request('GET', `${env.baseUrl}/order/newOrderForm`, {
        name: "GET_newOrderForm_1",
        headers: {
          accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
          "upgrade-insecure-requests": `1`,
          "sec-purpose": `prefetch`,
          "sec-speculation-tags": `null`,
          "sec-ch-ua": `"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"`,
          "sec-ch-ua-mobile": `?0`,
          "sec-ch-ua-platform": `"Windows"`,
          "sec-fetch-site": `none`,
          "sec-fetch-mode": `navigate`,
          "sec-fetch-dest": `document`,
          referer: `https://jpetstore.aspectran.com/cart/viewCart`,
          "accept-encoding": `gzip, deflate, br, zstd`,
          "accept-language": `en-US,en;q=0.9`,
          priority: `u=1, i`,
          },
        replay: { id: "req_13", recordingStartedAt: 'converted' },
      });
  
      k6Check(res_2, { "status equals 503": (r) => r.status === 503 });
  
  
      const res_3 = request('GET', `${env.baseUrl}/order/newOrderForm`, {
        name: "GET_newOrderForm_2",
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
        replay: { id: "req_14", recordingStartedAt: 'converted' },
      });
  
      k6Check(res_3, { "status equals 200": (r) => r.status === 200 });
    });

  thinktime(1);

  transaction('click_continue', function() {
  
      const res_1 = request('POST', `${env.baseUrl}/order/newOrder`, {
        name: "POST_newOrder_1",
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
        body: JSON.parse(
          `{"paymentForm":"true","billingForm":"true","cardType":"Visa","creditCard":"999999999999999","expiryDate":"12/2019","billToFirstName":"UpdatedFirst","billToLastName":"UpdatedLast","billAddress1":"New Address 1","billAddress2":"New Address 2","billCity":"NewCity","billState":"NewState","billZip":"54321","billCountry":"Philippines"}`,
        ),
        replay: { id: "req_15", recordingStartedAt: 'converted' },
      });
  
      k6Check(res_1, { "status equals 200": (r) => r.status === 200 });
    });

  thinktime(1);

  transaction('click_confirm', function() {
  
      const res_1 = request('POST', `${env.baseUrl}/order/submitOrder`, {
        name: "POST_submitOrder_1",
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
        body: JSON.parse(`{"confirmed":"true"}`),
        replay: { id: "req_16", recordingStartedAt: 'converted' },
      });
  
      k6Check(res_1, { "status equals 302": (r) => r.status === 302 });
  
      regex = new RegExp("orderId=(.*?)&submitted");
      match = res_1.headers["Location"].match(regex);
      if (match) {
        correlation_vars["correlation_1"] = trackCorrelation("correlation_1", trackCorrelation("correlation_1", match[1], "body"), "body");
      }
  
  
      const res_2 = request('GET', `${env.baseUrl}/order/viewOrder?orderId=${correlation_vars["correlation_1"]}&submitted=true`, {
        name: "GET_viewOrder_1",
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
        replay: { id: "req_17", recordingStartedAt: 'converted' },
      });
  
      k6Check(res_2, { "status equals 200": (r) => r.status === 200 });
    });

  thinktime(1);

  transaction('logout', function() {
  
      const res_1 = request('GET', `${env.baseUrl}/account/signoff`, {
        name: "GET_signoff_1",
        headers: {
          accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7`,
          "upgrade-insecure-requests": `1`,
          "sec-purpose": `prefetch`,
          "sec-speculation-tags": `null`,
          "sec-ch-ua": `"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"`,
          "sec-ch-ua-mobile": `?0`,
          "sec-ch-ua-platform": `"Windows"`,
          "sec-fetch-site": `none`,
          "sec-fetch-mode": `navigate`,
          "sec-fetch-dest": `document`,
          referer: `https://jpetstore.aspectran.com/order/viewOrder?orderId=${correlation_vars["correlation_1"]}&submitted=true`,
          "accept-encoding": `gzip, deflate, br, zstd`,
          "accept-language": `en-US,en;q=0.9`,
          priority: `u=1, i`,
          },
        replay: { id: "req_18", recordingStartedAt: 'converted' },
      });
  
      k6Check(res_1, { "status equals 503": (r) => r.status === 503 });
  
  
      const res_2 = request('GET', `${env.baseUrl}/account/signoff`, {
        name: "GET_signoff_2",
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
        replay: { id: "req_19", recordingStartedAt: 'converted' },
      });
  
      k6Check(res_2, { "status equals 302": (r) => r.status === 302 });
  
  
      const res_3 = request('GET', `${env.baseUrl}/`, {
        name: "GET_root_3",
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
        replay: { id: "req_20", recordingStartedAt: 'converted' },
      });
  
      k6Check(res_3, { "status equals 200": (r) => r.status === 200 });
    });

  thinktime(1);

}

export function endPhase(ctx) {
  const correlation_vars = ctx.correlation;
}

const env = getEnvContext('Jpet_new', { baseUrl: 'https://jpetstore.aspectran.com/' });

const __journeyLifecycleStore = createJourneyLifecycleStore();

export function initPhase(ctx) {
  clearCookies();

  const correlation_vars = ctx.correlation;
  runJourneyLifecycle(__journeyLifecycleStore, { initPhase, actionPhase, endPhase });
}

export function actionPhase(ctx) {
  const correlation_vars = ctx.correlation;
  runJourneyLifecycle(__journeyLifecycleStore, { initPhase, actionPhase, endPhase });
}

export function endPhase(ctx) {
  const correlation_vars = ctx.correlation;
}

export default function () {
  runJourneyLifecycle(__journeyLifecycleStore, { initPhase, actionPhase, endPhase });
}


