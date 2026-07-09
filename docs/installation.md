# Installation

> Derived from the root `README.md` (Prerequisites + First-Time Setup).

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 22+ | runs the framework CLI/engine |
| npm | 11+ | dependency install + scripts |
| Grafana k6 | latest | must be on `PATH` |
| Git | any | version control |

Verify:

```bash
node --version
npm --version
k6 version
git --version
```

## Install k6

```bash
# Windows
winget install k6
# macOS
brew install k6
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install k6
```

## First-time setup

From the repository root:

```bash
npm install
npm run build
```

`npm run build` compiles TypeScript to `dist/`. **k6 loads the compiled `dist/` files, not the `.ts`
source** — so re-run `npm run build` after changing any VU-side code under `core_engine/src/utils/`.

## Environment file (optional)

Create a local `.env` when you need secrets or output overrides (never commit it):

```bash
copy .env.template .env    # Windows
cp .env.template .env      # macOS/Linux
```

Common values:

```dotenv
K6_RESULTS_BASE_DIR=results
K6_INFLUXDB_URL=http://localhost:8086/k6   # optional; adds an InfluxDB k6 output when set
```

See the full variable list in [environment_index.json](../ai_generated/environment_index.json) *(generated)*.

## Next
→ [Getting Started](getting-started.md)
