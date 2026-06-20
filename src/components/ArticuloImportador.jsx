import React from "react";

export default function ArticuloImportador({
  menuImportarAbierto,
  setMenuImportarAbierto,
  procesandoImportacion,
  iniciarImportacionCsv,

  mostrarPreviewImportacion,
  setMostrarPreviewImportacion,
  previewImportacion,
  setPreviewImportacion,

  categorias,

  actualizarCampoPreview,
  actualizarCategoriaPreview,
  confirmarImportacionCsv,
}) {
  return (
    <>
      <div className="relative">
        <button
          onClick={() => setMenuImportarAbierto(!menuImportarAbierto)}
          disabled={procesandoImportacion}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 px-5 py-3 rounded-xl font-bold"
        >
          {procesandoImportacion ? "Leyendo..." : "Importar ▾"}
        </button>

        {menuImportarAbierto && (
          <div className="absolute right-0 top-14 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden z-50 min-w-52 shadow-2xl">
            <button
              onClick={iniciarImportacionCsv}
              className="w-full text-left px-5 py-4 hover:bg-zinc-800 font-bold"
            >
              📄 Importar CSV
            </button>
          </div>
        )}
      </div>

      {mostrarPreviewImportacion && (
        <div className="fixed inset-0 z-[95] bg-black/80 p-4 flex items-center justify-center">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 md:p-6 w-full max-w-5xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-start gap-4 mb-5">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-orange-500">
                  Preview importación CSV
                </h2>

                <p className="text-zinc-500 mt-1">
                  Revisá los artículos antes de guardar.
                </p>
              </div>

              <button
                onClick={() => {
                  setMostrarPreviewImportacion(false);
                  setPreviewImportacion([]);
                }}
                className="bg-zinc-800 hover:bg-zinc-700 w-11 h-11 rounded-2xl font-black"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {previewImportacion.map((item, index) => (
                <div
                  key={`${item.sku}-${index}`}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-[220px_1fr_135px_135px_220px_120px] gap-3 md:items-start"
                >
                  <div>
                    <p className="text-zinc-500 text-xs mb-1">SKU</p>

                    <input
                      type="text"
                      value={item.sku || ""}
                      onChange={(e) =>
                        actualizarCampoPreview(index, "sku", e.target.value)
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm font-bold"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-zinc-500 text-xs mb-1">
                      Producto / detalle
                    </p>

                    <textarea
                      value={item.detalle || ""}
                      onChange={(e) =>
                        actualizarCampoPreview(index, "detalle", e.target.value)
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm min-h-20"
                    />
                  </div>

                  <div>
                    <p className="text-zinc-500 text-xs mb-1">Categoría</p>

                    <select
                      value={item.categoria_id || ""}
                      onChange={(e) =>
                        actualizarCategoriaPreview(index, e.target.value)
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm"
                    >
                      <option value="">Seleccionar</option>

                      {categorias.map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span
                      className={
                        item.existe
                          ? "inline-block bg-blue-500/20 text-blue-300 px-3 py-2 rounded-xl text-sm font-bold"
                          : "inline-block bg-green-500/20 text-green-300 px-3 py-2 rounded-xl text-sm font-bold"
                      }
                    >
                      {item.existe ? "Actualizar" : "Nuevo"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={confirmarImportacionCsv}
                className="bg-orange-500 hover:bg-orange-600 px-6 py-4 rounded-2xl font-bold"
              >
                Importar {previewImportacion.length} artículos
              </button>

              <button
                onClick={() => {
                  setMostrarPreviewImportacion(false);
                  setPreviewImportacion([]);
                }}
                className="bg-zinc-700 hover:bg-zinc-600 px-6 py-4 rounded-2xl font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}