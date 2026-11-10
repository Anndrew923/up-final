package com.ultimatephysique.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

/**
 * Capacitor bridge host.
 *
 * WHY: Android 15+ draws edge-to-edge by default. Disabling decor fits-system-windows lets the
 * WebView paint under status/nav bars so CSS {@code env(safe-area-inset-*)} receives real insets
 * (BottomNav, modals, AppShell scroll clearance). Without this, insets can stay 0 and chrome
 * collides with the system navigation bar.
 *
 * Club Progress Dispatch: create the HIGH-importance FCM channel in native {@code onCreate}
 * before JS/Capacitor bootstraps. Android freezes channel importance after first creation — if
 * FCM arrives first, the system may mint {@code club_dispatches} at DEFAULT and heads-up is lost.
 */
public class MainActivity extends BridgeActivity {
  /** Keep in sync with JS {@code CLUB_DISPATCH_ANDROID_CHANNEL_ID} + Functions constant + Manifest. */
  private static final String CLUB_DISPATCH_CHANNEL_ID = "club_dispatches";

  @Override
  public void onCreate(Bundle savedInstanceState) {
    ensureClubDispatchNotificationChannel();
    super.onCreate(savedInstanceState);
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
  }

  private void ensureClubDispatchNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return;
    }
    NotificationManager manager = getSystemService(NotificationManager.class);
    if (manager == null) {
      return;
    }
    NotificationChannel channel =
        new NotificationChannel(
            CLUB_DISPATCH_CHANNEL_ID,
            getString(R.string.club_dispatches_channel_name),
            NotificationManager.IMPORTANCE_HIGH);
    channel.setDescription(getString(R.string.club_dispatches_channel_description));
    channel.enableVibration(true);
    manager.createNotificationChannel(channel);
  }
}
