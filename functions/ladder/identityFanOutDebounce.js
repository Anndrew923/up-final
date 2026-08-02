import { IDENTITY_FANOUT_DEBOUNCE_MS, IDENTITY_FANOUT_WAVE_GRACE_MS } from "../shared/constants.js";

/**
 * Score-equal identity/avatar fan-out gate.
 * WHY: Nickname/avatar-only sync-all would otherwise rewrite every shard; allow one
 * multi-shard "wave" (grace window), then cool down for 24h.
 *
 * @param {Record<string, unknown>} rateDoc
 * @param {number} nowMs
 */
export function checkIdentityFanOutAllowed(rateDoc, nowMs = Date.now()) {
  const raw = rateDoc?.identityFanOut;
  const lastWaveStartMs = Number(raw?.lastWaveStartMs);
  if (!Number.isFinite(lastWaveStartMs) || lastWaveStartMs <= 0) {
    return { allowed: true, startNewWave: true };
  }
  const elapsed = nowMs - lastWaveStartMs;
  if (elapsed >= IDENTITY_FANOUT_DEBOUNCE_MS) {
    return { allowed: true, startNewWave: true };
  }
  // Same sync-all / rapid sequential shard submits share one wave.
  if (elapsed <= IDENTITY_FANOUT_WAVE_GRACE_MS) {
    return { allowed: true, startNewWave: false };
  }
  return {
    allowed: false,
    startNewWave: false,
    nextAllowedAt: new Date(lastWaveStartMs + IDENTITY_FANOUT_DEBOUNCE_MS).toISOString(),
  };
}

/**
 * @param {Record<string, unknown>} rateDoc
 * @param {number} nowMs
 * @param {{ startNewWave?: boolean }} [opts]
 */
export function recordIdentityFanOut(rateDoc, nowMs = Date.now(), opts = {}) {
  const startNewWave = opts.startNewWave !== false;
  const existing = Number(rateDoc?.identityFanOut?.lastWaveStartMs);
  const lastWaveStartMs =
    startNewWave || !Number.isFinite(existing) || existing <= 0 ? nowMs : existing;
  rateDoc.identityFanOut = {
    lastWaveStartMs,
    lastAtMs: nowMs,
  };
  return rateDoc.identityFanOut;
}
