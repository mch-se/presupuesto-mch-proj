import React from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { supabase } from "./lib/supabase";

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

export default function App() {

  const [session, setSession] =
    React.useState(null);

  const [rol, setRol] =
    React.useState("pendiente");

  const [loading, setLoading] =
    React.useState(true);

  React.useEffect(() => {

    iniciar();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (_event, sessionNueva) => {

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

  async function iniciar() {

    try {

      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      setSession(session);

      if (session?.user) {

        cargarRol(
          session.user.id
        );
      }

    } catch (error) {

      console.error(error);
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

    if (
      rol ===
      "pendiente"
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

  function RutaAdmin({
    children,
  }) {

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
          path="/clientes"
          element={
            <RutaProtegida>
              <Clientes />
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

    </BrowserRouter>
  );
}