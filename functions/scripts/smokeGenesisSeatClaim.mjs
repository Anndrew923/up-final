/**
 * Emulator smoke: claimGenesisEarlyBirdSeat write contract.
 * WHY: Verify Scheme A user mirror + public_meta/genesisSeats stage in one transaction
 * without touching production Firestore.
 *
 * Usage (Firestore emulator must be on :8080):
 *   cd functions && FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node ../scripts/smokeGenesisSeatClaim.mjs
 *   # or:
 *   npm run smoke:genesis-seat --prefix functions
 */
import { initializeApp, getApps, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST =
  process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
process.env.GCLOUD_PROJECT =
  process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || "fitness-app-69f08";

const app =
  getApps().length === 0
    ? initializeApp({ projectId: process.env.GCLOUD_PROJECT })
    : getApps()[0];

const {
  claimGenesisEarlyBirdSeat,
  GENESIS_EARLY_BIRD_META_PATH,
  GENESIS_EARLY_BIRD_SEATS_COLLECTION,
  GENESIS_SEAT_PUBLIC_SUMMARY_PATH,
} = await import("../shared/genesisEarlyBird.js");

const db = getFirestore();
const uid = `smoke-genesis-${Date.now()}`;
const now = new Date("2026-09-06T10:00:00.000Z");

function fail(message, detail) {
  console.error("❌", message, detail ?? "");
  process.exitCode = 1;
}

function ok(message, detail) {
  console.log("✅", message, detail ?? "");
}

async function cleanup() {
  const batch = db.batch();
  batch.delete(db.collection("users").doc(uid));
  batch.delete(db.collection(GENESIS_EARLY_BIRD_SEATS_COLLECTION).doc(uid));
  await batch.commit();
}

try {
  console.log("→ claimGenesisEarlyBirdSeat", { uid, project: process.env.GCLOUD_PROJECT });
  const result = await claimGenesisEarlyBirdSeat(uid, { seatLimit: 2000, now });

  if (!result.ok || !result.claimed) {
    fail("expected a fresh claim", result);
  } else {
    ok("claim returned ok", {
      claimedCount: result.claimedCount,
      seatNumber: result.seatNumber,
    });
  }

  const userSnap = await db.collection("users").doc(uid).get();
  const userData = userSnap.data() ?? {};
  if (userData.isGenesisEarlyBird === true && userData.genesisSeatNumber === result.seatNumber) {
    ok("users/{uid} mirror", {
      isGenesisEarlyBird: userData.isGenesisEarlyBird,
      genesisSeatNumber: userData.genesisSeatNumber,
    });
  } else {
    fail("users/{uid} mirror mismatch", userData);
  }

  const publicSnap = await db.doc(GENESIS_SEAT_PUBLIC_SUMMARY_PATH).get();
  const publicData = publicSnap.data() ?? {};
  if (
    publicSnap.exists &&
    typeof publicData.stage === "string" &&
    publicData.seatLimit === 2000 &&
    !("claimedCount" in publicData)
  ) {
    ok("public_meta/genesisSeats summary", {
      stage: publicData.stage,
      seatLimit: publicData.seatLimit,
      percentBucket: publicData.percentBucket,
      remaining: publicData.remaining,
      updatedAt: publicData.updatedAt,
    });
  } else {
    fail("public_meta/genesisSeats missing or leaked claimedCount", publicData);
  }

  if (!["early", "growth", "closing", "ended"].includes(publicData.stage)) {
    fail("invalid stage", publicData.stage);
  } else {
    ok("stage is valid disclosure tier", publicData.stage);
  }

  const metaSnap = await db.doc(GENESIS_EARLY_BIRD_META_PATH).get();
  if (metaSnap.exists && Number(metaSnap.data()?.claimedCount) >= 1) {
    ok("private meta counter advanced", { claimedCount: metaSnap.data()?.claimedCount });
  } else {
    fail("meta/genesisEarlyBird not updated", metaSnap.data());
  }

  const again = await claimGenesisEarlyBirdSeat(uid, { seatLimit: 2000, now });
  if (again.ok && again.alreadyHad === true && again.claimed === false) {
    ok("idempotent re-claim", { claimedCount: again.claimedCount, seatNumber: again.seatNumber });
  } else {
    fail("re-claim should be alreadyHad", again);
  }
} catch (err) {
  fail("smoke threw", err?.stack || err?.message || err);
} finally {
  try {
    await cleanup();
    ok("cleaned smoke user + seat docs", uid);
  } catch (cleanupErr) {
    console.warn("cleanup warning", cleanupErr?.message || cleanupErr);
  }
  try {
    await deleteApp(app);
  } catch {
    // ignore
  }
}

if (process.exitCode) {
  console.error("\nGenesis seat claim smoke FAILED");
  process.exit(1);
}
console.log("\nGenesis seat claim smoke PASSED");
