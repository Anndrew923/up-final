import { describe, expect, it } from 'vitest';
import {
  KG_TO_LB,
  cmToIn,
  formatLength,
  formatLengthInput,
  formatWeight,
  formatWeightInput,
  inToCm,
  kgToLb,
  lbToKg,
  parseInputToMetric,
  reprojectDisplayInput,
  toDisplayLength,
  toDisplayWeight,
  trainingUnitToUnitSystem,
  unitSystemToTrainingUnit,
  snapNearMetricLimit,
} from '../unitConverters';

describe('unitConverters constants', () => {
  it('uses NIST kg→lb factor', () => {
    expect(KG_TO_LB).toBe(2.2046226218);
  });
});

describe('weight round-trip', () => {
  it.each([0, 1, 35, 100, 220.5, 250])('kg→lb→kg error < 0.001 for %s kg', (kg) => {
    const back = lbToKg(kgToLb(kg));
    expect(Math.abs(back - kg)).toBeLessThan(0.001);
  });

  it.each([0, 45, 135, 225, 315])('lb→kg→lb error < 0.001 for %s lb', (lb) => {
    const back = kgToLb(lbToKg(lb));
    expect(Math.abs(back - lb)).toBeLessThan(0.001);
  });
});

describe('length round-trip', () => {
  it.each([0, 1, 120, 175.5, 230])('cm→in→cm error < 0.001 for %s cm', (cm) => {
    const back = inToCm(cmToIn(cm));
    expect(Math.abs(back - cm)).toBeLessThan(0.001);
  });

  it.each([0, 12, 48, 70, 90])('in→cm→in error < 0.001 for %s in', (inches) => {
    const back = cmToIn(inToCm(inches));
    expect(Math.abs(back - inches)).toBeLessThan(0.001);
  });
});

describe('parseInputToMetric', () => {
  it('parses metric weight/length as-is', () => {
    expect(parseInputToMetric('100', 'weight', 'metric')).toBe(100);
    expect(parseInputToMetric('175.5', 'length', 'metric')).toBe(175.5);
  });

  it('parses imperial weight/length into kg/cm', () => {
    expect(parseInputToMetric('220.46226218', 'weight', 'imperial')).toBeCloseTo(100, 6);
    expect(parseInputToMetric('70', 'length', 'imperial')).toBeCloseTo(177.8, 6);
  });

  it('returns null for empty / invalid / negative', () => {
    expect(parseInputToMetric('', 'weight', 'metric')).toBeNull();
    expect(parseInputToMetric('abc', 'length', 'imperial')).toBeNull();
    expect(parseInputToMetric(-1, 'weight', 'metric')).toBeNull();
  });
});

describe('display projection + format', () => {
  it('projects and formats weight', () => {
    expect(toDisplayWeight(100, 'metric')).toBe(100);
    expect(toDisplayWeight(100, 'imperial')).toBeCloseTo(220.46226218, 6);
    expect(formatWeight(100, 'metric')).toBe('100 kg');
    expect(formatWeight(100, 'imperial', { digits: 1 })).toBe('220.5 lb');
    expect(formatWeightInput(100, 'imperial', 1)).toBe('220.5');
  });

  it('projects and formats length', () => {
    expect(toDisplayLength(177.8, 'metric')).toBe(177.8);
    expect(toDisplayLength(177.8, 'imperial')).toBeCloseTo(70, 6);
    expect(formatLength(177.8, 'metric')).toBe('177.8 cm');
    expect(formatLength(177.8, 'imperial', { digits: 1 })).toBe('70 in');
    expect(formatLengthInput(177.8, 'imperial', 1)).toBe('70');
  });
});

describe('reprojectDisplayInput', () => {
  it('round-trips display strings across systems within 0.001 metric', () => {
    const imperial = reprojectDisplayInput('100', 'weight', 'metric', 'imperial', 4);
    const back = reprojectDisplayInput(imperial, 'weight', 'imperial', 'metric', 4);
    const metric = parseInputToMetric(back, 'weight', 'metric');
    expect(metric).not.toBeNull();
    expect(Math.abs(metric! - 100)).toBeLessThan(0.001);
  });

  it('keeps empty and invalid inputs stable', () => {
    expect(reprojectDisplayInput('', 'length', 'metric', 'imperial')).toBe('');
    expect(reprojectDisplayInput('nope', 'length', 'metric', 'imperial')).toBe('nope');
  });
});

describe('training unit mapping', () => {
  it('maps unitSystem ↔ TrainingUnit', () => {
    expect(unitSystemToTrainingUnit('metric')).toBe('kg');
    expect(unitSystemToTrainingUnit('imperial')).toBe('lb');
    expect(trainingUnitToUnitSystem('kg')).toBe('metric');
    expect(trainingUnitToUnitSystem('lb')).toBe('imperial');
  });
});

describe('snapNearMetricLimit', () => {
  it('snaps values within epsilon onto exact limit', () => {
    expect(snapNearMetricLimit(119.888, 120, 0.15)).toBe(120);
    expect(snapNearMetricLimit(119.5, 120, 0.15)).toBe(119.5);
  });
});
