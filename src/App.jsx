import React from "react";

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import { supabase } from "./lib/supabase";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Presupuestos from "./pages/Presupuestos";
import Articulos from "./pages/Articulos";
import Clientes from "./pages/Clientes";
import HistorialPresupuestos from "./pages/HistorialPresupuestos";
import VerPresupuesto from "./pages/VerPresupuesto";
import VistaPreviaPresupuesto from "./pages/VistaPreviaPresupuesto";

export default function App() {

  const [session, setSession] =
    React.useState(null);

  const [loading, setLoading] =
    React.useState(true);

  React.useEffect(() => {

    obtenerSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () =>
      subscription.unsubscribe();

  }, []);

  async function obtenerSesion() {

    const {
      data: { session },
    } = await supabase.auth.getSession();

    setSession(session);

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-3xl">
        Cargando...
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
          element={<Dashboard />}
        />

        <Route
          path="/presupuestos"
          element={<Presupuestos />}
        />

        <Route
        path="/presupuestos/:id"
        element={<Presupuestos />}
        />

        <Route
          path="/historial"
          element={<HistorialPresupuestos />}
        />

        <Route
          path="/presupuesto/:id"
          element={<VerPresupuesto />}
        />

        <Route
          path="/presupuesto-preview/:id"
          element={<VistaPreviaPresupuesto />}
        />

        <Route
          path="/articulos"
          element={<Articulos />}
        />
        <Route
          path="/clientes"
          element={<Clientes />}
        />

      </Routes>

    </BrowserRouter>
  );
}