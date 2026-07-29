/**
 * Ensure Gen2 Callable Cloud Run services allow public invoke (allUsers).
 * WHY: Firebase Auth / App Check still gate the Callable; without run.invoker=allUsers
 * browsers see opaque CORS failures on preflight (as with getAdminLadderReports).
 *
 * Usage:
 *   GOOGLE_CLOUD_PROJECT=fitness-app-69f08 node scripts/ensureCallableInvokers.js
 */
import { GoogleAuth } from "google-auth-library";

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || "fitness-app-69f08";
const REGION = process.env.FUNCTIONS_REGION || "us-central1";

/** Cloud Run service ids are lowercased function names. */
const CALLABLE_SERVICES = [
  "getadminladderreports",
  "processladderreport",
  "ladderreportuser",
  "laddersubmitshard",
  "laddersyncpreview",
  "laddersyncbatch",
  "dynointelchat",
  "syncprosubscription",
  "deleteaccount",
];

const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});
const client = await auth.getClient();
const token = (await client.getAccessToken()).token;
if (!token) {
  throw new Error("No ADC access token — run gcloud auth application-default login");
}

function policyUrl(service) {
  return `https://run.googleapis.com/v1/projects/${PROJECT}/locations/${REGION}/services/${service}`;
}

async function getPolicy(service) {
  const res = await fetch(`${policyUrl(service)}:getIamPolicy`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`${service} getIamPolicy ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

function hasPublicInvoker(policy) {
  return (policy.bindings || []).some(
    (b) =>
      b.role === "roles/run.invoker" &&
      Array.isArray(b.members) &&
      b.members.includes("allUsers")
  );
}

async function ensurePublicInvoker(service) {
  const current = await getPolicy(service);
  if (hasPublicInvoker(current)) {
    console.info(`[ok] ${service} already has allUsers invoker`);
    return { service, changed: false };
  }

  const res = await fetch(`${policyUrl(service)}:setIamPolicy`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      policy: {
        bindings: [
          {
            role: "roles/run.invoker",
            members: ["allUsers"],
          },
        ],
      },
    }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`${service} setIamPolicy ${res.status}: ${JSON.stringify(body)}`);
  }
  console.info(`[fixed] ${service} granted roles/run.invoker to allUsers`);
  return { service, changed: true };
}

const results = [];
for (const service of CALLABLE_SERVICES) {
  try {
    results.push(await ensurePublicInvoker(service));
  } catch (err) {
    console.error(`[fail] ${service}:`, err.message || err);
    results.push({ service, changed: false, error: String(err.message || err) });
  }
}

const failed = results.filter((r) => r.error);
if (failed.length) {
  process.exitCode = 1;
}
console.info(
  `[ensureCallableInvokers] done — fixed ${results.filter((r) => r.changed).length}, failed ${failed.length}`
);
