import React from "react";

export default function PlantillasPanel({
  mostrarPlantillas,
  busquedaPlantilla,
  setBusquedaPlantilla,
  plantillasFiltradas,
  agregarPlantillaAlPresupuesto,
}) {
  if (!mostrarPlantillas) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 md:p-6 mb-6">
      <input
        type="text"
        placeholder="Buscar plantilla..."
        value={busquedaPlantilla}
        onChange={(e) => setBusquedaPlantilla(e.target.value)}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mb-5"
      />

      <div className="space-y-3">
        {plantillasFiltradas.map((plantilla) => (
          <div
            key={plantilla.id}
            className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center gap-4"
          >
            <div>
              <p className="font-bold text-lg">{plantilla.nombre}</p>

              {plantilla.descripcion && (
                <p className="text-zinc-500 text-sm mt-1">
                  {plantilla.descripcion}
                </p>
              )}
            </div>

            <button
              onClick={() => agregarPlantillaAlPresupuesto(plantilla)}
              className="bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-xl font-bold"
            >
              Cargar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
