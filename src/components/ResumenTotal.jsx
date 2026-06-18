import React from "react";

export default function ResumenTotal({
  items,
  moneda,
  subtotal,
  total,
  mostrarResumenTotal,
  setMostrarResumenTotal,
  guardarPresupuesto,
  guardando,
}) {
  return (
    <div className="fixed left-0 right-0 bottom-0 z-50 bg-black/90 border-t border-zinc-800 backdrop-blur">
      <div className="max-w-7xl mx-auto p-3 md:p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setMostrarResumenTotal(!mostrarResumenTotal)}
            className="w-full p-3 md:p-4 flex items-center justify-between gap-3"
          >
            <div className="text-sm text-zinc-400 text-left">
              <p>{items.length} ítems</p>

              <p className="hidden sm:block">
                Factura C - IVA no discriminado
              </p>
            </div>

            <div className="flex items-center gap-4 md:gap-8">
              <div className="text-right">
                <p className="text-zinc-500 text-sm">Total</p>

                <p className="text-orange-500 font-black text-xl md:text-2xl">
                  {moneda === "USD" ? "USD $" : "$"}
                  {total.toLocaleString()}
                </p>
              </div>

              <div className="text-zinc-500">
                {mostrarResumenTotal ? "▲" : "▼"}
              </div>
            </div>
          </button>

          {mostrarResumenTotal && (
            <div className="border-t border-zinc-800 p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                  <p className="text-zinc-500 text-sm">Subtotal</p>

                  <p className="font-black text-xl mt-1">
                    {moneda === "USD" ? "USD $" : "$"}
                    {subtotal.toLocaleString()}
                  </p>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                  <p className="text-zinc-500 text-sm">Total final</p>

                  <p className="text-orange-500 font-black text-2xl mt-1">
                    {moneda === "USD" ? "USD $" : "$"}
                    {total.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={guardarPresupuesto}
                  disabled={guardando}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 px-6 py-4 rounded-2xl font-bold"
                >
                  {guardando ? "..." : "Guardar"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
