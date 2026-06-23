package com.mch.presupuestos;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.Uri;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

@CapacitorPlugin(name = "SharedFile")
public class SharedFilePlugin extends Plugin {
    private static final String PREFS_NAME = "mch_shared_file";
    private static final String KEY_FILE_NAME = "fileName";
    private static final String KEY_FILE_URI = "fileUri";

    @PluginMethod
    public void getPendingFileInfo(PluginCall call) {
        String fileName = getPrefs().getString(KEY_FILE_NAME, null);
        JSObject result = new JSObject();

        if (fileName != null && !fileName.isEmpty()) {
            result.put("fileName", fileName);
        }

        call.resolve(result);
    }

    @PluginMethod
    public void getPendingFile(PluginCall call) {
        String fileName = getPrefs().getString(KEY_FILE_NAME, null);
        String fileUri = getPrefs().getString(KEY_FILE_URI, null);
        JSObject result = new JSObject();

        if (fileName != null && !fileName.isEmpty()) {
            result.put("fileName", fileName);
        }

        if (fileUri != null && !fileUri.isEmpty()) {
            try {
                result.put("dataBase64", readUriAsBase64(fileUri));
            } catch (Exception error) {
                call.reject("No se pudo leer el archivo compartido", error);
                return;
            }
        }

        call.resolve(result);
    }

    @PluginMethod
    public void clearPendingFile(PluginCall call) {
        getPrefs().edit().remove(KEY_FILE_NAME).remove(KEY_FILE_URI).apply();
        call.resolve();
    }

    private SharedPreferences getPrefs() {
        return getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    private String readUriAsBase64(String fileUri) throws Exception {
        Uri uri = Uri.parse(fileUri);

        try (InputStream input = getContext().getContentResolver().openInputStream(uri);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            if (input == null) {
                throw new IllegalStateException("Archivo no disponible");
            }

            byte[] buffer = new byte[8192];
            int bytesRead;

            while ((bytesRead = input.read(buffer)) != -1) {
                output.write(buffer, 0, bytesRead);
            }

            return Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP);
        }
    }
}
