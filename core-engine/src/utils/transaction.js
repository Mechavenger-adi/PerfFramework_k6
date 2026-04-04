import { Trend } from 'k6/metrics';

const txnStarts = {};
const txnTrends = {};

export function initTransactions(names) {
  names.forEach((name) => {
    if (!txnTrends[name]) {
      txnTrends[name] = new Trend(`${name}`);
    }
  });
}

export function startTransaction(name) {
  txnStarts[name] = Date.now();
}

export function endTransaction(name) {
  const startTime = txnStarts[name];
  if (!startTime) {
    console.error(`Transaction "${name}" was not started`);
    return;
  }

  const duration = Date.now() - startTime;
  if (txnTrends[name]) {
    txnTrends[name].add(duration);
  } else {
    console.error(`Transaction "${name}" trend was not initialized in init context`);
  }

  delete txnStarts[name];
}
