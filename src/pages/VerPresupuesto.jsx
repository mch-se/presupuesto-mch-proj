import React from "react";
import { supabase } from "../lib/supabase";
import { Link, useParams } from "react-router-dom";

export default function VerPresupuesto() {
  const { id } = useParams();

  const [presupuesto, setPresupuesto] =
    React.useState(null);

  const [items, setItems] =
    React.useState([]);

  const [loading, setLoading] =
    React.useState(true);

  React.useEffect(() => {
    obtenerPresupuesto();
  }, []);

  async function obtenerPresupuesto() {
    const { data, error } =
      await supabase
        .from("presupuestos")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
      alert(error.message);
      return;
    }

    setPresupuesto(data);

    const {
      data: itemsData,
    } = await supabase
      .from("presupuesto_items")
      .select("*")
      .eq("presupuesto_id", id);

    setItems(itemsData || []);

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-3xl">
        Cargando...
      </div>
    );
  }

  const simbolo =
    presupuesto.moneda === "USD"
      ? "USD $"
      : "$";

  return (
    <div className="min-h-screen bg-black text-white p-6">

      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-10">

          <div>
            <h1 className="text-5xl font-bold text-orange-500">
              Presupuesto
            </h1>

            <p className="text-orange-500 mt-3 text-2xl font-bold">
              #
              {presupuesto.numero}
            </p>
          </div>

          <div className="flex gap-4">

            <Link
              to="/historial"
              className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-xl font-bold"
            >
              Volver
            </Link>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div>
              <p className="text-zinc-400">
                Cliente
              </p>

              <p className="text-2xl font-bold mt-2">
                {presupuesto.cliente}
              </p>
            </div>

            <div>
              <p className="text-zinc-400">
                Trabajo
              </p>

              <p className="text-2xl font-bold mt-2">
                {presupuesto.trabajo}
              </p>
            </div>

            <div>
              <p className="text-zinc-400">
                Estado
              </p>

              <p className="text-2xl font-bold mt-2 text-orange-500">
                {presupuesto.estado}
              </p>
            </div>
          </div>

          <div className="mt-12">

            <div className="grid grid-cols-12 gap-4 mb-4 px-2 text-zinc-400 font-bold">

              <div className="col-span-6">
                Descripción
              </div>

              <div className="col-span-2">
                Cantidad
              </div>

              <div className="col-span-2">
                Precio
              </div>

              <div className="col-span-2">
                Subtotal
              </div>
            </div>

            <div className="space-y-4">

              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-4 bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                >

                  <div className="col-span-6">
                    {item.descripcion}
                  </div>

                  <div className="col-span-2">
                    {item.cantidad}
                  </div>

                  <div className="col-span-2">

                    {simbolo}

                    {Number(
                      item.precio
                    ).toLocaleString()}
                  </div>

                  <div className="col-span-2 text-orange-500 font-bold">

                    {simbolo}

                    {Number(
                      item.subtotal
                    ).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 bg-zinc-950 border border-zinc-800 rounded-3xl p-8">

            <div className="space-y-4 text-2xl">

              <div className="flex justify-between">

                <span>
                  Subtotal
                </span>

                <span>

                  {simbolo}

                  {Number(
                    presupuesto.subtotal
                  ).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">

                <span>
                  IVA
                </span>

                <span>

                  {simbolo}

                  {Number(
                    presupuesto.iva
                  ).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-4xl font-bold text-orange-500 pt-6 border-t border-zinc-800">

                <span>
                  Total
                </span>

                <span>

                  {simbolo}

                  {Number(
                    presupuesto.total
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}