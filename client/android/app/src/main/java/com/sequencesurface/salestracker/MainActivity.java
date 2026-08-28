package com.sequencesurface.salestracker;

import android.os.Bundle;
import android.view.View;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

/**
 * Keeps the web view clear of the system bars.
 *
 * targetSdk 35 means Android 15 lays every app out edge-to-edge, so the web
 * view is drawn BEHIND the status bar and the navigation bar — the app's top
 * row landed on top of the phone's clock.
 *
 * CSS env(safe-area-inset-*) is the usual answer, but Android's WebView
 * frequently reports those as 0 because nothing hands it the insets. So we
 * read them natively and pad the content view instead, which works on every
 * device regardless of WebView version.
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        final View content = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(content, (v, windowInsets) -> {
            Insets bars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            // Pad rather than consume, so the keyboard and gesture insets still
            // reach anything else that cares about them.
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return windowInsets;
        });
    }
}
