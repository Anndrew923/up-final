import type { ScoreMap } from '../types/scoring';
import type { CardioInputsPersisted } from '../types/cardioInputs';
import type { CardioAssessmentTab } from '../logic/core/cardioScoring';
import type { MuscleInputsPersisted } from '../types/muscleInputs';
import type { PowerInputsPersisted } from '../types/powerInputs';
import type { StrengthInputsPersisted } from '../types/strengthInputs';
import type { GripInputsPersisted } from '../types/gripInputs';
import type { ArmSizeInputsPersisted } from '../types/armSizeInputs';
import type { PhysicalProfile } from '../types/userProfile';
import { safeGetItem, safeRemoveItem, safeSetItem } from '../lib/safeLocalStorage';

const STORAGE_KEYS = {
  profile: 'up.profile',
  scores: 'up.scores',
  history: 'up.history',
  physicalProfile: 'up.physicalProfile',
  ffmiDraft: 'up.ffmiDraft',
  cardioInputs: 'up.cardioInputs',
  cardioActiveTab: 'up.cardioActiveTab',
  muscleInputs: 'up.muscleInputs',
  powerInputs: 'up.powerInputs',
  strengthInputs: 'up.strengthInputs',
  gripInputs: 'up.gripInputs',
  armSizeInputs: 'up.armSizeInputs',
  bootSequenceCompleted: 'up:completed-boot-sequence',
} as const;

/** First-run spotlight onboarding — persisted across sessions. */
export const BOOT_SEQUENCE_COMPLETED_KEY = STORAGE_KEYS.bootSequenceCompleted;

/** Same-tab/cross-tab: HUD & consumers can subscribe via `LOCAL_PROFILE_CHANGED_EVENT`. */
export const PROFILE_STORAGE_KEY = STORAGE_KEYS.profile;
export const LOCAL_PROFILE_CHANGED_EVENT = 'up-final-local-profile-changed';

export const PHYSICAL_PROFILE_STORAGE_KEY = STORAGE_KEYS.physicalProfile;
export const LOCAL_PHYSICAL_PROFILE_CHANGED_EVENT = 'up-final-physical-profile-changed';

export const CARDIO_INPUTS_STORAGE_KEY = STORAGE_KEYS.cardioInputs;
export const LOCAL_CARDIO_INPUTS_CHANGED_EVENT = 'up-final-cardio-inputs-changed';

export const CARDIO_ACTIVE_TAB_STORAGE_KEY = STORAGE_KEYS.cardioActiveTab;
export const LOCAL_CARDIO_ACTIVE_TAB_CHANGED_EVENT = 'up-final-cardio-active-tab-changed';

export type PersistedCardioActiveTab = CardioAssessmentTab;

export const MUSCLE_INPUTS_STORAGE_KEY = STORAGE_KEYS.muscleInputs;
export const LOCAL_MUSCLE_INPUTS_CHANGED_EVENT = 'up-final-muscle-inputs-changed';

export const POWER_INPUTS_STORAGE_KEY = STORAGE_KEYS.powerInputs;
export const LOCAL_POWER_INPUTS_CHANGED_EVENT = 'up-final-power-inputs-changed';

export const STRENGTH_INPUTS_STORAGE_KEY = STORAGE_KEYS.strengthInputs;
export const LOCAL_STRENGTH_INPUTS_CHANGED_EVENT = 'up-final-strength-inputs-changed';

export const GRIP_INPUTS_STORAGE_KEY = STORAGE_KEYS.gripInputs;
export const LOCAL_GRIP_INPUTS_CHANGED_EVENT = 'up-final-grip-inputs-changed';

export const ARM_SIZE_INPUTS_STORAGE_KEY = STORAGE_KEYS.armSizeInputs;
export const LOCAL_ARM_SIZE_INPUTS_CHANGED_EVENT = 'up-final-arm-size-inputs-changed';

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

function notifyGripInputsObservers(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(LOCAL_GRIP_INPUTS_CHANGED_EVENT));
}

function notifyArmSizeInputsObservers(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(LOCAL_ARM_SIZE_INPUTS_CHANGED_EVENT));
}

export interface LocalProfile {
  uid: string;
  displayName?: string;
  /** Compressed image data URL or HTTPS URL — used for leaderboard `avatarUrl` when uploading. */
  avatarUrl?: string;
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

function notifyCardioActiveTabObservers(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(LOCAL_CARDIO_ACTIVE_TAB_CHANGED_EVENT));
}

export function saveCardioActiveTab(tab: PersistedCardioActiveTab): void {
  safeSetItem(STORAGE_KEYS.cardioActiveTab, tab);
  notifyCardioActiveTabObservers();
}

export function loadCardioActiveTab(): PersistedCardioActiveTab {
  const raw = safeGetItem(STORAGE_KEYS.cardioActiveTab);
  return raw === '5km' ? '5km' : 'cooper';
}

export function subscribeCardioActiveTab(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(LOCAL_CARDIO_ACTIVE_TAB_CHANGED_EVENT, onChange);
  return () => window.removeEventListener(LOCAL_CARDIO_ACTIVE_TAB_CHANGED_EVENT, onChange);
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

export function saveGripInputs(inputs: GripInputsPersisted): void {
  safeSetItem(STORAGE_KEYS.gripInputs, JSON.stringify(inputs));
  notifyGripInputsObservers();
}

export function loadGripInputs(): GripInputsPersisted | null {
  return safeParse<GripInputsPersisted | null>(safeGetItem(STORAGE_KEYS.gripInputs), null);
}

export function subscribeGripInputs(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(LOCAL_GRIP_INPUTS_CHANGED_EVENT, onChange);
  return () => window.removeEventListener(LOCAL_GRIP_INPUTS_CHANGED_EVENT, onChange);
}

export function saveArmSizeInputs(inputs: ArmSizeInputsPersisted): void {
  safeSetItem(STORAGE_KEYS.armSizeInputs, JSON.stringify(inputs));
  notifyArmSizeInputsObservers();
}

export function loadArmSizeInputs(): ArmSizeInputsPersisted | null {
  return safeParse<ArmSizeInputsPersisted | null>(safeGetItem(STORAGE_KEYS.armSizeInputs), null);
}

export function subscribeArmSizeInputs(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(LOCAL_ARM_SIZE_INPUTS_CHANGED_EVENT, onChange);
  return () => window.removeEventListener(LOCAL_ARM_SIZE_INPUTS_CHANGED_EVENT, onChange);
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

export function loadBootSequenceCompleted(): boolean {
  return safeGetItem(BOOT_SEQUENCE_COMPLETED_KEY) === '1';
}

export function saveBootSequenceCompleted(completed: boolean): void {
  safeSetItem(BOOT_SEQUENCE_COMPLETED_KEY, completed ? '1' : '0');
}

export function clearLocalData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => safeRemoveItem(key));
  notifyProfileObservers();
  notifyPhysicalProfileObservers();
  notifyCardioInputsObservers();
  notifyMuscleInputsObservers();
  notifyPowerInputsObservers();
  notifyStrengthInputsObservers();
  notifyGripInputsObservers();
  notifyArmSizeInputsObservers();
}
