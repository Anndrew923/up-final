import { describe, expect, it } from 'vitest';
import enCommon from './locales/en/common.json';
import zhCommon from './locales/zh-Hant/common.json';

/** Keeps `history` in zh-Hant aligned with `en` — avoids silent English fallback for new keys. */
function assertZhMirrorsEnShape(enVal: unknown, zhVal: unknown, path: string): void {
  if (typeof enVal === 'string') {
    expect(typeof zhVal, path).toBe('string');
    expect((zhVal as string).trim().length, path).toBeGreaterThan(0);
    return;
  }
  expect(enVal, path).toEqual(expect.any(Object));
  expect(zhVal, path).toEqual(expect.any(Object));
  expect(Array.isArray(enVal), path).toBe(false);
  expect(Array.isArray(zhVal), path).toBe(false);
  const enObj = enVal as Record<string, unknown>;
  const zhObj = zhVal as Record<string, unknown>;
  for (const k of Object.keys(enObj)) {
    expect(zhObj, `${path}.${k}`).toHaveProperty(k);
    assertZhMirrorsEnShape(enObj[k], zhObj[k], `${path}.${k}`);
  }
}

describe('locale parity (common)', () => {
  it('zh-Hant history subtree matches en shape with non-empty strings', () => {
    assertZhMirrorsEnShape(enCommon.history, zhCommon.history, 'history');
  });
});
