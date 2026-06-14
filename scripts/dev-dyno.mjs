#!/usr/bin/env node
/**
 * One-click DYNO INTEL full-stack dev launcher.
 *
 * Design intent (WHY): Client bypass (Vite DEV) and server bypass (Functions env)
 * must start together; GEMINI_API_KEY must reach the Functions emulator worker.
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const functionsDir = join(rootDir, 'functions');
const functionsEnvLocalPath = join(functionsDir, '.env.local');

/** Ports that must be free for a clean full-stack boot. */
const REQUIRED_PORTS = [5173, 4000, 9099, 8080, 9199, 5001, 4400, 4500];

async function listPortConflicts(ports) {
  const { execSync } = await import('node:child_process');
  const conflicts = [];
  for (const port of ports) {
    try {
      const raw = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim();
      if (!raw) continue;
      const pids = [...new Set(raw.split('\n').filter(Boolean))];
      conflicts.push({ port, pids });
    } catch {
      /* port free */
    }
  }
  return conflicts;
}

async function assertPortsFree() {
  const conflicts = await listPortConflicts(REQUIRED_PORTS);
  if (conflicts.length === 0) return;

  console.error('[dev:dyno] ERROR: required ports are already in use:');
  for (const { port, pids } of conflicts) {
    console.error(`  - ${port}: pid ${pids.join(', ')}`);
  }
  console.error('[dev:dyno] Stop the old stack first (Ctrl+C twice in the old terminal), then run:');
  console.error(
    `  for p in ${REQUIRED_PORTS.join(' ')}; do lsof -ti:$p | xargs kill -9 2>/dev/null; done`
  );
  process.exit(1);
}

function parseDotEnv(content) {
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function loadDotEnvFiles(baseDir, fileNames) {
  const merged = {};
  for (const fileName of fileNames) {
    const filePath = join(baseDir, fileName);
    if (!existsSync(filePath)) continue;
    Object.assign(merged, parseDotEnv(readFileSync(filePath, 'utf8')));
  }
  return merged;
}

/**
 * WHY: Boss often pastes GEMINI into root `.env`, but Callable reads `functions/.env.local`.
 */
function ensureFunctionsGeminiEnv(rootEnv) {
  const functionsEnv = loadDotEnvFiles(functionsDir, ['.env', '.env.local']);
  if (functionsEnv.GEMINI_API_KEY?.trim()) {
    return { geminiSource: 'functions/.env(.local)', migratedFromRoot: false };
  }

  const rootGeminiKey = rootEnv.GEMINI_API_KEY?.trim();
  if (!rootGeminiKey) {
    return { geminiSource: null, migratedFromRoot: false };
  }

  const body = [
    '# Auto-provisioned by npm run dev:dyno',
    '# WHY: GEMINI_API_KEY must live under functions/ for the Callable emulator worker.',
    'DYNO_INTEL_DEV_BYPASS=true',
    `GEMINI_API_KEY=${rootGeminiKey}`,
    '',
  ].join('\n');
  writeFileSync(functionsEnvLocalPath, body, { mode: 0o600 });
  return { geminiSource: 'functions/.env.local (migrated from root .env)', migratedFromRoot: true };
}

const rootEnv = loadDotEnvFiles(rootDir, ['.env', '.env.local']);
const { geminiSource, migratedFromRoot } = ensureFunctionsGeminiEnv(rootEnv);
const functionsEnv = loadDotEnvFiles(functionsDir, ['.env', '.env.local']);

const emulatorEnv = {
  ...process.env,
  ...functionsEnv,
  DYNO_INTEL_DEV_BYPASS: 'true',
};

const hasGeminiKey = Boolean(emulatorEnv.GEMINI_API_KEY?.trim());
const emulatorsEnabled =
  String(rootEnv.VITE_FIREBASE_USE_EMULATORS ?? process.env.VITE_FIREBASE_USE_EMULATORS ?? '')
    .trim()
    .toLowerCase() === 'true';

console.log('[dev:dyno] Starting Firebase emulators + Vite…');
console.log('[dev:dyno] Client: npm run dev (DEV bypass auto-on when VITE_FIREBASE_USE_EMULATORS=true)');
console.log('[dev:dyno] Server: DYNO_INTEL_DEV_BYPASS=true (forced)');
if (migratedFromRoot) {
  console.warn(
    '[dev:dyno] WARNING: GEMINI_API_KEY was only in root .env — migrated to functions/.env.local'
  );
}
console.log(
  `[dev:dyno] GEMINI_API_KEY: ${
    hasGeminiKey
      ? `loaded (${geminiSource ?? 'functions/.env(.local)'})`
      : 'MISSING — set in functions/.env.local (see functions/.env.example)'
  }`
);
console.log(
  `[dev:dyno] VITE_FIREBASE_USE_EMULATORS: ${
    emulatorsEnabled ? 'true' : 'MISSING — set true in root .env before Vite starts'
  }`
);
console.log('[dev:dyno] Docs: docs/DYNO_INTEL_LOCAL.md');

await assertPortsFree();

function spawnNamed(label, command, args, env = process.env) {
  const child = spawn(command, args, {
    cwd: rootDir,
    env,
    stdio: 'inherit',
    shell: true,
  });
  child.on('exit', (code, signal) => {
    if (signal) {
      console.log(`[dev:dyno] ${label} stopped (${signal})`);
      return;
    }
    if (code && code !== 0) {
      console.error(`[dev:dyno] ${label} exited with code ${code}`);
    }
  });
  return child;
}

const emulators = spawnNamed('emulators', 'npm', ['run', 'firebase:emulators'], emulatorEnv);
const vite = spawnNamed('vite', 'npm', ['run', 'dev']);

let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  emulators.kill('SIGTERM');
  vite.kill('SIGTERM');
  setTimeout(() => process.exit(exitCode), 250);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

emulators.on('exit', (code, signal) => {
  if (shuttingDown || signal) return;
  shutdown(code ?? 1);
});
vite.on('exit', (code, signal) => {
  if (shuttingDown || signal) return;
  shutdown(code ?? 1);
});
