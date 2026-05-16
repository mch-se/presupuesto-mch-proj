import React from "react";
import { supabase } from "../lib/supabase";
import { Link, useParams } from "react-router-dom";

export default function VerPresupuesto() {
  const { id } = useParams();

  const [presupuesto, setPresupuesto] = React.useState(null);
  const [items, setItems] = React.useState([]);
  const [historialEstados, setHistorialEstados] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    obtenerPresupuesto();
  }, []);

  async function obtenerPresupuesto() {
    const { data, error } = await supabase
      .from("presupuestos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setPresupuesto(data);

    const { data: itemsData } = await supabase
      .from("presupuesto_items")
      .select("*")
      .eq("presupuesto_id", id);

    setItems(itemsData || []);

    const { data: estadosData } = await supabase
      .from("presupuesto_estados")
      .select("*")
      .eq("presupuesto_id", id)
      .order("created_at", { ascending: false });

    setHistorialEstados(estadosData || []);

    setLoading(false);
  }

  async function cambiarEstado(nuevoEstado) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const datos = {
      estado: nuevoEstado,
    };

    if (nuevoEstado === "Cerrado") {
      datos.cerrado = true;
      datos.fecha_cerrado = new Date().toISOString();
    }

    if (nuevoEstado === "Enviado") {
      datos.fecha_enviado = new Date().toISOString();
    }

    if (nuevoEstado === "Aprobado") {
      datos.fecha_aprobado = new Date().toISOString();
    }

    if (nuevoEstado === "Finalizado") {
      datos.fecha_finalizado = new Date().toISOString();
    }

    const { error } = await supabase
      .from("presupuestos")
      .update(datos)
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await supabase.from("presupuesto_estados").insert([
      {
        presupuesto_id: id,
        user_id: user.id,
        estado: nuevoEstado,
        nota: `Estado cambiado a ${nuevoEstado}`,
      },
    ]);

    obtenerPresupuesto();
  }

  async function abrirParaEditar() {
    const confirmar = window.confirm(
      "¿Abrir este presupuesto para editarlo nuevamente?"
    );

    if (!confirmar) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("presupuestos")
      .update({
        cerrado: false,
        estado: "Edición",
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await supabase.from("presupuesto_estados").insert([
      {
        presupuesto_id: id,
        user_id: user.id,
        estado: "Edición",
        nota: "Presupuesto abierto para edición",
      },
    ]);

    obtenerPresupuesto();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-3xl">
        Cargando...
      </div>
    );
  }

  const simbolo = presupuesto.moneda === "USD" ? "USD $" : "$";

  const estadoActual = presupuesto.estado || "Edición";

  const estados = ["Edición", "Cerrado", "Enviado", "Aprobado", "Finalizado"];

  function colorBotonEstado(estado) {
    if (estadoActual !== estado) {
      return "bg-zinc-800 hover:bg-zinc-700 text-white";
    }

    if (estado === "Cerrado") {
      return "bg-red-600 text-white";
    }

    if (
      estado === "Enviado" ||
      estado === "Aprobado" ||
      estado === "Finalizado"
    ) {
      return "bg-green-600 text-white";
    }

    return "bg-orange-500 text-white";
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-orange-500">
              Presupuesto
            </h1>

            <p className="text-zinc-400 mt-2">N° {presupuesto.numero}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to={`/presupuesto-preview/${id}`}
              className="bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-2xl font-bold"
            >
              Vista Previa PDF
            </Link>

            {presupuesto.cerrado ? (
              <button
                onClick={abrirParaEditar}
                className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-2xl font-bold"
              >
                Abrir para editar
              </button>
            ) : (
              <Link
                to={`/presupuestos/${id}`}
                className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-2xl font-bold"
              >
                Editar
              </Link>
            )}

            <Link
              to="/historial"
              className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-2xl font-bold"
            >
              Volver
            </Link>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-between gap-6">
            <div>
              <p className="text-zinc-400 text-sm">Estado actual</p>

              <p
                className={`text-3xl font-black mt-1 ${
                  estadoActual === "Cerrado"
                    ? "text-red-500"
                    : estadoActual === "Enviado" ||
                      estadoActual === "Aprobado" ||
                      estadoActual === "Finalizado"
                    ? "text-green-500"
                    : "text-orange-500"
                }`}
              >
                {estadoActual}
              </p>

              {presupuesto.cerrado && (
                <p className="text-zinc-400 mt-3">
                  Este presupuesto está cerrado y bloqueado contra edición.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {estados.map((estado) => (
                <button
                  key={estado}
                  onClick={() => cambiarEstado(estado)}
                  className={`px-5 py-3 rounded-2xl font-bold transition-all ${colorBotonEstado(
                    estado
                  )}`}
                >
                  {estado}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-zinc-400 text-sm">CLIENTE</p>

              <p className="text-3xl font-bold mt-2">
                {presupuesto.cliente_empresa || presupuesto.cliente}
              </p>

              {presupuesto.cliente_contacto && (
                <p className="text-zinc-400 mt-3">
                  Contacto: {presupuesto.cliente_contacto}
                </p>
              )}

              <p className="text-zinc-400 mt-2">
                Tel: {presupuesto.cliente_telefono || "-"}
              </p>

              <p className="text-zinc-400 mt-2">
                Email: {presupuesto.cliente_email || "-"}
              </p>

              <p className="text-zinc-400 mt-2">
                Dirección: {presupuesto.cliente_direccion || "-"}
              </p>
            </div>

            <div>
              <p className="text-zinc-400 text-sm">DESCRIPCIÓN</p>

              <p className="text-2xl font-bold mt-2">
                {presupuesto.descripcion_corta || "-"}
              </p>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 mt-4 whitespace-pre-wrap leading-relaxed text-zinc-300">
                {presupuesto.descripcion_larga || "-"}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-8">
          <div className="grid grid-cols-12 gap-4 mb-4 px-2 text-zinc-400 font-bold">
            <div className="col-span-6">Descripción</div>
            <div className="col-span-2">Cantidad</div>
            <div className="col-span-2">Precio</div>
            <div className="col-span-2">Subtotal</div>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-4 bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
              >
                <div className="col-span-6">
                  <p className="font-bold">{item.descripcion}</p>

                  {item.detalle && (
                    <p className="text-zinc-400 text-sm mt-2 whitespace-pre-wrap leading-relaxed">
                      {item.detalle}
                    </p>
                  )}
                </div>

                <div className="col-span-2">{item.cantidad}</div>

                <div className="col-span-2">
                  {simbolo}
                  {Number(item.precio).toLocaleString()}
                </div>

                <div className="col-span-2 text-orange-500 font-bold">
                  {simbolo}
                  {Number(item.subtotal).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-orange-500 mb-5">
              Historial de estados
            </h2>

            <div className="space-y-4">
              {historialEstados.map((estado) => (
                <div
                  key={estado.id}
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                >
                  <p className="font-bold">{estado.estado}</p>

                  <p className="text-zinc-400 text-sm mt-1">
                    {new Date(estado.created_at).toLocaleString()}
                  </p>

                  {estado.nota && (
                    <p className="text-zinc-500 text-sm mt-2">
                      {estado.nota}
                    </p>
                  )}
                </div>
              ))}

              {historialEstados.length === 0 && (
                <p className="text-zinc-500">
                  No hay cambios de estado registrados.
                </p>
              )}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 h-fit">
            <div className="space-y-4 text-2xl">
              <div className="flex justify-between">
                <span>Subtotal</span>

                <span>
                  {simbolo}
                  {Number(presupuesto.subtotal).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-4xl font-bold text-orange-500 pt-6 border-t border-zinc-800">
                <span>Total</span>

                <span>
                  {simbolo}
                  {Number(presupuesto.total).toLocaleString()}
                </span>
              </div>

              <p className="text-zinc-500 text-sm">
                Factura C - IVA no discriminado
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}