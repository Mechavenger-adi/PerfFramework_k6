// Generates file_index, symbol_index, dependency_graph, call_graph from core_engine/src.
// Deterministic. Run via `npm run docs:index`. DO NOT hand-edit the outputs.
const path = require("path");
const { tsFiles, analyzeFile, writeJson, rel } = require("./lib/ast");

// VU-safe = reachable only from the index.ts barrel, never importing Node built-ins.
const NODE_BUILTINS = new Set(["fs", "path", "os", "crypto", "child_process", "util", "http", "https", "net", "stream", "process"]);

function generate() {
  const analyses = tsFiles().map(analyzeFile);
  const byPath = new Map(analyses.map((a) => [a.path, a]));

  // file_index
  const fileIndex = analyses.map((a) => ({
    path: a.path,
    layer: layerOf(a.path),
    loc: a.loc,
    exports: a.exports,
    imports: a.imports.map((i) => i.resolved || i.spec),
    importsNode: a.imports.some((i) => !i.resolved && NODE_BUILTINS.has(i.spec.split("/")[0]))
  }));

  // symbol_index
  const symbolIndex = {};
  for (const a of analyses) {
    for (const s of a.symbols) {
      const key = `${a.path}#${s.name}`;
      symbolIndex[key] = { name: s.name, kind: s.kind, file: a.path, line: s.line, exported: s.exported, jsdoc: s.jsdoc };
    }
  }

  // dependency_graph (internal edges only)
  const depEdges = [];
  for (const a of analyses) {
    for (const i of a.imports) {
      if (i.resolved && byPath.has(i.resolved)) depEdges.push({ from: a.path, to: i.resolved });
    }
  }
  const dependencyGraph = {
    nodes: analyses.map((a) => a.path),
    edges: dedupeEdges(depEdges)
  };

  // call_graph (module-level, partial)
  const callGraph = { note: "module-level, partial (dynamic dispatch not resolved)", edges: [] };
  const callEdges = [];
  for (const a of analyses) {
    for (const to of a.callEdges) if (byPath.has(to)) callEdges.push({ from: a.path, to });
  }
  callGraph.edges = dedupeEdges(callEdges);

  const written = [
    writeJson("ai_generated/file_index.json", fileIndex),
    writeJson("ai_generated/symbol_index.json", symbolIndex),
    writeJson("ai_generated/dependency_graph.json", dependencyGraph),
    writeJson("ai_generated/call_graph.json", callGraph)
  ];
  return written;
}

function layerOf(p) {
  const m = p.match(/^core_engine\/src\/([^/]+)\//);
  return m ? m[1] : "root";
}

function dedupeEdges(edges) {
  const seen = new Set();
  const out = [];
  for (const e of edges.sort((a, b) => (a.from + a.to).localeCompare(b.from + b.to))) {
    const k = `${e.from}->${e.to}`;
    if (!seen.has(k)) { seen.add(k); out.push(e); }
  }
  return out;
}

module.exports = { generate };
if (require.main === module) generate().forEach((f) => console.log("wrote", f));
