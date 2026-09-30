package com.sequencesurface.salestracker;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;

import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

/**
 * Keeps the web view clear of the system bars.
 *
 * targetSdk 35 means Android 15 lays every app out edge-to-edge, so the web
 * view is drawn BEHIND the status bar and the navigation bar.
 *
 * Measured on an Android 15 emulator before this fix:
 *   window.innerHeight        915  (the full 2400px screen at dpr 2.625)
 *   env(safe-area-inset-top)    0
 *   #topbar getBoundingClientRect().top  0
 *
 * So two approaches are ruled out by evidence, not guesswork:
 *   - CSS env(safe-area-inset-*) reports 0 in Android's WebView, so the
 *     stylesheet alone can never fix this.
 *   - Padding the WebView itself does not shrink its web viewport; the page
 *     still measured the full screen height.
 *
 * Padding the web view's PARENT does work: the parent lays the web view out
 * smaller, so the page's own viewport shrinks and the top bar starts below
 * the status bar.
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        final View web = (getBridge() != null) ? (View) getBridge().getWebView() : null;
        final View target = (web != null && web.getParent() instanceof ViewGroup)
            ? (View) web.getParent()
            : findViewById(android.R.id.content);
        if (target == null) return;

        ViewCompat.setOnApplyWindowInsetsListener(target, (v, windowInsets) -> {
            Insets bars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            // Pass on rather than consume, so the keyboard inset still reaches
            // the web view and text inputs aren't hidden behind it.
            return windowInsets;
        });

        // The first inset dispatch happens before onCreate returns, so without
        // this the listener sits idle until a rotation or the keyboard.
        target.post(() -> ViewCompat.requestApplyInsets(target));
    }

    /**
     * Back goes back inside the app, one step at a time: the page decides
     * (window.__stpBack closes a popup, the menu, or returns to the previous
     * screen). Only when the page has nothing left to go back to does the app
     * leave — to the background, like other apps, so it opens where it was.
     * Without this, Android's default Back simply closed the app.
     */
    @Override
    public void onStart() {
        super.onStart();
        if (backHooked) return;
        backHooked = true;
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView web = (getBridge() != null) ? getBridge().getWebView() : null;
                if (web == null) { moveTaskToBack(true); return; }
                web.evaluateJavascript(
                    "(function(){try{return window.__stpBack?!!window.__stpBack():false}catch(e){return false}})()",
                    handled -> { if (!"true".equals(handled)) moveTaskToBack(true); });
            }
        });
    }

    private boolean backHooked = false;
}
