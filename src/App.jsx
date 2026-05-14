import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "./lib/supabase";

import VerPresupuesto from "./pages/VerPresupuesto";
import HistorialPresupuestos from "./pages/HistorialPresupuestos";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Presupuestos from "./pages/Presupuestos";
import Articulos from "./pages/Articulos";
import Clientes from "./pages/Clientes";
import Recursos from "./pages/Recursos";
import Analiticas from "./pages/Analiticas";

export default function App() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    obtenerSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function obtenerSesion() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setUser(session?.user ?? null);
    setLoading(false);
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-3xl">
        Cargando...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Dashboard
              user={user}
              cerrarSesion={cerrarSesion}
            />
          }
        />

        <Route
          path="/presupuestos"
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
          path="/articulos"
          element={<Articulos />}
        />

        <Route
          path="/clientes"
          element={<Clientes />}
        />

        <Route
          path="/recursos"
          element={<Recursos />}
        />

        <Route
          path="/analiticas"
          element={<Analiticas />}
        />
      </Routes>
    </BrowserRouter>
  );
}