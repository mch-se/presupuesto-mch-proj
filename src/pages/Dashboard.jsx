import React from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [hora, setHora] =
    React.useState(
      new Date().toLocaleTimeString()
    );

  const [alias, setAlias] =
    React.useState("");

  React.useEffect(() => {
    obtenerAlias();

    const intervalo = setInterval(() => {
      setHora(
        new Date().toLocaleTimeString()
      );
    }, 1000);

    return () =>
      clearInterval(intervalo);
  }, []);

  async function obtenerAlias() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("alias")
      .eq("id", user.id)
      .single();

    if (data) {
      setAlias(data.alias);
    }
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">

      <div className="max-w-7xl mx-auto">

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">

            <div>
              <h1 className="text-5xl font-bold text-orange-500">
                MCH
              </h1>

              <p className="text-zinc-400 mt-3 text-xl">
                Panel principal
              </p>
            </div>

            <div className="text-right">
              <p className="text-zinc-400">
                Usuario
              </p>

              <p className="text-2xl font-bold">
                {alias}
              </p>

              <p className="text-orange-500 mt-2 text-xl">
                {hora}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">

            <Link
              to="/presupuestos"
              className="bg-orange-500 hover:bg-orange-600 rounded-3xl p-8 transition"
            >
              <h2 className="text-3xl font-bold">
                Presupuestos
              </h2>

              <p className="mt-4 text-lg">
                Crear presupuestos
              </p>
            </Link>

            <Link
              to="/historial"
              className="bg-zinc-800 hover:bg-zinc-700 rounded-3xl p-8 transition"
            >
              <h2 className="text-3xl font-bold">
                Historial
              </h2>

              <p className="mt-4 text-lg text-zinc-400">
                Administración de presupuestos
              </p>
            </Link>

            <Link
              to="/articulos"
              className="bg-zinc-800 hover:bg-zinc-700 rounded-3xl p-8 transition"
            >
              <h2 className="text-3xl font-bold">
                Artículos
              </h2>

              <p className="mt-4 text-lg text-zinc-400">
                Biblioteca de materiales
              </p>
            </Link>
          </div>

          <div className="mt-12">

            <button
              onClick={cerrarSesion}
              className="bg-red-500 hover:bg-red-600 px-6 py-4 rounded-2xl text-lg font-bold"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}