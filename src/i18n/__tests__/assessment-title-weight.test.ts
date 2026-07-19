import { describe, expect, it } from 'vitest';
import assessment from '../locales/en/common/assessment.json';
import armSize from '../locales/en/common/armSize.json';
import cardio from '../locales/en/common/cardio.json';
import ffmi from '../locales/en/common/ffmi.json';
import grip from '../locales/en/common/grip.json';
import strength from '../locales/en/common/strength.json';

describe('English assessment title weight', () => {
  it('uses compact Test labels only on the approved assessment surfaces', () => {
    expect(strength.strength.title).toBe('Strength Test');
    expect(grip.grip.title).toBe('Grip Strength Test');
    expect(cardio.cardio.title).toBe('Cardio Test');
    expect(ffmi.ffmi.title).toBe('FFMI Test');
    expect(armSize.armSize.title).toBe('Arm Size Test');
    expect(assessment.assessment.grip.title).toBe('Grip Test (Traction // GRIP)');
    expect(assessment.assessment.armSize.title).toBe('Arm Size Test (Forged Rims)');
  });

  it('uses Scoring Guide for the shared and supplemental reference labels', () => {
    expect(assessment.assessment.referenceInfo.title).toBe('Scoring Guide');
    expect(grip.grip.referenceInfo.title).toBe('Scoring Guide');
    expect(armSize.armSize.referenceInfo.title).toBe('Scoring Guide');
  });
});
