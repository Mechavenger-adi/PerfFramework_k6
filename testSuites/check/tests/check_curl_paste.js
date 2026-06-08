import { transaction, k6Check } from '../../../dist/utils/transaction.js';
import { request } from '../../../dist/utils/request.js';
import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';
import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';
import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';

const env = getEnvContext('check', { baseUrl: 'https://2.sonic.fdp.api.flipkart.com' });

const __journeyLifecycleStore = createJourneyLifecycleStore();

export function initPhase(ctx) {
  clearCookies();

}

export function actionPhase(ctx) {
  transaction('transaction_1', function () {
    const res1 = request('POST', `${env.baseUrl}/4/data/collector/business`, {
      name: "POST_business_1",
      headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9,en-IN;q=0.8,hi;q=0.7",
      "content-type": "application/json",
      Cookie: "T=TI174107490791800136808273877719502066058897333540684131945418300778; vh=794; vw=1528; dpr=1.25; ULSN=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjb29raWUiLCJhdWQiOiJmbGlwa2FydCIsImlzcyI6ImF1dGguZmxpcGthcnQuY29tIiwiY2xhaW1zIjp7ImdlbiI6IjEiLCJ1bmlxdWVJZCI6IlVVSTI2MDIwNTIxNTA1NzI2N1JCUVFCRzgiLCJma0RldiI6bnVsbH0sImV4cCI6MTc4NjA4ODQ1NywiaWF0IjoxNzcwMzA4NDU3LCJqdGkiOiI4M2Q3MWRiNi03ZDJiLTRkMzUtYWZiZi05NWU0ZDIxOTUyOTYifQ.4RjF1V6cp7j3RTtEAtyZTrn351clLmFscs-E1JKXlFQ; AMCV_17EB401053DAF4840A490D4C%^40AdobeOrg=-227196251%^7CMCIDTS%^7C20601%^7CMCMID%^7C32048066363088304853165468909901698131%^7CMCAAMLH-1780465892%^7C12%^7CMCAAMB-1780465892%^7C6G1ynYcLPuiQxYZrsz_pkqfLG9yMXBpb2zX5dvJdYQJzPXImdj0y%^7CMCOPTOUT-1779868292s%^7CNONE%^7CMCAID%^7CNONE; _gcl_au=1.1.198045181.1779868161; at=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjNhNzdlZTgxLTRjNWYtNGU5Ni04ZmRlLWM3YWMyYjVlOTA1NSJ9.eyJleHAiOjE3ODAzNzc4ODIsImlhdCI6MTc4MDM3NjA4MiwiaXNzIjoia2V2bGFyIiwianRpIjoiNjE3MDI5YTgtZmM2ZC00YmM2LWFlZTUtNzMxODRjMzRiMjFmIiwidHlwZSI6IkFUIiwiZElkIjoiVEkxNzQxMDc0OTA3OTE4MDAxMzY4MDgyNzM4Nzc3MTk1MDIwNjYwNTg4OTczMzM1NDA2ODQxMzE5NDU0MTgzMDA3NzgiLCJiSWQiOiJJRjVZSUkiLCJrZXZJZCI6IlZJRUI1MTU0RDk2MEE1NDZBREExMENGOUYwN0RBNENEREYiLCJ0SWQiOiJtYXBpIiwiZWFJZCI6Ijk2cTBCTng0ZllsbmJuMmFDNmYtNS02SmJ4YlB0R2FnIiwidnMiOiJMSSIsInoiOiJIWUQiLCJtIjp0cnVlLCJnZW4iOjR9.jwTNxNwuhrxn2PNFXnbmo7nPuTmC_oPu4SMN9UqY7I8; rt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjNhNzdlZTgxLTRjNWYtNGU5Ni04ZmRlLWM3YWMyYjVlOTA1NSJ9.eyJleHAiOjE3OTYxODcyODIsImlhdCI6MTc4MDM3NjA4MiwiaXNzIjoia2V2bGFyIiwianRpIjoiN2I0ZjQ2MDAtYmYxZi00ZmM3LThkY2EtYmM2Zjc0N2MyOTY0IiwidHlwZSI6IlJUIiwiZElkIjoiVEkxNzQxMDc0OTA3OTE4MDAxMzY4MDgyNzM4Nzc3MTk1MDIwNjYwNTg4OTczMzM1NDA2ODQxMzE5NDU0MTgzMDA3NzgiLCJiSWQiOiJJRjVZSUkiLCJrZXZJZCI6IlZJRUI1MTU0RDk2MEE1NDZBREExMENGOUYwN0RBNENEREYiLCJ0SWQiOiJtYXBpIiwibSI6eyJ0eXBlIjoibiJ9LCJ2IjoiRFVHVjJYIn0.fsIFwvRv7gC0JMTtqFJKuIPnghfPYBEDD2zZHsi5a_o; ak_bmsc=1D5357321F4F1EAE32EA67365D6776D3~000000000000000000000000000000~YAAQVmnDF5JqAXOeAQAAGRevhgCaSv6B83ggwrRfrQ15foZga21xjPzFuEdpLjKEo9BcG/O67QTd54zT21EHhCYQGaBq2NOucUUuvfCKKxixxSgPFC11u/UI2szO1ExWGWRy27/ynqBrciMWLDCLeLyGTsT6rRcRgOeFnrz2OK4Ltqv9GsHhQBzWhrQSdRtf4d+vDIMxK2DGNtqk5PzYrN9zjpMhsjX+axZjf5o2rel24hvSsnQFzOeT4M/2OSJWVoGE3OTEn65C37tl1gH8k9GvgLc1nsTaZvlB5OEhLXkBJVtgTTp69WRnptuQwaKY/HIPd8KUnH+DED4YxW8NMUt+Gcm7bB81jE1xwVmgP2V0LSGOdgLXPx9iz8kjlAJQcHCteotYbpadwyINdJw8Ug==; Network-Type=4g; vd=VIEB5154D960A546ADA10CF9F07DA4CDDF-1770308439198-6.1780376086.1780376086.156825552; ud=7.FKluYsbjMSc0eLZOxg8Qno6QXJ93VzgOjkJobipM5KrExcK6xT6On4kEvpJ3ADlvLBxUp01CeJDKxxi_ZyzrfWaDsI4NCtZRPis5RWKMr84DtiRujoQozk8rwcnc_5G4gsvOQq1I0I9GsLUP6MxQd69cshSMQzIOLHvmKnbQHKFNyGPcZBOr6TybiwlDCk7scNc5uW1YixL7Djied7AAaalqYejs3pb6eyXU79Mx8F3Qaio13cuLB8X0DhIsGpBlJ8qLZrPJvaoxr32X1pU2EmzNo-lI_ia7p1zlj6wBEeWRwf7ao6YZvaIQsfTT49QHLxB1NqqVsMr0ALjb4nQUCz2WgVIuQemBGkNaSrwqN_24KCd9yeAWJ8KYCC7WH7fyUVxQu234DDIhMoMYFnxAdNHUppKk9_mU6g2pJxKMEwykG6ljwd80QTN25Q7XWhIgU0UveiVdT5pyp5m7upPwDyAW6wZo64ZnwyLUHilv5xteka1xk2O98ZLk_BHfJjjCmnMx9gUZCHonFENV4oVq_AinL8EDNAOrJZpO3AAavAbaxKp4chAk01ilA5QUdjBVU9BpaO_lo7WWmBkaT6vXS3EZmqTTQ3kf5hOg-abiQOSKRqASqT57CmzsUyhbxkKef1LqWCSBG04Wq4ASIEBOGRvSGAnNuKttTa1wm6rfINeXaq3ktmTPeujeLGrLePsoJZlQJyoFTkVJFtrosuD9zAy6BocKOvn9bvaYRBxuk-AsRQ2aeyBeTu_gtylOBzJEqyYI8uqYyNcvBTPtPFk6BsDn5ikl7-9UavSMkLEAG7M; S=d1t11M2w/Pz8lJT8LPz8JQBsVEfz0RgbXhy2xi7iO9ZHRJ+mMtpbZnR+8IQ4E7u4bqPMq9QDSYiy3LcfVy+6dmKzwMw==; SN=VIEB5154D960A546ADA10CF9F07DA4CDDF.TOK9EE82FD29DF945EBA35F674AE0F4FA51.1780376086753.LI",
      origin: "https://www.flipkart.com",
      priority: "u=1, i",
      referer: "https://www.flipkart.com/",
      "sec-ch-ua": "\"Chromium\";v=\"148\", \"Microsoft Edge\";v=\"148\", \"Not/A)Brand\";v=\"99\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0",
      "x-user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0 FKUA/website/42/website/Desktop channelType/brw",
    },
      body: "{\"nc\":{\"iid\":\"om8swy1gjk000000\",\"fm\":\"personalisedRecommendation/p2p-same\",\"mpid\":\"FLIPKART\",\"pn\":\"None\",\"pt\":\"None\",\"ppt\":\"\",\"ppn\":\"\",\"meta\":{\"polygonStores\":{\"numOfStores\":1,\"polygonStoreDetailsString\":\"^[{\\\"polygonType\\\":\\\"PRIMARY\\\",\\\"slaInSec\\\":532,\\\"storeServiceability\\\":\\\"true\\\",\\\"storeId\\\":\\\"gur_118_wh_hl_01\\\"}^]\"},\"slaInSec\":532,\"storeId\":\"gur_118_wh_hl_01\",\"hlIds\":\"gur_118_wh_hl_01\",\"sMode\":\"BLUE\",\"loc\":{\"ipInfo\":{\"country\":\"India\",\"state\":\"National Capital Territory of Delhi\",\"city\":\"New Delhi\",\"ip\":\"110.235.232.103\"},\"addId\":\"CNTCT917FF8FC0172405F9B30C9B5E\"},\"pc\":\"122001\"}},\"e\":^[{\"t\":1780376110791,\"en\":\"DCC\",\"_ev\":\"1.11\",\"p\":1,\"wvt\":\"ATLAS_PMU_V5_DOUBLE_ROW_SCROLLABLE_RECTANGLE\",\"wtp\":\"reco\",\"wtl\":\"Suggested For You\",\"mid\":\"personalisedRecommendation/p2p-same\",\"wc\":\"WHITELISTED\",\"ai\":{\"category\":\"MensCnFFootwear\",\"vertical\":\"CnFSneakers\",\"superCategory\":\"MensCnFFootwear\",\"subCategory\":\"CasualShoe\",\"marketPlace\":\"FLIPKART\"},\"iid\":\"R:s;p:SHOH5Y3M3GJQCKDR;pt:hp;uid:a888c3f6-79f9-4f69-a5a3-f63d7e69e217;.SHOHA5ZUDRV8HP5Z\",\"biid\":\"60ec0de7-a340-41fd-a564-7512e68a11e0\",\"ct\":\"productCardV2\",\"wps\":3,\"pid\":\"SHOHA5ZUDRV8HP5Z\",\"piid\":\"R:s;p:SHOH5Y3M3GJQCKDR;pt:hp;uid:a888c3f6-79f9-4f69-a5a3-f63d7e69e217;\",\"pbiid\":\"60ec0de7-a340-41fd-a564-7512e68a11e0\"}^]}",
      replay: {
        id: "req_1",
        recordingStartedAt: "1970-01-01T00:00:00.000Z",
      },
    });
    k6Check(res1, {
      "transaction_1 - status is 200": (r) => r.status === 200,
    });
  });

}

export function endPhase(ctx) {
}

export default function () {
  runJourneyLifecycle(__journeyLifecycleStore, { initPhase, actionPhase, endPhase });
}
