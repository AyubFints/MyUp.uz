package uz.axmap.app;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.browser.customtabs.CustomTabsCallback;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class LauncherActivity
        extends com.google.androidbrowserhelper.trusted.LauncherActivity {

    private static final String TAG = "AX-Map";
    private static final int RC_LOCATION = 1001;
    private boolean mFallbackLaunched = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        requestNativeLocationIfNeeded();
        try {
            super.onCreate(savedInstanceState);
        } catch (Throwable t) {
            Log.e(TAG, "LauncherActivity.onCreate error, falling back to WebView", t);
            launchFallback();
        }
    }

    private void requestNativeLocationIfNeeded() {
        try {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                    != PackageManager.PERMISSION_GRANTED) {
                Log.d(TAG, "Native location permission not granted, requesting from OS...");
                ActivityCompat.requestPermissions(
                        this,
                        new String[]{
                                Manifest.permission.ACCESS_FINE_LOCATION,
                                Manifest.permission.ACCESS_COARSE_LOCATION
                        },
                        RC_LOCATION
                );
            }
        } catch (Throwable t) {
            Log.w(TAG, "Could not request native location permission", t);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == RC_LOCATION) {
            Log.d(TAG, "Native location permission result received");
        }
    }

    @Override
    protected void launchTwa() {
        try {
            super.launchTwa();
        } catch (Throwable t) {
            Log.e(TAG, "LauncherActivity.launchTwa error, falling back to WebView", t);
            launchFallback();
        }
    }

    @Override
    protected CustomTabsCallback getCustomTabsCallback() {
        // Safe no-crash callback: overrides QualityEnforcer to prevent app crashes
        // on network delays, missing DAL verification, or transient custom tab errors.
        return new CustomTabsCallback() {
            @Override
            public void onNavigationEvent(int navigationEvent, Bundle extras) {
                super.onNavigationEvent(navigationEvent, extras);
            }

            @Override
            public Bundle extraCallbackWithResult(String callbackName, Bundle args) {
                // Intercept and swallow quality_enforcement.crash
                return Bundle.EMPTY;
            }
        };
    }

    private synchronized void launchFallback() {
        if (mFallbackLaunched) {
            return;
        }
        mFallbackLaunched = true;
        try {
            String url = getString(R.string.launchUrl);
            Uri uri = Uri.parse(url);
            Intent intent = new Intent(this, com.google.androidbrowserhelper.trusted.WebViewFallbackActivity.class);
            intent.putExtra("com.google.browser.examples.twawebviewfallback.WebViewFallbackActivity.LAUNCH_URL", uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(intent);
            finish();
        } catch (Throwable t2) {
            Log.e(TAG, "WebView fallback failed, opening browser", t2);
            try {
                String url = getString(R.string.launchUrl);
                Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(browserIntent);
                finish();
            } catch (Throwable t3) {
                Log.e(TAG, "Browser launch failed", t3);
            }
        }
    }
}
