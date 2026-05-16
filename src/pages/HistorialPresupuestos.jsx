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

  const [menuAbierto, setMenuAbierto] =
    React.useState(null);

  const [rol, setRol] =
    React.useState(null);

  React.useEffect(() => {
    obtenerPresupuestos();
  }, []);

  async function obtenerPresupuestos() {

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const {
      data: perfil,
    } = await supabase
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    const rolUsuario =
      perfil?.rol || "pendiente";

    setRol(rolUsuario);

    let query =
      supabase
        .from("presupuestos")
        .select("*");

    if (rolUsuario === "vendedor") {

      query =
        query.eq(
          "user_id",
          user.id
        );
    }

    const { data, error } =
      await query.order(
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

  async function generarNumeroNuevo() {

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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data } =
      await supabase
        .from("presupuestos")
        .select("numero")
        .eq("user_id", user.id);

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

  async function eliminarPresupuesto(id) {

    setMenuAbierto(null);

    const confirmar =
      window.confirm(
        "¿Eliminar presupuesto?"
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

    setMenuAbierto(null);

    const numeroNuevo =
      await generarNumeroNuevo();

    const {
      data: nuevo,
      error,
    } = await supabase
      .from("presupuestos")
      .insert([
        {
          numero:
            numeroNuevo,

          cliente:
            presupuesto.cliente,

          cliente_id:
            presupuesto.cliente_id || null,

          cliente_empresa:
            presupuesto.cliente_empresa || presupuesto.cliente || "",

          cliente_contacto:
            presupuesto.cliente_contacto || "",

          cliente_telefono:
            presupuesto.cliente_telefono || "",

          cliente_email:
            presupuesto.cliente_email || "",

          cliente_direccion:
            presupuesto.cliente_direccion || "",

          descripcion_corta:
            presupuesto.descripcion_corta || "",

          descripcion_larga:
            presupuesto.descripcion_larga || "",

          subtotal:
            presupuesto.subtotal,

          iva:
            0,

          total:
            presupuesto.total,

          estado:
            "Edición",

          cerrado:
            false,

          enviado_whatsapp:
            false,

          fecha_cerrado:
            null,

          fecha_enviado:
            null,

          fecha_aprobado:
            null,

          fecha_finalizado:
            null,

          moneda:
            presupuesto.moneda,

          tipo_factura:
            "C",

          aplica_iva:
            false,

          user_id:
            presupuesto.user_id,

          generado_por_alias:
            presupuesto.generado_por_alias || "",
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
      (items || []).map((item) => ({
        presupuesto_id:
          nuevo.id,

        descripcion:
          item.descripcion,

        detalle:
          item.detalle || "",

        cantidad:
          item.cantidad,

        precio:
          item.precio,

        subtotal:
          item.subtotal,

        tipo:
          item.tipo || "",
      }));

    if (nuevosItems.length > 0) {

      await supabase
        .from("presupuesto_items")
        .insert(nuevosItems);
    }

    obtenerPresupuestos();
  }

  function colorEstado(estado) {

    if (
      estado === "Enviado" ||
      estado === "Aprobado" ||
      estado === "Finalizado"
    ) {

      return "bg-green-600 text-white";
    }

    if (estado === "Cerrado") {

      return "bg-red-600 text-white";
    }

    return "bg-orange-500 text-white";
  }

  function textoEstado(estado) {

    if (
      !estado ||
      estado === "Edición"
    ) {

      return "Pendiente";
    }

    return estado;
  }

  if (loading) {

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-3xl">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6">

      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-8">

          <div>

            <h1 className="text-4xl md:text-5xl font-black text-orange-500">
              Historial
            </h1>

            <p className="text-zinc-400 mt-2">
              Administración de presupuestos
            </p>

          </div>

          <Link
            to="/"
            className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-2xl font-bold"
          >
            Volver
          </Link>

        </div>

        <div className="space-y-4">

          {presupuestos.map((presupuesto) => (

            <div
              key={presupuesto.id}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 md:p-6"
            >

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">

                <div className="lg:col-span-4">

                  <h2 className="text-2xl md:text-3xl font-black">
                    {presupuesto.numero}
                  </h2>

                  <p className="text-zinc-400 mt-2 text-lg">
                    {presupuesto.cliente_empresa ||
                      presupuesto.cliente}
                  </p>

                  <p className="text-zinc-500 mt-1">
                    {presupuesto.descripcion_corta ||
                      presupuesto.trabajo ||
                      "-"}
                  </p>

                  <p className="text-xs text-orange-400 mt-3 uppercase">

                    Generado por:
                    {" "}
                    {presupuesto.generado_por_alias ||
                      "Administrador"}

                  </p>

                </div>

                <div className="lg:col-span-2 flex lg:justify-center">

                  <div>

                    <p className="text-zinc-500 text-sm mb-2">
                      Estado
                    </p>

                    <span
                      className={`${colorEstado(
                        presupuesto.estado
                      )} inline-block px-4 py-2 rounded-2xl font-bold`}
                    >

                      {textoEstado(
                        presupuesto.estado
                      )}

                    </span>

                  </div>

                </div>

                <div className="lg:col-span-3 lg:text-right">

                  <p className="text-zinc-500 text-sm">
                    Total
                  </p>

                  <p className="text-3xl md:text-4xl font-black text-orange-500">

                    {presupuesto.moneda === "USD"
                      ? "USD $"
                      : "$"}

                    {Number(
                      presupuesto.total
                    ).toLocaleString()}

                  </p>

                </div>

                <div className="lg:col-span-3 flex gap-3 lg:justify-end relative">

                  <Link
                    to={`/presupuesto/${presupuesto.id}`}
                    className="bg-blue-500 hover:bg-blue-600 px-5 py-3 rounded-2xl font-bold"
                  >
                    Abrir
                  </Link>

                  <button
                    onClick={() =>
                      setMenuAbierto(
                        menuAbierto === presupuesto.id
                          ? null
                          : presupuesto.id
                      )
                    }
                    className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-2xl font-bold"
                  >
                    Opciones
                  </button>

                  {menuAbierto === presupuesto.id && (

                    <div className="absolute right-0 top-16 bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex flex-col gap-3 min-w-[180px] z-50 shadow-2xl">

                      <Link
                        to={`/presupuestos/${presupuesto.id}`}
                        className="bg-yellow-500 hover:bg-yellow-600 px-4 py-3 rounded-xl font-bold text-center"
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

                  )}

                </div>

              </div>

            </div>
          ))}

          {presupuestos.length === 0 && (

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center text-zinc-500">

              No hay presupuestos guardados.

            </div>

          )}

        </div>

      </div>

    </div>
  );
}