package com.mch.presupuestos;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.database.Cursor;
import android.net.Uri;
import android.provider.ContactsContract;
import android.util.Log;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ContactPicker")
public class ContactPickerPlugin extends Plugin {
    private static final String TAG = "Contactos";

    @PluginMethod
    public void selectContact(PluginCall call) {
        Log.i(TAG, "[Contactos] Selector abierto");

        Intent intent = new Intent(
            Intent.ACTION_PICK,
            ContactsContract.CommonDataKinds.Phone.CONTENT_URI
        );

        ResolveInfo activity = resolveAndLogActivity(intent);

        if (isFileExplorer(activity)) {
            Log.i(TAG, "[Contactos] HyperOS resolvio explorador, usando Contacts.CONTENT_URI");
            intent = new Intent(Intent.ACTION_PICK, ContactsContract.Contacts.CONTENT_URI);
            activity = resolveAndLogActivity(intent);
        }

        if (activity == null) {
            call.reject("No hay una aplicacion de contactos disponible");
            return;
        }

        startActivityForResult(call, intent, "selectContactCallback");
    }

    private ResolveInfo resolveAndLogActivity(Intent intent) {
        Log.i(TAG, "[Contactos] Intent action " + intent.getAction());
        Log.i(TAG, "[Contactos] Intent data " + intent.getDataString());
        Log.i(TAG, "[Contactos] Intent type " + intent.getType());
        Log.i(TAG, "[Contactos] Resolviendo actividad");

        ResolveInfo activity = getContext()
            .getPackageManager()
            .resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY);

        if (activity == null) {
            Log.i(TAG, "[Contactos] Actividad resuelta null");
            return null;
        }

        Log.i(
            TAG,
            "[Contactos] Actividad resuelta "
                + activity.activityInfo.packageName
                + "/"
                + activity.activityInfo.name
        );

        return activity;
    }

    private boolean isFileExplorer(ResolveInfo activity) {
        if (activity == null || activity.activityInfo == null) return false;

        String resolvedActivity = (
            activity.activityInfo.packageName + "/" + activity.activityInfo.name
        ).toLowerCase();

        return resolvedActivity.contains("fileexplorer")
            || resolvedActivity.contains("filemanager")
            || resolvedActivity.contains("documentsui");
    }

    @ActivityCallback
    private void selectContactCallback(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            JSObject response = new JSObject();
            response.put("cancelled", true);
            call.resolve(response);
            return;
        }

        Uri contactUri = result.getData().getData();

        if (contactUri == null) {
            call.reject("Contacto no disponible");
            return;
        }

        try {
            ContactData contact = readContact(contactUri);

            if (contact == null) {
                call.reject("No se pudo leer el contacto");
                return;
            }

            Log.i(TAG, "[Contactos] Contacto seleccionado");
            Log.i(TAG, "[Contactos] Nombre " + contact.name);
            Log.i(TAG, "[Contactos] Telefono " + contact.phone);

            JSObject response = new JSObject();
            response.put("name", contact.name);
            response.put("tel", contact.phone);
            response.put("email", contact.email);
            response.put("organization", contact.organization);
            call.resolve(response);
        } catch (Exception error) {
            call.reject("No se pudo leer el contacto", error);
        }
    }

    private ContactData readContact(Uri contactUri) {
        ContactData phoneContact = readPhoneContact(contactUri);
        if (phoneContact != null && !phoneContact.phone.isEmpty()) return phoneContact;

        return readContactAndFirstPhone(contactUri);
    }

    private ContactData readPhoneContact(Uri contactUri) {
        try (Cursor cursor = getContext().getContentResolver().query(
            contactUri,
            new String[] {
                ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                ContactsContract.CommonDataKinds.Phone.NUMBER
            },
            null,
            null,
            null
        )) {
            if (cursor == null || !cursor.moveToFirst()) return null;

            String contactId = readString(cursor, ContactsContract.CommonDataKinds.Phone.CONTACT_ID);

            return new ContactData(
                readString(cursor, ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME),
                readString(cursor, ContactsContract.CommonDataKinds.Phone.NUMBER),
                readFirstEmail(contactId),
                readOrganization(contactId)
            );
        } catch (Exception ignored) {
            return null;
        }
    }

    private ContactData readContactAndFirstPhone(Uri contactUri) {
        String contactId;
        String name;

        try (Cursor cursor = getContext().getContentResolver().query(
            contactUri,
            new String[] {
                ContactsContract.Contacts._ID,
                ContactsContract.Contacts.DISPLAY_NAME
            },
            null,
            null,
            null
        )) {
            if (cursor == null || !cursor.moveToFirst()) return null;

            contactId = readString(cursor, ContactsContract.Contacts._ID);
            name = readString(cursor, ContactsContract.Contacts.DISPLAY_NAME);
        } catch (Exception ignored) {
            return null;
        }

        if (contactId.isEmpty()) return null;

        try (Cursor cursor = getContext().getContentResolver().query(
            ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
            new String[] { ContactsContract.CommonDataKinds.Phone.NUMBER },
            ContactsContract.CommonDataKinds.Phone.CONTACT_ID + " = ?",
            new String[] { contactId },
            null
        )) {
            if (cursor == null || !cursor.moveToFirst()) {
                return new ContactData(name, "", readFirstEmail(contactId), readOrganization(contactId));
            }

            return new ContactData(
                name,
                readString(cursor, ContactsContract.CommonDataKinds.Phone.NUMBER),
                readFirstEmail(contactId),
                readOrganization(contactId)
            );
        } catch (Exception ignored) {
            return new ContactData(name, "", readFirstEmail(contactId), readOrganization(contactId));
        }
    }

    private String readFirstEmail(String contactId) {
        if (contactId == null || contactId.isEmpty()) return "";

        try (Cursor cursor = getContext().getContentResolver().query(
            ContactsContract.CommonDataKinds.Email.CONTENT_URI,
            new String[] { ContactsContract.CommonDataKinds.Email.ADDRESS },
            ContactsContract.CommonDataKinds.Email.CONTACT_ID + " = ?",
            new String[] { contactId },
            null
        )) {
            if (cursor == null || !cursor.moveToFirst()) return "";

            return readString(cursor, ContactsContract.CommonDataKinds.Email.ADDRESS);
        } catch (Exception ignored) {
            return "";
        }
    }

    private String readOrganization(String contactId) {
        if (contactId == null || contactId.isEmpty()) return "";

        try (Cursor cursor = getContext().getContentResolver().query(
            ContactsContract.Data.CONTENT_URI,
            new String[] { ContactsContract.CommonDataKinds.Organization.COMPANY },
            ContactsContract.Data.CONTACT_ID + " = ? AND "
                + ContactsContract.Data.MIMETYPE + " = ?",
            new String[] {
                contactId,
                ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE
            },
            null
        )) {
            if (cursor == null || !cursor.moveToFirst()) return "";

            return readString(cursor, ContactsContract.CommonDataKinds.Organization.COMPANY);
        } catch (Exception ignored) {
            return "";
        }
    }

    private String readString(Cursor cursor, String columnName) {
        int index = cursor.getColumnIndex(columnName);
        if (index < 0) return "";

        String value = cursor.getString(index);
        return value == null ? "" : value;
    }

    private static class ContactData {
        final String name;
        final String phone;
        final String email;
        final String organization;

        ContactData(String name, String phone, String email, String organization) {
            this.name = name == null ? "" : name;
            this.phone = phone == null ? "" : phone;
            this.email = email == null ? "" : email;
            this.organization = organization == null ? "" : organization;
        }
    }
}
