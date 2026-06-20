import React from "react";

export default function ArticuloVerModal({
  articuloVer,
  setArticuloVer,
  nombreCategoria,
  nombreTipo,
  esFrecuente,
  esImportadoProveedor,
  IconoImportadoProveedor,
  esTrabajoArticulo,
  precioBaseTrabajoArticulo,
  precioCostoArticulo,
  precioFinalArticulo,
}) {
  if (!articuloVer) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/80 p-4 flex items-center justify-center">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-start gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-black text-orange-500">
              {articuloVer.descripcion}
            </h2>

            <p className="text-zinc-500 mt-2">
              Detalle completo del artículo
            </p>
          </div>

          <button
            onClick={() => setArticuloVer(null)}
            className="bg-zinc-800 hover:bg-zinc-700 w-12 h-12 rounded-2xl font-black"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-900 rounded-2xl p-4">
            <p className="text-zinc-500 text-sm">Categoría</p>
            <p className="font-bold mt-1">
              {nombreCategoria(articuloVer)}
            </p>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-4">
            <p className="text-zinc-500 text-sm">Tipo</p>
            <p className="font-bold mt-1">
              {nombreTipo(articuloVer)}
            </p>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-4">
            <p className="text-zinc-500 text-sm">Proveedor</p>
            <p className="font-bold mt-1">
              {articuloVer.proveedor || "-"}
            </p>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-4">
            <p className="text-zinc-500 text-sm">Estado</p>

            <div className="flex items-center gap-2 mt-2">
              {esFrecuente(articuloVer) && (
                <span title="Artículo frecuente" className="text-2xl">
                  🔥
                </span>
              )}

              {esImportadoProveedor(articuloVer) && (
                <IconoImportadoProveedor />
              )}

              {!esFrecuente(articuloVer) &&
                !esImportadoProveedor(articuloVer) && (
                  <span className="text-zinc-500">
                    Manual
                  </span>
                )}
            </div>
          </div>

          {esTrabajoArticulo(articuloVer) ? (
            <>
              <div className="bg-zinc-900 rounded-2xl p-4">
                <p className="text-zinc-500 text-sm">
                  Precio base trabajo
                </p>

                <p className="font-bold mt-1 text-white">
                  {articuloVer.moneda === "USD" ? "USD $" : "$"}
                  {precioBaseTrabajoArticulo(articuloVer).toLocaleString()}
                </p>
              </div>

              <div className="bg-zinc-900 rounded-2xl p-4">
                <p className="text-zinc-500 text-sm">
                  Ajuste trabajo
                </p>

                <p className="font-bold mt-1 text-zinc-300">
                  -{Number(articuloVer.descuento_trabajo || 0).toLocaleString()}% / +{Number(articuloVer.recargo_trabajo || 0).toLocaleString()}%
                </p>
              </div>
            </>
          ) : (
            <div className="bg-zinc-900 rounded-2xl p-4">
              <p className="text-zinc-500 text-sm">
                Costo gremio
              </p>

              <p className="font-bold mt-1 text-red-400">
                {articuloVer.moneda === "USD" ? "USD $" : "$"}
                {precioCostoArticulo(articuloVer).toLocaleString()}
              </p>
            </div>
          )}

          <div className="bg-zinc-900 rounded-2xl p-4">
            <p className="text-zinc-500 text-sm">
              Precio venta
            </p>

            <p className="font-black text-green-400 text-2xl mt-1">
              {articuloVer.moneda === "USD" ? "USD $" : "$"}
              {precioFinalArticulo(articuloVer).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 mt-4">
          <p className="text-zinc-500 text-sm mb-2">
            Descripción larga
          </p>

          <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {articuloVer.detalle || "-"}
          </p>
        </div>

        {articuloVer.origen_pdf && (
          <p className="text-zinc-500 text-sm mt-5">
            Origen PDF: {articuloVer.origen_pdf}
          </p>
        )}

        <p className="text-zinc-500 text-sm mt-2">
          Cargado por: {articuloVer.cargado_por_alias || "Administrador"}
        </p>
      </div>
    </div>
  );
}
