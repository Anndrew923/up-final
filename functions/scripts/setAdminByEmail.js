/**
 * Grant or revoke `users/{uid}.isAdmin` by Auth email.
 *
 * Usage:
 *   GOOGLE_CLOUD_PROJECT=fitness-app-69f08 node scripts/setAdminByEmail.js topaj01@gmail.com
 *   GOOGLE_CLOUD_PROJECT=fitness-app-69f08 node scripts/setAdminByEmail.js topaj01@gmail.com --revoke
 *
 * Requires Application Default Credentials with quota project set
 * (`gcloud auth application-default set-quota-project <projectId>`).
 */
import { getAuth } from "firebase-admin/auth";
import { db } from "../shared/admin.js";

const email = (process.argv[2] || "").trim().toLowerCase();
const revoke = process.argv.includes("--revoke");

if (!email || !email.includes("@")) {
  console.error("Usage: node scripts/setAdminByEmail.js <email> [--revoke]");
  process.exit(1);
}

const userRecord = await getAuth().getUserByEmail(email);
const uid = userRecord.uid;
const isAdmin = !revoke;
const nowIso = new Date().toISOString();

await db.collection("users").doc(uid).set(
  {
    userId: uid,
    isAdmin,
    updatedAt: nowIso,
  },
  { merge: true }
);

console.info(
  `[setAdminByEmail] ${email} (${uid}) isAdmin=${isAdmin} — write complete`
);
