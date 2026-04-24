import { Counter, Trend } from 'k6/metrics';

const txnStarts = {};
const txnTrends = {};
const txnCounters = {};

export function initTransactions(names) {
  names.forEach((name) => {
    if (!txnTrends[name]) {
      txnTrends[name] = new Trend(`${name}`);
      txnCounters[name] = new Counter(`${name}_count`);
    }
  });
}

export function startTransaction(name) {
  txnStarts[name] = Date.now();
  if (txnCounters[name]) {
    txnCounters[name].add(1);
  }
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
