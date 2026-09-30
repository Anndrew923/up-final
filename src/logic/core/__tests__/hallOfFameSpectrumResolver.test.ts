import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import clientMatrix from '../../../data/hallOfFameMatrix.json';
import {
  HALL_OF_FAME_SPECTRUM_AXIS_IDS,
  buildAxisHallLadder,
  buildHallSpectrumDecodePrompt,
  getBundledHallOfFameMatrix,
  type HallOfFameMatrixDoc,
} from '../hallOfFameSpectrumResolver';
import { HUMAN_SCALE_DECADE_KEYS } from '../humanScaleBandResolver';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const functionsMatrixPath = join(root, 'functions/dynoIntel/data/hallOfFameMatrix.v1.json');

const t = ((key: string) => {
  const match = /^dynoIntel\.humanPraise\.byDecade\.(\d+)\.populationClass$/.exec(key);
  if (match) return `CLASS_${match[1]}`;
  return key;
}) as TFunction;

describe('hallOfFameMatrix client↔functions parity', () => {
  it('mirrors functions/dynoIntel/data/hallOfFameMatrix.v1.json byte-for-byte structure', () => {
    const functionsMatrix = JSON.parse(readFileSync(functionsMatrixPath, 'utf8')) as HallOfFameMatrixDoc;
    expect(clientMatrix as HallOfFameMatrixDoc).toEqual(functionsMatrix);
    expect(getBundledHallOfFameMatrix()).toEqual(functionsMatrix);
  });

  it('locks axis ids and decade keys used by the spectrum ladder', () => {
    const matrix = clientMatrix as HallOfFameMatrixDoc;
    const axes = new Set((matrix.entries ?? []).map((entry) => entry.axisId));
    const decades = new Set((matrix.entries ?? []).map((entry) => entry.decadeKey));

    for (const axisId of HALL_OF_FAME_SPECTRUM_AXIS_IDS) {
      expect(axes.has(axisId)).toBe(true);
    }
    for (const decade of decades) {
      expect(HUMAN_SCALE_DECADE_KEYS).toContain(decade);
      expect(Number(decade)).toBeGreaterThanOrEqual(60);
    }
  });
});

describe('buildAxisHallLadder', () => {
  it('returns full decade ladder high→low with only the current rung named', () => {
    const rows = buildAxisHallLadder({
      axisId: 'strength',
      currentDecadeKey: '70',
      maxNamesOnCurrent: 2,
      t,
    });

    expect(rows.map((row) => row.decadeKey)).toEqual([...HUMAN_SCALE_DECADE_KEYS].reverse());
    expect(rows.every((row) => row.populationClass.startsWith('CLASS_'))).toBe(true);

    const current = rows.find((row) => row.isCurrent);
    expect(current?.decadeKey).toBe('70');
    expect(current?.representativeNames.length).toBeGreaterThan(0);
    expect(current?.representativeNames.length).toBeLessThanOrEqual(2);

    for (const row of rows) {
      if (!row.isCurrent) expect(row.representativeNames).toEqual([]);
    }
  });

  it('keeps celebrity names stable across repeated builds (no shuffle)', () => {
    const first = buildAxisHallLadder({
      axisId: 'strength',
      currentDecadeKey: '70',
      maxNamesOnCurrent: 2,
      t,
    });
    const second = buildAxisHallLadder({
      axisId: 'strength',
      currentDecadeKey: '70',
      maxNamesOnCurrent: 2,
      t,
    });
    expect(first.find((row) => row.isCurrent)?.representativeNames).toEqual(
      second.find((row) => row.isCurrent)?.representativeNames
    );
  });

  it('never attaches names below the celebrity floor decade (<60)', () => {
    const rows = buildAxisHallLadder({
      axisId: 'strength',
      currentDecadeKey: '50',
      maxNamesOnCurrent: 2,
      t,
    });
    const current = rows.find((row) => row.isCurrent);
    expect(current?.decadeKey).toBe('50');
    expect(current?.representativeNames).toEqual([]);
  });

  it('respects maxNamesOnCurrent=1', () => {
    const rows = buildAxisHallLadder({
      axisId: 'strength',
      currentDecadeKey: '70',
      maxNamesOnCurrent: 1,
      t,
    });
    expect(rows.find((row) => row.isCurrent)?.representativeNames).toHaveLength(1);
  });

  it('falls back unknown decade keys to the infant rung', () => {
    const rows = buildAxisHallLadder({
      axisId: 'strength',
      currentDecadeKey: 'not-a-decade',
      t,
    });
    expect(rows.find((row) => row.isCurrent)?.decadeKey).toBe('0');
    expect(rows.find((row) => row.isCurrent)?.representativeNames).toEqual([]);
  });

  it('returns empty names when the current cell has no anchors', () => {
    const emptyMatrix: HallOfFameMatrixDoc = {
      version: 'test',
      entries: [{ decadeKey: '70', axisId: 'strength', anchors: [] }],
    };
    const rows = buildAxisHallLadder({
      axisId: 'strength',
      currentDecadeKey: '70',
      matrix: emptyMatrix,
      t,
    });
    expect(rows.find((row) => row.isCurrent)?.representativeNames).toEqual([]);
  });

  it('prefers Latin-script names for EN locale when mixed with CJK', () => {
    const mixedMatrix: HallOfFameMatrixDoc = {
      version: 'test',
      entries: [
        {
          decadeKey: '70',
          axisId: 'strength',
          anchors: [
            { id: 'a', displayZh: '呂小軍' },
            { id: 'b', displayZh: 'Larry Wheels' },
            { id: 'c', displayZh: 'Ronnie Coleman' },
          ],
        },
      ],
    };
    const enRows = buildAxisHallLadder({
      axisId: 'strength',
      currentDecadeKey: '70',
      maxNamesOnCurrent: 2,
      matrix: mixedMatrix,
      locale: 'en',
      t,
    });
    expect(enRows.find((row) => row.isCurrent)?.representativeNames).toEqual([
      'Larry Wheels',
      'Ronnie Coleman',
    ]);

    const zhRows = buildAxisHallLadder({
      axisId: 'strength',
      currentDecadeKey: '70',
      maxNamesOnCurrent: 2,
      matrix: mixedMatrix,
      locale: 'zh-Hant',
      t,
    });
    expect(zhRows.find((row) => row.isCurrent)?.representativeNames).toEqual([
      '呂小軍',
      'Larry Wheels',
    ]);
  });
});

describe('buildHallSpectrumDecodePrompt', () => {
  it('builds zh and en cold scientific prompts', () => {
    expect(
      buildHallSpectrumDecodePrompt({
        axisLabel: '馬力',
        scoreDisplay: '76.80',
        populationClass: '進階訓練者',
      })
    ).toContain('直面生理常模');

    expect(
      buildHallSpectrumDecodePrompt({
        axisLabel: 'Horsepower',
        scoreDisplay: '76.80',
        populationClass: 'Advanced Lifter',
        locale: 'en',
      })
    ).toContain('Drop feelings');
  });
});
