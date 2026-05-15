import React from "react";

import { supabase } from "../lib/supabase";

import {
  Link,
} from "react-router-dom";

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

        .order(
          "created_at",
          { ascending: false }
        );

    if (error) {
      alert(error.message);
      return;
    }

    setPresupuestos(data || []);

    setLoading(false);
  }

  async function eliminarPresupuesto(
    id
  ) {

    const confirmar =
      window.confirm(
        "Eliminar presupuesto?"
      );

    if (!confirmar) return;

    await supabase
      .from("presupuesto_items")
      .delete()
      .eq(
        "presupuesto_id",
        id
      );

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

  async function duplicarPresupuesto(
    presupuesto
  ) {

    const {
      data: nuevo,
      error,
    } = await supabase

      .from("presupuestos")

      .insert([
        {
          numero:
            `${presupuesto.numero}-COPIA`,

          cliente:
            presupuesto.cliente,

          trabajo:
            presupuesto.trabajo,

          subtotal:
            presupuesto.subtotal,

          iva:
            presupuesto.iva,

          total:
            presupuesto.total,

          estado:
            presupuesto.estado,

          moneda:
            presupuesto.moneda,

          user_id:
            presupuesto.user_id,
        },
      ])

      .select()

      .single();

    if (error) {
      alert(error.message);
      return;
    }

    const { data: items } =
      await supabase

        .from("presupuesto_items")

        .select("*")

        .eq(
          "presupuesto_id",
          presupuesto.id
        );

    const nuevosItems =
      items.map((item) => ({
        presupuesto_id:
          nuevo.id,

        descripcion:
          item.descripcion,

        cantidad:
          item.cantidad,

        precio:
          item.precio,

        subtotal:
          item.subtotal,
      }));

    await supabase
      .from("presupuesto_items")
      .insert(nuevosItems);

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

        {/* HEADER */}

        <div className="flex justify-between items-center mb-10">

          <div>

            <h1 className="text-5xl font-bold text-orange-500">
              Historial
            </h1>

            <p className="text-zinc-400 mt-3">
              Administración de presupuestos
            </p>

          </div>

          <Link
            to="/"
            className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-xl font-bold"
          >
            Volver
          </Link>

        </div>

        {/* LISTADO */}

        <div className="space-y-6">

          {presupuestos.map(
            (presupuesto) => (

              <div
                key={presupuesto.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex justify-between items-center"
              >

                <div>

                  <h2 className="text-3xl font-bold">
                    {
                      presupuesto.numero
                    }
                  </h2>

                  <p className="text-zinc-400 mt-3 text-xl">
                    {
                      presupuesto.cliente
                    }
                  </p>

                  <p className="text-zinc-500 mt-2">
                    {
                      presupuesto.trabajo
                    }
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-zinc-500">
                    Total
                  </p>

                  <p className="text-4xl font-bold text-orange-500">

                    {presupuesto.moneda ===
                    "USD"
                      ? "USD $"
                      : "$"}

                    {Number(
                      presupuesto.total
                    ).toLocaleString()}

                  </p>

                  <div className="flex gap-4 mt-6">

                    <Link
                      to={`/presupuesto/${presupuesto.id}`}
                      className="bg-blue-500 hover:bg-blue-600 px-4 py-3 rounded-xl font-bold"
                    >
                      Abrir
                    </Link>

                    <Link
                      to={`/presupuestos/${presupuesto.id}`}
                      className="bg-yellow-500 hover:bg-yellow-600 px-4 py-3 rounded-xl font-bold"
                    >
                      Editar
                    </Link>

                    <button
                      onClick={() =>
                        duplicarPresupuesto(
                          presupuesto
                        )
                      }

                      className="bg-orange-500 hover:bg-orange-600 px-4 py-3 rounded-xl font-bold"
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
            )
          )}

        </div>

      </div>

    </div>
  );
}