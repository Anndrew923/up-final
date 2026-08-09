import { describe, expect, it } from 'vitest';
import { enCommon, zhHantCommon } from './locales/common';

/** Keeps `common` in zh-Hant aligned with `en` — avoids silent English fallback for new keys. */
const ALLOWED_EMPTY_ZH_PATHS = new Set<string>(['common.home.overallFormula']);

function assertZhMirrorsEnShape(enVal: unknown, zhVal: unknown, path: string): void {
  if (typeof enVal === 'string') {
    expect(typeof zhVal, path).toBe('string');
    if (enVal.trim().length === 0 || ALLOWED_EMPTY_ZH_PATHS.has(path)) {
      return;
    }
    expect((zhVal as string).trim().length, path).toBeGreaterThan(0);
    return;
  }
  // WHY: About credentials / vision goals / advisor highlights are intentional string lists
  // (and advisor cards are object lists) consumed via `returnObjects` + aboutI18n helpers.
  if (Array.isArray(enVal)) {
    expect(Array.isArray(zhVal), path).toBe(true);
    const enArr = enVal as unknown[];
    const zhArr = zhVal as unknown[];
    expect(zhArr.length, path).toBe(enArr.length);
    for (let i = 0; i < enArr.length; i += 1) {
      assertZhMirrorsEnShape(enArr[i], zhArr[i], `${path}[${i}]`);
    }
    return;
  }
  expect(enVal, path).toEqual(expect.any(Object));
  expect(zhVal, path).toEqual(expect.any(Object));
  expect(Array.isArray(zhVal), path).toBe(false);
  const enObj = enVal as Record<string, unknown>;
  const zhObj = zhVal as Record<string, unknown>;
  for (const k of Object.keys(enObj)) {
    expect(zhObj, `${path}.${k}`).toHaveProperty(k);
    assertZhMirrorsEnShape(enObj[k], zhObj[k], `${path}.${k}`);
  }
}

describe('locale parity (common)', () => {
  it('zh-Hant common tree matches en shape with non-empty strings', () => {
    assertZhMirrorsEnShape(enCommon, zhHantCommon, 'common');
  });
});
