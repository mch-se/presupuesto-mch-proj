import React from "react";

import { supabase } from "../lib/supabase";

import {
  Link,
  useParams,
} from "react-router-dom";

export default function VistaPreviaPresupuesto() {

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
      error: itemsError,
    } = await supabase
      .from("presupuesto_items")
      .select("*")
      .eq("presupuesto_id", id);

    if (itemsError) {
      alert(itemsError.message);
      return;
    }

    setItems(itemsData || []);

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center text-3xl">
        Cargando...
      </div>
    );
  }

  const simbolo =
    presupuesto.moneda === "USD"
      ? "USD $"
      : "$";

  return (
    <div className="min-h-screen bg-zinc-300 p-6">

      <div className="max-w-5xl mx-auto">

        {/* BOTONES */}

        <div className="flex justify-between mb-6">

          <Link
            to={`/presupuesto/${id}`}
            className="bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-xl font-bold"
          >
            X Cerrar
          </Link>

          <button
            onClick={() => window.print()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-xl font-bold"
          >
            Imprimir
          </button>

        </div>

        {/* HOJA */}

        <div className="bg-white text-black rounded-2xl shadow-2xl p-14">

          {/* HEADER */}

          <div className="flex justify-between items-start border-b pb-8">

            <div>

              <h1 className="text-5xl font-bold">
                MCH
              </h1>

              <p className="mt-3 text-zinc-600">
                Seguridad Electrónica
              </p>

            </div>

            <div className="text-right">

              <p className="text-zinc-500">
                Presupuesto
              </p>

              <p className="text-3xl font-bold mt-2">
                #
                {presupuesto.numero}
              </p>

            </div>

          </div>

          {/* DATOS */}

          <div className="grid grid-cols-2 gap-10 mt-10">

            <div>

              <p className="text-zinc-500">
                Cliente
              </p>

              <p className="text-2xl font-bold mt-2">
                {presupuesto.cliente}
              </p>

            </div>

            <div>

              <p className="text-zinc-500">
                Trabajo
              </p>

              <p className="text-2xl font-bold mt-2">
                {presupuesto.trabajo}
              </p>

            </div>

          </div>

          {/* ITEMS */}

          <div className="mt-14">

            <div className="grid grid-cols-12 border-b pb-4 font-bold text-zinc-600">

              <div className="col-span-6">
                Descripción
              </div>

              <div className="col-span-2 text-center">
                Cantidad
              </div>

              <div className="col-span-2 text-right">
                Precio
              </div>

              <div className="col-span-2 text-right">
                Subtotal
              </div>

            </div>

            <div className="space-y-5 mt-6">

              {items.map((item) => (

                <div
                  key={item.id}
                  className="grid grid-cols-12 border-b pb-4"
                >

                  <div className="col-span-6">
                    {item.descripcion}
                  </div>

                  <div className="col-span-2 text-center">
                    {item.cantidad}
                  </div>

                  <div className="col-span-2 text-right">

                    {simbolo}

                    {Number(
                      item.precio
                    ).toLocaleString()}

                  </div>

                  <div className="col-span-2 text-right font-bold">

                    {simbolo}

                    {Number(
                      item.subtotal
                    ).toLocaleString()}

                  </div>

                </div>

              ))}

            </div>

          </div>

          {/* TOTALES */}

          <div className="mt-16 flex justify-end">

            <div className="w-96 space-y-4">

              <div className="flex justify-between text-xl">

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

              <div className="flex justify-between text-xl">

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

              <div className="flex justify-between text-4xl font-bold border-t pt-6 text-orange-500">

                <span>
                  TOTAL
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

          {/* FOOTER */}

          <div className="mt-20 pt-10 border-t text-zinc-500 text-sm">

            Presupuesto generado por
            MCH Seguridad Electrónica

          </div>

        </div>

      </div>

    </div>
  );
}