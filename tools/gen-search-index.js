// Generates search_index: title/layer/headings across L1 (ai_context) and L2 (engineering_docs) docs.
const fs = require("fs");
const path = require("path");
const { ROOT, walk, rel, read, writeJson } = require("./lib/ast");

function frontMatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  const fm = {};
  if (m) for (const line of m[1].split("\n")) {
    const km = line.match(/^(\w+):\s*(.*)$/);
    if (km) fm[km[1]] = km[2].trim();
  }
  return fm;
}

function generate() {
  const roots = ["ai_context", "engineering_docs"].map((d) => path.join(ROOT, d)).filter(fs.existsSync);
  const entries = [];
  for (const root of roots) {
    for (const f of walk(root, (p) => p.endsWith(".md")).sort()) {
      const text = read(f);
      const fm = frontMatter(text);
      const headings = [...text.matchAll(/^#{1,3}\s+(.+)$/gm)].map((m) => m[1].trim());
      entries.push({
        path: rel(f),
        title: fm.title || (headings[0] || path.basename(f)),
        layer: fm.layer || (rel(f).startsWith("ai_context") ? "L1" : "L2"),
        headings
      });
    }
  }
  entries.sort((a, b) => a.path.localeCompare(b.path));
  return [writeJson("ai_generated/search_index.json", entries)];
}

module.exports = { generate };
if (require.main === module) generate().forEach((f) => console.log("wrote", f));
