import React from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

export default function MiCuenta() {

  const [email, setEmail] =
    React.useState("");

  const [alias, setAlias] =
    React.useState("");

  const [rol, setRol] =
    React.useState("");

  const [nombreEmpresa, setNombreEmpresa] =
    React.useState("");

  const [cuit, setCuit] =
    React.useState("");

  const [telefono, setTelefono] =
    React.useState("");

  const [emailEmpresa, setEmailEmpresa] =
    React.useState("");

  const [direccion, setDireccion] =
    React.useState("");

  const [whatsapp, setWhatsapp] =
    React.useState("");

  const [logoUrl, setLogoUrl] =
    React.useState("");

  const [subiendoLogo, setSubiendoLogo] =
    React.useState(false);

  const textoCondicionesDefault =
`Los importes son válidos por 5 días debido a la inestabilidad monetaria.
El pago debe estar acreditado al momento de finalizar el trabajo; de lo contrario, se aplicará mora del 3% por día hasta que se acredite el pago.
Pago efectivo o transferencia.
Otros medios de pago pueden incluir recargos.
Incluye configuración y puesta en marcha salvo aclaración previa.
No incluye trabajos civiles, cañerías o cablecanal salvo aclaración.`;

  const [condicionesComerciales,
    setCondicionesComerciales] =
    React.useState(
      textoCondicionesDefault
    );

  const [firmaPdf, setFirmaPdf] =
    React.useState("");

  const [piePresupuesto,
    setPiePresupuesto] =
    React.useState("");

  const [loading, setLoading] =
    React.useState(true);

  React.useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) return;

    setEmail(user.email || "");

    const { data: profile } =
      await supabase
        .from("profiles")
        .select("alias, rol")
        .eq("id", user.id)
        .single();

    setAlias(profile?.alias || "");

    setRol(profile?.rol || "");

    const { data: config } =
      await supabase
        .from("configuracion_empresa")
        .select("*")
        .eq("id", "principal")
        .single();

    if (config) {

      setNombreEmpresa(
        config.nombre_empresa || ""
      );

      setCuit(
        config.cuit || ""
      );

      setTelefono(
        config.telefono || ""
      );

      setEmailEmpresa(
        config.email || ""
      );

      setDireccion(
        config.direccion || ""
      );

      setWhatsapp(
        config.whatsapp || ""
      );

      setLogoUrl(
        config.logo_url || ""
      );

      setCondicionesComerciales(
        config.condiciones_comerciales ||
        textoCondicionesDefault
      );

      setFirmaPdf(
        config.firma_pdf || ""
      );

      setPiePresupuesto(
        config.pie_presupuesto || ""
      );
    }

    setLoading(false);
  }

  async function subirLogo(event) {

    if (
      rol !== "admin" &&
      rol !== "socio"
    ) {

      alert(
        "No tenés permisos para modificar el logo"
      );

      return;
    }

    const archivo =
      event.target.files?.[0];

    if (!archivo) return;

    if (
      !archivo.type.startsWith(
        "image/"
      )
    ) {

      alert(
        "El archivo debe ser una imagen"
      );

      return;
    }

    setSubiendoLogo(true);

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {

      setSubiendoLogo(false);

      return;
    }

    const extension =
      archivo.name
        .split(".")
        .pop();

    const nombreArchivo =
      `empresa/logo.${extension}`;

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from("logos")
        .upload(
          nombreArchivo,
          archivo,
          {
            cacheControl:
              "3600",

            upsert: true,
          }
        );

    if (uploadError) {

      alert(
        uploadError.message
      );

      setSubiendoLogo(false);

      return;
    }

    const { data } =
      supabase.storage
        .from("logos")
        .getPublicUrl(
          nombreArchivo
        );

    setLogoUrl(
      data.publicUrl
    );

    setSubiendoLogo(false);
  }

  async function guardarConfiguracion() {

    if (
      rol !== "admin" &&
      rol !== "socio"
    ) {

      alert(
        "No tenés permisos para editar esta configuración"
      );

      return;
    }

    const datos = {

      id: "principal",

      condiciones_comerciales:
        condicionesComerciales,

      firma_pdf:
        firmaPdf,

      pie_presupuesto:
        piePresupuesto,

      logo_url:
        logoUrl,

      updated_at:
        new Date().toISOString(),
    };

    if (rol === "admin") {

      datos.nombre_empresa =
        nombreEmpresa;

      datos.cuit =
        cuit;

      datos.telefono =
        telefono;

      datos.email =
        emailEmpresa;

      datos.direccion =
        direccion;

      datos.whatsapp =
        whatsapp;
    }

    const { error } =
      await supabase
        .from(
          "configuracion_empresa"
        )
        .upsert(
          datos,
          {
            onConflict:
              "id",
          }
        );

    if (error) {

      alert(
        error.message
      );

      return;
    }

    alert(
      "Configuración guardada"
    );
  }

  async function cambiarPassword() {

    if (!email) {

      alert(
        "No se encontró el email del usuario"
      );

      return;
    }

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo:
            window.location.origin,
        }
      );

    if (error) {

      alert(
        error.message
      );

      return;
    }

    alert(
      "Te enviamos un email para cambiar la contraseña"
    );
  }

  if (loading) {

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-3xl">
        Cargando...
      </div>
    );
  }

  const puedeEditarPdf =
    rol === "admin" ||
    rol === "socio";

  const esAdmin =
    rol === "admin";

  return (
    <div className="min-h-screen bg-black text-white p-6">

      <div className="max-w-5xl mx-auto">

        <div className="flex justify-between items-center mb-10">

          <div>

            <h1 className="text-5xl font-bold text-orange-500">
              Mi Cuenta
            </h1>

            <p className="text-zinc-400 mt-3">
              Configuración global de empresa
            </p>

          </div>

          <Link
            to="/"
            className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-xl font-bold"
          >
            Volver
          </Link>

        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-8">

          <h2 className="text-3xl font-bold text-orange-500 mb-6">
            Usuario
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <input
              value={alias}
              disabled
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />

            <input
              value={email}
              disabled
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />

          </div>

          <button
            onClick={cambiarPassword}
            className="mt-6 bg-orange-500 hover:bg-orange-600 px-6 py-4 rounded-2xl font-bold"
          >
            Cambiar contraseña por email
          </button>

        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-8">

          <h2 className="text-3xl font-bold text-orange-500 mb-6">
            Logo
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">

            <label className="bg-zinc-950 border-2 border-dashed border-zinc-700 hover:border-orange-500 rounded-3xl p-8 min-h-56 flex flex-col items-center justify-center cursor-pointer">

              {logoUrl ? (

                <img
                  src={logoUrl}
                  alt="Logo"
                  className="max-h-40 max-w-full object-contain"
                />

              ) : (

                <>

                  <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center text-4xl font-black">
                    +
                  </div>

                  <p className="text-zinc-300 font-bold mt-4">
                    Subir logo
                  </p>

                  <p className="text-zinc-500 text-sm mt-1 text-center">
                    Logo global para todo el sistema.
                  </p>

                </>

              )}

              <input
                type="file"
                accept="image/*"
                onChange={subirLogo}
                className="hidden"
              />

            </label>

            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">

              <p className="text-zinc-400">
                Recomendado:
                PNG transparente.
              </p>

              {subiendoLogo && (

                <p className="text-orange-400 font-bold mt-4">
                  Subiendo logo...
                </p>

              )}

              {logoUrl &&
                puedeEditarPdf && (

                <button
                  onClick={() =>
                    setLogoUrl("")
                  }
                  className="mt-5 bg-red-600 hover:bg-red-700 px-5 py-3 rounded-2xl font-bold"
                >
                  Quitar logo
                </button>

              )}

            </div>

          </div>

        </div>

        {esAdmin && (

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-8">

            <h2 className="text-3xl font-bold text-orange-500 mb-6">
              Empresa
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <input
                placeholder="Nombre comercial"
                value={nombreEmpresa}
                onChange={(e) =>
                  setNombreEmpresa(
                    e.target.value
                  )
                }
                className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
              />

              <input
                placeholder="CUIT"
                value={cuit}
                onChange={(e) =>
                  setCuit(
                    e.target.value
                  )
                }
                className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
              />

              <input
                placeholder="Teléfono"
                value={telefono}
                onChange={(e) =>
                  setTelefono(
                    e.target.value
                  )
                }
                className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
              />

              <input
                placeholder="Email empresa"
                value={emailEmpresa}
                onChange={(e) =>
                  setEmailEmpresa(
                    e.target.value
                  )
                }
                className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
              />

              <input
                placeholder="Dirección"
                value={direccion}
                onChange={(e) =>
                  setDireccion(
                    e.target.value
                  )
                }
                className="md:col-span-2 bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
              />

              <input
                placeholder="WhatsApp Business"
                value={whatsapp}
                onChange={(e) =>
                  setWhatsapp(
                    e.target.value
                  )
                }
                className="md:col-span-2 bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
              />

            </div>

          </div>

        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-8">

          <h2 className="text-3xl font-bold text-orange-500 mb-6">
            PDF / Presupuestos
          </h2>

          {!puedeEditarPdf && (

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mb-6 text-zinc-400">
              Solo admin y socios pueden modificar esta configuración.
            </div>

          )}

          <div className="space-y-6">

            <textarea
              placeholder="Condiciones comerciales"
              value={condicionesComerciales}
              disabled={!puedeEditarPdf}
              onChange={(e) =>
                setCondicionesComerciales(
                  e.target.value
                )
              }
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 min-h-40"
            />

            <input
              placeholder="Firma / aclaración PDF"
              value={firmaPdf}
              disabled={!puedeEditarPdf}
              onChange={(e) =>
                setFirmaPdf(
                  e.target.value
                )
              }
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />

            <input
              placeholder="Texto pie de presupuesto"
              value={piePresupuesto}
              disabled={!puedeEditarPdf}
              onChange={(e) =>
                setPiePresupuesto(
                  e.target.value
                )
              }
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />

          </div>

        </div>

        {puedeEditarPdf && (

          <button
            onClick={guardarConfiguracion}
            className="w-full bg-orange-500 hover:bg-orange-600 p-5 rounded-2xl text-xl font-bold"
          >
            Guardar Configuración
          </button>

        )}

      </div>

    </div>
  );
}