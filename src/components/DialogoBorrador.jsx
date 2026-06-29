export default function DialogoBorrador({
  visible,
  onContinuar,
  onDescartar,
}) {
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-orange-500 mb-3">
          Se encontró un borrador
        </h2>

        <p className="text-zinc-300 mb-6">
          Hay un presupuesto sin guardar.
          ¿Deseás continuar editándolo o descartarlo?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onContinuar}
            className="flex-1 bg-orange-500 hover:bg-orange-600 rounded-xl py-3 font-bold"
          >
            Continuar
          </button>

          <button
            onClick={onDescartar}
            className="flex-1 bg-zinc-700 hover:bg-zinc-600 rounded-xl py-3 font-bold"
          >
            Descartar
          </button>
        </div>
      </div>
    </div>
  );
}