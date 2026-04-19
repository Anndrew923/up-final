import type { ScoreMap } from '../types/scoring';
import type { CardioInputsPersisted } from '../types/cardioInputs';
import type { MuscleInputsPersisted } from '../types/muscleInputs';
import type { PowerInputsPersisted } from '../types/powerInputs';
import type { StrengthInputsPersisted } from '../types/strengthInputs';
import type { PhysicalProfile } from '../types/userProfile';
import { safeGetItem, safeRemoveItem, safeSetItem } from '../lib/safeLocalStorage';

const STORAGE_KEYS = {
  profile: 'up.profile',
  scores: 'up.scores',
  history: 'up.history',
  physicalProfile: 'up.physicalProfile',
  ffmiDraft: 'up.ffmiDraft',
  cardioInputs: 'up.cardioInputs',
  muscleInputs: 'up.muscleInputs',
  powerInputs: 'up.powerInputs',
  strengthInputs: 'up.strengthInputs',
} as const;

/** Same-tab/cross-tab: HUD & consumers can subscribe via `LOCAL_PROFILE_CHANGED_EVENT`. */
export const PROFILE_STORAGE_KEY = STORAGE_KEYS.profile;
export const LOCAL_PROFILE_CHANGED_EVENT = 'up-final-local-profile-changed';

export const PHYSICAL_PROFILE_STORAGE_KEY = STORAGE_KEYS.physicalProfile;
export const LOCAL_PHYSICAL_PROFILE_CHANGED_EVENT = 'up-final-physical-profile-changed';

export const CARDIO_INPUTS_STORAGE_KEY = STORAGE_KEYS.cardioInputs;
export const LOCAL_CARDIO_INPUTS_CHANGED_EVENT = 'up-final-cardio-inputs-changed';

export const MUSCLE_INPUTS_STORAGE_KEY = STORAGE_KEYS.muscleInputs;
export const LOCAL_MUSCLE_INPUTS_CHANGED_EVENT = 'up-final-muscle-inputs-changed';

export const POWER_INPUTS_STORAGE_KEY = STORAGE_KEYS.powerInputs;
export const LOCAL_POWER_INPUTS_CHANGED_EVENT = 'up-final-power-inputs-changed';

export const STRENGTH_INPUTS_STORAGE_KEY = STORAGE_KEYS.strengthInputs;
export const LOCAL_STRENGTH_INPUTS_CHANGED_EVENT = 'up-final-strength-inputs-changed';

function notifyProfileObservers(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(LOCAL_PROFILE_CHANGED_EVENT));
}

function notifyPhysicalProfileObservers(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(LOCAL_PHYSICAL_PROFILE_CHANGED_EVENT));
}

function notifyCardioInputsObservers(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(LOCAL_CARDIO_INPUTS_CHANGED_EVENT));
}

function notifyMuscleInputsObservers(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(LOCAL_MUSCLE_INPUTS_CHANGED_EVENT));
}

function notifyPowerInputsObservers(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(LOCAL_POWER_INPUTS_CHANGED_EVENT));
}

function notifyStrengthInputsObservers(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(LOCAL_STRENGTH_INPUTS_CHANGED_EVENT));
}

export interface LocalProfile {
  uid: string;
  displayName?: string;
  updatedAt: string;
}

export interface LocalHistoryRecord {
  id: string;
  createdAt: string;
  scores: ScoreMap;
  overallScore: number;
  note?: string;
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function saveProfile(profile: LocalProfile): void {
  safeSetItem(STORAGE_KEYS.profile, JSON.stringify(profile));
  notifyProfileObservers();
}

export function loadProfile(): LocalProfile | null {
  return safeParse<LocalProfile | null>(safeGetItem(STORAGE_KEYS.profile), null);
}

export function savePhysicalProfile(profile: PhysicalProfile): void {
  safeSetItem(STORAGE_KEYS.physicalProfile, JSON.stringify(profile));
  notifyPhysicalProfileObservers();
}

export function loadPhysicalProfile(): PhysicalProfile | null {
  return safeParse<PhysicalProfile | null>(safeGetItem(STORAGE_KEYS.physicalProfile), null);
}

/** React `useSyncExternalStore` subscription — re-read after `savePhysicalProfile`. */
export function subscribePhysicalProfile(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(LOCAL_PHYSICAL_PROFILE_CHANGED_EVENT, onChange);
  return () => window.removeEventListener(LOCAL_PHYSICAL_PROFILE_CHANGED_EVENT, onChange);
}

export interface FfmiDraft {
  bodyFatPctInput: string;
}

export function saveFfmiDraft(draft: FfmiDraft): void {
  safeSetItem(STORAGE_KEYS.ffmiDraft, JSON.stringify(draft));
}

export function loadFfmiDraft(): FfmiDraft | null {
  return safeParse<FfmiDraft | null>(safeGetItem(STORAGE_KEYS.ffmiDraft), null);
}

export function saveCardioInputs(inputs: CardioInputsPersisted): void {
  safeSetItem(STORAGE_KEYS.cardioInputs, JSON.stringify(inputs));
  notifyCardioInputsObservers();
}

export function loadCardioInputs(): CardioInputsPersisted | null {
  return safeParse<CardioInputsPersisted | null>(safeGetItem(STORAGE_KEYS.cardioInputs), null);
}

/** Subscribe for `useSyncExternalStore` / hooks after `saveCardioInputs`. */
export function subscribeCardioInputs(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(LOCAL_CARDIO_INPUTS_CHANGED_EVENT, onChange);
  return () => window.removeEventListener(LOCAL_CARDIO_INPUTS_CHANGED_EVENT, onChange);
}

export function saveMuscleInputs(inputs: MuscleInputsPersisted): void {
  safeSetItem(STORAGE_KEYS.muscleInputs, JSON.stringify(inputs));
  notifyMuscleInputsObservers();
}

export function loadMuscleInputs(): MuscleInputsPersisted | null {
  return safeParse<MuscleInputsPersisted | null>(safeGetItem(STORAGE_KEYS.muscleInputs), null);
}

export function subscribeMuscleInputs(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(LOCAL_MUSCLE_INPUTS_CHANGED_EVENT, onChange);
  return () => window.removeEventListener(LOCAL_MUSCLE_INPUTS_CHANGED_EVENT, onChange);
}

export function savePowerInputs(inputs: PowerInputsPersisted): void {
  safeSetItem(STORAGE_KEYS.powerInputs, JSON.stringify(inputs));
  notifyPowerInputsObservers();
}

export function loadPowerInputs(): PowerInputsPersisted | null {
  return safeParse<PowerInputsPersisted | null>(safeGetItem(STORAGE_KEYS.powerInputs), null);
}

export function subscribePowerInputs(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(LOCAL_POWER_INPUTS_CHANGED_EVENT, onChange);
  return () => window.removeEventListener(LOCAL_POWER_INPUTS_CHANGED_EVENT, onChange);
}

export function saveStrengthInputs(inputs: StrengthInputsPersisted): void {
  safeSetItem(STORAGE_KEYS.strengthInputs, JSON.stringify(inputs));
  notifyStrengthInputsObservers();
}

export function loadStrengthInputs(): StrengthInputsPersisted | null {
  return safeParse<StrengthInputsPersisted | null>(safeGetItem(STORAGE_KEYS.strengthInputs), null);
}

export function subscribeStrengthInputs(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(LOCAL_STRENGTH_INPUTS_CHANGED_EVENT, onChange);
  return () => window.removeEventListener(LOCAL_STRENGTH_INPUTS_CHANGED_EVENT, onChange);
}

export function saveScores(scores: ScoreMap): void {
  safeSetItem(STORAGE_KEYS.scores, JSON.stringify(scores));
}

export function loadScores(): ScoreMap {
  return safeParse<ScoreMap>(safeGetItem(STORAGE_KEYS.scores), {});
}

export function saveHistory(records: LocalHistoryRecord[]): void {
  safeSetItem(STORAGE_KEYS.history, JSON.stringify(records));
}

export function loadHistory(): LocalHistoryRecord[] {
  return safeParse<LocalHistoryRecord[]>(safeGetItem(STORAGE_KEYS.history), []);
}

export function appendHistory(record: LocalHistoryRecord, maxRecords = 200): LocalHistoryRecord[] {
  const current = loadHistory();
  const next = [record, ...current].slice(0, maxRecords);
  saveHistory(next);
  return next;
}

export function clearLocalData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => safeRemoveItem(key));
  notifyProfileObservers();
  notifyPhysicalProfileObservers();
  notifyCardioInputsObservers();
  notifyMuscleInputsObservers();
  notifyPowerInputsObservers();
  notifyStrengthInputsObservers();
}
