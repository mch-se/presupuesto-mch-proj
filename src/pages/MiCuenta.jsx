import React from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

export default function MiCuenta() {
  const [email, setEmail] = React.useState("");
  const [alias, setAlias] = React.useState("");

  const [nombreEmpresa, setNombreEmpresa] = React.useState("");
  const [cuit, setCuit] = React.useState("");
  const [telefono, setTelefono] = React.useState("");
  const [emailEmpresa, setEmailEmpresa] = React.useState("");
  const [direccion, setDireccion] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");

  const [condicionesComerciales, setCondicionesComerciales] =
    React.useState("");
  const [firmaPdf, setFirmaPdf] = React.useState("");
  const [piePresupuesto, setPiePresupuesto] = React.useState("");

  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setEmail(user.email || "");

    const { data: profile } = await supabase
      .from("profiles")
      .select("alias")
      .eq("id", user.id)
      .single();

    setAlias(profile?.alias || "");

    const { data: config } = await supabase
      .from("configuracion_usuario")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (config) {
      setNombreEmpresa(config.nombre_empresa || "");
      setCuit(config.cuit || "");
      setTelefono(config.telefono || "");
      setEmailEmpresa(config.email || "");
      setDireccion(config.direccion || "");
      setWhatsapp(config.whatsapp || "");
      setCondicionesComerciales(config.condiciones_comerciales || "");
      setFirmaPdf(config.firma_pdf || "");
      setPiePresupuesto(config.pie_presupuesto || "");
    }

    setLoading(false);
  }

  async function guardarConfiguracion() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const datos = {
      user_id: user.id,
      nombre_empresa: nombreEmpresa,
      cuit,
      telefono,
      email: emailEmpresa,
      direccion,
      whatsapp,
      condiciones_comerciales: condicionesComerciales,
      firma_pdf: firmaPdf,
      pie_presupuesto: piePresupuesto,
    };

    const { error } = await supabase
      .from("configuracion_usuario")
      .upsert(datos, {
        onConflict: "user_id",
      });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Configuración guardada");
  }

  async function cambiarPassword() {
    if (!email) {
      alert("No se encontró el email del usuario");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Te enviamos un email para cambiar la contraseña");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-3xl">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-bold text-orange-500">
              Mi Cuenta
            </h1>

            <p className="text-zinc-400 mt-3">
              Usuario, empresa y configuración futura
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
            Empresa
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              placeholder="Nombre comercial"
              value={nombreEmpresa}
              onChange={(e) => setNombreEmpresa(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />

            <input
              placeholder="CUIT"
              value={cuit}
              onChange={(e) => setCuit(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />

            <input
              placeholder="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />

            <input
              placeholder="Email empresa"
              value={emailEmpresa}
              onChange={(e) => setEmailEmpresa(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />

            <input
              placeholder="Dirección"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className="md:col-span-2 bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />

            <input
              placeholder="WhatsApp Business"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="md:col-span-2 bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-orange-500 mb-6">
            PDF / Presupuestos
          </h2>

          <div className="space-y-6">
            <textarea
              placeholder="Condiciones comerciales"
              value={condicionesComerciales}
              onChange={(e) => setCondicionesComerciales(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 min-h-32"
            />

            <input
              placeholder="Firma / aclaración PDF"
              value={firmaPdf}
              onChange={(e) => setFirmaPdf(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />

            <input
              placeholder="Texto pie de presupuesto"
              value={piePresupuesto}
              onChange={(e) => setPiePresupuesto(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />
          </div>
        </div>

        <button
          onClick={guardarConfiguracion}
          className="w-full bg-orange-500 hover:bg-orange-600 p-5 rounded-2xl text-xl font-bold"
        >
          Guardar Configuración
        </button>
      </div>
    </div>
  );
}