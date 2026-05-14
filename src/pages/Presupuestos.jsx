import React from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

export default function Presupuestos() {
  const [cliente, setCliente] = React.useState("");
  const [trabajo, setTrabajo] = React.useState("");
  const [moneda, setMoneda] = React.useState("ARS");

  const [numeroPresupuesto, setNumeroPresupuesto] =
    React.useState("");

  const [items, setItems] = React.useState([
    {
      descripcion: "",
      cantidad: "",
      precio: "",
    },
  ]);

  React.useEffect(() => {
    generarNumeroPresupuesto();
  }, []);

  async function generarNumeroPresupuesto() {
    const hoy = new Date();

    const dia = String(hoy.getDate()).padStart(2, "0");

    const mes = String(
      hoy.getMonth() + 1
    ).padStart(2, "0");

    const anio = hoy.getFullYear();

    const fechaTexto =
      `${dia}-${mes}-${anio}`;

    const { data } = await supabase
      .from("presupuestos")
      .select("numero");

    const presupuestosHoy =
      data?.filter((p) =>
        p.numero?.includes(fechaTexto)
      ) || [];

    const numero =
      presupuestosHoy.length + 1;

    setNumeroPresupuesto(
      `${numero}-${fechaTexto}`
    );
  }

  function agregarItemManual() {
    setItems([
      ...items,
      {
        descripcion: "",
        cantidad: "",
        precio: "",
      },
    ]);
  }

  function actualizarItem(
    index,
    campo,
    valor
  ) {
    const nuevos = [...items];

    nuevos[index][campo] =
      campo === "descripcion"
        ? valor
        : valor;

    setItems(nuevos);
  }

  function eliminarItem(index) {
    const nuevos = items.filter(
      (_, i) => i !== index
    );

    setItems(nuevos);
  }

  const subtotal = items.reduce(
    (acc, item) =>
      acc +
      Number(item.cantidad || 0) *
        Number(item.precio || 0),
    0
  );

  const iva = subtotal * 0.21;

  const total = subtotal + iva;

  async function guardarPresupuesto() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } =
      await supabase
        .from("presupuestos")
        .insert([
          {
            numero: numeroPresupuesto,
            user_id: user.id,
            cliente,
            trabajo,
            moneda,
            estado: "Pendiente",
            subtotal,
            iva,
            total,
          },
        ])
        .select()
        .single();

    if (error) {
      alert(error.message);
      return;
    }

    const presupuestoId = data.id;

    const itemsGuardar = items.map(
      (item) => ({
        presupuesto_id: presupuestoId,
        descripcion: item.descripcion,
        cantidad: Number(
          item.cantidad || 0
        ),
        precio: Number(
          item.precio || 0
        ),
        subtotal:
          Number(item.cantidad || 0) *
          Number(item.precio || 0),
      })
    );

    const {
      error: errorItems,
    } = await supabase
      .from("presupuesto_items")
      .insert(itemsGuardar);

    if (errorItems) {
      alert(errorItems.message);
      return;
    }

    alert("Presupuesto guardado");

    setCliente("");
    setTrabajo("");
    setMoneda("ARS");

    setItems([
      {
        descripcion: "",
        cantidad: "",
        precio: "",
      },
    ]);

    generarNumeroPresupuesto();
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">

      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-8">

          <div>
            <h1 className="text-5xl font-bold text-orange-500">
              Presupuestos
            </h1>

            <p className="text-zinc-400 mt-2">
              Crear presupuestos MCH
            </p>

            <p className="text-orange-500 mt-3 text-xl font-bold">
              Presupuesto #
              {numeroPresupuesto}
            </p>
          </div>

          <Link
            to="/"
            className="bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-xl font-bold"
          >
            Volver
          </Link>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div>
              <p className="mb-2 text-zinc-400">
                Cliente
              </p>

              <input
                value={cliente}
                onChange={(e) =>
                  setCliente(
                    e.target.value
                  )
                }
                placeholder="Cliente"
                className="w-full bg-zinc-950 border border-zinc-700 p-4 rounded-xl"
              />
            </div>

            <div>
              <p className="mb-2 text-zinc-400">
                Trabajo
              </p>

              <input
                value={trabajo}
                onChange={(e) =>
                  setTrabajo(
                    e.target.value
                  )
                }
                placeholder="Trabajo"
                className="w-full bg-zinc-950 border border-zinc-700 p-4 rounded-xl"
              />
            </div>

            <div>
              <p className="mb-2 text-zinc-400">
                Moneda
              </p>

              <select
                value={moneda}
                onChange={(e) =>
                  setMoneda(
                    e.target.value
                  )
                }
                className="w-full bg-zinc-950 border border-zinc-700 p-4 rounded-xl"
              >
                <option value="ARS">
                  ARS $
                </option>

                <option value="USD">
                  USD $
                </option>
              </select>
            </div>
          </div>

          <div className="mt-10">

            <div className="flex justify-between items-center mb-6">

              <h2 className="text-3xl font-bold">
                Items
              </h2>

              <div className="flex gap-4">

                <Link
                  to="/articulos"
                  className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-xl font-bold"
                >
                  Biblioteca de Artículos
                </Link>

                <button
                  onClick={
                    agregarItemManual
                  }
                  className="bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-xl font-bold"
                >
                  Agregar Item Manual
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 px-2 text-zinc-400 font-bold">

              <div className="md:col-span-5">
                Descripción
              </div>

              <div className="md:col-span-2">
                Cantidad
              </div>

              <div className="md:col-span-2">
                Precio
              </div>

              <div className="md:col-span-2">
                Subtotal
              </div>

              <div className="md:col-span-1">
              </div>
            </div>

            <div className="space-y-4">

              {items.map(
                (item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                  >

                    <div className="md:col-span-5">

                      <input
                        value={
                          item.descripcion
                        }
                        onChange={(e) =>
                          actualizarItem(
                            index,
                            "descripcion",
                            e.target.value
                          )
                        }
                        placeholder="Descripción"
                        className="w-full bg-zinc-900 border border-zinc-700 p-4 rounded-xl"
                      />
                    </div>

                    <div className="md:col-span-2">

                      <input
                        type="number"
                        value={
                          item.cantidad
                        }
                        onChange={(e) =>
                          actualizarItem(
                            index,
                            "cantidad",
                            e.target.value
                          )
                        }
                        placeholder="0"
                        className="w-full bg-zinc-900 border border-zinc-700 p-4 rounded-xl"
                      />
                    </div>

                    <div className="md:col-span-2">

                      <input
                        type="number"
                        value={
                          item.precio
                        }
                        onChange={(e) =>
                          actualizarItem(
                            index,
                            "precio",
                            e.target.value
                          )
                        }
                        placeholder="0"
                        className="w-full bg-zinc-900 border border-zinc-700 p-4 rounded-xl"
                      />
                    </div>

                    <div className="md:col-span-2 flex items-center text-xl font-bold text-orange-500">

                      {moneda === "USD"
                        ? "USD $"
                        : "$"}

                      {(
                        Number(
                          item.cantidad ||
                            0
                        ) *
                        Number(
                          item.precio ||
                            0
                        )
                      ).toLocaleString()}
                    </div>

                    <div className="md:col-span-1">

                      <button
                        onClick={() =>
                          eliminarItem(
                            index
                          )
                        }
                        className="w-full bg-red-500 hover:bg-red-600 p-4 rounded-xl font-bold"
                      >
                        X
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="mt-12 bg-zinc-950 border border-zinc-800 rounded-3xl p-8">

            <div className="space-y-4 text-2xl">

              <div className="flex justify-between">

                <span>
                  Subtotal
                </span>

                <span>

                  {moneda === "USD"
                    ? "USD $"
                    : "$"}

                  {subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">

                <span>
                  IVA
                </span>

                <span>

                  {moneda === "USD"
                    ? "USD $"
                    : "$"}

                  {iva.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-4xl font-bold text-orange-500 pt-6 border-t border-zinc-800">

                <span>
                  Total
                </span>

                <span>

                  {moneda === "USD"
                    ? "USD $"
                    : "$"}

                  {total.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={
                guardarPresupuesto
              }
              className="mt-10 w-full bg-orange-500 hover:bg-orange-600 p-5 rounded-2xl text-2xl font-bold"
            >
              Guardar Presupuesto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}