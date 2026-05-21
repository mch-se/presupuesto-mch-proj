import React from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { supabase } from "./lib/supabase";

import Layout from "./components/Layout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MiCuenta from "./pages/MiCuenta";
import Presupuestos from "./pages/Presupuestos";
import Articulos from "./pages/Articulos";
import Clientes from "./pages/Clientes";
import HistorialPresupuestos from "./pages/HistorialPresupuestos";
import VerPresupuesto from "./pages/VerPresupuesto";
import VistaPreviaPresupuesto from "./pages/VistaPreviaPresupuesto";
import Plantillas from "./pages/Plantillas";
import ImportarDatos from "./pages/ImportarDatos";
import AdminUsuarios from "./pages/AdminUsuarios";
import CategoriasArticulos from "./pages/CategoriasArticulos";
import TiposArticulos from "./pages/TiposArticulos";
import Estadisticas from "./pages/Estadisticas";

export default function App() {
  const [session, setSession] = React.useState(null);

  const [rol, setRol] =
    React.useState("pendiente");

  const [loading, setLoading] =
    React.useState(true);

  const [mostrarAvisoInactividad, setMostrarAvisoInactividad] =
    React.useState(false);

  const temporizadorLogoutRef = React.useRef(null);
  const temporizadorAvisoRef = React.useRef(null);

  const TIEMPO_INACTIVIDAD_MS = 40 * 60 * 1000;
  const TIEMPO_AVISO_MS = 38 * 60 * 1000;

  React.useEffect(() => {
    iniciar();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        async (_event, sessionNueva) => {

          setSession(sessionNueva);

          if (sessionNueva?.user) {

            cargarRol(
              sessionNueva.user.id
            );

          } else {

            setRol(
              "pendiente"
            );
          }
        }
      );

    return () =>
      subscription.unsubscribe();

  }, []);


  React.useEffect(() => {
    if (!session) {
      limpiarTemporizadoresInactividad();
      setMostrarAvisoInactividad(false);
      return;
    }

    reiniciarTemporizadoresInactividad();

    const eventos = [
      "click",
      "keydown",
      "mousemove",
      "scroll",
      "touchstart",
    ];

    eventos.forEach((evento) => {
      window.addEventListener(
        evento,
        reiniciarTemporizadoresInactividad,
        { passive: true }
      );
    });

    return () => {
      eventos.forEach((evento) => {
        window.removeEventListener(
          evento,
          reiniciarTemporizadoresInactividad
        );
      });

      limpiarTemporizadoresInactividad();
    };
  }, [session]);

  function limpiarTemporizadoresInactividad() {
    if (temporizadorLogoutRef.current) {
      clearTimeout(temporizadorLogoutRef.current);
    }

    if (temporizadorAvisoRef.current) {
      clearTimeout(temporizadorAvisoRef.current);
    }
  }

  function reiniciarTemporizadoresInactividad() {
    if (!session) return;

    limpiarTemporizadoresInactividad();
    setMostrarAvisoInactividad(false);

    temporizadorAvisoRef.current = setTimeout(() => {
      setMostrarAvisoInactividad(true);
    }, TIEMPO_AVISO_MS);

    temporizadorLogoutRef.current = setTimeout(() => {
      cerrarSesionPorInactividad();
    }, TIEMPO_INACTIVIDAD_MS);
  }

  async function cerrarSesionPorInactividad() {
    limpiarTemporizadoresInactividad();
    setMostrarAvisoInactividad(false);

    await supabase.auth.signOut();

    setSession(null);
    setRol("pendiente");
  }

  function continuarSesion() {
    reiniciarTemporizadoresInactividad();
  }

  async function iniciar() {

    try {

      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      setSession(
        session || null
      );

      if (session?.user) {

        cargarRol(
          session.user.id
        );

      } else {

        setRol(
          "pendiente"
        );
      }

    } catch (error) {

      console.error(error);

      setSession(null);

      setRol(
        "pendiente"
      );
    }

    setLoading(false);
  }

  async function cargarRol(
    userId
  ) {

    try {

      const {
        data,
        error,
      } =
        await supabase
          .from("profiles")
          .select("rol")
          .eq("id", userId)
          .maybeSingle();

      if (error) {

        console.error(error);

        setRol(
          "pendiente"
        );

        return;
      }

      setRol(
        data?.rol ||
          "pendiente"
      );

    } catch (error) {

      console.error(error);

      setRol(
        "pendiente"
      );
    }
  }

  function RutaProtegida({
    children,
  }) {

    if (loading) {
      return null;
    }

    if (!session) {

      return (
        <Navigate
          to="/"
          replace
        />
      );
    }

    return children;
  }

  function RutaAdmin({
    children,
  }) {

    if (loading) {
      return null;
    }

    if (!session) {

      return (
        <Navigate
          to="/"
          replace
        />
      );
    }

    if (
      rol !==
      "admin"
    ) {

      return (
        <Navigate
          to="/"
          replace
        />
      );
    }

    return children;
  }

  if (loading) {

    return (
      <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden">

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.15),transparent_45%)]" />

        <div className="relative z-10 flex flex-col items-center">

          <div className="relative">

            <div className="w-40 h-40 rounded-full border-4 border-orange-500/20" />

            <div className="absolute inset-0 rounded-full border-t-4 border-orange-500 animate-spin" />

            <div className="absolute inset-5 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-2xl">

              <div className="text-center">

                <h1 className="text-5xl font-black text-orange-500 tracking-widest">
                  MCH
                </h1>

                <p className="text-zinc-500 text-xs mt-2 tracking-[0.35em]">
                  SEGURIDAD
                </p>

              </div>

            </div>

          </div>

          <p className="text-zinc-400 mt-10 text-lg tracking-wide animate-pulse">

            Iniciando sistema...

          </p>

        </div>

      </div>
    );
  }

  if (!session) {

    return <Login />;
  }

  return (
    <BrowserRouter>

      {mostrarAvisoInactividad && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 max-w-md w-full text-white shadow-2xl">
            <h2 className="text-2xl font-black text-orange-500">
              Sesión por expirar
            </h2>

            <p className="text-zinc-300 mt-4 leading-relaxed">
              Tu sesión se cerrará automáticamente por inactividad.
            </p>

            <p className="text-zinc-500 mt-2 text-sm">
              Tocá continuar para mantener la sesión abierta.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={continuarSesion}
                className="flex-1 bg-orange-500 hover:bg-orange-600 px-5 py-4 rounded-2xl font-bold"
              >
                Continuar
              </button>

              <button
                onClick={cerrarSesionPorInactividad}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 px-5 py-4 rounded-2xl font-bold"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      <Layout>

        <Routes>

          <Route
            path="/"
            element={
              <Dashboard />
            }
          />

          <Route
            path="/micuenta"
            element={
              <MiCuenta />
            }
          />

          <Route
            path="/presupuestos"
            element={
              <RutaProtegida>
                <Presupuestos />
              </RutaProtegida>
            }
          />

          <Route
            path="/presupuestos/:id"
            element={
              <RutaProtegida>
                <Presupuestos />
              </RutaProtegida>
            }
          />

          <Route
            path="/historial"
            element={
              <RutaProtegida>
                <HistorialPresupuestos />
              </RutaProtegida>
            }
          />

          <Route
            path="/presupuesto/:id"
            element={
              <RutaProtegida>
                <VerPresupuesto />
              </RutaProtegida>
            }
          />

          <Route
            path="/presupuesto-preview/:id"
            element={
              <RutaProtegida>
                <VistaPreviaPresupuesto />
              </RutaProtegida>
            }
          />

          <Route
            path="/articulos"
            element={
              <RutaProtegida>
                <Articulos />
              </RutaProtegida>
            }
          />

          <Route
            path="/config/categorias"
            element={
              <RutaProtegida>
                <CategoriasArticulos />
              </RutaProtegida>
            }
          />

          <Route
            path="/config/tipos"
            element={
              <RutaProtegida>
                <TiposArticulos />
              </RutaProtegida>
            }
          />

          <Route
            path="/clientes"
            element={
              <RutaProtegida>
                <Clientes />
              </RutaProtegida>
            }
          />

          <Route
            path="/estadisticas"
            element={
              <RutaProtegida>
                <Estadisticas />
              </RutaProtegida>
            }
          />

          <Route
            path="/importar"
            element={
              <RutaProtegida>
                <ImportarDatos />
              </RutaProtegida>
            }
          />

          <Route
            path="/plantillas"
            element={
              <RutaProtegida>
                <Plantillas />
              </RutaProtegida>
            }
          />

          <Route
            path="/admin/usuarios"
            element={
              <RutaAdmin>
                <AdminUsuarios />
              </RutaAdmin>
            }
          />

        </Routes>

      </Layout>

    </BrowserRouter>
  );
}