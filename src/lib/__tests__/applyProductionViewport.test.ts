import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { APP_VIEWPORT_CONTENT } from '../applyProductionViewport';

describe('APP_VIEWPORT_CONTENT', () => {
  it('stays byte-identical to the index.html viewport meta', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    expect(html).toContain(`content="${APP_VIEWPORT_CONTENT}"`);
    expect(APP_VIEWPORT_CONTENT).toContain('viewport-fit=cover');
  });
});
