#!/usr/bin/env node
/**
 * Washes DynoIntel hall-of-fame CSV into sparse hallOfFameMatrix.v1.json.
 * Run: node scripts/import-hall-of-fame-matrix.mjs [optional-input-path]
 *
 * DESIGN INTENT:
 * - Rows → decadeKey, columns → axisId (not 1:1 paired — full matrix).
 * - Blank cells omitted (sparse output).
 * - Parenthetical reference scores stripped from display names; kept as optional metadata.
 * - FULL cell roster is persisted (deduped). maxDisplayNames is ONLY the runtime
 *   per-reply display cap used by resolvers — never an ingest truncate limit.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { basename, dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const defaultCsv = join(root, "docs/data/DynoIntel_v4.0_名人堂聖殿矩陣.csv");
const outputPath = join(root, "functions/dynoIntel/data/hallOfFameMatrix.v1.json");

const COLUMN_AXIS_MAP = {
  力量: "strength",
  爆發力: "explosivePower",
  心肺機能: "cardio",
  肌肉量: "muscleMass",
  FFMI: "bodyFat",
  握力: "gripStrength",
  臂圍: "armSize",
  總分: "overall",
};

/** Runtime per-reply display cap — mirrored into JSON for resolvers; NOT an ingest limit. */
const MAX_DISPLAY_NAMES = 3;

function resolveDefaultInput() {
  return defaultCsv;
}

function slugifyId(name) {
  // WHY: Do not strip parenthetical eras — Zac Efron(鐵爪) vs (Baywatch) must stay distinct ids.
  return (
    String(name)
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 64) || "anchor"
  );
}

function parseDecadeKey(rowLabel) {
  const label = String(rowLabel ?? "").trim();
  if (!label) return null;
  if (/150\+|150\s*\+|A2/i.test(label)) return "150";
  if (/140\s*[-~–]\s*150|A3/i.test(label)) return "140";
  if (/130\s*[-~–]\s*140|A4/i.test(label)) return "130";
  if (/120\s*[-~–]\s*130|A5/i.test(label)) return "120";
  if (/110\s*[-~–]\s*120|A6/i.test(label)) return "110";
  if (/100\s*[-~–]\s*110|A7/i.test(label)) return "100";
  if (/90\s*[-~–]\s*100|A8/i.test(label)) return "90";
  if (/80\s*[-~–]\s*90|A9/i.test(label)) return "80";
  if (/70\s*[~～-]\s*80/.test(label)) return "70";
  if (/60\s*[~～-]\s*70/.test(label)) return "60";
  return null;
}

function stripDisplayName(raw) {
  let name = String(raw ?? "").trim();
  if (!name || name === "、") return "";
  name = name.replace(/\(\d+(?:\.\d+)?\)/g, "").trim();
  name = name
    .replace(/（[^）]*）/g, (m) => {
      if (/^（\d+(?:\.\d+)?）$/.test(m)) return "";
      return m;
    })
    .trim();
  return name.replace(/^[,，、\s]+|[,，、\s]+$/g, "").trim();
}

/**
 * Persist every unique name in the Excel/CSV cell.
 * WHY: Ingest used to truncate at MAX_DISPLAY_NAMES (=3), collapsing full pantheon
 * rosters into a 3-name pool so "random" consults looked frozen.
 */
function parseAnchors(cell) {
  const raw = String(cell ?? "").trim();
  if (!raw) return null;

  const tokens = raw
    .split(/[\n\r]+/)
    .flatMap((line) => line.split(/[、,，]/))
    .map(stripDisplayName)
    .filter(Boolean);

  const anchors = [];
  const seen = new Set();

  for (const token of tokens) {
    const refMatch = String(cell).match(
      new RegExp(`${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\((\\d+(?:\\.\\d+)?)\\)`)
    );
    const displayZh = token;
    const key = displayZh.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const anchor = { id: slugifyId(displayZh), displayZh };
    if (refMatch) anchor.referenceScore = Number(refMatch[1]);
    anchors.push(anchor);
  }

  return anchors.length ? anchors : null;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function importMatrix(inputPath = resolveDefaultInput()) {
  if (extname(inputPath).toLowerCase() !== ".csv") {
    throw new Error("Hall-of-fame import accepts UTF-8 CSV only.");
  }
  const rows = parseCsv(readFileSync(inputPath, "utf8"));

  const header = rows[0] ?? [];
  const columnAxes = header
    .map((h, colIdx) => ({ colIdx, axisId: COLUMN_AXIS_MAP[String(h).trim()] }))
    .filter((c) => c.axisId);

  if (columnAxes.length === 0) {
    throw new Error(
      `No axis columns matched in ${basename(inputPath)}. Header was: ${JSON.stringify(header)}`
    );
  }

  const entries = [];

  for (let rowIdx = 1; rowIdx < rows.length; rowIdx += 1) {
    const row = rows[rowIdx] ?? [];
    const decadeKey = parseDecadeKey(row[0]);
    if (!decadeKey) continue;

    for (const { colIdx, axisId } of columnAxes) {
      const anchors = parseAnchors(row[colIdx]);
      if (!anchors) continue;
      entries.push({ decadeKey, axisId, anchors });
    }
  }

  entries.sort((a, b) => {
    const decadeDiff = Number(b.decadeKey) - Number(a.decadeKey);
    if (decadeDiff !== 0) return decadeDiff;
    return a.axisId.localeCompare(b.axisId);
  });

  return {
    version: "v1",
    source: basename(inputPath),
    generatedAt: new Date().toISOString(),
    maxDisplayNames: MAX_DISPLAY_NAMES,
    entries,
  };
}

const cliPath = process.argv[2];
const resolvedInput = cliPath && existsSync(cliPath) ? cliPath : resolveDefaultInput();
const washed = importMatrix(resolvedInput);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(washed, null, 2)}\n`, "utf8");

const overall90 = washed.entries.find((e) => e.decadeKey === "90" && e.axisId === "overall");
const maxAnchors = Math.max(0, ...washed.entries.map((e) => (e.anchors?.length ?? 0)));
console.log(`Source: ${resolvedInput}`);
console.log(`Wrote ${washed.entries.length} sparse cells → ${outputPath}`);
console.log(`max anchors/cell: ${maxAnchors}; display cap metadata: ${washed.maxDisplayNames}`);
if (overall90) {
  console.log(
    `90:overall anchors (${overall90.anchors.length}): ${overall90.anchors.map((a) => a.displayZh).join(" | ")}`
  );
}
