export async function asegurarPermisoContactos() {
  return true;
}

export async function seleccionarContacto() {
  if (!("contacts" in navigator) || !navigator.contacts?.select) {
    const error = new Error("Contact Picker no disponible");
    error.code = "CONTACTS_UNSUPPORTED";
    throw error;
  }

  return navigator.contacts.select(["name", "tel", "email"], {
    multiple: false,
  });
}
