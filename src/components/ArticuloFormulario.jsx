import React from "react";

export default function ArticuloFormulario({
  formularioRef,
  mostrarFormulario,
  setMostrarFormulario,
  editandoId,
  limpiarFormulario,
  descripcion,
  setDescripcion,
  categorias,
  categoriaId,
  setCategoriaId,
  tipos,
  tipoId,
  setTipoId,
  proveedor,
  setProveedor,
  esTrabajoFormulario,
  precioBaseTrabajo,
  actualizarPrecioBaseTrabajo,
  descuentoTrabajo,
  actualizarDescuentoTrabajo,
  recargoTrabajo,
  actualizarRecargoTrabajo,
  precioCosto,
  setPrecioCosto,
  precioFinal,
  setPrecioFinal,
  moneda,
  setMoneda,
  origenPdf,
  setOrigenPdf,
  frecuente,
  setFrecuente,
  importadoProveedor,
  setImportadoProveedor,
  detalle,
  setDetalle,
  guardarArticulo,
}) {
  return (
    <div ref={formularioRef} className="mb-6">
      {!mostrarFormulario ? (
        <button
          onClick={() => setMostrarFormulario(true)}
          className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl p-4 transition-all"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-2xl font-black">
              +
            </div>

            <p className="text-lg font-black text-white">
              Agregar artículo
            </p>
          </div>
        </button>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-orange-500">
                {editandoId ? "Editar artículo" : "Nuevo artículo"}
              </h2>

              <p className="text-zinc-500 mt-1">
                Completar información del artículo
              </p>
            </div>

            <button
              onClick={limpiarFormulario}
              className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-2xl font-bold"
            >
              Cerrar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <input
              type="text"
              placeholder="Descripción corta"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />

            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            >
              <option value="">Seleccionar categoría</option>

              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>

            <select
              value={tipoId}
              onChange={(e) => setTipoId(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            >
              <option value="">Seleccionar tipo</option>

              {tipos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Proveedor"
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />

            {esTrabajoFormulario() ? (
              <>
                <input
                  type="number"
                  placeholder="Precio base trabajo"
                  value={precioBaseTrabajo}
                  onChange={(e) =>
                    actualizarPrecioBaseTrabajo(e.target.value)
                  }
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                />

                <input
                  type="number"
                  placeholder="% descuento trabajo"
                  value={descuentoTrabajo}
                  onChange={(e) =>
                    actualizarDescuentoTrabajo(e.target.value)
                  }
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                />

                <input
                  type="number"
                  placeholder="% recargo trabajo"
                  value={recargoTrabajo}
                  onChange={(e) =>
                    actualizarRecargoTrabajo(e.target.value)
                  }
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                />

                <input
                  type="number"
                  placeholder="Precio venta trabajo"
                  value={precioFinal}
                  onChange={(e) => setPrecioFinal(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                />
              </>
            ) : (
              <>
                <input
                  type="number"
                  placeholder="Costo gremio"
                  value={precioCosto}
                  onChange={(e) => setPrecioCosto(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                />

                <input
                  type="number"
                  placeholder="Precio final"
                  value={precioFinal}
                  onChange={(e) => setPrecioFinal(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                />
              </>
            )}

            <select
              value={moneda}
              onChange={(e) => setMoneda(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            >
              <option value="ARS">ARS $</option>
              <option value="USD">USD $</option>
            </select>

            <input
              type="text"
              placeholder="Origen PDF / proveedor"
              value={origenPdf}
              onChange={(e) => setOrigenPdf(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3">
              <label className="flex items-center gap-3 font-bold">
                <input
                  type="checkbox"
                  checked={frecuente}
                  onChange={(e) => setFrecuente(e.target.checked)}
                  className="w-5 h-5"
                />
                🔥 Frecuente
              </label>

              <label className="flex items-center gap-3 font-bold">
                <input
                  type="checkbox"
                  checked={importadoProveedor}
                  onChange={(e) => setImportadoProveedor(e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white font-black">
                    ↪
                  </span>
                  Importado proveedor
                </span>
              </label>
            </div>

            <textarea
              placeholder="Descripción larga / detalle"
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              className="md:col-span-2 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 min-h-28"
            />
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={guardarArticulo}
              className="bg-orange-500 hover:bg-orange-600 px-6 py-4 rounded-2xl font-bold"
            >
              {editandoId ? "Actualizar" : "Guardar"}
            </button>

            <button
              onClick={limpiarFormulario}
              className="bg-zinc-700 hover:bg-zinc-600 px-6 py-4 rounded-2xl font-bold"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
