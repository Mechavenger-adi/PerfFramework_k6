// Orchestrates all L4 generators, then splices generated tables into FrameworkAtlas.md.
// `npm run docs:index`. Deterministic; the staleness gate (`npm run docs:check`) diffs its output.
const fs = require("fs");
const path = require("path");
const { ROOT } = require("./lib/ast");

function run() {
  const written = [];
  for (const mod of ["./gen-indexes", "./gen-feature-index", "./gen-config-index", "./gen-search-index", "./gen-cli-reference", "./gen-presentation"]) {
    written.push(...require(mod).generate());
  }
  spliceAtlas();
  written.forEach((f) => console.log("wrote", f));
  console.log("spliced FrameworkAtlas.md");
}

function loadJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function splice(text, key, body) {
  const re = new RegExp(`(<!-- gen:${key} -->)([\\s\\S]*?)(<!-- /gen -->)`);
  return text.replace(re, `$1\n${body}\n$3`);
}

function spliceAtlas() {
  const atlasPath = path.join(ROOT, "FrameworkAtlas.md");
  if (!fs.existsSync(atlasPath)) return;
  const features = loadJson("ai_generated/feature_index.json");
  const ownership = loadJson("ai_generated/ownership.json");

  const featTable = [
    "| Feature | Entry | Owning dir | EDD |",
    "|---------|-------|------------|-----|",
    ...features.map((f) =>
      `| ${f.title} (\`${f.feature}\`) | \`${f.entry}\` | \`${f.dirs[0] || ""}\` | ${f.edd ? `\`${f.edd}\`` : "mini"} |`)
  ].join("\n");

  const ownTable = [
    "| Feature | Files |",
    "|---------|-------|",
    ...Object.keys(ownership).sort().map((k) =>
      `| \`${k}\` | ${ownership[k].files.map((p) => `\`${p.replace("core_engine/src/", "")}\``).join(", ") || "—"} |`)
  ].join("\n");

  // config path -> features that reference it
  const byConfig = {};
  for (const f of features) for (const c of f.config) (byConfig[c] = byConfig[c] || []).push(f.feature);
  const cfgTable = [
    "| Config path | Used by |",
    "|-------------|---------|",
    ...Object.keys(byConfig).sort().map((c) => `| \`${c}\` | ${byConfig[c].sort().join(", ")} |`)
  ].join("\n");

  let text = fs.readFileSync(atlasPath, "utf8").replace(/\r\n/g, "\n");
  text = splice(text, "features", featTable);
  text = splice(text, "ownership", ownTable);
  text = splice(text, "config", cfgTable);
  fs.writeFileSync(atlasPath, text, "utf8");
}

if (require.main === module) run();
module.exports = { run };
