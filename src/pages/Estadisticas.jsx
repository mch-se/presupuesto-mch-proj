import React from "react";

export default function Estadisticas() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-black text-orange-500">
          Estadísticas
        </h1>

        <p className="text-zinc-400 mt-3">
          Panel de análisis comercial y operativo.
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mt-10">
          <p className="text-zinc-400">
            Próximo paso: conectar métricas reales de presupuestos, clientes y vendedores.
          </p>
        </div>
      </div>
    </div>
  );
}