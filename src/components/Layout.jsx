import React from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ConfirmModal from "./ConfirmModal";

export default function Layout({ children }) {
  const location = useLocation();

  const [alias, setAlias] = React.useState("");
  const [rol, setRol] = React.useState("");
  const [modalSalir, setModalSalir] = React.useState(false);

  React.useEffect(() => {
    cargarPerfil();
  }, []);

  async function cargarPerfil() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("alias, rol")
      .eq("id", user.id)
      .single();

    setAlias(data?.alias || user.email);
    setRol(data?.rol || "pendiente");
  }

  async function confirmarCerrarSesion() {
    await supabase.auth.signOut();
  }

  const links = [
    { texto: "Dashboard", url: "/" },
    { texto: "Nuevo", url: "/presupuestos" },
    { texto: "Historial", url: "/historial" },
    { texto: "Clientes", url: "/clientes" },
    { texto: "Artículos", url: "/articulos" },
    { texto: "Plantillas", url: "/plantillas" },
    { texto: "Mi Cuenta", url: "/micuenta" },
  ];

  if (rol === "admin") {
    links.push({
      texto: "Admin",
      url: "/admin/usuarios",
    });
  }

  return (
    <>
      <ConfirmModal
        visible={modalSalir}
        titulo="Cerrar sesión"
        mensaje="¿Deseás salir del sistema?"
        textoConfirmar="Salir"
        textoCancelar="Cancelar"
        onCancelar={() => setModalSalir(false)}
        onConfirmar={confirmarCerrarSesion}
      />

      <div className="min-h-screen bg-black text-white flex">
        <aside className="hidden lg:flex w-72 bg-zinc-950 border-r border-zinc-800 p-5 flex-col justify-between">
          <div>
            <div className="mb-10">
              <h1 className="text-4xl font-black text-orange-500">
                MCH
              </h1>

              <p className="text-zinc-500 text-sm mt-1">
                Seguridad Electrónica
              </p>
            </div>

            <nav className="space-y-2">
              {links.map((link) => {
                const activo = location.pathname === link.url;

                return (
                  <Link
                    key={link.url}
                    to={link.url}
                    className={`block px-4 py-3 rounded-2xl font-bold transition-all ${
                      activo
                        ? "bg-orange-500 text-white"
                        : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {link.texto}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4">
            <p className="text-zinc-500 text-xs">
              Usuario
            </p>

            <p className="font-bold text-lg truncate">
              {alias || "-"}
            </p>

            <p className="text-orange-400 text-xs uppercase mt-1">
              {rol || "-"}
            </p>

            <button
              onClick={() => setModalSalir(true)}
              className="mt-4 w-full bg-red-600 hover:bg-red-700 py-3 rounded-2xl font-bold"
            >
              Salir
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="lg:hidden bg-zinc-950 border-b border-zinc-800 p-4 flex justify-between items-center sticky top-0 z-50">
            <div>
              <h1 className="text-2xl font-black text-orange-500">
                MCH
              </h1>

              <p className="text-zinc-500 text-xs uppercase">
                {rol || "-"}
              </p>
            </div>

            <Link
              to="/"
              className="bg-zinc-800 hover:bg-zinc-700 px-4 py-3 rounded-2xl font-bold"
            >
              Inicio
            </Link>
          </div>

          {children}
        </main>
      </div>
    </>
  );
}