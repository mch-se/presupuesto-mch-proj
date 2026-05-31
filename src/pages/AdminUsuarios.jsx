import React from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [usuarioEditandoAlias, setUsuarioEditandoAlias] = React.useState(null);
  const [aliasEditado, setAliasEditado] = React.useState("");

  React.useEffect(() => {
    cargarUsuarios();
  }, []);

  async function cargarUsuarios() {
    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setUsuarios(data || []);
    setLoading(false);
  }

  async function cambiarRol(userId, nuevoRol) {
    const { error } = await supabase
      .from("profiles")
      .update({ rol: nuevoRol })
      .eq("id", userId);

    if (error) {
      alert(error.message);
      return;
    }

    cargarUsuarios();
  }

  function iniciarEdicionAlias(usuario) {
    setUsuarioEditandoAlias(usuario);
    setAliasEditado(usuario.alias || "");
  }

  function cancelarEdicionAlias() {
    setUsuarioEditandoAlias(null);
    setAliasEditado("");
  }

  async function guardarAlias() {
    if (!usuarioEditandoAlias) return;

    const aliasLimpio = aliasEditado.trim();

    if (!aliasLimpio) {
      alert("El alias no puede quedar vacío");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ alias: aliasLimpio })
      .eq("id", usuarioEditandoAlias.id);

    if (error) {
      alert(error.message);
      return;
    }

    cancelarEdicionAlias();
    cargarUsuarios();
  }

  async function cambiarActivo(usuario) {
    const activoActual = usuario.activo ?? true;
    const nuevoEstado = !activoActual;

    const confirmar = window.confirm(
      nuevoEstado
        ? `¿Activar la cuenta de ${usuario.alias || usuario.email}?`
        : `¿Desactivar la cuenta de ${usuario.alias || usuario.email}?`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("profiles")
      .update({ activo: nuevoEstado })
      .eq("id", usuario.id);

    if (error) {
      alert(error.message);
      return;
    }

    cargarUsuarios();
  }

  const coloresRol = {
    admin: "bg-red-500 text-white",
    socio: "bg-blue-500 text-white",
    vendedor: "bg-green-500 text-white",
    pendiente: "bg-zinc-700 text-white",
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
              Administración de roles, alias y estado de cuentas
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
            {usuarios.map((usuario) => {
              const activo = usuario.activo ?? true;

              return (
                <div
                  key={usuario.id}
                  className={
                    activo
                      ? "bg-zinc-900 border border-zinc-800 rounded-3xl p-6"
                      : "bg-zinc-950 border border-zinc-800 opacity-60 rounded-3xl p-6"
                  }
                >
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-2xl font-black text-orange-500">
                          {usuario.alias || "Sin alias"}
                        </p>

                        {!activo && (
                          <span className="bg-zinc-700 text-zinc-300 px-3 py-2 rounded-xl text-xs font-bold">
                            INACTIVO
                          </span>
                        )}
                      </div>

                      <p className="text-zinc-400 mt-1">
                        {usuario.email}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <span
                          className={`px-4 py-2 rounded-xl text-sm font-bold uppercase ${
                            coloresRol[usuario.rol] || coloresRol.pendiente
                          }`}
                        >
                          {usuario.rol || "pendiente"}
                        </span>

                        <button
                          onClick={() => iniciarEdicionAlias(usuario)}
                          className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl text-sm font-bold"
                        >
                          Editar alias
                        </button>

                        <button
                          onClick={() => cambiarActivo(usuario)}
                          className={
                            activo
                              ? "bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl text-sm font-bold"
                              : "bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl text-sm font-bold"
                          }
                        >
                          {activo ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => cambiarRol(usuario.id, "pendiente")}
                        className="bg-zinc-700 hover:bg-zinc-600 px-4 py-3 rounded-xl font-bold"
                      >
                        Pendiente
                      </button>

                      <button
                        onClick={() => cambiarRol(usuario.id, "vendedor")}
                        className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded-xl font-bold"
                      >
                        Vendedor
                      </button>

                      <button
                        onClick={() => cambiarRol(usuario.id, "socio")}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl font-bold"
                      >
                        Socio
                      </button>

                      <button
                        onClick={() => cambiarRol(usuario.id, "admin")}
                        className="bg-red-600 hover:bg-red-700 px-4 py-3 rounded-xl font-bold"
                      >
                        Admin
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {usuarioEditandoAlias && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 max-w-lg w-full">
            <h2 className="text-3xl font-black text-orange-500">
              Editar alias
            </h2>

            <p className="text-zinc-400 mt-2">
              {usuarioEditandoAlias.email}
            </p>

            <input
              value={aliasEditado}
              onChange={(e) => setAliasEditado(e.target.value)}
              placeholder="Alias"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mt-6"
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={guardarAlias}
                className="flex-1 bg-orange-500 hover:bg-orange-600 px-5 py-4 rounded-2xl font-bold"
              >
                Guardar
              </button>

              <button
                onClick={cancelarEdicionAlias}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 px-5 py-4 rounded-2xl font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
