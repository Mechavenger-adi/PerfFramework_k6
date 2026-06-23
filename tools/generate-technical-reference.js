const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const childProcess = require("child_process");
const ts = require("typescript");

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "docs");
const MD_OUT = path.join(OUT_DIR, "K6_PerfFramework_Technical_Reference.md");

const EXCLUDED_DIRS = new Set([
  ".git",
  ".agent",
  ".claude",
  ".k6-temp",
  ".tmp-init-check",
  "node_modules",
  "results",
  "dist"
]);

const SOURCE_EXTENSIONS = new Set([".ts", ".js"]);
const TEXT_EXTENSIONS = new Set([".md", ".json", ".jsonc", ".csv", ".har", ".html", ".log", ".txt", ".d.ts"]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (TEXT_EXTENSIONS.has(ext) || SOURCE_EXTENSIONS.has(ext)) files.push(full);
    }
  }
  return files;
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function read(file) {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function countLines(text) {
  return text.length === 0 ? 0 : text.split("\n").length;
}

function firstHeading(text) {
  const match = text.match(/^#\s+(.+)$/m);
  return match ? cleanText(match[1]) : "";
}

function cleanText(value) {
  return String(value || "")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
    .replace(/[â][^\s]*/g, "")
    .trim();
}

function extractJSDoc(source, node) {
  const full = node.getFullText();
  const match = full.match(/\/\*\*([\s\S]*?)\*\//);
  if (!match) return "";
  return cleanText(
    match[1]
      .split("\n")
      .map((line) => line.replace(/^\s*\*\s?/, ""))
      .filter((line) => !line.trim().startsWith("@"))
      .join(" ")
  );
}

function lineOf(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function signatureOf(source, node) {
  const text = node.getText();
  const head = text.split("{")[0].replace(/\s+/g, " ").trim();
  return head.length > 180 ? `${head.slice(0, 177)}...` : head;
}

function inferDescription(name, kind, sourceText) {
  const readable = name
    .replace(/^run/, "run ")
    .replace(/^build/, "build ")
    .replace(/^create/, "create ")
    .replace(/^resolve/, "resolve ")
    .replace(/^validate/, "validate ")
    .replace(/^load/, "load ")
    .replace(/^get/, "get ")
    .replace(/^is/, "is ")
    .replace(/^should/, "should ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase();
  const verbs = [];
  if (/fs\.|readFile|writeFile|mkdir|existsSync/.test(sourceText)) verbs.push("performs file-system work");
  if (/spawn|exec|k6|child_process/.test(sourceText)) verbs.push("orchestrates process execution");
  if (/JSON\.parse|parseJSON|jsonc/.test(sourceText)) verbs.push("parses structured configuration or artifact data");
  if (/validate|schema|ajv|errors/.test(sourceText)) verbs.push("enforces validation rules");
  if (/console\.|Logger\./.test(sourceText)) verbs.push("emits operator-facing output");
  const suffix = verbs.length ? ` It ${verbs.join(", ")}.` : "";
  return `Implements the ${readable} ${kind}.${suffix}`;
}

function paramsOf(node) {
  if (!node.parameters) return "";
  return node.parameters
    .map((p) => cleanText(p.getText()).replace(/\s+/g, " "))
    .join(", ");
}

function returnTypeOf(node) {
  return node.type ? cleanText(node.type.getText()) : "Inferred";
}

function isExported(node) {
  return Boolean(
    node.modifiers &&
      node.modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword || m.kind === ts.SyntaxKind.DefaultKeyword)
  );
}

function analyzeSource(file) {
  const source = read(file);
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith(".ts") ? ts.ScriptKind.TS : ts.ScriptKind.JS);
  const imports = [];
  const exports = [];
  const classes = [];
  const functions = [];
  const types = [];
  const variables = [];

  for (const statement of sf.statements) {
    if (ts.isImportDeclaration(statement)) {
      imports.push(cleanText(statement.getText()));
      continue;
    }
    if (ts.isExportDeclaration(statement)) {
      exports.push(cleanText(statement.getText()));
      continue;
    }
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      const bodyText = statement.body ? statement.body.getText() : statement.getText();
      functions.push({
        name: statement.name.getText(),
        kind: "function",
        line: lineOf(sf, statement),
        signature: signatureOf(source, statement),
        params: paramsOf(statement),
        returns: returnTypeOf(statement),
        exported: isExported(statement),
        description: extractJSDoc(source, statement) || inferDescription(statement.name.getText(), "function", bodyText)
      });
      if (isExported(statement)) exports.push(statement.name.getText());
      continue;
    }
    if (ts.isClassDeclaration(statement) && statement.name) {
      const classInfo = {
        name: statement.name.getText(),
        line: lineOf(sf, statement),
        exported: isExported(statement),
        description: extractJSDoc(source, statement) || inferDescription(statement.name.getText(), "class", statement.getText()),
        methods: [],
        properties: []
      };
      if (isExported(statement)) exports.push(classInfo.name);
      for (const member of statement.members) {
        if (ts.isMethodDeclaration(member) || ts.isConstructorDeclaration(member)) {
          const name = ts.isConstructorDeclaration(member) ? "constructor" : member.name.getText();
          const bodyText = member.body ? member.body.getText() : member.getText();
          classInfo.methods.push({
            name,
            line: lineOf(sf, member),
            signature: signatureOf(source, member),
            params: paramsOf(member),
            returns: returnTypeOf(member),
            description: extractJSDoc(source, member) || inferDescription(name, "method", bodyText)
          });
        } else if (ts.isPropertyDeclaration(member) && member.name) {
          classInfo.properties.push({
            name: member.name.getText(),
            line: lineOf(sf, member),
            type: member.type ? cleanText(member.type.getText()) : "Inferred",
            description: extractJSDoc(source, member) || "Class state or configuration value used by the class methods."
          });
        }
      }
      classes.push(classInfo);
      continue;
    }
    if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement) || ts.isEnumDeclaration(statement)) {
      const name = statement.name.getText();
      types.push({
        name,
        kind: ts.SyntaxKind[statement.kind].replace("Declaration", ""),
        line: lineOf(sf, statement),
        exported: isExported(statement),
        description: extractJSDoc(source, statement) || `Defines the ${name} contract used by the framework.`
      });
      if (isExported(statement)) exports.push(name);
      continue;
    }
    if (ts.isVariableStatement(statement)) {
      for (const decl of statement.declarationList.declarations) {
        if (!decl.name) continue;
        const initializer = decl.initializer;
        const name = decl.name.getText();
        const exported = isExported(statement);
        if (initializer && (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))) {
          functions.push({
            name,
            kind: "function variable",
            line: lineOf(sf, decl),
            signature: cleanText(decl.getText().split("=>")[0]).slice(0, 180),
            params: paramsOf(initializer),
            returns: returnTypeOf(initializer),
            exported,
            description: extractJSDoc(source, statement) || inferDescription(name, "function", initializer.getText())
          });
        } else {
          variables.push({
            name,
            line: lineOf(sf, decl),
            exported,
            type: decl.type ? cleanText(decl.type.getText()) : "Inferred",
            description: extractJSDoc(source, statement) || "Module-level constant or configuration value."
          });
        }
        if (exported) exports.push(name);
      }
    }
  }

  return {
    path: rel(file),
    lines: countLines(source),
    imports,
    exports: Array.from(new Set(exports)).filter(Boolean),
    classes,
    functions,
    types,
    variables
  };
}

function summarizeJson(file) {
  const source = read(file);
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  try {
    const data = JSON.parse(withoutComments);
    if (data && typeof data === "object" && !Array.isArray(data)) {
      return {
        keys: Object.keys(data),
        summary: `Top-level keys: ${Object.keys(data).join(", ") || "none"}.`
      };
    }
    return { keys: [], summary: `Contains a ${Array.isArray(data) ? "JSON array" : typeof data} value.` };
  } catch {
    return { keys: [], summary: "Structured text file; parsing was skipped because it contains JSONC syntax or non-JSON content." };
  }
}

function summarizeCsv(file) {
  const source = read(file);
  const rows = source.split("\n").filter((line) => line.trim());
  const header = rows[0] || "";
  return {
    summary: `CSV data file with ${Math.max(rows.length - 1, 0)} data rows. Columns: ${header || "not detected"}.`
  };
}

function summarizeMarkdown(file) {
  const text = read(file);
  const heading = firstHeading(text);
  const paragraph = text
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#") && !line.startsWith("|") && !line.startsWith("```"));
  return {
    summary: cleanText([heading, paragraph].filter(Boolean).join(" - ")) || "Markdown documentation file."
  };
}

function layerFor(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  if (normalized.startsWith("core_engine/src/")) return normalized.split("/")[2];
  if (normalized.startsWith("config/")) return "configuration";
  if (normalized.startsWith("testSuites/")) return "test suite";
  if (normalized.startsWith("templates/")) return "templates";
  if (normalized.startsWith("ai_context/")) return "AI context";
  if (normalized.startsWith("docs/")) return "documentation";
  return "repository";
}

function filePurpose(filePath, analysis) {
  const name = path.basename(filePath);
  if (analysis && analysis.classes.length) {
    return `${analysis.classes.map((c) => c.name).join(", ")} implementation.`;
  }
  if (analysis && analysis.functions.length) {
    return `${analysis.functions.map((f) => f.name).slice(0, 4).join(", ")} helpers or command handlers.`;
  }
  if (filePath.includes("schema")) return "JSON Schema contract used for validation and IDE assistance.";
  if (filePath.includes("test_plans")) return "Executable test plan or reusable workload template.";
  if (filePath.includes("runtime_settings")) return "Runtime behavior profile controlling execution, errors, reporting, and diagnostics.";
  if (filePath.endsWith(".md")) return "Human-readable documentation and operating guidance.";
  if (filePath.endsWith(".csv")) return "Parameterized data set used by journeys.";
  if (filePath.endsWith(".har")) return "Recorded HTTP archive used for script generation and replay comparison.";
  return "Framework file.";
}

function buildModel() {
  const files = walk(ROOT).sort((a, b) => rel(a).localeCompare(rel(b)));
  const analyses = [];
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const info = {
      path: rel(file),
      layer: layerFor(rel(file)),
      extension: ext || "(none)",
      lines: countLines(read(file))
    };
    if (SOURCE_EXTENSIONS.has(ext)) {
      info.source = analyzeSource(file);
      info.summary = filePurpose(info.path, info.source);
    } else if (ext === ".json" || ext === ".jsonc" || ext === ".har") {
      Object.assign(info, summarizeJson(file));
      info.summary = `${filePurpose(info.path)} ${info.summary}`;
    } else if (ext === ".csv") {
      Object.assign(info, summarizeCsv(file));
    } else if (ext === ".md") {
      Object.assign(info, summarizeMarkdown(file));
    } else {
      info.summary = filePurpose(info.path);
    }
    analyses.push(info);
  }
  return analyses;
}

function mdEscape(value) {
  return String(value || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function buildMarkdown(model) {
  const now = new Date().toISOString();
  const coreSources = model.filter((f) => f.source && f.path.startsWith("core_engine/src/"));
  const testSources = model.filter((f) => f.source && f.path.startsWith("testSuites/"));
  const sourceFunctions = model
    .filter((f) => f.source)
    .reduce((sum, f) => sum + f.source.functions.length + f.source.classes.reduce((s, c) => s + c.methods.length, 0), 0);

  const lines = [];
  lines.push("# K6 Performance Framework Technical Reference");
  lines.push("");
  lines.push(`Generated: ${now}`);
  lines.push("");
  lines.push("## Document Purpose");
  lines.push("");
  lines.push("This document is a professional SDET reference for the K6 Performance Framework. It combines the framework overview, execution contracts, configuration model, and a source-level catalog of files, classes, functions, methods, schemas, templates, data files, and sample journeys.");
  lines.push("");
  lines.push("## Executive Summary");
  lines.push("");
  lines.push("| Area | Count |");
  lines.push("|---|---:|");
  lines.push(`| Documented files | ${model.length} |`);
  lines.push(`| Core engine source files | ${coreSources.length} |`);
  lines.push(`| Test suite source files | ${testSources.length} |`);
  lines.push(`| Documented functions and methods | ${sourceFunctions} |`);
  lines.push("");
  lines.push("## Architecture Overview");
  lines.push("");
  lines.push("The framework is an enterprise k6 performance testing engine with LoadRunner-style lifecycle phases: `initPhase`, `actionPhase`, and `endPhase`. It supports HAR-to-script generation, Bring Your Own Script conversion, debug replay diffing, schema-driven configuration, artifact-first reporting, and multi-team suite organization.");
  lines.push("");
  lines.push("The major layers are CLI, Config, Schemas, Types, Scenario, Execution, Runtime, Data, Recording, Correlation, Assertions, Debug, Reporters, Reporting, and Utils. CLI code should orchestrate workflows; engine layers own validation, scenario construction, execution, artifacts, replay, and reusable runtime behavior.");
  lines.push("");
  lines.push("## Normal Execution Flow");
  lines.push("");
  lines.push("1. CLI parses command arguments.");
  lines.push("2. The test plan is loaded and validated against schema.");
  lines.push("3. Configuration layers are resolved into a single runtime contract.");
  lines.push("4. Gatekeeper validation checks scripts, data, recording logs, weights, and hybrid settings.");
  lines.push("5. Scenario metadata, runtime metadata, environment URLs, thresholds, and summary trend stats are assembled.");
  lines.push("6. k6 is executed through the pipeline runner.");
  lines.push("7. Runtime scripts execute lifecycle phases and emit transaction metrics, debug logs, errors, and warnings.");
  lines.push("8. Artifacts are finalized: transaction metrics, CI summary, event streams, timeseries, system metrics, and HTML report.");
  lines.push("");
  lines.push("## Debug Replay Flow");
  lines.push("");
  lines.push("Debug mode resolves a recording log, forces a controlled replay profile, enables `K6_PERF_DEBUG`, extracts replay exchange logs, compares recording vs replay entries, and writes an interactive HTML diff report for request, response, timing, and variable substitution analysis.");
  lines.push("");
  lines.push("## Configuration Chain");
  lines.push("");
  lines.push("Configuration is resolved from framework defaults, environment config, runtime settings, suite overrides, CLI flags, and `.env` secrets. JSON Schemas under `config/schemas` are the source of truth for validation and editor assistance.");
  lines.push("");
  lines.push("## Repository File Catalog");
  lines.push("");
  lines.push("| File | Layer | Lines | Purpose |");
  lines.push("|---|---|---:|---|");
  for (const file of model) {
    lines.push(`| \`${mdEscape(file.path)}\` | ${mdEscape(file.layer)} | ${file.lines} | ${mdEscape(file.summary)} |`);
  }
  lines.push("");
  lines.push("## Detailed Source Reference");
  lines.push("");

  for (const file of model.filter((f) => f.source)) {
    const src = file.source;
    lines.push(`### ${src.path}`);
    lines.push("");
    lines.push(`Layer: ${file.layer}  `);
    lines.push(`Lines: ${src.lines}  `);
    lines.push(`Purpose: ${file.summary}`);
    lines.push("");
    if (src.imports.length) {
      lines.push("Imports:");
      for (const imp of src.imports) lines.push(`- \`${imp}\``);
      lines.push("");
    }
    if (src.exports.length) {
      lines.push(`Exports: ${src.exports.map((e) => `\`${e}\``).join(", ")}`);
      lines.push("");
    }
    if (src.types.length) {
      lines.push("| Type | Kind | Line | Description |");
      lines.push("|---|---|---:|---|");
      for (const t of src.types) lines.push(`| \`${mdEscape(t.name)}\` | ${t.kind} | ${t.line} | ${mdEscape(t.description)} |`);
      lines.push("");
    }
    if (src.variables.length) {
      lines.push("| Variable / Constant | Type | Line | Description |");
      lines.push("|---|---|---:|---|");
      for (const v of src.variables) lines.push(`| \`${mdEscape(v.name)}\` | ${mdEscape(v.type)} | ${v.line} | ${mdEscape(v.description)} |`);
      lines.push("");
    }
    if (src.functions.length) {
      lines.push("| Function | Signature | Parameters | Returns | Line | Description |");
      lines.push("|---|---|---|---|---:|---|");
      for (const fn of src.functions) {
        lines.push(`| \`${mdEscape(fn.name)}\` | \`${mdEscape(fn.signature)}\` | ${mdEscape(fn.params || "None")} | ${mdEscape(fn.returns)} | ${fn.line} | ${mdEscape(fn.description)} |`);
      }
      lines.push("");
    }
    for (const cls of src.classes) {
      lines.push(`#### Class: ${cls.name}`);
      lines.push("");
      lines.push(`Line: ${cls.line}  `);
      lines.push(`Description: ${cls.description}`);
      lines.push("");
      if (cls.properties.length) {
        lines.push("| Property | Type | Line | Description |");
        lines.push("|---|---|---:|---|");
        for (const p of cls.properties) lines.push(`| \`${mdEscape(p.name)}\` | ${mdEscape(p.type)} | ${p.line} | ${mdEscape(p.description)} |`);
        lines.push("");
      }
      if (cls.methods.length) {
        lines.push("| Method | Signature | Parameters | Returns | Line | Description |");
        lines.push("|---|---|---|---|---:|---|");
        for (const m of cls.methods) {
          lines.push(`| \`${mdEscape(m.name)}\` | \`${mdEscape(m.signature)}\` | ${mdEscape(m.params || "None")} | ${mdEscape(m.returns)} | ${m.line} | ${mdEscape(m.description)} |`);
        }
        lines.push("");
      }
    }
    lines.push("");
  }

  lines.push("## Non-Source Configuration, Template, Data, And Documentation Files");
  lines.push("");
  for (const file of model.filter((f) => !f.source)) {
    lines.push(`### ${file.path}`);
    lines.push("");
    lines.push(`Layer: ${file.layer}  `);
    lines.push(`Lines: ${file.lines}  `);
    lines.push(`Purpose: ${file.summary}`);
    if (file.keys && file.keys.length) lines.push(`  \nTop-level keys: ${file.keys.map((k) => `\`${k}\``).join(", ")}`);
    lines.push("");
  }

  lines.push("## SDET Operating Notes");
  lines.push("");
  lines.push("- Treat `config/schemas` as the validation source of truth.");
  lines.push("- Prefer adding framework behavior in engine layers instead of CLI handlers.");
  lines.push("- Runtime utilities under `core_engine/src/utils` execute inside k6 and must remain compatible with k6's JavaScript runtime.");
  lines.push("- Debug replay depends on generated or converted scripts calling `logExchange()` for every meaningful HTTP exchange.");
  lines.push("- Reporting is artifact-first; CI should consume `ci-summary.json` and related JSON/NDJSON artifacts instead of console text.");
  lines.push("- Existing `dist` files are generated build output and are intentionally not duplicated in the source-level reference.");
  lines.push("");
  return lines.join("\n");
}

function xmlEscape(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraph(text, style) {
  const styleXml = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : "";
  const safe = xmlEscape(text);
  return `<w:p>${styleXml}<w:r><w:t xml:space="preserve">${safe}</w:t></w:r></w:p>`;
}

function table(rows) {
  const rowXml = rows
    .map((row) => `<w:tr>${row.map((cell) => `<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/></w:tcPr>${paragraph(cell)}</w:tc>`).join("")}</w:tr>`)
    .join("");
  return `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="0" w:type="auto"/></w:tblPr>${rowXml}</w:tbl>`;
}

function markdownToDocXml(markdown) {
  const lines = markdown.split("\n");
  const body = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) {
      body.push(paragraph(""));
      continue;
    }
    if (line.startsWith("# ")) {
      body.push(paragraph(line.slice(2), "Title"));
    } else if (line.startsWith("## ")) {
      body.push(paragraph(line.slice(3), "Heading1"));
    } else if (line.startsWith("### ")) {
      body.push(paragraph(line.slice(4), "Heading2"));
    } else if (line.startsWith("#### ")) {
      body.push(paragraph(line.slice(5), "Heading3"));
    } else if (line.startsWith("- ")) {
      body.push(paragraph(`• ${line.slice(2)}`, "ListParagraph"));
    } else if (/^\d+\.\s/.test(line)) {
      body.push(paragraph(line, "ListParagraph"));
    } else if (line.startsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        if (!/^\|\s*-+/.test(lines[i])) {
          tableLines.push(
            lines[i]
              .split("|")
              .slice(1, -1)
              .map((cell) => cell.replace(/`/g, "").trim())
          );
        }
        i += 1;
      }
      i -= 1;
      body.push(table(tableLines));
    } else {
      body.push(paragraph(line.replace(/`/g, "")));
    }
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${body.join("\n")}
    <w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>
  </w:body>
</w:document>`;
}

function writeDocx(markdown) {
  const temp = path.join(os.tmpdir(), `k6-ref-${crypto.randomBytes(6).toString("hex")}`);
  const wordDir = path.join(temp, "word");
  const relsDir = path.join(temp, "_rels");
  fs.mkdirSync(wordDir, { recursive: true });
  fs.mkdirSync(relsDir, { recursive: true });

  fs.writeFileSync(path.join(temp, "[Content_Types].xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`);
  fs.writeFileSync(path.join(relsDir, ".rels"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>`);
  fs.mkdirSync(path.join(temp, "docProps"), { recursive: true });
  fs.writeFileSync(path.join(temp, "docProps", "core.xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>K6 Performance Framework Technical Reference</dc:title>
  <dc:creator>Codex</dc:creator>
  <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
</cp:coreProperties>`);
  fs.writeFileSync(path.join(wordDir, "styles.xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="20"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:rPr><w:b/><w:color w:val="1F4E79"/><w:sz w:val="28"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:rPr><w:b/><w:color w:val="2F5597"/><w:sz w:val="24"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:rPr><w:b/><w:sz w:val="22"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="360"/></w:pPr></w:style>
  <w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"/><w:left w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"/><w:right w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"/></w:tblBorders></w:tblPr></w:style>
</w:styles>`);
  fs.writeFileSync(path.join(wordDir, "document.xml"), markdownToDocXml(markdown));
  if (fs.existsSync(DOCX_OUT)) fs.unlinkSync(DOCX_OUT);
  const zipOut = `${DOCX_OUT}.zip`;
  if (fs.existsSync(zipOut)) fs.unlinkSync(zipOut);
  childProcess.execFileSync("powershell", [
    "-NoProfile",
    "-Command",
    `Compress-Archive -Path '${temp.replace(/'/g, "''")}\\*' -DestinationPath '${zipOut.replace(/'/g, "''")}' -Force`
  ]);
  fs.renameSync(zipOut, DOCX_OUT);
  fs.rmSync(temp, { recursive: true, force: true });
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const model = buildModel();
const markdown = buildMarkdown(model);
fs.writeFileSync(MD_OUT, markdown, "utf8");

console.log(`Wrote ${MD_OUT}`);
console.log(`Documented ${model.length} files.`);
