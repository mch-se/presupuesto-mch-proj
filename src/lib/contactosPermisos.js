import { Capacitor, registerPlugin } from "@capacitor/core";

const ContactsPermission = registerPlugin("ContactsPermission");
const ContactPicker = registerPlugin("ContactPicker");

export async function asegurarPermisoContactos() {
  if (!Capacitor.isNativePlatform()) {
    return true;
  }

  try {
    const resultado = await ContactsPermission.ensureReadContacts();
    return resultado?.granted === true;
  } catch (error) {
    console.error("[Contactos] No se pudo solicitar permiso de contactos", error);
    return false;
  }
}

export async function seleccionarContacto() {
  console.info("[Contactos] seleccionarContacto inicio");

  if (!Capacitor.isNativePlatform()) {
    if (!("contacts" in navigator) || !navigator.contacts?.select) {
      const error = new Error("Contact Picker no disponible");
      error.code = "CONTACTS_UNSUPPORTED";
      throw error;
    }

    return navigator.contacts.select(["name", "tel", "email"], {
      multiple: false,
    });
  }

  const permisoConcedido = await asegurarPermisoContactos();

  if (!permisoConcedido) {
    const error = new Error("Permiso de contactos denegado");
    error.code = "CONTACTS_PERMISSION_DENIED";
    throw error;
  }

  console.info("[Contactos] Permiso OK");
  console.info("[Contactos] Selector abierto");

  console.info("[Contactos] Esperando respuesta del selector nativo");
  console.info("[Contactos] llamando plugin nativo");

  let contacto;

  try {
    contacto = await ContactPicker.selectContact();
    console.info("[Contactos] plugin respondió", contacto);
  } catch (error) {
    console.error("[Contactos] plugin error", error);
    throw error;
  }

  console.info("[Contactos] Respuesta del selector nativo", contacto);

  if (contacto?.cancelled) {
    return [];
  }

  console.info("[Contactos] Contacto seleccionado");
  console.info("[Contactos] Nombre", contacto?.name || "");
  console.info("[Contactos] Teléfono", contacto?.tel || "");

  return [
    {
      name: contacto?.name ? [contacto.name] : [],
      tel: contacto?.tel ? [contacto.tel] : [],
      email: contacto?.email ? [contacto.email] : [],
      organization: contacto?.organization ? [contacto.organization] : [],
    },
  ];
}
