#!/usr/bin/env node
/**
 * Seeds Firestore `dyno_intel_config/hall_of_fame_matrix` from bundled JSON.
 *
 * Usage (repo root or functions/):
 *   GCLOUD_PROJECT=fitness-app-69f08 node functions/scripts/seedHallOfFameMatrix.js
 *
 * Requires Application Default Credentials (gcloud auth application-default login)
 * or a service account with Firestore write access.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../shared/admin.js";
import {
  HALL_OF_FAME_MATRIX_COLLECTION,
  HALL_OF_FAME_MATRIX_DOC_ID,
  isValidHallOfFameMatrix,
} from "../dynoIntel/hallOfFameMatrixLoader.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const matrixPath = join(root, "dynoIntel/data/hallOfFameMatrix.v1.json");
const dryRun = process.argv.includes("--dry-run");

const matrix = JSON.parse(readFileSync(matrixPath, "utf8"));
if (!isValidHallOfFameMatrix(matrix)) {
  throw new Error(`Invalid matrix payload: ${matrixPath}`);
}

const payload = {
  version: matrix.version ?? "v1",
  source: matrix.source ?? "hallOfFameMatrix.v1.json",
  generatedAt: matrix.generatedAt ?? null,
  maxDisplayNames: matrix.maxDisplayNames ?? 3,
  entries: matrix.entries,
  seededFrom: "hallOfFameMatrix.v1.json",
  updatedAt: FieldValue.serverTimestamp(),
};

const ref = db.collection(HALL_OF_FAME_MATRIX_COLLECTION).doc(HALL_OF_FAME_MATRIX_DOC_ID);

console.info(
  `[seedHallOfFameMatrix] target=${HALL_OF_FAME_MATRIX_COLLECTION}/${HALL_OF_FAME_MATRIX_DOC_ID} entries=${matrix.entries.length} dryRun=${dryRun}`
);

if (dryRun) {
  console.info("[seedHallOfFameMatrix] dry-run OK — no write");
  process.exit(0);
}

await ref.set(payload, { merge: false });
console.info("[seedHallOfFameMatrix] write OK");
