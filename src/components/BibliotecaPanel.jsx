import React from "react";

export default function BibliotecaPanel({
  mostrarBiblioteca,
  busquedaArticulo,
  setBusquedaArticulo,
  categoriaBusquedaArticulo,
  setCategoriaBusquedaArticulo,
  mostrarFiltroCategoriasArticulo,
  setMostrarFiltroCategoriasArticulo,
  categorias,
  articulosFiltrados,
  moneda,
  agregarArticuloAlPresupuesto,
}) {
  if (!mostrarBiblioteca) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-6">
      <div className="grid grid-cols-[1fr_auto] gap-3 mb-5 items-stretch">
        <input
          type="text"
          placeholder="Buscar artículo..."
          value={busquedaArticulo}
          onChange={(e) => setBusquedaArticulo(e.target.value)}
          className="min-w-0 w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
        />

        <div className="relative">
          <button
            onClick={() =>
              setMostrarFiltroCategoriasArticulo(
                !mostrarFiltroCategoriasArticulo
              )
            }
            className="h-full bg-zinc-800 hover:bg-zinc-700 px-3 md:px-4 rounded-2xl font-bold min-w-[92px] md:min-w-[120px] max-w-[120px] md:max-w-[180px] truncate"
          >
            {categoriaBusquedaArticulo === "Todas"
              ? "Filtro"
              : categoriaBusquedaArticulo}
          </button>

          {mostrarFiltroCategoriasArticulo && (
            <div className="absolute right-0 top-16 bg-zinc-950 border border-zinc-800 rounded-2xl z-[120] shadow-2xl w-[260px] max-w-[calc(100vw-2rem)] max-h-[55vh] overflow-y-auto overscroll-contain">
              <button
                onClick={() => {
                  setCategoriaBusquedaArticulo("Todas");
                  setMostrarFiltroCategoriasArticulo(false);
                }}
                className={
                  categoriaBusquedaArticulo === "Todas"
                    ? "w-full text-left px-5 py-4 bg-orange-500/20 text-orange-400 font-bold"
                    : "w-full text-left px-5 py-4 hover:bg-zinc-800 font-bold"
                }
              >
                Todas
              </button>

              {categorias.map((categoria) => (
                <button
                  key={categoria.id}
                  onClick={() => {
                    setCategoriaBusquedaArticulo(categoria.nombre);
                    setMostrarFiltroCategoriasArticulo(false);
                  }}
                  className={
                    categoriaBusquedaArticulo === categoria.nombre
                      ? "w-full text-left px-5 py-4 bg-orange-500/20 text-orange-400 font-bold"
                      : "w-full text-left px-5 py-4 hover:bg-zinc-800 font-bold"
                  }
                >
                  {categoria.nombre}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 max-h-[420px] overflow-auto">
        {articulosFiltrados.map((articulo) => (
          <div
            key={articulo.id}
            className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center gap-4"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-lg">
                  {articulo.descripcion}
                </p>

                {(Boolean(articulo.frecuente) ||
                  (Number(articulo.usado_count) || 0) >= 11) && (
                  <span
                    title="Artículo frecuente"
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-500 text-white text-sm font-black shrink-0"
                  >
                    🔥
                  </span>
                )}

                {Boolean(articulo.importado_proveedor) && (
                  <span
                    title="Importado proveedor"
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-500 text-white text-sm font-black shrink-0"
                  >
                    ↪
                  </span>
                )}
              </div>

              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-orange-400">
                  {articulo.tipo || "-"}
                </span>

                <span className="text-orange-400">
                  {articulo.categoria || "-"}
                </span>
              </div>

              <p className="text-zinc-400 mt-2">
                {moneda === "USD" ? "USD $" : "$"}
                {Number(articulo.precio || 0).toLocaleString()}
              </p>
            </div>

            <button
              onClick={() => agregarArticuloAlPresupuesto(articulo)}
              className="bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-xl font-bold"
            >
              Agregar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}