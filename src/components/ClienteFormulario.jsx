import React from "react";

export default function ClienteFormulario({
  editandoId = null,
  tipo,
  setTipo,
  empresa,
  setEmpresa,
  contacto,
  setContacto,
  telefono,
  setTelefono,
  email,
  setEmail,
  direccion,
  setDireccion,
  observaciones,
  setObservaciones,
  onGuardar,
  onCancelar,
}) {
  console.info("[Contactos] ClienteFormulario renderizado", {
    tipo,
    empresa,
    telefono,
    email,
  });

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-orange-500">
            {editandoId ? "Editar cliente" : "Nuevo cliente"}
          </h2>

          <p className="text-zinc-500 mt-1">
            Completar informacion del cliente
          </p>
        </div>

        <button
          onClick={onCancelar}
          className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-2xl font-bold"
        >
          Cerrar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <select
          value={tipo}
          onChange={(e) => {
            setTipo(e.target.value);
            setContacto("");
          }}
          className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
        >
          <option value="Particular">Particular</option>
          <option value="Empresa">Empresa</option>
        </select>

        {tipo === "Empresa" ? (
          <>
            <input
              type="text"
              placeholder="Empresa"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />

            <input
              type="text"
              placeholder="Persona de contacto"
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />
          </>
        ) : (
          <input
            type="text"
            placeholder="Nombre y apellido"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 md:col-span-2"
          />
        )}

        <input
          type="text"
          placeholder="Telefono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
        />

        <input
          type="text"
          placeholder="Direccion"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
        />

        <textarea
          placeholder="Observaciones"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          className="md:col-span-3 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 min-h-28"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <button
          onClick={onGuardar}
          className="bg-orange-500 hover:bg-orange-600 px-6 py-4 rounded-2xl font-bold"
        >
          {editandoId ? "Actualizar cliente" : "Guardar cliente"}
        </button>

        <button
          onClick={onCancelar}
          className="bg-zinc-700 hover:bg-zinc-600 px-6 py-4 rounded-2xl font-bold"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
