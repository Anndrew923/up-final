import { beforeAll, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';
import type { AestheticSpecCardModel } from '../../../hooks/useAestheticSpecCard';
import type { AestheticResolverOutput } from '../../../logic/aesthetic/aestheticTypes';
import AestheticSpecCard from '../AestheticSpecCard';
import { clampMeterFill } from '../AestheticMeter';
import { CERT_STAGE_MAX_H_CLASS, FOIL_HERO_TITLE_CLASS } from '../aestheticChrome';

function spec(over: Partial<AestheticResolverOutput> = {}): AestheticResolverOutput {
  return {
    overallTitleId: 'health',
    visual: { id: 'assassin', score: 88.3, unmeasured: false, bodyFatMissing: false },
    force: { id: '80', score: 85, unmeasured: false },
    kinetic: { id: '70', score: 72, unmeasured: false },
    hasTitanGrip: false,
    peakKg: null,
    ...over,
  };
}

function model(over: Partial<AestheticSpecCardModel> = {}): AestheticSpecCardModel {
  return {
    overallScore: 69.06,
    battleCode: 'UP-Bruce #1234',
    gender: 'male',
    bodyFatPct: 8,
    gripScore: 90,
    spec: spec(),
    ...over,
  };
}

function renderCard(cardModel: AestheticSpecCardModel): string {
  return renderToStaticMarkup(
    <I18nextProvider i18n={i18n}>
      <AestheticSpecCard model={cardModel} />
    </I18nextProvider>
  );
}

describe('clampMeterFill', () => {
  it('caps at 100 and treats missing as zero', () => {
    expect(clampMeterFill(null)).toBe(0);
    expect(clampMeterFill(88.3)).toBe(88.3);
    expect(clampMeterFill(140)).toBe(100);
    expect(clampMeterFill(-4)).toBe(0);
  });
});

describe('AestheticSpecCard certificate surface', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  it('renders four calipers without mecha leftovers', () => {
    const html = renderCard(model());
    expect(html).toContain('aspect-[9/16]');
    expect(html).toContain(CERT_STAGE_MAX_H_CLASS);
    expect(html).toContain(FOIL_HERO_TITLE_CLASS);
    expect(html).toContain('contents');
    expect(html).toContain('體態純度');
    expect(html).toContain('力量爆發');
    expect(html).toContain('心肺機能');
    expect(html).toContain('極限握力');
    expect(html).toContain('最強肉體 // 機體總戰力：');
    expect(html).toContain('UP-Bruce #1234');
    expect(html).toContain('VERIFIED PHYSIOLOGICAL SPECIFICATION');
    expect(html).toContain('--fill:88.3%');
    expect(html).toContain('--fill:85%');
    expect(html).toContain('--fill:72%');
    expect(html).toContain('--fill:90%');
    expect(html).toContain('translate3d(var(--fill), -50%, 0)');
    expect(html).not.toContain('<button');
    expect(html).not.toContain('ui-btn-primary');
    expect(html).not.toContain('挑戰此身形規格');
    expect(html).not.toContain('OVERFLOW');
    expect(html).not.toContain('TITAN GRIP');
    expect(html).not.toContain('drop-shadow');
    expect(html).not.toContain('repeating-linear-gradient(-45deg');
    expect(html).not.toContain('拿掉感覺');
    expect(html).not.toMatch(/id="[^"]*:/);
  });

  it('shows 超限 on century scores but never on the grip row', () => {
    const html = renderCard(
      model({
        gripScore: 110,
        spec: spec({
          visual: { id: 'assassin', score: 111.62, unmeasured: false, bodyFatMissing: false },
          force: { id: '90', score: 103.33, unmeasured: false },
          kinetic: { id: '70', score: 72, unmeasured: false },
          hasTitanGrip: false,
        }),
      })
    );
    expect(html.split('超限').length - 1).toBe(2);
    expect(html).not.toContain('泰坦認證');
    expect(html).not.toContain('OVERFLOW');
    expect(html).toContain('--fill:100%');
  });

  it('prints peak kg and unlocks 泰坦認證 only when titan is certified', () => {
    const html = renderCard(
      model({
        gripScore: 100.8,
        spec: spec({ hasTitanGrip: true, peakKg: 70.5 }),
      })
    );
    expect(html).toContain('70.5 KG');
    expect(html).toContain('泰坦認證');
    expect(html).not.toContain('TITAN GRIP');
  });

  it('falls back to 待檢測 when grip has neither score nor kg', () => {
    const html = renderCard(
      model({
        gripScore: null,
        spec: spec({ peakKg: null, hasTitanGrip: false }),
      })
    );
    expect(html).toContain('待檢測');
  });
});
