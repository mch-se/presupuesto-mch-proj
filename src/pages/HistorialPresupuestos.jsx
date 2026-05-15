import React from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

export default function HistorialPresupuestos() {
  const [presupuestos, setPresupuestos] =
    React.useState([]);

  const [loading, setLoading] =
    React.useState(true);

  React.useEffect(() => {
    obtenerPresupuestos();
  }, []);

  async function obtenerPresupuestos() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } =
      await supabase
        .from("presupuestos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      alert(error.message);
      return;
    }

    setPresupuestos(data || []);
    setLoading(false);
  }

  function colorEstado(estado) {
    switch (estado) {
      case "Aprobado":
        return "bg-green-500";

      case "Rechazado":
        return "bg-red-500";

      case "Enviado":
        return "bg-blue-500";

      default:
        return "bg-orange-500";
    }
  }

  async function generarNumeroPresupuesto() {
    const hoy = new Date();

    const dia = String(
      hoy.getDate()
    ).padStart(2, "0");

    const mes = String(
      hoy.getMonth() + 1
    ).padStart(2, "0");

    const anio =
      hoy.getFullYear();

    const fechaTexto =
      `${dia}-${mes}-${anio}`;

    const { data } = await supabase
      .from("presupuestos")
      .select("numero");

    const presupuestosHoy =
      data?.filter((p) =>
        p.numero?.includes(
          fechaTexto
        )
      ) || [];

    const numero =
      presupuestosHoy.length + 1;

    return `${numero}-${fechaTexto}`;
  }

  async function duplicarPresupuesto(
    presupuesto
  ) {
    const nuevoNumero =
      await generarNumeroPresupuesto();

    const {
      data: nuevoPresupuesto,
      error,
    } = await supabase
      .from("presupuestos")
      .insert([
        {
          numero: nuevoNumero,
          user_id:
            presupuesto.user_id,
          cliente:
            presupuesto.cliente,
          trabajo:
            presupuesto.trabajo,
          moneda:
            presupuesto.moneda,
          estado: "Pendiente",
          subtotal:
            presupuesto.subtotal,
          iva: presupuesto.iva,
          total:
            presupuesto.total,
        },
      ])
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    const {
      data: itemsOriginales,
    } = await supabase
      .from("presupuesto_items")
      .select("*")
      .eq(
        "presupuesto_id",
        presupuesto.id
      );

    const nuevosItems =
      itemsOriginales.map(
        (item) => ({
          presupuesto_id:
            nuevoPresupuesto.id,

          descripcion:
            item.descripcion,

          cantidad:
            item.cantidad,

          precio: item.precio,

          subtotal:
            item.subtotal,
        })
      );

    const {
      error: errorItems,
    } = await supabase
      .from("presupuesto_items")
      .insert(nuevosItems);

    if (errorItems) {
      alert(errorItems.message);
      return;
    }

    alert(
      "Presupuesto duplicado"
    );

    obtenerPresupuestos();
  }

  async function eliminarPresupuesto(
    id
  ) {
    const confirmar = confirm(
      "¿Eliminar presupuesto?"
    );

    if (!confirmar) return;

    const { error } =
      await supabase
        .from("presupuestos")
        .delete()
        .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    obtenerPresupuestos();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-3xl">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">

      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-10">

          <div>
            <h1 className="text-5xl font-bold text-orange-500">
              Historial
            </h1>

            <p className="text-zinc-400 mt-2">
              Administración de presupuestos
            </p>
          </div>

          <div className="flex gap-4">

            <Link
              to="/presupuestos"
              className="bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-xl font-bold"
            >
              Nuevo Presupuesto
            </Link>

            <Link
              to="/"
              className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-xl font-bold"
            >
              Volver
            </Link>
          </div>
        </div>

        {presupuestos.length ===
        0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-20 text-center">

            <p className="text-3xl text-zinc-400">
              No hay presupuestos cargados
            </p>
          </div>
        ) : (
          <div className="space-y-5">

            {presupuestos.map(
              (presupuesto) => (
                <div
                  key={
                    presupuesto.id
                  }
                  className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6"
                >

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                    <div>

                      <div className="flex items-center gap-4 flex-wrap">

                        <h2 className="text-3xl font-bold text-orange-500">
                          #
                          {
                            presupuesto.numero
                          }
                        </h2>

                        <div
                          className={`${colorEstado(
                            presupuesto.estado
                          )} px-4 py-2 rounded-xl text-sm font-bold`}
                        >
                          {
                            presupuesto.estado
                          }
                        </div>
                      </div>

                      <p className="text-2xl mt-4 font-bold">
                        {
                          presupuesto.cliente
                        }
                      </p>

                      <p className="text-zinc-400 mt-2">
                        {
                          presupuesto.trabajo
                        }
                      </p>

                      <p className="text-zinc-500 mt-3">
                        {new Date(
                          presupuesto.created_at
                        ).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">

                      <p className="text-zinc-400 text-lg">
                        Total
                      </p>

                      <p className="text-4xl font-bold text-orange-500 mt-2">

                        {presupuesto.moneda ===
                        "USD"
                          ? "USD $"
                          : "$"}

                        {Number(
                          presupuesto.total
                        ).toLocaleString()}
                      </p>

                      <div className="flex gap-3 mt-6 justify-end flex-wrap">

                        <Link
                          to={`/presupuesto/${presupuesto.id}`}
                          className="bg-blue-500 hover:bg-blue-600 px-4 py-3 rounded-xl font-bold"
                        >
                          Abrir
                        </Link>

                        <button
                          onClick={() =>
                            duplicarPresupuesto(
                              presupuesto
                            )
                          }
                          className="bg-zinc-700 hover:bg-zinc-600 px-4 py-3 rounded-xl font-bold"
                        >
                          Duplicar
                        </button>

                        <button
                          onClick={() =>
                            eliminarPresupuesto(
                              presupuesto.id
                            )
                          }
                          className="bg-red-500 hover:bg-red-600 px-4 py-3 rounded-xl font-bold"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}