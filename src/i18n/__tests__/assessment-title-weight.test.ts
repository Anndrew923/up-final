import { describe, expect, it } from 'vitest';
import assessment from '../locales/en/common/assessment.json';
import armSize from '../locales/en/common/armSize.json';
import cardio from '../locales/en/common/cardio.json';
import ffmi from '../locales/en/common/ffmi.json';
import grip from '../locales/en/common/grip.json';
import home from '../locales/en/common/home.json';
import strength from '../locales/en/common/strength.json';
import tools from '../locales/en/common/tools.json';

describe('English assessment title weight', () => {
  it('uses compact Test labels only on dedicated assessment page titles', () => {
    expect(strength.strength.title).toBe('Strength Test');
    expect(grip.grip.title).toBe('Grip Strength Test');
    expect(cardio.cardio.title).toBe('Cardio Test');
    expect(ffmi.ffmi.title).toBe('FFMI Test');
    expect(armSize.armSize.title).toBe('Arm Size Test');
  });

  it('uses ultra-compact EN lobby titles so dual-column cards do not truncate at ~360px', () => {
    expect(assessment.assessment.grip.title).toBe('Grip');
    expect(assessment.assessment.explosive.title).toBe('Power');
    expect(assessment.assessment.muscle.title).toBe('Muscle');
    expect(assessment.assessment.armSize.title).toBe('Arm');
    expect(tools.tools.somatotypeLab.entry.title).toBe('Somatochart');
  });

  it('keeps the home console title as a full-width centered PERFORMANCE MAP label', () => {
    expect(home.home.radarOverview).toBe('PERFORMANCE MAP');
  });

  it('uses Scoring Guide for the shared and supplemental reference labels', () => {
    expect(assessment.assessment.referenceInfo.title).toBe('Scoring Guide');
    expect(grip.grip.referenceInfo.title).toBe('Scoring Guide');
    expect(armSize.armSize.referenceInfo.title).toBe('Scoring Guide');
  });
});
