/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildSomatotypeLabSnapshot } from '../../logic/core/somatotypeLab';
import {
  loadPhysicalProfile,
  loadSomatotypeLabInputs,
  saveArmSizeInputs,
  saveFfmiDraft,
  savePhysicalProfile,
  saveSomatotypeLabInputs,
  SOMATOTYPE_LAB_INPUTS_STORAGE_KEY,
} from '../../services/localStorageService';
import type { PhysicalProfile } from '../../types/userProfile';
import { readLabPrefill, useSomatotypeLab } from '../useSomatotypeLab';
import {
  useSomatotypeLabRitual,
  type UseSomatotypeLabRitualResult,
} from '../useSomatotypeLabRitual';

vi.mock('../../services/hapticService', () => ({
  hapticService: {
    trigger: vi.fn(async () => undefined),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../lib/motionPreference', () => ({
  prefersReducedMotion: () => true,
}));

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const memory = new Map<string, string>();

function installMemoryLocalStorage(): void {
  memory.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
    removeItem: (key: string) => {
      memory.delete(key);
    },
    clear: () => {
      memory.clear();
    },
    key: (index: number) => Array.from(memory.keys())[index] ?? null,
    get length() {
      return memory.size;
    },
  });
}

function sampleProfile(overrides: Partial<PhysicalProfile> = {}): PhysicalProfile {
  return {
    gender: 'male',
    age: 30,
    heightCm: 173,
    weightKg: 95,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('readLabPrefill / somatotype lab draft', () => {
  beforeEach(() => {
    installMemoryLocalStorage();
  });

  afterEach(() => {
    memory.clear();
    vi.unstubAllGlobals();
  });

  it('prefills body fat from ffmiDraft when armSizeInputs body fat is empty', () => {
    savePhysicalProfile(sampleProfile());
    saveFfmiDraft({ bodyFatPctInput: '13' });

    const prefill = readLabPrefill();

    expect(prefill.heightInput).toBe('173');
    expect(prefill.weightInput).toBe('95');
    expect(prefill.bodyFatInput).toBe('13');
    expect(prefill.wristInput).toBe('');
    expect(prefill.armGirthInput).toBe('');
  });

  it('prefers armSize body fat over ffmiDraft when both exist', () => {
    saveArmSizeInputs({ bodyFatPct: 12, armCircumferenceCm: 40 });
    saveFfmiDraft({ bodyFatPctInput: '22' });

    const prefill = readLabPrefill();

    expect(prefill.bodyFatInput).toBe('12');
    expect(prefill.armGirthInput).toBe('40');
  });

  it('ignores non-numeric ffmiDraft body fat strings', () => {
    saveFfmiDraft({ bodyFatPctInput: 'not-a-number' });

    expect(readLabPrefill().bodyFatInput).toBe('');
  });

  it('prefers lab draft (including wrist) over global fallbacks', () => {
    savePhysicalProfile(sampleProfile({ heightCm: 180, weightKg: 80 }));
    saveFfmiDraft({ bodyFatPctInput: '20' });
    saveSomatotypeLabInputs({
      heightCm: 173,
      weightKg: 95,
      bodyFatPct: 13,
      wristCm: 17,
      flexedArmGirthCm: 45,
      gender: 'male',
      isVeteran: true,
      physiqueTier: 'elite',
    });

    const prefill = readLabPrefill();

    expect(prefill).toEqual({
      heightInput: '173',
      weightInput: '95',
      bodyFatInput: '13',
      wristInput: '17',
      armGirthInput: '45',
      gender: 'male',
      isVeteran: true,
      physiqueTier: 'elite',
    });
  });
});

describe('runAnalysis persists lab-local draft', () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    memory.clear();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('saves full form including wrist on runAnalysis without touching physicalProfile', () => {
    const baseline = sampleProfile({ heightCm: 170, weightKg: 70 });
    savePhysicalProfile(baseline);

    const snap = buildSomatotypeLabSnapshot({
      heightCm: 173,
      weightKg: 95,
      bodyFatPct: 13,
      wristCm: 17.5,
      flexedArmGirthCm: 38,
      gender: 'female',
      isVeteran: false,
      physiqueTier: 'athletic',
    });
    expect(snap).not.toBeNull();

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root: Root = createRoot(container);
    let latest: UseSomatotypeLabRitualResult | null = null;

    function Harness() {
      latest = useSomatotypeLabRitual(true, snap);
      return null;
    }

    act(() => {
      root.render(<Harness />);
    });

    act(() => {
      latest!.runAnalysis();
    });

    const saved = loadSomatotypeLabInputs();
    expect(saved).toEqual({
      heightCm: snap!.metrics.heightCm,
      weightKg: snap!.metrics.weightKg,
      bodyFatPct: snap!.metrics.bodyFatPct,
      wristCm: snap!.metrics.wristCm,
      flexedArmGirthCm: snap!.metrics.flexedArmGirthCm,
      gender: snap!.gender,
      isVeteran: snap!.metrics.isVeteran,
      physiqueTier: snap!.physiqueTier,
    });
    expect(saved?.wristCm).toBe(17.5);
    expect(memory.has(SOMATOTYPE_LAB_INPUTS_STORAGE_KEY)).toBe(true);

    // Trial sandbox must not pollute the real baseline profile.
    expect(loadPhysicalProfile()).toEqual(baseline);

    const restored = readLabPrefill();
    expect(restored.wristInput).toBe('17.5');
    expect(restored.heightInput).toBe(String(snap!.metrics.heightCm));
    expect(restored.bodyFatInput).toBe(String(snap!.metrics.bodyFatPct));
    expect(restored.armGirthInput).toBe(String(snap!.metrics.flexedArmGirthCm));
    expect(restored.gender).toBe('female');
    expect(restored.physiqueTier).toBe('athletic');

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('hydrates useSomatotypeLab wrist/bodyFat from the saved lab draft', () => {
    saveSomatotypeLabInputs({
      heightCm: 173,
      weightKg: 95,
      bodyFatPct: 13,
      wristCm: 17,
      flexedArmGirthCm: 45,
      gender: 'male',
    });

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root: Root = createRoot(container);
    let latest: ReturnType<typeof useSomatotypeLab> | null = null;

    function Harness() {
      latest = useSomatotypeLab();
      return null;
    }

    act(() => {
      root.render(<Harness />);
    });

    expect(latest!.heightInput).toBe('173');
    expect(latest!.wristInput).toBe('17');
    expect(latest!.bodyFatInput).toBe('13');
    expect(latest!.armGirthInput).toBe('45');
    expect(latest!.snapshot).not.toBeNull();

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
