/**
 * Shared Callable auth / error helpers for guild modules.
 * WHY: Six callables must reject anonymous the same way; HttpsError instanceof
 * can fail across transaction wrappers — also match by name + code.
 */
import { HttpsError } from "firebase-functions/v2/https";

export function isAnonymousProvider(request) {
  const provider = request.auth?.token?.firebase?.sign_in_provider;
  return provider === "anonymous" || !provider;
}

/**
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 * @returns {string} uid
 */
export function requireSignedInUid(request) {
  const uid = request.auth?.uid;
  if (!uid || isAnonymousProvider(request)) {
    throw new HttpsError("unauthenticated", "Sign in required");
  }
  return uid;
}

/**
 * @param {unknown} err
 */
export function isHttpsError(err) {
  if (err instanceof HttpsError) return true;
  if (!err || typeof err !== "object") return false;
  return err.name === "HttpsError" && typeof err.code === "string";
}

/**
 * Re-throw client-facing errors; wrap unexpected ones.
 * @param {unknown} err
 * @param {string} logTag
 * @param {string} internalMessage
 */
export function rethrowGuildError(err, logTag, internalMessage) {
  if (isHttpsError(err)) throw err;
  console.error(logTag, err && typeof err === "object" ? err.message : err);
  throw new HttpsError("internal", internalMessage);
}
