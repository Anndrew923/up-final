/**
 * Firebase Admin singleton — all ladder callables import `db` from here.
 */
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();
export const FieldValue = admin.firestore.FieldValue;
export { admin };
