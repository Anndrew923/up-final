import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildClubDispatchAndroidChannel,
  CLUB_DISPATCH_ANDROID_CHANNEL,
  CLUB_DISPATCH_ANDROID_CHANNEL_ID,
  resolveClubDispatchAndroidChannelName,
} from '../pushNotificationChannel';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..');

describe('pushNotificationChannel', () => {
  it('locks club dispatch Android channel contract for heads-up banners', () => {
    expect(CLUB_DISPATCH_ANDROID_CHANNEL_ID).toBe('club_dispatches');
    expect(CLUB_DISPATCH_ANDROID_CHANNEL).toEqual({
      id: 'club_dispatches',
      name: '戰隊戰報通知',
      importance: 5,
      vibration: true,
    });
  });

  it('resolves channel display name by language tag', () => {
    expect(resolveClubDispatchAndroidChannelName('zh-Hant')).toBe('戰隊戰報通知');
    expect(resolveClubDispatchAndroidChannelName('zh-TW')).toBe('戰隊戰報通知');
    expect(resolveClubDispatchAndroidChannelName('en-US')).toBe('Club Dispatch Alerts');
    expect(buildClubDispatchAndroidChannel('en').name).toBe('Club Dispatch Alerts');
  });

  it('keeps channel id identical across Manifest, Functions constants, and MainActivity', () => {
    const id = CLUB_DISPATCH_ANDROID_CHANNEL_ID;
    const manifest = readFileSync(
      join(repoRoot, 'android/app/src/main/AndroidManifest.xml'),
      'utf8'
    );
    const constants = readFileSync(join(repoRoot, 'functions/shared/constants.js'), 'utf8');
    const mainActivity = readFileSync(
      join(repoRoot, 'android/app/src/main/java/com/ultimatephysique/app/MainActivity.java'),
      'utf8'
    );

    expect(manifest).toContain(
      'com.google.firebase.messaging.default_notification_channel_id'
    );
    expect(manifest).toContain(`android:value="${id}"`);
    expect(constants).toContain(`CLUB_DISPATCH_ANDROID_CHANNEL_ID = "${id}"`);
    expect(mainActivity).toContain(`CLUB_DISPATCH_CHANNEL_ID = "${id}"`);
  });
});
