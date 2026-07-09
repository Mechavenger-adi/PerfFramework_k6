// Shared TypeScript-compiler AST utilities for the L4 index generators.
// Deterministic by construction: forward-slash paths, sorted arrays, LF output.
// Reuses the same `typescript` compiler API the technical-reference generator uses.

const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const ROOT = process.cwd();
const SRC_ROOT = path.join(ROOT, "core_engine", "src");

// Excluded from ALL indexing/analysis. Matches generate-technical-reference.js + archive freeze.
const EXCLUDED_DIRS = new Set([
  ".git", ".agent", ".claude", ".k6-temp", ".tmp-init-check",
  "node_modules", "results", "dist", "k6-master", "archive", ".md"
]);

function norm(p) {
  return p.replace(/\\/g, "/");
}

function rel(file) {
  return norm(path.relative(ROOT, file));
}

function read(file) {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function walk(dir, filter, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, filter, files);
    else if (filter(full)) files.push(full);
  }
  return files;
}

function tsFiles(dir = SRC_ROOT) {
  return walk(dir, (f) => f.endsWith(".ts") && !f.endsWith(".d.ts")).sort();
}

function lineOf(sf, node) {
  return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
}

function jsdocOf(source, node) {
  const full = node.getFullText();
  const m = full.match(/\/\*\*([\s\S]*?)\*\//);
  if (!m) return "";
  return m[1]
    .split("\n")
    .map((l) => l.replace(/^\s*\*\s?/, ""))
    .filter((l) => !l.trim().startsWith("@"))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function isExported(node) {
  return Boolean(
    node.modifiers &&
      node.modifiers.some(
        (m) => m.kind === ts.SyntaxKind.ExportKeyword || m.kind === ts.SyntaxKind.DefaultKeyword
      )
  );
}

// Resolve a relative import specifier to a repo-relative .ts file, or null if external/unresolved.
function resolveImport(fromFile, spec) {
  if (!spec.startsWith(".")) return null; // external (k6, node, npm)
  const base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [
    base + ".ts",
    base + ".d.ts",
    path.join(base, "index.ts")
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return rel(c);
  }
  return null;
}

// Full per-file analysis used by every generator.
function analyzeFile(file) {
  const source = read(file);
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const imports = [];        // {spec, resolved, names[]}
  const exports = new Set();
  const symbols = [];        // {name, kind, line, exported, jsdoc}
  const importedBindings = new Map(); // localName -> resolved file

  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) && st.moduleSpecifier && ts.isStringLiteral(st.moduleSpecifier)) {
      const spec = st.moduleSpecifier.text;
      const resolved = resolveImport(file, spec);
      const names = [];
      const clause = st.importClause;
      if (clause) {
        if (clause.name) names.push(clause.name.text);
        const nb = clause.namedBindings;
        if (nb && ts.isNamedImports(nb)) for (const el of nb.elements) names.push(el.name.text);
        if (nb && ts.isNamespaceImport(nb)) names.push(nb.name.text);
      }
      names.sort();
      imports.push({ spec, resolved, names });
      if (resolved) for (const n of names) importedBindings.set(n, resolved);
      continue;
    }
    if (ts.isExportDeclaration(st)) {
      const nb = st.exportClause;
      if (nb && ts.isNamedExports(nb)) for (const el of nb.elements) exports.add(el.name.text);
      continue;
    }
    const record = (name, kind) => {
      const exported = isExported(st);
      symbols.push({ name, kind, line: lineOf(sf, st), exported, jsdoc: jsdocOf(source, st) });
      if (exported) exports.add(name);
    };
    if (ts.isFunctionDeclaration(st) && st.name) record(st.name.text, "function");
    else if (ts.isClassDeclaration(st) && st.name) record(st.name.text, "class");
    else if (ts.isInterfaceDeclaration(st) && st.name) record(st.name.text, "interface");
    else if (ts.isTypeAliasDeclaration(st) && st.name) record(st.name.text, "type");
    else if (ts.isEnumDeclaration(st) && st.name) record(st.name.text, "enum");
    else if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) {
        if (ts.isIdentifier(d.name)) {
          const exported = isExported(st);
          symbols.push({ name: d.name.text, kind: "const", line: lineOf(sf, st), exported, jsdoc: jsdocOf(source, st) });
          if (exported) exports.add(d.name.text);
        }
      }
    }
  }

  // Module-level call edges (partial): callee identifier resolved against imported bindings.
  const callEdges = new Set();
  const visit = (node) => {
    if (ts.isCallExpression(node)) {
      let callee = node.expression;
      // For `a.b()` use `a`; for `b()` use `b`.
      while (ts.isPropertyAccessExpression(callee)) callee = callee.expression;
      if (ts.isIdentifier(callee) && importedBindings.has(callee.text)) {
        callEdges.add(importedBindings.get(callee.text));
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  return {
    path: rel(file),
    loc: source.split("\n").length,
    imports: imports.sort((a, b) => a.spec.localeCompare(b.spec)),
    exports: [...exports].sort(),
    symbols: symbols.sort((a, b) => a.line - b.line),
    callEdges: [...callEdges].sort()
  };
}

// Stable JSON: sorted keys everywhere, LF, trailing newline.
function stableStringify(value) {
  const sort = (v) => {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === "object") {
      const out = {};
      for (const k of Object.keys(v).sort()) out[k] = sort(v[k]);
      return out;
    }
    return v;
  };
  return JSON.stringify(sort(value), null, 2) + "\n";
}

function writeJson(relPath, value) {
  const full = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, stableStringify(value).replace(/\n/g, "\n"), "utf8");
  return relPath;
}

module.exports = {
  ROOT, SRC_ROOT, EXCLUDED_DIRS,
  norm, rel, read, walk, tsFiles,
  analyzeFile, stableStringify, writeJson
};
