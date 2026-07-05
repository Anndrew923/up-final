#!/usr/bin/env node
/**
 * Washes DynoIntel hall-of-fame xlsx into sparse hallOfFameMatrix.v1.json.
 * Run: node scripts/import-hall-of-fame-matrix.mjs
 *
 * DESIGN INTENT:
 * - Rows → decadeKey, columns → axisId (not 1:1 paired — full matrix).
 * - Blank cells omitted (sparse output).
 * - Parenthetical reference scores stripped from display names; kept as optional metadata.
 * - UI sampling capped at 3 names per cell.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const defaultInput = join(root, "docs/data/DynoIntel_v4.0_名人堂聖殿矩陣.xlsx");
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

const MAX_DISPLAY_NAMES = 3;

function slugifyId(name) {
  return String(name)
    .toLowerCase()
    .replace(/[（(].*?[）)]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64) || "anchor";
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
  name = name.replace(/（[^）]*）/g, (m) => {
    if (/^\（\d+(?:\.\d+)?\）$/.test(m)) return "";
    return m;
  }).trim();
  return name.replace(/^[,，、\s]+|[,，、\s]+$/g, "").trim();
}

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
    if (anchors.length >= MAX_DISPLAY_NAMES) break;
  }

  return anchors.length ? anchors : null;
}

function importMatrix(inputPath = defaultInput) {
  const wb = XLSX.readFile(inputPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  const header = rows[0] ?? [];
  const columnAxes = header
    .map((h, colIdx) => ({ colIdx, axisId: COLUMN_AXIS_MAP[String(h).trim()] }))
    .filter((c) => c.axisId);

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
    source: "DynoIntel_v4.0_名人堂聖殿矩陣.xlsx",
    generatedAt: new Date().toISOString(),
    maxDisplayNames: MAX_DISPLAY_NAMES,
    entries,
  };
}

const matrix = importMatrix();
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(matrix, null, 2)}\n`, "utf8");
console.log(`Wrote ${matrix.entries.length} sparse cells → ${outputPath}`);
