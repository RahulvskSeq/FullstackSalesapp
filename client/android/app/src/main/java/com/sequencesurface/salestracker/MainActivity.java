package com.sequencesurface.salestracker;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

/**
 * Keeps the web view clear of the system bars.
 *
 * targetSdk 35 means Android 15 lays every app out edge-to-edge, so the web
 * view is drawn BEHIND the status bar and the navigation bar: the app's top row
 * landed on the phone's clock and the last card sat under the nav buttons.
 *
 * CSS env(safe-area-inset-*) is the usual answer but Android's WebView often
 * reports it as 0, so the insets are read natively instead.
 *
 * Attached to the WEB VIEW rather than android.R.id.content: Capacitor builds
 * its own view hierarchy inside the content frame, and a listener on the outer
 * frame can be beaten to the insets by a child that consumes them first.
 * requestApplyInsets() forces a dispatch, because the first pass usually
 * happens before onCreate returns and would otherwise never reach us.
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        final View target = (getBridge() != null && getBridge().getWebView() != null)
            ? (View) getBridge().getWebView()
            : findViewById(android.R.id.content);
        if (target == null) return;

        ViewCompat.setOnApplyWindowInsetsListener(target, (v, windowInsets) -> {
            Insets bars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            // Pass the insets on rather than consuming them, so the keyboard
            // inset still reaches the web view and inputs aren't hidden.
            return windowInsets;
        });

        // The view may already be laid out by now; without this the listener
        // sits idle until something else triggers a dispatch (a rotation, the
        // keyboard) and the app looks unfixed on first launch.
        target.post(() -> ViewCompat.requestApplyInsets(target));
    }
}
