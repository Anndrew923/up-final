import type { LocalHistoryRecord } from './localStorageService';
import type { ScoreMap } from '../types/scoring';

export interface CloudBackupPayload {
  scores: ScoreMap;
  history: LocalHistoryRecord[];
  updatedAt: string;
}

export interface LocalCloudAdapter {
  isAvailable(): Promise<boolean>;
  backup(payload: CloudBackupPayload): Promise<void>;
  restore(): Promise<CloudBackupPayload | null>;
}

export const noopLocalCloudAdapter: LocalCloudAdapter = {
  async isAvailable() {
    return false;
  },
  async backup() {
    return;
  },
  async restore() {
    return null;
  },
};
