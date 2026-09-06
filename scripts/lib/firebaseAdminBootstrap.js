/**
 * Shared Admin SDK bootstrap for repo-root ops scripts.
 * WHY: Avoid copy-pasting ADC / .env.local / .firebaserc resolution across seed & report tools.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

export const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FUNCTIONS_DIR = join(ROOT_DIR, 'functions');
const require = createRequire(join(FUNCTIONS_DIR, 'package.json'));

export function loadEnvLocal(rootDir = ROOT_DIR) {
  const envPath = join(rootDir, 'functions', '.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

export function resolveProjectId(rootDir = ROOT_DIR) {
  let projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  const firebasercPath = join(rootDir, '.firebaserc');
  if (!projectId && existsSync(firebasercPath)) {
    const firebaserc = JSON.parse(readFileSync(firebasercPath, 'utf8'));
    projectId = firebaserc?.projects?.default;
  }
  return projectId || undefined;
}

/**
 * @returns {{ projectId: string | undefined; db: FirebaseFirestore.Firestore }}
 */
export function initAdminFirestore(rootDir = ROOT_DIR) {
  loadEnvLocal(rootDir);
  const projectId = resolveProjectId(rootDir);
  // WHY: firebase-admin v13+ is modular — legacy admin.firestore()/admin.apps are undefined.
  const { getApps, initializeApp } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  if (getApps().length === 0) {
    initializeApp(projectId ? { projectId } : undefined);
  }
  return { projectId, db: getFirestore() };
}
