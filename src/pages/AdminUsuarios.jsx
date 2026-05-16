import React from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AdminUsuarios() {

  const [usuarios, setUsuarios] =
    React.useState([]);

  const [loading, setLoading] =
    React.useState(true);

  React.useEffect(() => {
    cargarUsuarios();
  }, []);

  async function cargarUsuarios() {

    setLoading(true);

    const { data, error } =
      await supabase
        .from("profiles")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      alert(error.message);
      return;
    }

    setUsuarios(data || []);

    setLoading(false);
  }

  async function cambiarRol(
    userId,
    nuevoRol
  ) {

    const { error } =
      await supabase
        .from("profiles")
        .update({
          rol: nuevoRol,
        })
        .eq("id", userId);

    if (error) {
      alert(error.message);
      return;
    }

    cargarUsuarios();
  }

  const coloresRol = {
    admin:
      "bg-red-500 text-white",

    socio:
      "bg-blue-500 text-white",

    vendedor:
      "bg-green-500 text-white",

    pendiente:
      "bg-zinc-700 text-white",
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6">

      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-8">

          <div>

            <h1 className="text-4xl md:text-5xl font-black text-orange-500">
              Usuarios
            </h1>

            <p className="text-zinc-400 mt-2">
              Administración de roles
            </p>

          </div>

          <Link
            to="/"
            className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-2xl font-bold"
          >
            Volver
          </Link>

        </div>

        {loading && (

          <div className="text-center text-2xl py-20">
            Cargando usuarios...
          </div>

        )}

        {!loading && (

          <div className="space-y-4">

            {usuarios.map(
              (usuario) => (

                <div
                  key={usuario.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6"
                >

                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">

                    <div>

                      <p className="text-2xl font-black text-orange-500">

                        {usuario.alias ||
                          "Sin alias"}

                      </p>

                      <p className="text-zinc-400 mt-1">
                        {usuario.email}
                      </p>

                      <div className="mt-4">

                        <span
                          className={`px-4 py-2 rounded-xl text-sm font-bold uppercase ${
                            coloresRol[
                              usuario.rol
                            ] ||
                            coloresRol.pendiente
                          }`}
                        >

                          {usuario.rol ||
                            "pendiente"}

                        </span>

                      </div>

                    </div>

                    <div className="flex flex-wrap gap-3">

                      <button
                        onClick={() =>
                          cambiarRol(
                            usuario.id,
                            "pendiente"
                          )
                        }

                        className="bg-zinc-700 hover:bg-zinc-600 px-4 py-3 rounded-xl font-bold"
                      >
                        Pendiente
                      </button>

                      <button
                        onClick={() =>
                          cambiarRol(
                            usuario.id,
                            "vendedor"
                          )
                        }

                        className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded-xl font-bold"
                      >
                        Vendedor
                      </button>

                      <button
                        onClick={() =>
                          cambiarRol(
                            usuario.id,
                            "socio"
                          )
                        }

                        className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl font-bold"
                      >
                        Socio
                      </button>

                      <button
                        onClick={() =>
                          cambiarRol(
                            usuario.id,
                            "admin"
                          )
                        }

                        className="bg-red-600 hover:bg-red-700 px-4 py-3 rounded-xl font-bold"
                      >
                        Admin
                      </button>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>

        )}

      </div>

    </div>
  );
}