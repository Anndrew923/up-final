import { describe, expect, it } from 'vitest';
import { AESTHETIC_AXIS_SUMMARY_AXES } from '../axisSummaryReport';
import { SINGLE_LEAF_IDS } from '../singleLeafReport';
import {
  CARBON_VERDICT_CRITIQUE_FONT_PX,
  CARBON_VERDICT_CRITIQUE_LINE1_OFFSET_Y,
  CARBON_VERDICT_CRITIQUE_LINE2_OFFSET_Y,
  CARBON_VERDICT_CRITIQUE_MAX_LINES,
  CARBON_VERDICT_CRITIQUE_MAX_WIDTH,
  CARBON_VERDICT_EPITHET_FONT_PX,
  CARBON_VERDICT_EPITHET_OFFSET_Y,
  EN_CRITIQUE_ORPHAN_MIN_CHARS,
  TELEMETRY_VERDICT_CATALOG,
  VERDICT_DECADE_KEYS,
  VERDICT_FAMILIES,
  ZH_CRITIQUE_ORPHAN_MIN_CHARS,
  estimateCritiqueGlyphWidth,
  resolveTelemetryVerdict,
  resolveTelemetryVerdictForTarget,
  resolveVerdictDecadeKey,
  resolveVerdictFamilyFromTarget,
  wrapCritiqueLines,
  wrapVerdictCritiqueLines,
  type VerdictFamily,
} from '../telemetryVerdictCatalog';

const SECOND_PERSON_RE = /[你您]|\byou(r|rs|'re)?\b/i;
/** Vehicle metaphors banned in SSOT — Chinese terms only (EN body "frame" / "aerobic" are allowed). */
const VEHICLE_RE = /馬力|底盤|引擎|車架|破風阻/;
const MAINLAND_RE = /信息|视频|软件|默认|数据量|里面|之后|什么|怎么|这个|那个/;

function zhLen(s: string): number {
  return Array.from(s).length;
}

describe('telemetryVerdictCatalog', () => {
  it('covers 7 families × 13 decades × zh/en (182 non-empty pairs)', () => {
    let pairs = 0;
    for (const family of VERDICT_FAMILIES) {
      for (const decade of VERDICT_DECADE_KEYS) {
        const entry = TELEMETRY_VERDICT_CATALOG[family][decade];
        expect(entry.zh[0].trim().length).toBeGreaterThan(0);
        expect(entry.zh[1].trim().length).toBeGreaterThan(0);
        expect(entry.en[0].trim().length).toBeGreaterThan(0);
        expect(entry.en[1].trim().length).toBeGreaterThan(0);
        pairs += 2;
      }
    }
    expect(VERDICT_FAMILIES).toHaveLength(7);
    expect(VERDICT_DECADE_KEYS).toHaveLength(13);
    expect(pairs).toBe(182);
  });

  it('enforces critique length gates and bans second-person / vehicle / mainland copy', () => {
    for (const family of VERDICT_FAMILIES) {
      for (const decade of VERDICT_DECADE_KEYS) {
        const entry = TELEMETRY_VERDICT_CATALOG[family][decade];
        const zhCritique = entry.zh[1];
        const enCritique = entry.en[1];
        const zhN = zhLen(zhCritique);
        // WHY: SSOT is immutable (product aspirational zh 18–30; manual edits up to ~37). EN ≤88 is hard gate.
        expect(zhN, `${family}@${decade} zh`).toBeGreaterThanOrEqual(18);
        expect(zhN, `${family}@${decade} zh=${zhCritique}`).toBeLessThanOrEqual(40);
        expect(enCritique.length, `${family}@${decade} en`).toBeGreaterThanOrEqual(55);
        expect(enCritique.length, `${family}@${decade} en`).toBeLessThanOrEqual(88);

        for (const text of [entry.zh[0], zhCritique, entry.en[0], enCritique]) {
          expect(SECOND_PERSON_RE.test(text)).toBe(false);
          expect(VEHICLE_RE.test(text)).toBe(false);
          expect(MAINLAND_RE.test(text)).toBe(false);
        }
      }
    }
  });

  it('maps every single-leaf and axis-summary target onto the correct family', () => {
    const expectedLeafFamily: Record<string, VerdictFamily> = {
      'strength.benchPress': 'strength',
      'strength.squat': 'strength',
      'strength.deadlift': 'strength',
      'strength.latPulldown': 'strength',
      'strength.shoulderPress': 'strength',
      'explosive.verticalJump': 'explosivePower',
      'explosive.standingLongJump': 'explosivePower',
      'explosive.sprint': 'explosivePower',
      grip: 'gripStrength',
      'cardio.cooper': 'cardio',
      'cardio.run5km': 'cardio',
      'muscle.smm': 'muscleMass',
      'muscle.smPercent': 'muscleMass',
      ffmi: 'bodyFat',
      armSize: 'armSize',
    };

    for (const leaf of SINGLE_LEAF_IDS) {
      expect(
        resolveVerdictFamilyFromTarget({ reportType: 'single-leaf', leaf })
      ).toBe(expectedLeafFamily[leaf]);
    }

    for (const axis of AESTHETIC_AXIS_SUMMARY_AXES) {
      expect(
        resolveVerdictFamilyFromTarget({ reportType: 'axis-summary', axis })
      ).toBe(axis);
    }
  });

  it('resolves decade + bilingual verdict from human-scale score ladder', () => {
    expect(resolveVerdictDecadeKey('strength', 80.31)).toBe(80);
    expect(resolveVerdictDecadeKey('strength', 39)).toBe(0);
    expect(resolveVerdictDecadeKey('strength', 165)).toBe(150);

    const zh = resolveTelemetryVerdict('strength', 80.31, 'zh');
    expect(zh.epithet).toBe('重載穩壓者');
    expect(zh.critique).toContain('紮實肌力');
    expect(zh.critiqueLines.join('')).toContain('紮實肌力');
    expect(zh.critiqueLines.length).toBeLessThanOrEqual(2);

    const en = resolveTelemetryVerdictForTarget(
      { reportType: 'single-leaf', leaf: 'ffmi' },
      100,
      'en'
    );
    expect(en.epithet).toBe('THRESHOLD BREACHED');
    expect(en.critique.startsWith('FFMI past the 100-point mark')).toBe(true);
    expect(en.critiqueLines.length).toBeGreaterThanOrEqual(1);

    const axis = resolveTelemetryVerdictForTarget(
      { reportType: 'axis-summary', axis: 'muscleMass' },
      70.4,
      'zh'
    );
    expect(axis.epithet).toBe('高密度肌群');
  });

  it('locks enlarged Carbon verdict type + 840px safety gutter', () => {
    expect(CARBON_VERDICT_EPITHET_FONT_PX).toBe(32);
    expect(CARBON_VERDICT_CRITIQUE_FONT_PX).toBe(26);
    expect(CARBON_VERDICT_CRITIQUE_MAX_WIDTH).toBe(840);
    expect(CARBON_VERDICT_EPITHET_OFFSET_Y).toBe(32);
    expect(CARBON_VERDICT_CRITIQUE_LINE1_OFFSET_Y).toBe(68);
    expect(CARBON_VERDICT_CRITIQUE_LINE2_OFFSET_Y).toBe(104);
    // Line2 middle + half critique glyph must stay inside 125px slot.
    expect(
      CARBON_VERDICT_CRITIQUE_LINE2_OFFSET_Y + CARBON_VERDICT_CRITIQUE_FONT_PX / 2
    ).toBeLessThanOrEqual(125);
    expect(
      CARBON_VERDICT_CRITIQUE_LINE2_OFFSET_Y - CARBON_VERDICT_CRITIQUE_LINE1_OFFSET_Y
    ).toBe(36);
  });

  it('balances long EN critique at em-dash (no orphan second line)', () => {
    const measure = (text: string) =>
      estimateCritiqueGlyphWidth(text, CARBON_VERDICT_CRITIQUE_FONT_PX);
    const critique = TELEMETRY_VERDICT_CATALOG.cardio[60].en[1];
    const lines = wrapCritiqueLines(
      measure,
      critique,
      CARBON_VERDICT_CRITIQUE_MAX_WIDTH,
      CARBON_VERDICT_CRITIQUE_MAX_LINES
    );
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/—$/);
    expect(lines[1]!.length).toBeGreaterThanOrEqual(EN_CRITIQUE_ORPHAN_MIN_CHARS);
    expect(lines[0]!.length).toBeGreaterThanOrEqual(EN_CRITIQUE_ORPHAN_MIN_CHARS);
    for (const line of lines) {
      expect(measure(line)).toBeLessThanOrEqual(CARBON_VERDICT_CRITIQUE_MAX_WIDTH);
    }
    expect(`${lines[0]}${lines[1]}`.replace(/\s+/g, ' ').trim()).toContain('daily life');
  });

  it('wraps all 182 catalog critiques into ≤2 balanced lines without orphans', () => {
    // WHY: Measure at live critique px so max-width gutter stays honest after type enlargement.
    const measure = (text: string) =>
      estimateCritiqueGlyphWidth(text, CARBON_VERDICT_CRITIQUE_FONT_PX);
    for (const family of VERDICT_FAMILIES) {
      for (const decade of VERDICT_DECADE_KEYS) {
        const entry = TELEMETRY_VERDICT_CATALOG[family][decade];
        for (const locale of ['zh', 'en'] as const) {
          const critique = entry[locale][1];
          const lines = wrapCritiqueLines(
            measure,
            critique,
            CARBON_VERDICT_CRITIQUE_MAX_WIDTH,
            CARBON_VERDICT_CRITIQUE_MAX_LINES
          );
          expect(lines.length, `${family}@${decade} ${locale}`).toBeGreaterThanOrEqual(1);
          expect(lines.length, `${family}@${decade} ${locale}`).toBeLessThanOrEqual(2);
          expect(lines.join(' ')).not.toContain('…');
          expect(lines.join(' ')).not.toContain('...');
          for (const line of lines) {
            expect(
              measure(line),
              `${family}@${decade} ${locale} line="${line}"`
            ).toBeLessThanOrEqual(CARBON_VERDICT_CRITIQUE_MAX_WIDTH);
          }
          if (lines.length === 2) {
            const orphanMin =
              locale === 'en' ? EN_CRITIQUE_ORPHAN_MIN_CHARS : ZH_CRITIQUE_ORPHAN_MIN_CHARS;
            expect(
              Array.from(lines[1]!).length,
              `${family}@${decade} ${locale} orphan="${lines[1]}"`
            ).toBeGreaterThanOrEqual(orphanMin);
            expect(
              Array.from(lines[0]!).length,
              `${family}@${decade} ${locale} head="${lines[0]}"`
            ).toBeGreaterThanOrEqual(orphanMin);
          }
        }
      }
    }
  });

  it('keeps short critiques on a single line', () => {
    expect(wrapVerdictCritiqueLines('SHORT LINE')).toEqual(['SHORT LINE']);
  });
});
