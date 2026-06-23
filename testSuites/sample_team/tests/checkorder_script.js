import { transaction, k6Check } from '../../../dist/utils/transaction.js';
import { request } from '../../../dist/utils/request.js';
import { createJourneyLifecycleStore, runJourneyLifecycle, thinktime } from '../../../dist/utils/lifecycle.js';
import { logReplayExchange, trackCorrelation, trackParameter } from '../../../dist/utils/replayLogger.js';
import { clearCookies, getEnvContext } from '../../../dist/utils/session.js';

const env = getEnvContext('sample_team', { baseUrl: 'https://2.sonic.fdp.api.flipkart.com' });

const __journeyLifecycleStore = createJourneyLifecycleStore();

export function initPhase(ctx) {
  clearCookies();

}

export function actionPhase(ctx) {
  transaction('transaction_1', function () {
    const res1 = request('POST', `${env.baseUrl}/4/data/collector/business`, {
      headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9,en-IN;q=0.8,hi;q=0.7",
      "content-type": "application/json",
      Cookie: "T=TI174107490791800136808273877719502066058897333540684131945418300778; vh=794; vw=1528; dpr=1.25; ULSN=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjb29raWUiLCJhdWQiOiJmbGlwa2FydCIsImlzcyI6ImF1dGguZmxpcGthcnQuY29tIiwiY2xhaW1zIjp7ImdlbiI6IjEiLCJ1bmlxdWVJZCI6IlVVSTI2MDIwNTIxNTA1NzI2N1JCUVFCRzgiLCJma0RldiI6bnVsbH0sImV4cCI6MTc4NjA4ODQ1NywiaWF0IjoxNzcwMzA4NDU3LCJqdGkiOiI4M2Q3MWRiNi03ZDJiLTRkMzUtYWZiZi05NWU0ZDIxOTUyOTYifQ.4RjF1V6cp7j3RTtEAtyZTrn351clLmFscs-E1JKXlFQ; at=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjNhNzdlZTgxLTRjNWYtNGU5Ni04ZmRlLWM3YWMyYjVlOTA1NSJ9.eyJleHAiOjE3Nzk4NjI4ODAsImlhdCI6MTc3OTg2MTA4MCwiaXNzIjoia2V2bGFyIiwianRpIjoiMzFlN2M3YzgtZWZlZS00YjlhLThkYjAtZTBmOGRiZTljOTE5IiwidHlwZSI6IkFUIiwiZElkIjoiVEkxNzQxMDc0OTA3OTE4MDAxMzY4MDgyNzM4Nzc3MTk1MDIwNjYwNTg4OTczMzM1NDA2ODQxMzE5NDU0MTgzMDA3NzgiLCJiSWQiOiJWUUgyS0UiLCJrZXZJZCI6IlZJRUI1MTU0RDk2MEE1NDZBREExMENGOUYwN0RBNENEREYiLCJ0SWQiOiJtYXBpIiwiZWFJZCI6Ijk2cTBCTng0ZllsbmJuMmFDNmYtNS02SmJ4YlB0R2FnIiwidnMiOiJMSSIsInoiOiJIWUQiLCJtIjp0cnVlLCJnZW4iOjR9.bq7L8CgsoQ8hW1yilrr6VyVNMyzlBPdG627VWEx8N34; rt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjhlM2ZhMGE3LTJmZDMtNGNiMi05MWRjLTZlNTMxOGU1YTkxZiJ9.eyJleHAiOjE3OTU3NTg2ODAsImlhdCI6MTc3OTg2MTA4MCwiaXNzIjoia2V2bGFyIiwianRpIjoiZTBhNzU4ODUtNmRhOC00M2JmLTk0YzgtOTliZDI3MGQ0MGFhIiwidHlwZSI6IlJUIiwiZElkIjoiVEkxNzQxMDc0OTA3OTE4MDAxMzY4MDgyNzM4Nzc3MTk1MDIwNjYwNTg4OTczMzM1NDA2ODQxMzE5NDU0MTgzMDA3NzgiLCJiSWQiOiJWUUgyS0UiLCJrZXZJZCI6IlZJRUI1MTU0RDk2MEE1NDZBREExMENGOUYwN0RBNENEREYiLCJ0SWQiOiJtYXBpIiwibSI6eyJ0eXBlIjoibiJ9LCJ2IjoiMDg5V0dBIn0.crBTspD5DjscZoz7mAEA2BZnwzwbAWcziwAbQFc5eAo; Network-Type=4g; vd=VIEB5154D960A546ADA10CF9F07DA4CDDF-1770308439198-3.1779861082.1779861082.156903382; K-ACTION=null; AMCVS_17EB401053DAF4840A490D4C%^40AdobeOrg=1; AMCV_17EB401053DAF4840A490D4C%^40AdobeOrg=-227196251%^7CMCIDTS%^7C20601%^7CMCMID%^7C32048066363088304853165468909901698131%^7CMCAAMLH-1780465892%^7C12%^7CMCAAMB-1780465892%^7C6G1ynYcLPuiQxYZrsz_pkqfLG9yMXBpb2zX5dvJdYQJzPXImdj0y%^7CMCOPTOUT-1779868292s%^7CNONE%^7CMCAID%^7CNONE; ud=8.6uH41AnRCPNLlFt7n-PoRh3IFJDejJL7sEsktCkbY6HnFyEwxOZ_tmmmoidgUMtZr9G3d3TJcFMy8bwekERBoR-l93Hy-AJBSb8eJtn73xDV0y1nnDp41uFPzaTYS6m_9rGAFM706Wp9LfkF2_PLPErPNWRgcpRov9C5dQM0qMQCA1njEZVP9N_Cx8-1lA0nLbkUCpOzTWH1BL3pmvPO-xculaz4SSMteWuPAh1DmCWqM6qib9iK17AaehoJzrn4OLn-H8GDi6kDXbVr8JTFXAC5YzH2t9c4dFr1guuQk3OzpoMkaq2DIUWonuOdiiMHRygirfzmQkPudZOCPJJYef9lGA4CE6MyjFeULaXAroQ6FxtewrEBIEMrN5DT6iV6Y1iL4stTeTncrx4fHLO6DcyyfRcfNTcxOjPmqGWxQKeaHtQY1WSmpvTeAmtkCGWF3HZm4DMoyPBvELkKVh-4YYSJ6Y37nAahB7PUS6qSc5UpQWd7ICAwilxsjK6Nae5GNxscaR0Qg_42oTkDSJun0CtTMkdxzUJR925LWnlgFcxWDSzNp_jIcBPGvkrSMNuE8oJOTKUQ6uOQV3SkVFq-AQATsGLq1bk9mZMYOFLyYDHV47dDnSTeZTaMhFUnXMkFABPP0ZMl0XuWFy3-OY6Z7LDSVHgx1nZ10FLy2gPhPGsLfV4m10kuxLMmtytX2YRZUDiUZKGamTC4apaA0evevhTQ0by-BnXIjKpCMtRTg3RGZz7Y-uULpCqO1TsNQO67oKNNDoP34eCf7KoZEFPcJVvfHWOGP2-Wb07bTRkBfNM; S=d1t11Rz8ddz9TPz8ZP3o/Pz8bPxWRWrEQPdte//KEN/tqInIlu6a1mMkAoE49FSnDDd44mY/RQUwRo+fGhFN8DwFN+Q==; SN=VIEB5154D960A546ADA10CF9F07DA4CDDF.TOK22388E90F7EF49F5939D30966CDB9C98.1779861092782.LI",
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
      "x-user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0 FKUA/website/42/website/Desktop",
    },
      body: "{\"nc\":{\"pn\":\"MyOrders\",\"pt\":\"SelfServe\",\"mpid\":\"FLIPKART\",\"iid\":\"ke7vq3te740000001779861092866\",\"fm\":\"organic\",\"meta\":{\"loc\":{\"ipInfo\":{\"country\":\"UNKNOWN\",\"state\":\"Flipkart\",\"city\":\"Flipkart\",\"ip\":\"10.54.147.101\"},\"addId\":\"CNTCT917FF8FC0172405F9B30C9B5E\"},\"pc\":\"122001\"}},\"e\":^[{\"en\":\"OAE\",\"_ev\":\"4.1\",\"iid\":\"e94fnk23ts0000001779861106301\",\"p\":0,\"at\":\"OrderClick\",\"os\":\"OS_2\",\"opd\":1779860946748,\"dd\":1779989400000,\"oi\":\"OD437671567847132100\",\"imi\":^[{\"fsn\":\"ACCGBFXHRGZZGG4J\",\"quantity\":1,\"cost\":2701,\"category\":\"ComputerAccessory\",\"vertical\":\"Mouse\",\"brand\":\"Logitech\"}^],\"t\":1779861106301}^]}",
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
