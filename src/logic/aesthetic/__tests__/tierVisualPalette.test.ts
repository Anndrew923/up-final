import { describe, expect, it } from 'vitest';
import { resolveTierVisualPalette } from '../tierVisualPalette';

describe('resolveTierVisualPalette', () => {
  it('maps sub-60 decades to cold zinc', () => {
    expect(resolveTierVisualPalette('0').band).toBe('zinc');
    expect(resolveTierVisualPalette('40').band).toBe('zinc');
    expect(resolveTierVisualPalette('50').band).toBe('zinc');
    expect(resolveTierVisualPalette(null).band).toBe('zinc');
  });

  it('maps decade 60 to electric cyan/sky', () => {
    expect(resolveTierVisualPalette('60').band).toBe('cyan');
    expect(resolveTierVisualPalette('60').scoreTextClass).toContain('sky');
  });

  it('maps 70–90 to competition amber', () => {
    expect(resolveTierVisualPalette('70').band).toBe('amber');
    expect(resolveTierVisualPalette('90').band).toBe('amber');
  });

  it('maps 100–110 to track orange', () => {
    expect(resolveTierVisualPalette('100').band).toBe('orange');
    expect(resolveTierVisualPalette('110').band).toBe('orange');
  });

  it('maps 120–130 to limit violet', () => {
    expect(resolveTierVisualPalette('120').band).toBe('violet');
    expect(resolveTierVisualPalette('130').band).toBe('violet');
  });

  it('maps ≥140 to champagne gold', () => {
    expect(resolveTierVisualPalette('140').band).toBe('champagne');
    expect(resolveTierVisualPalette('150').band).toBe('champagne');
  });

  it('keeps badge hover fills hue-matched when interactive', () => {
    expect(resolveTierVisualPalette('60').badgeClass()).not.toContain('hover:bg-sky-500/20');
    expect(resolveTierVisualPalette('60').badgeClass(true)).toContain('hover:bg-sky-500/20');
    expect(resolveTierVisualPalette('80').badgeClass(true)).toContain('hover:bg-amber-500/20');
    expect(resolveTierVisualPalette('60').badgeClass(true)).not.toContain('hover:bg-amber-500/20');
  });
});
