import React from "react";

export default function MenuFlotante({
  mostrarMenuFlotante,
  setMostrarMenuFlotante,
  mostrarBiblioteca,
  setMostrarBiblioteca,
  setMostrarPlantillas,
  agregarItemManual,
  onImportarCsv,
}) {
  return (
    <>
      {mostrarMenuFlotante && (
        <div className="fixed bottom-28 right-4 z-[90] flex flex-col gap-2">
          <button
            onClick={() => {
              setMostrarBiblioteca(!mostrarBiblioteca);
              setMostrarPlantillas(false);
              setMostrarMenuFlotante(false);
            }}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-4 py-3 rounded-2xl text-left shadow-2xl"
          >
            📚 Biblioteca
          </button>

          <button
            onClick={() => {
              setMostrarPlantillas((actual) => !actual);
              setMostrarBiblioteca(false);
              setMostrarMenuFlotante(false);
            }}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-4 py-3 rounded-2xl text-left shadow-2xl"
          >
            📋 Plantilla
          </button>

          <button
            onClick={() => {
              agregarItemManual();
              setMostrarMenuFlotante(false);
            }}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-4 py-3 rounded-2xl text-left shadow-2xl"
          >
            ✍ Manual
          </button>

          <button
            onClick={() => {
              onImportarCsv?.();
              setMostrarMenuFlotante(false);
            }}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-4 py-3 rounded-2xl text-left shadow-2xl"
          >
            📄 Importar CSV
          </button>
        </div>
      )}

      <button
        onClick={() => setMostrarMenuFlotante(!mostrarMenuFlotante)}
        className="fixed bottom-28 right-4 z-[95] bg-orange-500 hover:bg-orange-600 w-16 h-16 rounded-full text-4xl font-light shadow-2xl"
      >
        +
      </button>
    </>
  );
}
