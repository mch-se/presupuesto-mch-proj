import React from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import { seleccionarContacto } from "../lib/contactosPermisos";

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
  const [mostrarFiltros, setMostrarFiltros] = React.useState(false);
  const [menuAbierto, setMenuAbierto] = React.useState(null);
  const [clienteVer, setClienteVer] = React.useState(null);

  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastMensaje, setToastMensaje] = React.useState("");
  const [toastTipo, setToastTipo] = React.useState("ok");

  const [modalVisible, setModalVisible] = React.useState(false);
  const [clienteEliminar, setClienteEliminar] = React.useState(null);

  const formularioRef = React.useRef(null);

  React.useEffect(() => {
    obtenerClientes();
  }, []);

  React.useEffect(() => {
    console.info("[Contactos] Estado temporal actualizado", {
      origen: "clientes",
      mostrarFormulario,
      tipo,
      empresa,
      telefono,
      email,
    });

    if (mostrarFormulario) {
      console.info("[Contactos] Mostrando formulario", {
        origen: "clientes",
      });
      console.info("[Contactos] ClienteFormulario renderizado", {
        origen: "clientes",
        tipo,
        empresa,
        telefono,
        email,
      });
    }
  }, [mostrarFormulario, tipo, empresa, telefono, email]);

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

  function limpiarFiltros() {
    setBusqueda("");
    setFiltroTipo("Todos");
  }

  async function importarContacto() {
    console.info("[Contactos] importarContacto inicio", {
      origen: "clientes",
    });
    console.info("[Contactos] Entrando importarContacto", {
      origen: "clientes",
    });

    try {
      console.info("[Contactos] antes de await seleccionarContacto", {
        origen: "clientes",
      });
      const contactos = await seleccionarContacto();
      console.info("[Contactos] después de await seleccionarContacto", {
        origen: "clientes",
      });
      console.info("[Contactos] Contacto recibido en React", {
        origen: "clientes",
        contactos,
      });
      console.info("[Contactos] contacto recibido en pantalla", {
        origen: "clientes",
        contactos,
      });

      const contactoImportado = contactos?.[0];

      if (!contactoImportado) {
        return;
      }

      const nombre = contactoImportado.name?.[0] || "";
      const telefonoContacto = contactoImportado.tel?.[0] || "";
      const emailContacto = contactoImportado.email?.[0] || "";
      const organizacionContacto = contactoImportado.organization?.[0] || "";

      console.info("[Contactos] Contacto seleccionado");
      console.info("[Contactos] Precargando formulario de cliente");
      console.info("[Contactos] Seteando estado temporal", {
        tipo: organizacionContacto ? "Empresa" : "Particular",
        empresa: organizacionContacto || nombre,
        telefono: telefonoContacto,
        email: emailContacto,
      });

      setTipo(organizacionContacto ? "Empresa" : "Particular");
      setEmpresa(organizacionContacto || nombre);
      setContacto("");
      setTelefono(telefonoContacto);
      setEmail(emailContacto);
      setDireccion("");
      setObservaciones("");
      setEditandoId(null);
      console.info("[Contactos] abriendo formulario", {
        origen: "clientes",
      });
      console.info("[Contactos] Abriendo formulario", {
        origen: "clientes",
      });
      setMostrarFormulario(true);

      mostrarToast("Contacto importado. Revisá y guardá el cliente.", "ok");

      setTimeout(() => {
        formularioRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      if (error?.code === "CONTACTS_UNSUPPORTED") {
        mostrarToast(
          "Este dispositivo no permite importar contactos. Cargá el cliente manualmente.",
          "error"
        );
        return;
      }

      if (error?.code === "CONTACTS_PERMISSION_DENIED") {
        mostrarToast("Permiso de contactos denegado", "error");
        return;
      }

      mostrarToast("No se pudo importar el contacto", "error");
    }
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

      console.info("[Contactos] Cliente guardado");
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

      {menuAbierto && (
        <div
          onClick={() => setMenuAbierto(null)}
          className="fixed inset-0 z-40 bg-transparent"
        />
      )}

      {clienteVer && (
        <div className="fixed inset-0 z-[90] bg-black/80 p-4 flex items-center justify-center">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-start gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-black text-orange-500">
                  {clienteVer.empresa || "-"}
                </h2>

                <p className="text-zinc-500 mt-2">
                  Detalle completo del cliente
                </p>
              </div>

              <button
                onClick={() => setClienteVer(null)}
                className="bg-zinc-800 hover:bg-zinc-700 w-12 h-12 rounded-2xl font-black"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-900 rounded-2xl p-4">
                <p className="text-zinc-500 text-sm">Tipo</p>
                <p className="font-bold mt-1">{clienteVer.tipo || "-"}</p>
              </div>

              <div className="bg-zinc-900 rounded-2xl p-4">
                <p className="text-zinc-500 text-sm">Contacto</p>
                <p className="font-bold mt-1">{clienteVer.contacto || "-"}</p>
              </div>

              <div className="bg-zinc-900 rounded-2xl p-4">
                <p className="text-zinc-500 text-sm">Teléfono</p>
                <p className="font-bold mt-1">{clienteVer.telefono || "-"}</p>
              </div>

              <div className="bg-zinc-900 rounded-2xl p-4">
                <p className="text-zinc-500 text-sm">Email</p>
                <p className="font-bold mt-1 break-words">
                  {clienteVer.email || "-"}
                </p>
              </div>

              <div className="bg-zinc-900 rounded-2xl p-4 md:col-span-2">
                <p className="text-zinc-500 text-sm">Dirección</p>
                <p className="font-bold mt-1">{clienteVer.direccion || "-"}</p>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-4 mt-4">
              <p className="text-zinc-500 text-sm mb-2">Observaciones</p>

              <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {clienteVer.observaciones || "-"}
              </p>
            </div>

            <p className="text-zinc-500 text-sm mt-5">
              Cargado por: {clienteVer.cargado_por_alias || "Administrador"}
            </p>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-black text-white p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-5 mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-orange-500">
                Clientes
              </h1>

              <p className="text-zinc-400 mt-3">
                Empresas, particulares y contactos
              </p>
            </div>

            <Link
              to="/"
              className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-xl font-bold text-center"
            >
              Volver
            </Link>
          </div>

          <div ref={formularioRef} className="mb-6">
            {!mostrarFormulario ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setMostrarFormulario(true)}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl p-4 transition-all"
                >
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-2xl font-black">
                      +
                    </div>

                    <p className="text-lg font-black text-white">
                      Agregar cliente
                    </p>
                  </div>
                </button>

                <button
                  onClick={importarContacto}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl p-4 transition-all"
                >
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-2xl">
                      👤
                    </div>

                    <p className="text-lg font-black text-white">
                      Importar contacto
                    </p>
                  </div>
                </button>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8">
                <div className="flex items-center justify-between mb-8 gap-4">
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

                <div className="flex flex-col sm:flex-row gap-4 mt-8">
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

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-6">
            <div className="flex gap-3">
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className="bg-zinc-800 hover:bg-zinc-700 px-5 rounded-2xl text-2xl"
              >
                🔍
              </button>

              <input
                type="text"
                placeholder="Buscar clientes..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
              />
            </div>

            {mostrarFiltros && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                  onClick={limpiarFiltros}
                  className="bg-orange-500 hover:bg-orange-600 rounded-2xl p-4 font-bold"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {clientesFiltrados.map((cliente) => (
              <div
                key={cliente.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 md:p-5"
              >
                <div className="flex justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="bg-orange-500 text-white px-3 py-1 rounded-xl text-sm font-bold">
                        {cliente.tipo}
                      </span>

                      <h2 className="text-xl md:text-2xl font-bold truncate">
                        {cliente.empresa || "-"}
                      </h2>
                    </div>

                    {cliente.tipo === "Empresa" && cliente.contacto && (
                      <p className="text-zinc-500 text-sm mt-2 truncate">
                        Contacto: {cliente.contacto}
                      </p>
                    )}
                  </div>

                  <div className="relative shrink-0">
                    <button
                      onClick={() =>
                        setMenuAbierto(
                          menuAbierto === cliente.id ? null : cliente.id
                        )
                      }
                      className="w-12 h-12 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-3xl font-black"
                    >
                      ⋮
                    </button>

                    {menuAbierto === cliente.id && (
                      <div className="absolute right-0 top-14 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden z-50 min-w-44 shadow-2xl">
                        <button
                          onClick={() => {
                            setClienteVer(cliente);
                            setMenuAbierto(null);
                          }}
                          className="w-full text-left px-5 py-4 hover:bg-zinc-800 font-bold"
                        >
                          Ver
                        </button>

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
