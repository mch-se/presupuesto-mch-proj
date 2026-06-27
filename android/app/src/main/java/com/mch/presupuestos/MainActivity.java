package com.mch.presupuestos;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "Contactos";
    private static final String PREFS_NAME = "mch_shared_file";
    private static final String KEY_FILE_NAME = "fileName";
    private static final String KEY_FILE_URI = "fileUri";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(SharedFilePlugin.class);
        registerPlugin(ContactsPermissionPlugin.class);
        registerPlugin(ContactPickerPlugin.class);
        super.onCreate(savedInstanceState);
        handleSharedFileIntent(getIntent(), false);
    }

    @Override
    protected void onPause() {
        Log.i(TAG, "[Contactos] MainActivity onPause");
        super.onPause();
    }

    @Override
    protected void onStop() {
        Log.i(TAG, "[Contactos] MainActivity onStop");
        super.onStop();
    }

    @Override
    protected void onDestroy() {
        Log.i(TAG, "[Contactos] MainActivity onDestroy");
        super.onDestroy();
    }

    @Override
    protected void onResume() {
        Log.i(TAG, "[Contactos] MainActivity onResume");
        super.onResume();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleSharedFileIntent(intent, true);
    }

    private void handleSharedFileIntent(Intent intent, boolean notifyWeb) {
        if (intent == null) return;

        Uri fileUri = extractFileUri(intent);
        if (fileUri == null) return;

        String fileName = resolveFileName(fileUri);
        if (!isSupportedFile(fileName)) return;

        getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_FILE_NAME, fileName)
            .putString(KEY_FILE_URI, fileUri.toString())
            .apply();

        if (notifyWeb && bridge != null) {
            bridge.triggerWindowJSEvent(
                "mchSharedFileReceived",
                "{\"fileName\":\"" + escapeJson(fileName) + "\"}"
            );
        }
    }

    private Uri extractFileUri(Intent intent) {
        String action = intent.getAction();

        if (Intent.ACTION_SEND.equals(action)) {
            return intent.getParcelableExtra(Intent.EXTRA_STREAM);
        }

        if (Intent.ACTION_VIEW.equals(action)) {
            return intent.getData();
        }

        return null;
    }

    private String resolveFileName(Uri uri) {
        if (uri == null) return "";

        if ("content".equals(uri.getScheme())) {
            try (Cursor cursor = getContentResolver().query(uri, null, null, null, null)) {
                if (cursor != null && cursor.moveToFirst()) {
                    int nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                    if (nameIndex >= 0) {
                        String displayName = cursor.getString(nameIndex);
                        if (displayName != null && !displayName.isEmpty()) {
                            return displayName;
                        }
                    }
                }
            } catch (Exception ignored) {
            }
        }

        String path = uri.getPath();
        if (path == null || path.isEmpty()) return "";

        int lastSlash = path.lastIndexOf('/');
        return lastSlash >= 0 ? path.substring(lastSlash + 1) : path;
    }

    private boolean isSupportedFile(String fileName) {
        String lowerName = fileName == null ? "" : fileName.toLowerCase();
        return lowerName.endsWith(".csv") || lowerName.endsWith(".xlsx");
    }

    private String escapeJson(String value) {
        return value
            .replace("\\", "\\\\")
            .replace("\"", "\\\"");
    }
}
