import React from "react";

export default function ArticuloLista({
  articulosFiltrados,
  menuAbierto,
  setMenuAbierto,
  setArticuloVer,
  editarArticulo,
  solicitarEliminarArticulo,
  esFrecuente,
  esImportadoProveedor,
  IconoImportadoProveedor,
  nombreCategoria,
  nombreTipo,
  esTrabajoArticulo,
  precioBaseTrabajoArticulo,
  precioCostoArticulo,
  precioFinalArticulo,
  detalleCorto,
}) {
  const [articuloExpandidoId, setArticuloExpandidoId] = React.useState(null);

  function alternarArticulo(articuloId) {
    setArticuloExpandidoId((actual) =>
      actual === articuloId ? null : articuloId
    );
  }

  return (
    <div className="space-y-3">
      {articulosFiltrados.map((articulo) => {
        const expandido = articuloExpandidoId === articulo.id;
        const trabajo = esTrabajoArticulo(articulo);

        return (
          <div
            key={articulo.id}
            onClick={() => alternarArticulo(articulo.id)}
            className={
              expandido
                ? "bg-zinc-900 border border-orange-500/60 rounded-3xl p-5 md:p-6 shadow-2xl cursor-pointer transition-all"
                : "bg-zinc-900 border border-zinc-800 rounded-3xl p-4 md:p-5 cursor-pointer hover:border-zinc-700 transition-all"
            }
          >
            <div className="flex justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={
                      expandido
                        ? "text-xl md:text-2xl font-black text-white"
                        : "text-lg md:text-xl font-bold truncate"
                    }
                  >
                    {articulo.descripcion}
                  </p>

                  {esFrecuente(articulo) && (
                    <span title="Artículo frecuente" className="text-xl shrink-0">
                      🔥
                    </span>
                  )}

                  {esImportadoProveedor(articulo) && (
                    <IconoImportadoProveedor />
                  )}

                  <span className="text-zinc-500 text-xs shrink-0">
                    {expandido ? "▲" : "▼"}
                  </span>
                </div>

                {articulo.detalle && !expandido && (
                  <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                    {detalleCorto(articulo.detalle)}
                  </p>
                )}

                {articulo.detalle && expandido && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mt-4">
                    <p className="text-zinc-500 text-xs mb-2">
                      Descripción larga
                    </p>

                    <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                      {articulo.detalle}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_180px_180px] gap-2 mt-3 items-stretch">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
                    <p className="text-zinc-500 text-xs">Categoría</p>
                    <p className="text-white font-bold truncate">
                      {nombreCategoria(articulo)}
                    </p>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
                    <p className="text-zinc-500 text-xs">Tipo</p>
                    <p className="text-white font-bold truncate">
                      {nombreTipo(articulo)}
                    </p>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
                    <p className="text-zinc-500 text-xs">
                      {trabajo ? "Precio base" : "Costo gremio"}
                    </p>

                    <p className={trabajo ? "text-white font-bold" : "text-red-400 font-bold"}>
                      {articulo.moneda === "USD" ? "USD $" : "$"}
                      {trabajo
                        ? precioBaseTrabajoArticulo(articulo).toLocaleString()
                        : precioCostoArticulo(articulo).toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
                    <p className="text-zinc-500 text-xs">Precio venta</p>
                    <p className="text-green-400 font-black">
                      {articulo.moneda === "USD" ? "USD $" : "$"}
                      {precioFinalArticulo(articulo).toLocaleString()}
                    </p>
                  </div>
                </div>

                {expandido && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
                      <p className="text-zinc-500 text-xs">Proveedor</p>
                      <p className="text-white font-bold truncate">
                        {articulo.proveedor || "-"}
                      </p>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
                      <p className="text-zinc-500 text-xs">Origen</p>
                      <p className="text-white font-bold truncate">
                        {articulo.origen_pdf || "-"}
                      </p>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
                      <p className="text-zinc-500 text-xs">Cargado por</p>
                      <p className="text-white font-bold truncate">
                        {articulo.cargado_por_alias || "Administrador"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuAbierto(
                      menuAbierto === articulo.id ? null : articulo.id
                    );
                  }}
                  className="w-12 h-12 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-3xl font-black"
                >
                  ⋮
                </button>

                {menuAbierto === articulo.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-14 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden z-50 min-w-44 shadow-2xl"
                  >
                    <button
                      onClick={() => {
                        setArticuloVer(articulo);
                        setMenuAbierto(null);
                      }}
                      className="w-full text-left px-5 py-4 hover:bg-zinc-800 font-bold"
                    >
                      Ver
                    </button>

                    <button
                      onClick={() => editarArticulo(articulo)}
                      className="w-full text-left px-5 py-4 hover:bg-zinc-800 font-bold"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => solicitarEliminarArticulo(articulo.id)}
                      className="w-full text-left px-5 py-4 hover:bg-red-500/20 text-red-400 font-bold"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {articulosFiltrados.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center text-zinc-500">
          No hay artículos encontrados.
        </div>
      )}
    </div>
  );
}
