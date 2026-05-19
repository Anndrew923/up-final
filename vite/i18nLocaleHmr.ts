import type { Plugin } from 'vite';
import { sep } from 'node:path';

const LOCALES_SEGMENT = `${sep}i18n${sep}locales${sep}`;

function isLocaleJsonFile(file: string): boolean {
  return file.includes(LOCALES_SEGMENT) && file.endsWith('.json');
}

/**
 * WHY: Locale JSON is statically imported into i18n bundles. Vite defaults to full `page reload`
 * on any JSON change — if the editor auto-saves `core.json`, the tab loops on `/muscle` forever.
 * Swap that for a custom event so the client re-merges resource bundles without navigation.
 */
export function i18nLocaleHmr(): Plugin {
  return {
    name: 'i18n-locale-hmr',
    handleHotUpdate({ file, server, modules }) {
      if (!isLocaleJsonFile(file)) return;

      for (const mod of modules) {
        server.moduleGraph.invalidateModule(mod);
      }

      server.ws.send({ type: 'custom', event: 'locales-update', data: { file } });
      return [];
    },
  };
}
