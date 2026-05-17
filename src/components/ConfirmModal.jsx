import React from "react";

export default function ConfirmModal({
  visible,
  titulo = "Confirmar acción",
  mensaje = "¿Querés continuar?",
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  onConfirmar,
  onCancelar,
}) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9998] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-black text-orange-500">
          {titulo}
        </h2>

        <p className="text-zinc-300 mt-4 leading-relaxed">
          {mensaje}
        </p>

        <div className="flex gap-3 justify-end mt-8">
          <button
            onClick={onCancelar}
            className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-2xl font-bold text-white"
          >
            {textoCancelar}
          </button>

          <button
            onClick={onConfirmar}
            className="bg-red-600 hover:bg-red-700 px-5 py-3 rounded-2xl font-bold text-white"
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}