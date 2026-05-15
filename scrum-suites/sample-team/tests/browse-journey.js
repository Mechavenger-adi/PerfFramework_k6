import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { initTransactions, startTransaction, endTransaction } from '../../../dist/utils/transaction.js';
import { createJourneyLifecycleStore, runJourneyLifecycle, getFrameworkThinkTime } from '../../../dist/utils/lifecycle.js';
import { logExchange } from '../../../dist/utils/replayLogger.js';
import { clearCookies, registerFrameworkEnvironmentUrls, resolveFrameworkUrl } from '../../../dist/utils/session.js';

initTransactions(['Homepage', 'Product_List']);
registerFrameworkEnvironmentUrls(['https://your-dev-environment.com/']);
const lifecycleStore = createJourneyLifecycleStore();

export function initPhase(ctx) {
  clearCookies();
}

export function actionPhase(ctx) {
  group('Homepage', function () {
    startTransaction('Homepage');
    const res = http.get(resolveFrameworkUrl('/', { fallbackBaseUrl: 'https://your-dev-environment.com/' }));
    check(res, { 'Homepage: status 2xx': (r) => r.status >= 200 && r.status < 300 });
    endTransaction('Homepage');
  });

  sleep(getFrameworkThinkTime());

  group('Product List', function () {
    startTransaction('Product_List');
    const res = http.get(resolveFrameworkUrl('/products', { fallbackBaseUrl: 'https://your-dev-environment.com/' }));
    check(res, { 'ProductList: status 2xx': (r) => r.status >= 200 && r.status < 300 });
    endTransaction('Product_List');
  });

  sleep(getFrameworkThinkTime());
}

export function endPhase(ctx) {
}

export default function () {
  runJourneyLifecycle(lifecycleStore, { initPhase, actionPhase, endPhase });
}
