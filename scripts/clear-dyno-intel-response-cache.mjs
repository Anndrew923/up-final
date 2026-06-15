#!/usr/bin/env node
/**
 * Clears Firestore dyno_intel_cache after model migrations (quality reset, not cost optimization).
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { DYNO_INTEL_CACHE_COLLECTION } from "../functions/shared/constants.js";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const functionsDir = join(rootDir, "functions");
const require = createRequire(join(functionsDir, "package.json"));
const admin = require("firebase-admin");

function loadEnvLocal() {
  const envPath = join(rootDir, "functions", ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

async function clearCollection(collectionName) {
  const db = admin.firestore();
  const batchSize = 200;
  let deleted = 0;

  while (true) {
    const snap = await db.collection(collectionName).limit(batchSize).get();
    if (snap.empty) break;
    const batch = db.batch();
    for (const doc of snap.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    deleted += snap.size;
  }

  return deleted;
}

async function main() {
  loadEnvLocal();

  const firebasercPath = join(rootDir, ".firebaserc");
  let projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId && existsSync(firebasercPath)) {
    const firebaserc = JSON.parse(readFileSync(firebasercPath, "utf8"));
    projectId = firebaserc?.projects?.default;
  }

  if (!admin.apps.length) {
    admin.initializeApp(projectId ? { projectId } : undefined);
  }

  const deleted = await clearCollection(DYNO_INTEL_CACHE_COLLECTION);
  console.log(`[clear-dyno-intel-cache] deleted ${deleted} docs from ${DYNO_INTEL_CACHE_COLLECTION}`);
}

main().catch((err) => {
  console.error("[clear-dyno-intel-cache] failed", err);
  process.exit(1);
});
