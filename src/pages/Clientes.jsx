import React from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

export default function Clientes() {
  const [tipo, setTipo] = React.useState("Empresa");
  const [empresa, setEmpresa] = React.useState("");
  const [contacto, setContacto] = React.useState("");
  const [telefono, setTelefono] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [direccion, setDireccion] = React.useState("");
  const [observaciones, setObservaciones] = React.useState("");

  const [clientes, setClientes] = React.useState([]);
  const [busqueda, setBusqueda] = React.useState("");
  const [filtroTipo, setFiltroTipo] = React.useState("Todos");
  const [editandoId, setEditandoId] = React.useState(null);

  const [mostrarFormulario, setMostrarFormulario] = React.useState(false);
  const [menuAbierto, setMenuAbierto] = React.useState(null);

  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastMensaje, setToastMensaje] = React.useState("");
  const [toastTipo, setToastTipo] = React.useState("ok");

  const [modalVisible, setModalVisible] = React.useState(false);
  const [clienteEliminar, setClienteEliminar] = React.useState(null);

  const formularioRef = React.useRef(null);

  React.useEffect(() => {
    obtenerClientes();
  }, []);

  async function obtenerClientes() {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      mostrarToast(error.message, "error");
      return;
    }

    setClientes(data || []);
  }

  function mostrarToast(mensaje, tipo = "ok") {
    setToastMensaje(mensaje);
    setToastTipo(tipo);
    setToastVisible(true);

    setTimeout(() => {
      setToastVisible(false);
    }, 2500);
  }

  function limpiarFormulario() {
    setTipo("Empresa");
    setEmpresa("");
    setContacto("");
    setTelefono("");
    setEmail("");
    setDireccion("");
    setObservaciones("");
    setEditandoId(null);
    setMostrarFormulario(false);
  }

  async function guardarCliente() {
    if (tipo === "Empresa" && !empresa) {
      mostrarToast("Ingresar empresa", "error");
      return;
    }

    if (tipo === "Particular" && !empresa) {
      mostrarToast("Ingresar persona", "error");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = await supabase
      .from("profiles")
      .select("alias")
      .eq("id", user.id)
      .single();

    const alias = profile?.alias || "Administrador";

    const datosCliente = {
      tipo,
      empresa,
      contacto: tipo === "Empresa" ? contacto : "",
      telefono,
      email,
      direccion,
      observaciones,
      user_id: user.id,
      cargado_por: user.id,
      cargado_por_alias: alias,
    };

    if (editandoId) {
      const { error } = await supabase
        .from("clientes")
        .update(datosCliente)
        .eq("id", editandoId);

      if (error) {
        mostrarToast(error.message, "error");
        return;
      }

      mostrarToast("Cliente actualizado", "ok");
    } else {
      const { error } = await supabase.from("clientes").insert([datosCliente]);

      if (error) {
        mostrarToast(error.message, "error");
        return;
      }

      mostrarToast("Cliente creado correctamente", "ok");
    }

    limpiarFormulario();
    obtenerClientes();
  }

  function editarCliente(cliente) {
    setTipo(cliente.tipo || "Empresa");
    setEmpresa(cliente.empresa || "");
    setContacto(cliente.contacto || "");
    setTelefono(cliente.telefono || "");
    setEmail(cliente.email || "");
    setDireccion(cliente.direccion || "");
    setObservaciones(cliente.observaciones || "");
    setEditandoId(cliente.id);
    setMostrarFormulario(true);
    setMenuAbierto(null);

    setTimeout(() => {
      formularioRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  function solicitarEliminarCliente(id) {
    setClienteEliminar(id);
    setModalVisible(true);
    setMenuAbierto(null);
  }

  async function confirmarEliminarCliente() {
    if (!clienteEliminar) return;

    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", clienteEliminar);

    if (error) {
      mostrarToast(error.message, "error");
      return;
    }

    mostrarToast("Cliente eliminado", "ok");

    setModalVisible(false);
    setClienteEliminar(null);

    obtenerClientes();
  }

  const clientesFiltrados = clientes.filter((cliente) => {
    const texto = `
      ${cliente.tipo || ""}
      ${cliente.empresa || ""}
      ${cliente.contacto || ""}
      ${cliente.telefono || ""}
      ${cliente.email || ""}
      ${cliente.direccion || ""}
      ${cliente.cargado_por_alias || ""}
    `.toLowerCase();

    const coincideBusqueda = texto.includes(busqueda.toLowerCase());
    const coincideTipo =
      filtroTipo === "Todos" ? true : cliente.tipo === filtroTipo;

    return coincideBusqueda && coincideTipo;
  });

  return (
    <>
      <ConfirmModal
        visible={modalVisible}
        titulo="Eliminar cliente"
        mensaje="Esta acción eliminará el cliente definitivamente."
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        onCancelar={() => {
          setModalVisible(false);
          setClienteEliminar(null);
        }}
        onConfirmar={confirmarEliminarCliente}
      />

      <Toast mensaje={toastMensaje} tipo={toastTipo} visible={toastVisible} />

      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-5 mb-10">
            <div>
              <h1 className="text-5xl font-bold text-orange-500">
                Clientes
              </h1>

              <p className="text-zinc-400 mt-3">
                Empresas, particulares y contactos
              </p>
            </div>

            <Link
              to="/"
              className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-xl font-bold"
            >
              Volver
            </Link>
          </div>

          <div ref={formularioRef} className="mb-10">
            {!mostrarFormulario ? (
              <button
                onClick={() => setMostrarFormulario(true)}
                className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-3xl p-8 transition-all"
              >
                <div className="flex items-center justify-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center text-4xl font-black">
                    +
                  </div>

                  <div className="text-left">
                    <p className="text-2xl font-black text-white">
                      Agregar cliente
                    </p>

                    <p className="text-zinc-500 mt-1">
                      Crear nuevo cliente o contacto
                    </p>
                  </div>
                </div>
              </button>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-black text-orange-500">
                      {editandoId ? "Editar cliente" : "Nuevo cliente"}
                    </h2>

                    <p className="text-zinc-500 mt-1">
                      Completar información del cliente
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
                  <select
                    value={tipo}
                    onChange={(e) => {
                      setTipo(e.target.value);
                      setContacto("");
                    }}
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                  >
                    <option value="Empresa">Empresa</option>
                    <option value="Particular">Particular</option>
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
                      placeholder="Persona"
                      value={empresa}
                      onChange={(e) => setEmpresa(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 md:col-span-2"
                    />
                  )}

                  <input
                    type="text"
                    placeholder="Teléfono"
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
                    placeholder="Dirección"
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

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={guardarCliente}
                    className="bg-orange-500 hover:bg-orange-600 px-6 py-4 rounded-2xl font-bold"
                  >
                    {editandoId ? "Actualizar cliente" : "Guardar cliente"}
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

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
              />

              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
              >
                <option>Todos</option>
                <option>Empresa</option>
                <option>Particular</option>
              </select>

              <button
                onClick={() => {
                  setBusqueda("");
                  setFiltroTipo("Todos");
                }}
                className="bg-orange-500 hover:bg-orange-600 rounded-2xl p-4 font-bold"
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {clientesFiltrados.map((cliente) => (
              <div
                key={cliente.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6"
              >
                <div className="flex flex-col lg:flex-row lg:justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="bg-orange-500 text-white px-3 py-1 rounded-xl text-sm font-bold">
                        {cliente.tipo}
                      </span>

                      <h2 className="text-2xl font-bold">
                        {cliente.empresa || "-"}
                      </h2>
                    </div>

                    {cliente.tipo === "Empresa" && (
                      <p className="text-zinc-400 mt-3">
                        Contacto: {cliente.contacto || "-"}
                      </p>
                    )}

                    <p className="text-zinc-400 mt-3">
                      Teléfono: {cliente.telefono || "-"}
                    </p>

                    <p className="text-zinc-400">
                      Email: {cliente.email || "-"}
                    </p>

                    <p className="text-zinc-400">
                      Dirección: {cliente.direccion || "-"}
                    </p>

                    <p className="text-zinc-500 mt-3 text-sm">
                      Cargado por:{" "}
                      {cliente.cargado_por_alias || "Administrador"}
                    </p>

                    {cliente.observaciones && (
                      <p className="text-zinc-500 mt-3">
                        {cliente.observaciones}
                      </p>
                    )}
                  </div>

                  <div className="relative lg:self-start">
                    <button
                      onClick={() =>
                        setMenuAbierto(
                          menuAbierto === cliente.id ? null : cliente.id
                        )
                      }
                      className="w-14 h-14 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-3xl font-black"
                    >
                      ⋮
                    </button>

                    {menuAbierto === cliente.id && (
                      <div className="absolute right-0 top-16 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden z-50 min-w-44 shadow-2xl">
                        <button
                          onClick={() => editarCliente(cliente)}
                          className="w-full text-left px-5 py-4 hover:bg-zinc-800 font-bold"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => solicitarEliminarCliente(cliente.id)}
                          className="w-full text-left px-5 py-4 hover:bg-red-500/20 text-red-400 font-bold"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {clientesFiltrados.length === 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center text-zinc-500">
                No hay clientes cargados.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}