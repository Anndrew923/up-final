import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from './firebaseClient';

interface DeleteAccountResponse {
  ok: boolean;
}

export async function deleteAccountOnServer(): Promise<void> {
  const functions = getFirebaseFunctions();
  if (!functions) throw new Error('firebase-functions-not-configured');
  const callable = httpsCallable<Record<string, never>, DeleteAccountResponse>(
    functions,
    'deleteAccount'
  );
  const result = await callable({});
  if (result.data.ok !== true) {
    throw new Error('account-delete-failed');
  }
}
