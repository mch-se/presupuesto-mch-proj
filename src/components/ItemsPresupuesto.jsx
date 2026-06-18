import React from "react";

export default function ItemsPresupuesto({
  items,
  itemExpandido,
  setItemExpandido,
  actualizarItem,
  eliminarItem,
  esTipoTrabajo,
  moneda,
}) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl overflow-hidden">
      <div className="hidden md:grid grid-cols-[90px_1fr_160px_80px] gap-4 px-4 py-3 text-sm text-zinc-500 border-b border-zinc-800">
        <span>Cant.</span>
        <span>Artículo</span>
        <span className="text-right">Total</span>
        <span className="text-right">Acción</span>
      </div>

      {items.length === 0 && (
        <div className="p-6 text-center text-zinc-500">
          No hay ítems cargados.
        </div>
      )}

      {items.map((item, index) => {
        const subtotalItem =
          (Number(item.cantidad) || 0) *
          (Number(item.precio) || 0);

        const expandido = itemExpandido === index;

        return (
          <div
            key={index}
            className="border-b border-zinc-800 last:border-b-0"
          >
            <div className="grid grid-cols-[64px_1fr_auto_auto] md:grid-cols-[90px_1fr_160px_80px] gap-3 md:gap-4 items-center p-3 md:p-4">
              <input
                type="number"
                value={item.cantidad}
                onChange={(e) =>
                  actualizarItem(
                    index,
                    "cantidad",
                    e.target.value
                  )
                }
                className="w-16 md:w-20 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center font-bold"
              />

              <button
                type="button"
                onClick={() =>
                  setItemExpandido(
                    expandido ? null : index
                  )
                }
                className="min-w-0 text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <p className="font-bold text-white truncate">
                    {item.descripcion || "Artículo sin descripción"}
                  </p>

                  <span className="text-zinc-500 text-xs shrink-0">
                    {expandido ? "▲" : "▼"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mt-1 text-xs">
                  <span className="text-orange-400">
                    Tipo: {item.tipo || "-"}
                  </span>

                  <span className="text-zinc-500">
                    ·
                  </span>

                  <span className="text-zinc-400">
                    Categoría: {item.categoria || "-"}
                  </span>
                </div>
              </button>

              <div className="text-right">
                <p className="text-orange-500 font-black whitespace-nowrap">
                  {moneda === "USD" ? "USD $" : "$"}
                  {subtotalItem.toLocaleString()}
                </p>

                <p className="text-zinc-600 text-xs md:hidden">
                  Total
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  eliminarItem(index)
                }
                className="bg-red-500 hover:bg-red-600 w-11 h-11 rounded-xl font-black"
              >
                X
              </button>
            </div>

            {expandido && (
              <div className="bg-zinc-950/70 border-t border-zinc-800 px-3 md:px-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-4">
                  <textarea
                    placeholder="Descripción larga / detalle"
                    value={item.detalle || ""}
                    onChange={(e) =>
                      actualizarItem(
                        index,
                        "detalle",
                        e.target.value
                      )
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 min-h-24 text-zinc-300"
                  />

                  <div className="space-y-4">
                    {`${item.tipo || ""}`.toLowerCase() === "material" && (
                      <div>
                        <label className="block text-zinc-500 text-sm mb-2">
                          Costo gremio / proveedor
                        </label>

                        <input
                          type="number"
                          value={item.precio_costo ?? item.costo ?? 0}
                          onChange={(e) =>
                            actualizarItem(
                              index,
                              "precio_costo",
                              e.target.value
                            )
                          }
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                        />
                      </div>
                    )}

                    {esTipoTrabajo(item) && (
                      <>
                        <div>
                          <label className="block text-zinc-500 text-sm mb-2">
                            Precio base trabajo
                          </label>

                          <input
                            type="number"
                            value={item.precio_base_trabajo ?? item.precio ?? 0}
                            onChange={(e) =>
                              actualizarItem(
                                index,
                                "precio_base_trabajo",
                                e.target.value
                              )
                            }
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-zinc-500 text-sm mb-2">
                              Descuento %
                            </label>

                            <input
                              type="number"
                              value={item.descuento_trabajo ?? 0}
                              onChange={(e) =>
                                actualizarItem(
                                  index,
                                  "descuento_trabajo",
                                  e.target.value
                                )
                              }
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                            />
                          </div>

                          <div>
                            <label className="block text-zinc-500 text-sm mb-2">
                              Recargo %
                            </label>

                            <input
                              type="number"
                              value={item.recargo_trabajo ?? 0}
                              onChange={(e) =>
                                actualizarItem(
                                  index,
                                  "recargo_trabajo",
                                  e.target.value
                                )
                              }
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-zinc-500 text-sm mb-2">
                        Precio venta
                      </label>

                      <input
                        type="number"
                        value={item.precio}
                        onChange={(e) => {
                          actualizarItem(
                            index,
                            "precio",
                            e.target.value
                          );

                          actualizarItem(
                            index,
                            "precio_final",
                            e.target.value
                          );
                        }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                      />
                    </div>

                    {item.articulo_id && (
                      <label className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm font-bold">
                        <input
                          type="checkbox"
                          checked={Boolean(item.actualizar_biblioteca)}
                          onChange={(e) =>
                            actualizarItem(
                              index,
                              "actualizar_biblioteca",
                              e.target.checked
                            )
                          }
                          className="w-5 h-5"
                        />

                        Actualizar artículo en biblioteca
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
