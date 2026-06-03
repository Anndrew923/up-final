import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifestCopy from '../webInstallManifest.copy.json';

const PUBLIC_DIR = resolve(process.cwd(), 'public');

describe('public web manifest files', () => {
  for (const [locale, copy] of Object.entries(manifestCopy)) {
    it(`${copy.manifestFile} matches webInstallManifest.copy.json (${locale})`, () => {
      const raw = readFileSync(resolve(PUBLIC_DIR, copy.manifestFile), 'utf8');
      const onDisk = JSON.parse(raw) as {
        name: string;
        short_name: string;
        description: string;
        icons?: unknown[];
        start_url?: string;
        display?: string;
        background_color?: string;
        theme_color?: string;
      };

      expect(onDisk.name).toBe(copy.name);
      expect(onDisk.short_name).toBe(copy.short_name);
      expect(onDisk.description).toBe(copy.description);
      expect(onDisk).toMatchObject({
        start_url: '/',
        display: 'standalone',
        background_color: '#0A0A0A',
        theme_color: '#0A0A0A',
      });
      expect(onDisk.icons?.length).toBeGreaterThanOrEqual(2);
    });
  }
});
