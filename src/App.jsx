import React from "react";

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Presupuestos from "./pages/Presupuestos";
import Articulos from "./pages/Articulos";
import HistorialPresupuestos from "./pages/HistorialPresupuestos";
import VerPresupuesto from "./pages/VerPresupuesto";
import VistaPreviaPresupuesto from "./pages/VistaPreviaPresupuesto";

export default function App() {
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

      </Routes>

    </BrowserRouter>
  );
}