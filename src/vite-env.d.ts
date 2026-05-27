/// <reference types="vite/client" />

interface ViteCustomEventMap {
  'locales-update': { file: string };
}

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_USE_EMULATORS?: string;
  readonly VITE_FIREBASE_FUNCTIONS_REGION?: string;
  readonly VITE_LADDER_CALLABLE_WRITES?: string;
  readonly VITE_RC_API_KEY_IOS?: string;
  /** Empty until `.env` is filled; runtime code must tolerate missing keys (web dev). */
  readonly VITE_RC_API_KEY_ANDROID?: string;
  readonly VITE_RC_API_KEY_WEB?: string;
  readonly VITE_RC_ENTITLEMENT_ID?: string;
  readonly VITE_RC_PACKAGE_ID?: string;
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
