// Generates config_index (from JSON Schemas) and environment_index (variable NAMES only).
// Never emits secret values. Run via `npm run docs:index`.
const fs = require("fs");
const path = require("path");
const { ROOT, walk, rel, read, writeJson } = require("./lib/ast");

function loadJson(full) {
  try { return JSON.parse(read(full)); } catch { return null; }
}

// Flatten a JSON Schema into [{key, type, default, enum, required, source}].
function flattenSchema(schema, source, prefix = "", required = new Set(), out = []) {
  if (!schema || typeof schema !== "object") return out;
  const props = schema.properties || {};
  const req = new Set(schema.required || []);
  for (const key of Object.keys(props).sort()) {
    const node = props[key];
    const full = prefix ? `${prefix}.${key}` : key;
    out.push({
      key: full,
      type: node.type || (node.enum ? "enum" : node.$ref ? "ref" : "any"),
      default: node.default !== undefined ? node.default : null,
      enum: node.enum || null,
      required: req.has(key),
      source
    });
    if (node.type === "object" && node.properties) flattenSchema(node, source, full, req, out);
  }
  return out;
}

function generate() {
  // config_index from every schema
  const schemaDir = path.join(ROOT, "config", "schemas");
  const configIndex = [];
  if (fs.existsSync(schemaDir)) {
    for (const f of walk(schemaDir, (p) => p.endsWith(".json")).sort()) {
      const schema = loadJson(f);
      if (schema) flattenSchema(schema, rel(f), "", new Set(), configIndex);
    }
  }
  configIndex.sort((a, b) => (a.source + a.key).localeCompare(b.source + b.key));

  // environment_index: variable NAMES only, from .env* templates and process.env refs in src
  const envVars = new Map(); // name -> {templates:Set, usedIn:Set}
  const touch = (name) => {
    if (!envVars.has(name)) envVars.set(name, { templates: new Set(), usedIn: new Set() });
    return envVars.get(name);
  };
  // .env templates (names only, never values)
  for (const name of [".env.template", ".env"]) {
    const full = path.join(ROOT, name);
    if (!fs.existsSync(full)) continue;
    for (const line of read(full).split("\n")) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=/);
      if (m) touch(m[1]).templates.add(name);
    }
  }
  // process.env.X and K6_PERF_* refs in source
  const srcRoot = path.join(ROOT, "core_engine", "src");
  if (fs.existsSync(srcRoot)) {
    for (const f of walk(srcRoot, (p) => p.endsWith(".ts") && !p.endsWith(".d.ts")).sort()) {
      const text = read(f);
      const re = /process\.env\.([A-Z_][A-Z0-9_]*)|process\.env\[["']([A-Z_][A-Z0-9_]*)["']\]/g;
      let m;
      while ((m = re.exec(text))) touch(m[1] || m[2]).usedIn.add(rel(f));
    }
  }
  const environmentIndex = [...envVars.keys()].sort().map((name) => {
    const v = envVars.get(name);
    return { var: name, templates: [...v.templates].sort(), usedIn: [...v.usedIn].sort() };
  });

  return [
    writeJson("ai_generated/config_index.json", configIndex),
    writeJson("ai_generated/environment_index.json", environmentIndex)
  ];
}

module.exports = { generate };
if (require.main === module) generate().forEach((f) => console.log("wrote", f));
