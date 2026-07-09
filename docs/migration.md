# Migration: Existing k6 → Framework

> Derived from the recording/convert feature ([features/recording](../engineering_docs/features/recording.md)) and
> [EDD-auto-correlation](../engineering_docs/edd/EDD-auto-correlation.md).

You do **not** rewrite scripts by hand. Pick the path that matches what you have.

## I have a conventional k6 script

```bash
npm run convert -- path/to/script.js MyTeam converted-name
# overwrite in place instead of writing to testSuites/<team>/tests/:
npm run cli -- convert path/to/script.js MyTeam converted-name --in-place
```

`convert` wraps requests in `transaction()`, adds lifecycle phases, and inserts replay logging. It is
**idempotent** — re-converting a converted script is a no-op. It handles two input patterns
(Studio/Trend-based and semi-framework). Keep any `let match;` / `let regex;` declarations — they're
needed for correlation.

## I have a browser recording (HAR)

```bash
npm run generate -- MyTeam my-flow --har testSuites/MyTeam/recordings/my-flow.har
```

You'll be prompted for domain selection and whether to include static assets. Output: a framework k6
script + a normalized recording log for debug diffing.

## I have a cURL command or Postman collection

```bash
npm run cli -- import curl MyTeam login --clipboard      # or --file / --stdin / --curl '<string>'
npm run cli -- import postman MyTeam api --file collection.json --folder "API/Auth"
```

## Then: correlate dynamic values

Recorded scripts replay stale tokens (CSRF/JWT/session/ViewState), so iteration 2+ fails. Scan and
auto-correlate:

```bash
npm run correlate -- --log testSuites/MyTeam/recordings/my-flow.recording-log.json   # list (review)
npm run correlate -- --script testSuites/MyTeam/tests/my-flow.js --apply high        # rewrite
```

`correlate` writes a reviewable manifest first; you can edit it (rename vars, toggle apply) before
applying. Default `--apply` commits only **high**-confidence links. See
[EDD-auto-correlation](../engineering_docs/edd/EDD-auto-correlation.md).

## Finally: validate the migration

```bash
npm run cli -- debug --script testSuites/MyTeam/tests/my-flow.js   # HTML diff vs recording
```

## Contract differences to know
- Use `transaction()` + `k6Check()`, not raw `group()`/`check()` (pre-flight guard enforces this).
- Import the framework API from `dist/index.js` (VU-safe barrel), never from `engine.ts`.
- Rebuild (`npm run build`) after editing VU-side framework code.
