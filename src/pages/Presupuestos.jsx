import React from "react";

import { supabase } from "../lib/supabase";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

export default function Presupuestos() {

  const navigate = useNavigate();

  const { id } = useParams();

  const modoEdicion = !!id;

  const [cliente, setCliente] =
    React.useState("");

  const [trabajo, setTrabajo] =
    React.useState("");

  const [moneda, setMoneda] =
    React.useState("ARS");

  const [items, setItems] =
    React.useState([]);

  const [numeroPresupuesto, setNumeroPresupuesto] =
    React.useState("");

  const [mostrarBiblioteca, setMostrarBiblioteca] =
    React.useState(false);

  const [articulos, setArticulos] =
    React.useState([]);

  const [busquedaArticulo, setBusquedaArticulo] =
    React.useState("");

  React.useEffect(() => {

    obtenerArticulos();

    if (modoEdicion) {
      cargarPresupuesto();
    } else {
      generarNumeroPresupuesto();
    }

  }, []);

  async function cargarPresupuesto() {

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

    console.log("PRESUPUESTO CARGADO:");
    console.log(data);

    setCliente(
      data.cliente || ""
    );

    setTrabajo(
      data.trabajo || ""
    );

    setMoneda(
      data.moneda || "ARS"
    );

    setNumeroPresupuesto(
      data.numero || ""
    );

    const {
      data: itemsData,
    } = await supabase

      .from("presupuesto_items")

      .select("*")

      .eq(
        "presupuesto_id",
        id
      );

    setItems(itemsData || []);
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

    setNumeroPresupuesto(
      `${numero}-${fechaTexto}`
    );
  }

  async function obtenerArticulos() {

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } =
      await supabase
        .from("articulos")
        .select("*")
        .eq("user_id", user.id)
        .order("descripcion");

    if (error) {
      alert(error.message);
      return;
    }

    setArticulos(data || []);
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

    const nuevosItems = [
      ...items,
    ];

    nuevosItems[index][campo] =
      valor;

    setItems(nuevosItems);
  }

  function eliminarItem(index) {

    const nuevosItems =
      items.filter(
        (_, i) => i !== index
      );

    setItems(nuevosItems);
  }

  function agregarArticuloAlPresupuesto(
    articulo
  ) {

    setItems([
      ...items,

      {
        descripcion:
          articulo.descripcion,

        cantidad: 1,

        precio:
          articulo.precio || 0,
      },
    ]);

    setMostrarBiblioteca(false);
  }

  const subtotal = items.reduce(
    (acc, item) => {

      const cantidad =
        Number(item.cantidad) || 0;

      const precio =
        Number(item.precio) || 0;

      return (
        acc +
        cantidad * precio
      );
    },

    0
  );

  const iva =
    subtotal * 0.21;

  const total =
    subtotal + iva;

  async function guardarPresupuesto() {

    if (!cliente) {
      alert(
        "Ingresar cliente"
      );
      return;
    }

    if (modoEdicion) {

      console.log("ACTUALIZANDO:");
      console.log({
        cliente,
        trabajo,
        subtotal,
        iva,
        total,
        moneda,
      });

      const { data, error } =
        await supabase

          .from("presupuestos")

          .update({
            cliente: cliente || "",
            trabajo: trabajo || "",
            subtotal,
            iva,
            total,
            moneda,
          })

          .eq("id", id)

          .select();

      console.log("RESPUESTA UPDATE:");
      console.log(data);
      console.log(error);

      if (error) {
        alert(error.message);
        return;
      }

      await supabase
        .from("presupuesto_items")
        .delete()
        .eq(
          "presupuesto_id",
          id
        );

      const nuevosItems =
        items.map((item) => ({

          presupuesto_id:
            id,

          descripcion:
            item.descripcion,

          cantidad:
            Number(
              item.cantidad
            ) || 0,

          precio:
            Number(
              item.precio
            ) || 0,

          subtotal:
            (Number(
              item.cantidad
            ) || 0) *

            (Number(
              item.precio
            ) || 0),
        }));

      await supabase
        .from("presupuesto_items")
        .insert(
          nuevosItems
        );

      alert(
        "Presupuesto actualizado"
      );

    } else {

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const {
        data: presupuesto,
        error,
      } = await supabase

        .from("presupuestos")

        .insert([
          {
            numero:
              numeroPresupuesto,

            cliente,

            trabajo,

            subtotal,

            iva,

            total,

            estado:
              "Pendiente",

            moneda,

            user_id:
              user.id,
          },
        ])

        .select()

        .single();

      if (error) {
        alert(error.message);
        return;
      }

      const itemsInsertar =
        items.map((item) => ({

          presupuesto_id:
            presupuesto.id,

          descripcion:
            item.descripcion,

          cantidad:
            Number(
              item.cantidad
            ) || 0,

          precio:
            Number(
              item.precio
            ) || 0,

          subtotal:
            (Number(
              item.cantidad
            ) || 0) *

            (Number(
              item.precio
            ) || 0),
        }));

      await supabase
        .from("presupuesto_items")
        .insert(
          itemsInsertar
        );

      alert(
        "Presupuesto guardado"
      );
    }

    navigate("/historial");
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">

      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-10">

          <div>

            <h1 className="text-5xl font-bold text-orange-500">

              {modoEdicion
                ? "Editar Presupuesto"
                : "Nuevo Presupuesto"}

            </h1>

          </div>

          <div className="flex gap-4">

            <button
              onClick={
                guardarPresupuesto
              }
              className="bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-xl font-bold"
            >

              {modoEdicion
                ? "Actualizar"
                : "Guardar"}

            </button>

            <Link
              to="/historial"
              className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-xl font-bold"
            >
              Volver
            </Link>

          </div>

        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-10">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

            <input
              type="text"
              value={
                numeroPresupuesto
              }
              disabled
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />

            <input
              type="text"
              placeholder="Cliente"
              value={cliente}
              onChange={(e) =>
                setCliente(
                  e.target.value
                )
              }
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />

            <input
              type="text"
              placeholder="Trabajo"
              value={trabajo}
              onChange={(e) =>
                setTrabajo(
                  e.target.value
                )
              }
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />

            <select
              value={moneda}
              onChange={(e) =>
                setMoneda(
                  e.target.value
                )
              }
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
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

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

          <div className="flex justify-between items-center mb-8">

            <div className="flex gap-4">

              <button
                onClick={() =>
                  setMostrarBiblioteca(
                    true
                  )
                }
                className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-xl font-bold"
              >
                Biblioteca de Artículos
              </button>

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

            {items.map(
              (item, index) => {

                const subtotalItem =
                  (Number(
                    item.cantidad
                  ) || 0) *

                  (Number(
                    item.precio
                  ) || 0);

                return (

                  <div
                    key={index}
                    className="grid grid-cols-12 gap-4 bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                  >

                    <div className="col-span-6">

                      <input
                        type="text"
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

                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3"
                      />

                    </div>

                    <div className="col-span-2">

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

                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3"
                      />

                    </div>

                    <div className="col-span-2">

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

                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3"
                      />

                    </div>

                    <div className="col-span-1 flex items-center text-orange-500 font-bold">

                      {moneda === "USD"
                        ? "USD $"
                        : "$"}

                      {subtotalItem.toLocaleString()}

                    </div>

                    <div className="col-span-1 flex justify-end">

                      <button
                        onClick={() =>
                          eliminarItem(
                            index
                          )
                        }

                        className="bg-red-500 hover:bg-red-600 px-4 rounded-xl font-bold"
                      >
                        X
                      </button>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>

      </div>

    </div>
  );
}