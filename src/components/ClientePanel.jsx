import React from "react";

export default function ClientePanel({
  cliente,
  setCliente,
  setClienteSeleccionado,
  mostrarMenuCliente,
  setMostrarMenuCliente,
  mostrarClientes,
  setMostrarClientes,
  mostrarDatosCliente,
  setMostrarDatosCliente,
  busquedaCliente,
  setBusquedaCliente,
  clientesFiltrados,
  seleccionarCliente,
  importarContactoCliente,
  limpiarClienteSeleccionado,
  clienteTelefono,
  setClienteTelefono,
  clienteEmail,
  setClienteEmail,
  clienteDireccion,
  setClienteDireccion,
  moneda,
  setMoneda,
  validoHasta,
  setValidoHasta,
  descripcionCorta,
  setDescripcionCorta,
  descripcionLarga,
  setDescripcionLarga,
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 md:p-3 mb-4">
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-1.5 md:gap-2 items-center">
        <span className="text-orange-500 font-black text-sm md:text-base shrink-0">
          Cliente:
        </span>
    
        <input
          type="text"
          placeholder="Seleccionar"
          value={cliente}
          onChange={(e) => {
            setCliente(e.target.value);
            setClienteSeleccionado(null);
          }}
          className="min-w-0 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 md:px-3 py-2 text-sm"
        />
    
        <div className="relative shrink-0">
          <button
            onClick={() => setMostrarMenuCliente(!mostrarMenuCliente)}
            className="bg-zinc-800 hover:bg-zinc-700 w-9 md:w-10 h-9 md:h-10 rounded-xl text-base md:text-lg shrink-0"
          >
            🔍
          </button>
    
          {mostrarMenuCliente && (
            <div className="absolute right-0 top-11 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden z-[90] min-w-64 shadow-2xl">
              <button
                onClick={() => {
                  setMostrarClientes(!mostrarClientes);
                  setMostrarMenuCliente(false);
                }}
                className="w-full text-left px-5 py-4 hover:bg-zinc-800 font-bold"
              >
                👥 Buscar cliente existente
              </button>
    
              <button
                onClick={importarContactoCliente}
                className="w-full text-left px-5 py-4 hover:bg-zinc-800 font-bold"
              >
                👤 Importar contacto
              </button>
            </div>
          )}
        </div>
    
        <button
          onClick={limpiarClienteSeleccionado}
          className="bg-red-500 hover:bg-red-600 w-9 md:w-10 h-9 md:h-10 rounded-xl font-black shrink-0 text-sm md:text-base"
        >
          ✕
        </button>
    
        <button
          onClick={() => setMostrarDatosCliente(!mostrarDatosCliente)}
          className="bg-zinc-800 hover:bg-zinc-700 w-9 md:w-10 h-9 md:h-10 rounded-xl text-sm md:text-lg shrink-0"
        >
          {mostrarDatosCliente ? "▲" : "▼"}
        </button>
      </div>
    
      {mostrarClientes && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3 mt-4">
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={busquedaCliente}
            onChange={(e) => setBusquedaCliente(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4"
          />
    
          <div className="max-h-72 overflow-auto space-y-2">
            {clientesFiltrados.map((clienteItem) => (
              <button
                key={clienteItem.id}
                onClick={() => seleccionarCliente(clienteItem)}
                className="w-full text-left bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-2xl p-4"
              >
                <p className="font-bold">{clienteItem.empresa}</p>
    
                {clienteItem.contacto && (
                  <p className="text-zinc-400 text-sm mt-1">
                    {clienteItem.contacto}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    
      {mostrarDatosCliente && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <input
            type="text"
            placeholder="Teléfono"
            value={clienteTelefono}
            onChange={(e) => setClienteTelefono(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
          />
    
          <input
            type="text"
            placeholder="Email"
            value={clienteEmail}
            onChange={(e) => setClienteEmail(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
          />
    
          <input
            type="text"
            placeholder="Dirección"
            value={clienteDireccion}
            onChange={(e) => setClienteDireccion(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 md:col-span-2"
          />
    
          <select
            value={moneda}
            onChange={(e) => setMoneda(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
          >
            <option value="ARS">Pesos Argentinos</option>
            <option value="USD">Dólares</option>
          </select>
    
          <div>
            <label className="block text-zinc-400 mb-2">
              Presupuesto válido hasta
            </label>
    
            <div className="relative">
              <input
                id="validoHasta"
                type="date"
                value={validoHasta}
                onChange={(e) => setValidoHasta(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 pr-16 text-white"
              />
    
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById("validoHasta");
                  if (!input) return;
                  input.showPicker?.();
                  input.focus();
                  input.click();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-xl text-lg"
              >
                📅
              </button>
            </div>
          </div>
    
          <input
            type="text"
            placeholder="Descripción corta"
            value={descripcionCorta}
            onChange={(e) => setDescripcionCorta(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 md:col-span-2"
          />
    
          <textarea
            placeholder="Descripción larga"
            value={descripcionLarga}
            onChange={(e) => setDescripcionLarga(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 min-h-[160px] md:col-span-2"
          />
        </div>
      )}
    </div>
  );
}
