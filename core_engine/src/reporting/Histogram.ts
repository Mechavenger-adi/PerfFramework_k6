/**
 * Histogram.ts
 * Accuracy core for distributed result aggregation (see
 * .md/Distributed-Load-Test-Design-Approach.md §2).
 *
 * Two primitives:
 *   1. percentileR7()      — the EXACT percentile k6 itself computes (R-7 / Excel
 *                            PERCENTILE.INC / NumPy default), replicated bit-for-bit
 *                            from k6-master/metrics/sink.go:145-165. Used for the
 *                            single-machine headline and the multi-machine `exact`
 *                            mode (pool all raw values, then call this).
 *   2. RelativeHistogram   — a compact, MERGEABLE histogram with a bounded RELATIVE
 *                            error (the "HDR-style" property): bucket counts add
 *                            losslessly across machines and across time buckets, and
 *                            a percentile read off the merged histogram is accurate
 *                            to `relativeAccuracy` (default 0.1%). Used as the
 *                            endurance-safe substrate and for any-duration zoom.
 *
 * The histogram uses logarithmic ("DDSketch-style") bucketing: a value v maps to
 * key = ceil(ln(v) / ln(gamma)), with gamma chosen so consecutive bucket edges are
 * a fixed RELATIVE distance apart. This guarantees the relative-error bound while
 * keeping size bounded by duration/precision, not by request count — exactly what
 * multi-hour endurance tests need. Merging is associative + commutative (bins add),
 * so tree/incremental reduction needs no redesign. No external dependency.
 */

/**
 * Exact percentile via the R-7 method, identical to k6's TrendSink.P().
 * `pct` is a fraction in [0, 1] (e.g. 0.95 for p95). `values` need not be sorted;
 * pass `presorted=true` to skip the internal sort (caller's array is then NOT copied).
 */
export function percentileR7(values: number[], pct: number, presorted = false): number {
  const n = values.length;
  if (n === 0) return 0;
  if (n === 1) return values[0];
  const sorted = presorted ? values : [...values].sort((a, b) => a - b);
  // i = pct * (N - 1); interpolate linearly between the neighbours. Mirrors
  // k6-master/metrics/sink.go exactly.
  const i = pct * (n - 1);
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  const j = sorted[lo];
  const k = sorted[hi];
  return j + (k - j) * (i - lo);
}

/** Serialized form of a RelativeHistogram — compact and self-describing for merge. */
export interface HistogramJSON {
  /** Relative-accuracy bound (alpha). Histograms must match to be mergeable. */
  a: number;
  /** Count of exact-zero observations (log bucketing can't represent 0). */
  z: number;
  count: number;
  sum: number;
  min: number;
  max: number;
  /** Sparse bucket map: { "<key>": count }. Only non-empty buckets are stored. */
  b: Record<string, number>;
}

export class RelativeHistogram {
  readonly relativeAccuracy: number;
  private readonly gamma: number;
  private readonly logGamma: number;
  private readonly buckets = new Map<number, number>();
  private zeroCount = 0;
  count = 0;
  sum = 0;
  min = Number.POSITIVE_INFINITY;
  max = Number.NEGATIVE_INFINITY;

  /**
   * @param relativeAccuracy alpha — the guaranteed relative error on any quantile
   *   (default 0.001 = 0.1%, i.e. "3 significant figures").
   */
  constructor(relativeAccuracy = 0.001) {
    if (!(relativeAccuracy > 0 && relativeAccuracy < 1)) {
      throw new Error(`[Histogram] relativeAccuracy must be in (0,1), got ${relativeAccuracy}`);
    }
    this.relativeAccuracy = relativeAccuracy;
    // gamma = (1+a)/(1-a) — consecutive bucket edges differ by this factor, so
    // the midpoint estimate is within `a` of any value in the bucket.
    this.gamma = (1 + relativeAccuracy) / (1 - relativeAccuracy);
    this.logGamma = Math.log(this.gamma);
  }

  /** Map significant decimal digits (k6/HDR style) to a relative accuracy. */
  static fromSignificantDigits(digits: number): RelativeHistogram {
    return new RelativeHistogram(Math.pow(10, -Math.max(1, Math.floor(digits))));
  }

  private keyOf(value: number): number {
    return Math.ceil(Math.log(value) / this.logGamma);
  }

  /** Representative (midpoint) value for a bucket key. Within `a` of every member. */
  private valueOf(key: number): number {
    return (2 * Math.pow(this.gamma, key)) / (this.gamma + 1);
  }

  /** Record `value` (`n` times, default 1). Negative values are clamped to 0. */
  record(value: number, n = 1): void {
    if (n <= 0) return;
    const v = value < 0 ? 0 : value;
    if (v === 0) {
      this.zeroCount += n;
    } else {
      const key = this.keyOf(v);
      this.buckets.set(key, (this.buckets.get(key) ?? 0) + n);
    }
    this.count += n;
    this.sum += v * n;
    if (v < this.min) this.min = v;
    if (v > this.max) this.max = v;
  }

  /**
   * Add another histogram into this one (lossless, associative). Both must share
   * the same relativeAccuracy — otherwise the bucket keys are incomparable.
   */
  merge(other: RelativeHistogram): void {
    if (other.relativeAccuracy !== this.relativeAccuracy) {
      throw new Error(
        `[Histogram] cannot merge histograms with different relativeAccuracy ` +
        `(${this.relativeAccuracy} vs ${other.relativeAccuracy})`,
      );
    }
    if (other.count === 0) return;
    this.zeroCount += other.zeroCount;
    for (const [key, c] of other.buckets) {
      this.buckets.set(key, (this.buckets.get(key) ?? 0) + c);
    }
    this.count += other.count;
    this.sum += other.sum;
    if (other.min < this.min) this.min = other.min;
    if (other.max > this.max) this.max = other.max;
  }

  get mean(): number {
    return this.count > 0 ? this.sum / this.count : 0;
  }

  /**
   * Value at percentile `pct` (a fraction in [0,1]). Walks buckets in ascending
   * order to the target rank (nearest-rank), accurate to `relativeAccuracy`.
   * Clamped to [min, max] so the result never falls outside observed data.
   */
  valueAtPercentile(pct: number): number {
    if (this.count === 0) return 0;
    const p = pct <= 0 ? 0 : pct >= 1 ? 1 : pct;
    // Nearest-rank target (1-based): the rank-th smallest observation.
    const rank = Math.max(1, Math.ceil(p * this.count));

    let cumulative = this.zeroCount;
    if (rank <= cumulative) return this.min === Number.POSITIVE_INFINITY ? 0 : Math.max(0, this.min);

    const sortedKeys = [...this.buckets.keys()].sort((x, y) => x - y);
    for (const key of sortedKeys) {
      cumulative += this.buckets.get(key)!;
      if (rank <= cumulative) {
        const v = this.valueOf(key);
        return Math.min(this.max, Math.max(this.min, v));
      }
    }
    return this.max; // rank == count → top of distribution
  }

  toJSON(): HistogramJSON {
    return {
      a: this.relativeAccuracy,
      z: this.zeroCount,
      count: this.count,
      sum: this.sum,
      min: this.count > 0 ? this.min : 0,
      max: this.count > 0 ? this.max : 0,
      b: Object.fromEntries([...this.buckets].map(([k, v]) => [String(k), v])),
    };
  }

  static fromJSON(json: HistogramJSON): RelativeHistogram {
    const h = new RelativeHistogram(json.a);
    h.zeroCount = json.z ?? 0;
    h.count = json.count ?? 0;
    h.sum = json.sum ?? 0;
    h.min = json.count > 0 ? json.min : Number.POSITIVE_INFINITY;
    h.max = json.count > 0 ? json.max : Number.NEGATIVE_INFINITY;
    for (const [k, v] of Object.entries(json.b ?? {})) {
      h.buckets.set(Number(k), v as number);
    }
    return h;
  }
}
