package com.mch.presupuestos;

import android.Manifest;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "ContactsPermission",
    permissions = {
        @Permission(alias = "contacts", strings = { Manifest.permission.READ_CONTACTS })
    }
)
public class ContactsPermissionPlugin extends Plugin {
    @PluginMethod
    public void ensureReadContacts(PluginCall call) {
        if (getPermissionState("contacts") == PermissionState.GRANTED) {
            resolve(call, true);
            return;
        }

        requestPermissionForAlias("contacts", call, "readContactsCallback");
    }

    @PermissionCallback
    private void readContactsCallback(PluginCall call) {
        resolve(call, getPermissionState("contacts") == PermissionState.GRANTED);
    }

    private void resolve(PluginCall call, boolean granted) {
        JSObject result = new JSObject();
        result.put("granted", granted);
        call.resolve(result);
    }
}
