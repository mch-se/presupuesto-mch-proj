import React from "react";

export default function ArticuloFiltros({
  busqueda,
  setBusqueda,
  mostrarFiltros,
  setMostrarFiltros,
  categoriaBusqueda,
  setCategoriaBusqueda,
  mostrarFiltroCategorias,
  setMostrarFiltroCategorias,
  filtroCategoria,
  setFiltroCategoria,
  filtroTipo,
  setFiltroTipo,
  categorias,
  tipos,
  limpiarFiltros,
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 md:p-5 mb-6">
      <div className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_1fr_auto] gap-3 items-stretch">
        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="bg-zinc-800 hover:bg-zinc-700 px-5 rounded-2xl text-2xl"
        >
          🔍
        </button>

        <input
          type="text"
          placeholder="Buscar artículos..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="min-w-0 w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
        />

        <div className="relative col-span-2 md:col-span-1">
          <button
            onClick={() =>
              setMostrarFiltroCategorias(!mostrarFiltroCategorias)
            }
            className="w-full md:w-auto bg-zinc-800 hover:bg-zinc-700 rounded-2xl px-4 py-4 md:py-0 md:min-w-[120px] md:max-w-[180px] h-full font-bold truncate"
          >
            {categoriaBusqueda === "Todas"
              ? "Filtro categoría"
              : categoriaBusqueda}
          </button>

          {mostrarFiltroCategorias && (
            <div className="absolute left-0 md:left-auto md:right-0 top-16 bg-zinc-950 border border-zinc-800 rounded-2xl z-50 shadow-2xl w-full md:w-[260px] max-h-[55vh] overflow-y-auto">
              <button
                onClick={() => {
                  setCategoriaBusqueda("Todas");
                  setMostrarFiltroCategorias(false);
                }}
                className={
                  categoriaBusqueda === "Todas"
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
                    setCategoriaBusqueda(categoria.nombre);
                    setMostrarFiltroCategorias(false);
                  }}
                  className={
                    categoriaBusqueda === categoria.nombre
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

      {mostrarFiltros && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
          >
            <option>Todas</option>

            {categorias.map((categoria) => (
              <option key={categoria.id}>{categoria.nombre}</option>
            ))}
          </select>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
          >
            <option>Todos</option>

            {tipos.map((tipo) => (
              <option key={tipo.id}>{tipo.nombre}</option>
            ))}
          </select>

          <button
            onClick={limpiarFiltros}
            className="bg-orange-500 hover:bg-orange-600 rounded-2xl p-4 font-bold"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}