import { beforeAll, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';
import type { AestheticSpecCardModel } from '../../../hooks/useAestheticSpecCard';
import type { AestheticResolverOutput } from '../../../logic/aesthetic/aestheticTypes';
import AestheticSpecCard from '../AestheticSpecCard';
import { clampMeterFill } from '../AestheticMeter';
import {
  CERT_STAGE_MAX_H_CLASS,
  FOIL_HERO_STAMP_CLASS,
  FOIL_HERO_TITLE_CLASS,
  FOIL_HERO_WING_LEFT_CLASS,
  FOIL_HERO_WING_RIGHT_CLASS,
} from '../aestheticChrome';

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

  it('renders three trinity calipers without mecha leftovers', () => {
    const html = renderCard(model());
    expect(html).toContain('aspect-[9/16]');
    expect(html).toContain(CERT_STAGE_MAX_H_CLASS);
    expect(html).toContain(FOIL_HERO_STAMP_CLASS);
    expect(FOIL_HERO_STAMP_CLASS).toContain('overflow-visible');
    expect(FOIL_HERO_STAMP_CLASS).not.toContain('overflow-hidden');
    expect(FOIL_HERO_TITLE_CLASS).toContain('leading-normal');
    expect(FOIL_HERO_TITLE_CLASS).not.toContain('leading-none');
    expect(html).toContain('tracking-[0.2em]');
    expect(html).toContain('text-[clamp(1.2rem,4.8vw,1.45rem)]');
    expect(html).toContain('from-[#fff6d6]');
    expect(html).toContain('Songti_TC');
    expect(html).toContain('drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)]');
    expect(html).toContain(FOIL_HERO_WING_LEFT_CLASS);
    expect(html).toContain(FOIL_HERO_WING_RIGHT_CLASS);
    expect(html).toContain('data-testid="aesthetic-guilloche-crest"');
    expect(html).toContain('grid-cols-[7rem_1fr]');
    expect(html).toContain('自律狠人');
    expect(html).not.toContain('【');
    expect(html).not.toContain('】');
    expect(html).toContain('contents');
    expect(html).toContain(i18n.t('aesthetic.labels.visualMetric'));
    expect(html).toContain(i18n.t('aesthetic.labels.forceMetric'));
    expect(html).toContain(i18n.t('aesthetic.labels.kineticMetric'));
    expect(html).not.toContain(i18n.t('aesthetic.labels.gripMetric'));
    expect(html).toContain(i18n.t('aesthetic.labels.brandHeader'));
    expect(html).toContain('UP-Bruce #1234');
    expect(html).toContain('VERIFIED PHYSIOLOGICAL SPECIFICATION');
    expect(html).toContain('--fill:88.3%');
    expect(html).toContain('--fill:85%');
    expect(html).toContain('--fill:72%');
    expect(html).not.toContain('--fill:90%');
    expect(html).toContain('translate3d(var(--fill), -50%, 0)');
    expect(html).toContain('gap-y-5');
    // WHY: SpecRow must clamp title/subtitle so long zh force/kinetic copy cannot blow the 9:16 plate.
    expect(html).toContain('truncate text-[12px]');
    expect(html).toContain('line-clamp-2 text-[10px]');
    expect(html).not.toContain('<button');
    expect(html).not.toContain('ui-btn-primary');
    expect(html).not.toContain('挑戰此身形規格');
    expect(html).not.toContain('OVERFLOW');
    expect(html).not.toContain('OVERDRIVE');
    expect(html).not.toContain('TITAN GRIP');
    expect(html).not.toContain('repeating-linear-gradient(-45deg');
    expect(html).not.toContain('拿掉感覺');
    expect(html).not.toMatch(/id="[^"]*:/);
  });

  it('prints the English overall title without CJK brackets', async () => {
    await i18n.changeLanguage('en');
    try {
      const html = renderCard(model());
      expect(html).toContain('LOCKED IN');
      expect(html).not.toContain('【');
      expect(html).not.toContain('】');
      // WHY: Fixed 7rem kicker column keeps EN label widths from shifting title plumb lines.
      expect(html).toContain('grid-cols-[7rem_1fr]');
      expect(html).toContain('ABSOLUTE RIGIDITY');
      expect(html).toContain('VISUAL TENSION');
      expect(html).toContain('PRIMAL DRIVE');
    } finally {
      await i18n.changeLanguage('zh-Hant');
    }
  });

  it('shows 超限 on century visual and force scores only', () => {
    const html = renderCard(
      model({
        spec: spec({
          visual: { id: 'assassin', score: 111.62, unmeasured: false, bodyFatMissing: false },
          force: { id: '90', score: 103.33, unmeasured: false },
          kinetic: { id: '70', score: 72, unmeasured: false },
        }),
      })
    );
    expect(html.split('超限').length - 1).toBe(2);
    expect(html).not.toContain('極限握力');
    expect(html).not.toContain('泰坦認證');
    expect(html).not.toContain('OVERFLOW');
    expect(html).not.toContain('OVERDRIVE');
    expect(html).toContain('--fill:100%');
  });
});
