// Generates feature_index, ownership, framework_map by enriching the handwritten
// ai_context/features.seed.json with resolved file data. Validates every path exists.
const fs = require("fs");
const path = require("path");
const { ROOT, writeJson } = require("./lib/ast");

function loadJson(rel) {
  const full = path.join(ROOT, rel);
  return fs.existsSync(full) ? JSON.parse(fs.readFileSync(full, "utf8")) : null;
}

function generate() {
  const seed = loadJson("ai_context/features.seed.json");
  if (!seed) throw new Error("ai_context/features.seed.json missing");
  const fileIndex = loadJson("ai_generated/file_index.json") || [];
  const fileMap = new Map(fileIndex.map((f) => [f.path, f]));
  const warnings = [];

  const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

  const features = seed.features.map((feat) => {
    if (!exists(feat.entry)) warnings.push(`${feat.feature}: entry missing ${feat.entry}`);
    const files = (feat.files || []).map((p) => {
      if (!exists(p)) warnings.push(`${feat.feature}: file missing ${p}`);
      const fi = fileMap.get(p);
      return { path: p, loc: fi ? fi.loc : null, exports: fi ? fi.exports : [] };
    });
    for (const c of feat.config || []) if (!exists(c)) warnings.push(`${feat.feature}: config missing ${c}`);
    if (feat.edd && !exists(feat.edd)) warnings.push(`${feat.feature}: EDD not yet written ${feat.edd}`);
    return {
      feature: feat.feature,
      title: feat.title,
      tier: feat.tier,
      entry: feat.entry,
      dirs: feat.dirs || [],
      files,
      config: feat.config || [],
      env: feat.env || [],
      tests: feat.tests || [],
      edd: feat.edd || null,
      contracts: feat.contracts || [],
      risks: feat.risks || []
    };
  });

  const ownership = {};
  for (const f of features) ownership[f.feature] = { dirs: f.dirs, files: f.files.map((x) => x.path) };

  // framework_map: layer -> features rooted there
  const layers = {};
  for (const f of features) {
    const layer = (f.dirs[0] || "").replace(/^core_engine\/src\//, "") || "root";
    (layers[layer] = layers[layer] || []).push({ feature: f.feature, title: f.title, entry: f.entry, edd: f.edd, tier: f.tier });
  }

  const written = [
    writeJson("ai_generated/feature_index.json", features),
    writeJson("ai_generated/ownership.json", ownership),
    writeJson("ai_generated/framework_map.json", { layers })
  ];
  if (warnings.length) {
    console.warn("feature-index warnings (" + warnings.length + "):");
    warnings.forEach((w) => console.warn("  - " + w));
  }
  return written;
}

module.exports = { generate };
if (require.main === module) generate().forEach((f) => console.log("wrote", f));
