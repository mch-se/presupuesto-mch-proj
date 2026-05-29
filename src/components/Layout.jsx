import React from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ConfirmModal from "./ConfirmModal";

export default function Layout({ children }) {
  const location = useLocation();

  const [alias, setAlias] = React.useState("");
  const [rol, setRol] = React.useState("");

  const [configuracion, setConfiguracion] =
    React.useState(null);

  const [modalSalir, setModalSalir] =
    React.useState(false);

  const [menuMobileAbierto,
    setMenuMobileAbierto] =
    React.useState(false);

  React.useEffect(() => {
    cargarPerfil();
  }, []);

  React.useEffect(() => {
    setMenuMobileAbierto(false);
  }, [location.pathname]);

  async function cargarPerfil() {

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } =
      await supabase
        .from("profiles")
        .select("alias, rol")
        .eq("id", user.id)
        .single();

    setAlias(
      data?.alias || user.email
    );

    setRol(
      data?.rol || "pendiente"
    );

    const {
      data: configData,
    } =
      await supabase
        .from("configuracion_empresa")
        .select("*")
        .eq("id", "principal")
        .single();

    setConfiguracion(
      configData || null
    );
  }

  async function confirmarCerrarSesion() {
    await supabase.auth.signOut();
  }

  const links = [
    {
  texto: "Inicio",
  url: "/",
},

    {
      texto: "Nuevo",
      url: "/presupuestos",
    },

    {
  texto: "Presupuestos",
  url: "/historial",
},
    {
      texto: "Clientes",
      url: "/clientes",
    },

    {
      texto: "Artículos",
      url: "/articulos",
    },

    {
      texto: "Plantillas",
      url: "/plantillas",
    },

    {
      texto: "Estadísticas",
      url: "/estadisticas",
    },
    
    {
      texto: "Liquidaciones",
      url: "/liquidaciones",
    },

    {
      texto: "Mi Cuenta",
      url: "/micuenta",
    },
  ];

  if (rol === "admin") {

    links.push({
      texto: "Admin",
      url: "/admin/usuarios",
    });
  }

  function HeaderLogo() {

    return (
      <Link
        to="/micuenta"
        className="block mb-8"
      >

        {configuracion?.logo_url ? (

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 flex items-center justify-center min-h-[100px]">

            <img
              src={configuracion.logo_url}
              alt="Logo"
              className="max-h-20 max-w-full object-contain"
            />

          </div>

        ) : (

          <div className="border-2 border-dashed border-zinc-700 rounded-3xl p-5 flex flex-col items-center justify-center min-h-[100px] hover:border-orange-500 transition-all">

            <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-2xl font-black">
              +
            </div>

            <p className="text-zinc-300 font-bold mt-3">
              Mi Cuenta
            </p>

          </div>

        )}

      </Link>
    );
  }

  function NavLinks() {

    return (
      <nav className="space-y-2">

        {links.map((link) => {

          const activo =
            location.pathname ===
            link.url;

          return (
            <Link
              key={link.url}
              to={link.url}
              className={`block px-4 py-4 rounded-2xl font-bold transition-all text-base ${
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
    );
  }

  function UserBox() {

    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 mt-6">

        <p className="text-zinc-500 text-xs">
          Usuario
        </p>

        <p className="font-bold text-lg truncate mt-1">
          {alias || "-"}
        </p>

        <p className="text-orange-400 text-xs uppercase mt-1">
          {rol || "-"}
        </p>

        <button
          onClick={() =>
            setModalSalir(true)
          }
          className="mt-4 w-full bg-red-600 hover:bg-red-700 py-4 rounded-2xl font-bold text-base"
        >
          Salir
        </button>

      </div>
    );
  }

  return (
    <>

      <ConfirmModal
        visible={modalSalir}
        titulo="Cerrar sesión"
        mensaje="¿Deseás salir del sistema?"
        textoConfirmar="Salir"
        textoCancelar="Cancelar"
        onCancelar={() =>
          setModalSalir(false)
        }
        onConfirmar={
          confirmarCerrarSesion
        }
      />

      {menuMobileAbierto && (

        <div
          onClick={() =>
            setMenuMobileAbierto(false)
          }
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] lg:hidden"
        />

      )}

      <div
        className={`fixed top-0 left-0 h-screen w-[86vw] max-w-[340px] bg-zinc-950 border-r border-zinc-800 p-5 z-[80] flex flex-col justify-between transform transition-transform duration-300 lg:hidden overflow-y-auto ${
          menuMobileAbierto
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >

        <div>

          <div className="flex justify-between items-start gap-3 mb-5">

            <div className="flex-1">

              <HeaderLogo />

            </div>

            <button
              onClick={() =>
                setMenuMobileAbierto(false)
              }
              className="bg-zinc-800 hover:bg-zinc-700 w-12 h-12 rounded-2xl font-black text-lg flex items-center justify-center shrink-0"
            >
              ✕
            </button>

          </div>

          <NavLinks />

        </div>

        <UserBox />

      </div>

      <div className="min-h-screen bg-black text-white flex">

        <aside className="hidden lg:flex w-72 bg-zinc-950 border-r border-zinc-800 p-5 flex-col justify-between">

          <div>

            <HeaderLogo />

            <NavLinks />

          </div>

          <UserBox />

        </aside>

        <main className="flex-1 min-w-0 overflow-x-hidden">

          <div className="lg:hidden sticky top-0 z-50 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between">

            <div className="flex items-center gap-3 min-w-0">

              {configuracion?.logo_url ? (

                <img
                  src={configuracion.logo_url}
                  alt="Logo"
                  className="h-11 max-w-[130px] object-contain shrink-0"
                />

              ) : (

                <div className="w-11 h-11 border-2 border-dashed border-zinc-700 rounded-2xl flex items-center justify-center text-orange-500 font-black shrink-0">
                  +
                </div>

              )}

              <div className="min-w-0">

                <p className="text-zinc-500 text-[11px] uppercase truncate">
                  {rol || "-"}
                </p>

                <p className="text-sm font-bold truncate">
                  {alias || "-"}
                </p>

              </div>

            </div>

            <button
              onClick={() =>
                setMenuMobileAbierto(true)
              }
              className="bg-zinc-800 active:bg-zinc-700 px-5 py-3 rounded-2xl font-bold text-sm shrink-0"
            >
              Menú
            </button>

          </div>

          <div className="pb-24">
            {children}
          </div>

        </main>

      </div>

    </>
  );
}