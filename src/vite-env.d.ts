/// <reference types="vite/client" />

interface ViteCustomEventMap {
  'locales-update': { file: string };
}

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_RC_API_KEY_IOS?: string;
  readonly VITE_RC_API_KEY_ANDROID?: string;
  readonly VITE_RC_API_KEY_WEB?: string;
  readonly VITE_RC_ENTITLEMENT_ID?: string;
  readonly VITE_RC_PACKAGE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
