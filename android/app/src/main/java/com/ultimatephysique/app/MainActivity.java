package com.ultimatephysique.app;

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
 */
public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
  }
}
