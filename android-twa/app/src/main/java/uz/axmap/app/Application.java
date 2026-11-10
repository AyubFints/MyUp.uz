package uz.axmap.app;

import android.util.Log;

public class Application extends android.app.Application {
    private static final String TAG = "AX-Map";

    @Override
    public void onCreate() {
        super.onCreate();
        Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {
            Log.e(TAG, "Uncaught exception on thread: " + thread.getName(), throwable);
        });
    }
}
