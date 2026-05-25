import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { initTransactions, startTransaction, endTransaction } from '../../../dist/utils/transaction.js';
import { createJourneyLifecycleStore, runJourneyLifecycle, getFrameworkThinkTime } from '../../../dist/utils/lifecycle.js';
import { logExchange } from '../../../dist/utils/replayLogger.js';
import { clearCookies, registerFrameworkEnvironmentUrls, resolveFrameworkUrl } from '../../../dist/utils/session.js';

initTransactions(['Login', 'Add_To_Cart', 'Checkout']);
registerFrameworkEnvironmentUrls(['https://your-dev-environment.com/']);
const lifecycleStore = createJourneyLifecycleStore();

export function initPhase(ctx) {
  clearCookies();
  group('Login', function () {
    startTransaction('Login');
    const res = http.post(resolveFrameworkUrl('/auth/login', { fallbackBaseUrl: 'https://your-dev-environment.com/' }), JSON.stringify({
      // TODO: parameterize with p_username and p_password from data file
      username: 'testuser001',
      password: 'P@ssw0rd1',
    }), { headers: { 'Content-Type': 'application/json' } });
    check(res, { 'Login: status 200': (r) => r.status === 200 });
    // TODO: Correlate auth token -> c_authToken
    endTransaction('Login');
  });
}

export function actionPhase(ctx) {
  group('Add To Cart', function () {
    startTransaction('Add_To_Cart');
    const res = http.post(resolveFrameworkUrl('/cart/add', { fallbackBaseUrl: 'https://your-dev-environment.com/' }), JSON.stringify({
      productId: 'PROD-001',
      quantity: 1,
    }), { headers: { 'Content-Type': 'application/json' } });
    check(res, { 'AddToCart: status 2xx': (r) => r.status >= 200 && r.status < 300 });
    endTransaction('Add_To_Cart');
  });

  sleep(getFrameworkThinkTime());

  group('Checkout', function () {
    startTransaction('Checkout');
    const res = http.post(resolveFrameworkUrl('/checkout', { fallbackBaseUrl: 'https://your-dev-environment.com/' }), '{}', {
      headers: { 'Content-Type': 'application/json' },
    });
    check(res, { 'Checkout: status 2xx': (r) => r.status >= 200 && r.status < 300 });
    endTransaction('Checkout');
  });

  sleep(getFrameworkThinkTime());
}

export function endPhase(ctx) {
}

export default function () {
  runJourneyLifecycle(lifecycleStore, { initPhase, actionPhase, endPhase });
}
