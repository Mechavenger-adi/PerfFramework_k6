---
title: Test Data Management — Mini EDD
layer: L2
owns: data
sources: [core_engine/src/data/**]
related: [risk-zones]
updated: 2026-07-09
---

# Test Data Management (Mini-EDD)

**Purpose.** Load CSV/JSON datasets with type coercion, assign rows to VUs/iterations (with overflow
strategy), validate data files pre-run, and generate dynamic values (uuid/timestamp/random).

**Owning files.** `DataFactory.ts` (load + coerce), `DataPoolManager.ts` (VU/iteration assignment),
`DataValidator.ts` (pre-run validation), `DynamicValueFactory.ts` (generators).

**Entry point + condensed runtime flow (§4A).**
1. `DataFactory.load(filePath)` dispatches to `loadCSV` / `loadJSON` by extension ([DataFactory.ts:90](../../core_engine/src/data/DataFactory.ts#L90), [:28](../../core_engine/src/data/DataFactory.ts#L28), [:62](../../core_engine/src/data/DataFactory.ts#L62)).
2. `parseCSVRow` + `coerceValue` turn cells into `string|number|boolean|null` ([:105](../../core_engine/src/data/DataFactory.ts#L105), [:131](../../core_engine/src/data/DataFactory.ts#L131)).
3. `DataPoolManager` ([DataPoolManager.ts:25](../../core_engine/src/data/DataPoolManager.ts#L25)) assigns rows per VU/iteration with an overflow policy.
4. `DynamicValueFactory` statics: `uuid` [:29](../../core_engine/src/data/DynamicValueFactory.ts#L29), `timestamp` [:13](../../core_engine/src/data/DynamicValueFactory.ts#L13), `randomInt`/`randomString`/`randomEmail`/`randomPhone` [:44-69](../../core_engine/src/data/DynamicValueFactory.ts#L44), `epochMs`/`epochSecs` [:84-91](../../core_engine/src/data/DynamicValueFactory.ts#L84).

**Key types.** `LoadedDataset`.

**Configuration + env influence.** Data file paths are relative to the entry-script location (see
RZ2/F8); dataset name optional.

**Extension points.** New generator in `DynamicValueFactory`; new format in `DataFactory.load`.

**Known limitations.** Relative-path resolution depends on where the entry script is written (RZ2/F8).
Cross-team filename collisions can resolve to the wrong file (RZ9).

**Risks.** RZ9 (multi-team file isolation not enforced), RZ2/F8 (relative data paths).

**Tests to run.** Manual: load a CSV/JSON dataset; verify per-VU row assignment + overflow.

**Related.** [[execution]], [[vu-runtime]].
