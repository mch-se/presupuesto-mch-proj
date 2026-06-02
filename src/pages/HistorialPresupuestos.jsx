import React from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";

export default function HistorialPresupuestos() {
  const navigate = useNavigate();

  const [presupuestos, setPresupuestos] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [menuAbierto, setMenuAbierto] = React.useState(null);
  const [rol, setRol] = React.useState(null);

  const [busqueda, setBusqueda] = React.useState("");
  const [filtroEstado, setFiltroEstado] = React.useState("Todos");
  const [filtroMoneda, setFiltroMoneda] = React.useState("Todas");

  const [mostrarFiltros, setMostrarFiltros] = React.useState(false);

  const [modalVisible, setModalVisible] = React.useState(false);
  const [modalTitulo, setModalTitulo] = React.useState("");
  const [modalMensaje, setModalMensaje] = React.useState("");
  const [accionPendiente, setAccionPendiente] = React.useState(null);

  React.useEffect(() => {
    obtenerPresupuestos();
  }, []);

  async function obtenerPresupuestos() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: perfil } = await supabase
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    const rolUsuario = perfil?.rol || "pendiente";
    setRol(rolUsuario);

    let query = supabase.from("presupuestos").select("*");

    if (rolUsuario === "vendedor") {
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setPresupuestos(data || []);
    setLoading(false);
  }

  function limpiarFiltros() {
    setBusqueda("");
    setFiltroEstado("Todos");
    setFiltroMoneda("Todas");
  }

  async function generarNumeroNuevo() {
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, "0");
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const anio = hoy.getFullYear();
    const fechaTexto = `${dia}-${mes}-${anio}`;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data } = await supabase
      .from("presupuestos")
      .select("numero")
      .eq("user_id", user.id);

    const presupuestosHoy =
      data?.filter((p) => p.numero?.includes(fechaTexto)) || [];

    return `${presupuestosHoy.length + 1}-${fechaTexto}`;
  }

  function abrirPresupuesto(presupuesto) {
    setMenuAbierto(null);

    if ((presupuesto.estado || "Edición") === "Finalizado") {
      setAccionPendiente({
        tipo: "abrir_finalizado",
        id: presupuesto.id,
      });

      setModalTitulo("Presupuesto finalizado");

      setModalMensaje(
        "Este presupuesto está finalizado. ¿Deseás abrirlo igualmente?"
      );

      setModalVisible(true);

      return;
    }

    navigate(`/presupuesto/${presupuesto.id}`);
  }

  function solicitarEliminarPresupuesto(id) {
    setMenuAbierto(null);

    setAccionPendiente({
      tipo: "eliminar",
      id,
    });

    setModalTitulo("Eliminar presupuesto");

    setModalMensaje(
      "Esta acción eliminará el presupuesto definitivamente."
    );

    setModalVisible(true);
  }

  async function confirmarAccion() {
    if (!accionPendiente) return;

    if (accionPendiente.tipo === "abrir_finalizado") {
      const idAbrir = accionPendiente.id;

      setModalVisible(false);
      setAccionPendiente(null);

      navigate(`/presupuesto/${idAbrir}`);

      return;
    }

    if (accionPendiente.tipo === "eliminar") {
      await supabase
        .from("presupuesto_items")
        .delete()
        .eq("presupuesto_id", accionPendiente.id);

      const { error } = await supabase
        .from("presupuestos")
        .delete()
        .eq("id", accionPendiente.id);

      if (error) {
        alert(error.message);
        return;
      }

      setModalVisible(false);
      setAccionPendiente(null);

      obtenerPresupuestos();
    }
  }

  async function duplicarPresupuesto(presupuesto) {
    setMenuAbierto(null);

    const numeroNuevo = await generarNumeroNuevo();

    const { data: nuevo, error } = await supabase
      .from("presupuestos")
      .insert([
        {
          numero: numeroNuevo,
          cliente: presupuesto.cliente,
          cliente_id: presupuesto.cliente_id || null,
          cliente_empresa:
            presupuesto.cliente_empresa || presupuesto.cliente || "",
          cliente_contacto: presupuesto.cliente_contacto || "",
          cliente_telefono: presupuesto.cliente_telefono || "",
          cliente_email: presupuesto.cliente_email || "",
          cliente_direccion: presupuesto.cliente_direccion || "",
          descripcion_corta: presupuesto.descripcion_corta || "",
          descripcion_larga: presupuesto.descripcion_larga || "",
          subtotal: presupuesto.subtotal,
          iva: 0,
          total: presupuesto.total,
          estado: "Edición",
          moneda: presupuesto.moneda,
          tipo_factura: "C",
          aplica_iva: false,
          user_id: presupuesto.user_id,
          generado_por: presupuesto.generado_por || presupuesto.user_id,
          generado_por_alias: presupuesto.generado_por_alias || "",
        },
      ])
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    const { data: items } = await supabase
      .from("presupuesto_items")
      .select("*")
      .eq("presupuesto_id", presupuesto.id);

    const nuevosItems = (items || []).map((item) => ({
      presupuesto_id: nuevo.id,
      descripcion: item.descripcion,
      detalle: item.detalle || "",
      categoria_id: item.categoria_id || null,
      tipo_id: item.tipo_id || null,
      categoria: item.categoria || "",
      tipo: item.tipo || "",
      cantidad: item.cantidad,
      precio: item.precio,
      subtotal: item.subtotal,
    }));

    if (nuevosItems.length > 0) {
      await supabase.from("presupuesto_items").insert(nuevosItems);
    }

    obtenerPresupuestos();
  }

  function colorEstado(estado) {
    if (estado === "Aprobado") {
      return "bg-green-600 text-white";
    }

    if (estado === "Finalizado") {
      return "bg-purple-600 text-white";
    }

    if (estado === "Cerrado") {
      return "bg-red-600 text-white";
    }

    if (estado === "Enviado") {
      return "bg-blue-600 text-white";
    }

    return "bg-orange-500 text-white";
  }

  const presupuestosFiltrados = presupuestos.filter((presupuesto) => {
    const texto = `
      ${presupuesto.numero || ""}
      ${presupuesto.cliente || ""}
      ${presupuesto.cliente_empresa || ""}
      ${presupuesto.descripcion_corta || ""}
      ${presupuesto.generado_por_alias || ""}
    `.toLowerCase();

    const coincideBusqueda = texto.includes(busqueda.toLowerCase());

    const coincideEstado =
      filtroEstado === "Todos"
        ? true
        : (presupuesto.estado || "Edición") === filtroEstado;

    const coincideMoneda =
      filtroMoneda === "Todas"
        ? true
        : presupuesto.moneda === filtroMoneda;

    return coincideBusqueda && coincideEstado && coincideMoneda;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-3xl">
        Cargando...
      </div>
    );
  }

  return (
    <>
      <ConfirmModal
        visible={modalVisible}
        titulo={modalTitulo}
        mensaje={modalMensaje}
        textoConfirmar="Confirmar"
        textoCancelar="Cancelar"
        onCancelar={() => {
          setModalVisible(false);
          setAccionPendiente(null);
        }}
        onConfirmar={confirmarAccion}
      />

      {menuAbierto && (
        <div
          onClick={() => setMenuAbierto(null)}
          className="fixed inset-0 z-40 bg-transparent"
        />
      )}

      <div className="min-h-screen bg-black text-white p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-orange-500">
                Presupuestos
              </h1>

              <p className="text-zinc-400 mt-2">
                Presupuestos guardados
              </p>
            </div>

            <Link
              to="/"
              className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-2xl font-bold"
            >
              Volver
            </Link>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-6">
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setMostrarFiltros(!mostrarFiltros)
                }
                className="bg-zinc-800 hover:bg-zinc-700 px-5 rounded-2xl text-2xl"
              >
                🔍
              </button>

              <input
                type="text"
                placeholder="Buscar presupuestos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-3 text-white outline-none"
              />
            </div>

            {mostrarFiltros && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <select
                  value={filtroEstado}
                  onChange={(e) =>
                    setFiltroEstado(e.target.value)
                  }
                  className="bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-3 text-white outline-none"
                >
                  <option>Todos</option>
                  <option>Edición</option>
                  <option>Cerrado</option>
                  <option>Enviado</option>
                  <option>Aprobado</option>
                  <option>Finalizado</option>
                </select>

                <select
                  value={filtroMoneda}
                  onChange={(e) =>
                    setFiltroMoneda(e.target.value)
                  }
                  className="bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-3 text-white outline-none"
                >
                  <option>Todas</option>
                  <option>ARS</option>
                  <option>USD</option>
                </select>

                <button
                  onClick={limpiarFiltros}
                  className="bg-orange-500 hover:bg-orange-600 rounded-2xl px-4 py-3 font-bold"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {presupuestosFiltrados.map((presupuesto) => (
              <div
                key={presupuesto.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4"
              >
                <div className="flex justify-between gap-4">
                  <div className="min-w-0 flex-1"
                    onClick={() => abrirPresupuesto(presupuesto)}
                    >
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-xl md:text-2xl font-black">
                        {presupuesto.numero}
                      </h2>
                    </div>

                    <p className="text-zinc-300 mt-1 text-lg truncate">
                      {presupuesto.cliente_empresa ||
                        presupuesto.cliente}
                    </p>

                    <p className="text-zinc-500 text-sm mt-1 truncate">
                      {presupuesto.descripcion_corta || "-"}
                    </p>
                  </div>

                  <div className="flex items-start gap-3 shrink-0">
                    <div className="text-right">
                      <span
                        className={`${colorEstado(
                          presupuesto.estado
                        )} inline-block px-3 py-1 rounded-xl text-sm font-bold`}
                      >
                        {presupuesto.estado || "Edición"}
                      </span>

                      <p className="text-orange-500 font-black text-xl mt-2">
                        {presupuesto.moneda === "USD"
                          ? "USD $"
                          : "$"}
                        {Number(
                          presupuesto.total
                        ).toLocaleString()}
                      </p>
                    </div>

                    <div className="relative">
                      <button
                        onClick={() =>
                          setMenuAbierto(
                            menuAbierto === presupuesto.id
                              ? null
                              : presupuesto.id
                          )
                        }
                        className="w-12 h-12 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-3xl font-black"
                      >
                        ⋮
                      </button>

                      {menuAbierto === presupuesto.id && (
                        <div className="absolute right-0 top-14 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden z-50 min-w-48 shadow-2xl">
                          <button
                            onClick={() =>
                              abrirPresupuesto(
                                presupuesto
                              )
                            }
                            className="w-full text-left px-5 py-4 hover:bg-zinc-800 font-bold"
                          >
                            Abrir
                          </button>

                          <Link
                            to={`/presupuestos/${presupuesto.id}`}
                            className="block px-5 py-4 hover:bg-zinc-800 font-bold"
                          >
                            Editar
                          </Link>

                          <button
                            onClick={() =>
                              duplicarPresupuesto(
                                presupuesto
                              )
                            }
                            className="w-full text-left px-5 py-4 hover:bg-zinc-800 font-bold"
                          >
                            Duplicar
                          </button>

                          <button
                            onClick={() =>
                              solicitarEliminarPresupuesto(
                                presupuesto.id
                              )
                            }
                            className="w-full text-left px-5 py-4 hover:bg-red-500/20 text-red-400 font-bold"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {presupuestosFiltrados.length === 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center text-zinc-500">
                No hay presupuestos encontrados.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}