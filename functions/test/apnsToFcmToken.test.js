import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isApnsDeviceToken } from "../guild/apnsToFcmToken.js";
import { pickStoredPushCredential } from "../guild/adminTestClubPushCore.js";

const SAMPLE_APNS = "A".repeat(64);
const SAMPLE_FCM = "nKctODamlM4:CKrh_PC8kIb7O_example_registration";

describe("isApnsDeviceToken", () => {
  it("accepts 64-char hex", () => {
    assert.equal(isApnsDeviceToken(SAMPLE_APNS), true);
    assert.equal(
      isApnsDeviceToken("7ea9936ba60bd425690760f18ac3804abd15b62dfec42bb48e2922eb0c8d82fc"),
      true
    );
  });

  it("rejects FCM-shaped and short tokens", () => {
    assert.equal(isApnsDeviceToken(SAMPLE_FCM), false);
    assert.equal(isApnsDeviceToken("abcd1234567890"), false);
    assert.equal(isApnsDeviceToken(""), false);
    assert.equal(isApnsDeviceToken(null), false);
  });
});

describe("pickStoredPushCredential", () => {
  it("prefers existing FCM registration token over APNs archive", () => {
    assert.equal(
      pickStoredPushCredential({ fcmToken: SAMPLE_FCM, apnsToken: SAMPLE_APNS }),
      SAMPLE_FCM
    );
  });

  it("uses APNs hex when fcmToken still holds device token", () => {
    assert.equal(pickStoredPushCredential({ fcmToken: SAMPLE_APNS }), SAMPLE_APNS);
  });

  it("falls back to apnsToken field", () => {
    assert.equal(pickStoredPushCredential({ apnsToken: SAMPLE_APNS }), SAMPLE_APNS);
  });

  it("returns empty when neither field is set", () => {
    assert.equal(pickStoredPushCredential({}), "");
  });
});
