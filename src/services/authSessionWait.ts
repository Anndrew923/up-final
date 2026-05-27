import { useAuthStore } from '../stores/authStore';
import { getCurrentFirebaseUser, onFirebaseAuthStateChanged } from './firebaseClient';

const DEFAULT_TIMEOUT_MS = 5000;

function isAnonymousSessionReady(): boolean {
  const { status, isAnonymous } = useAuthStore.getState();
  return status === 'signed-in' && isAnonymous;
}

/**
 * WHY: `signInAnonymously` can resolve before `useAuthSessionBootstrap` mirrors user into the store;
 * navigating early lets `App` parent `<Navigate>` win the race on Android WebView cold start.
 */
export function waitForAnonymousAuthSession(timeoutMs = DEFAULT_TIMEOUT_MS): Promise<void> {
  const user = getCurrentFirebaseUser();
  if (user?.isAnonymous && useAuthStore.getState().status !== 'signed-in') {
    useAuthStore.getState().setFromUser(user);
  }
  if (isAnonymousSessionReady()) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let unsubStore: (() => void) | undefined;
    let unsubAuth: (() => void) | undefined;

    const cleanup = () => {
      if (timer !== undefined) clearTimeout(timer);
      unsubStore?.();
      unsubAuth?.();
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error('auth-anonymous-timeout'));
    }, timeoutMs);

    unsubStore = useAuthStore.subscribe((state) => {
      if (state.status === 'signed-in' && state.isAnonymous) {
        cleanup();
        resolve();
      }
    });

    unsubAuth = onFirebaseAuthStateChanged((authUser) => {
      if (!authUser?.isAnonymous) return;
      if (useAuthStore.getState().status !== 'signed-in') {
        useAuthStore.getState().setFromUser(authUser);
      }
      if (isAnonymousSessionReady()) {
        cleanup();
        resolve();
      }
    });
  });
}
