import React from "react";

import { supabase } from "../lib/supabase";

import {
  Link,
  useParams,
} from "react-router-dom";

import html2pdf from "html2pdf.js";

export default function VistaPreviaPresupuesto() {

  const { id } = useParams();

  const [presupuesto, setPresupuesto] =
    React.useState(null);

  const [items, setItems] =
    React.useState([]);

  const [alias, setAlias] =
    React.useState("");

  const [loading, setLoading] =
    React.useState(true);

  const hojaRef =
    React.useRef(null);

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

    const { data: itemsData } =
      await supabase
        .from("presupuesto_items")
        .select("*")
        .eq("presupuesto_id", id);

    setItems(itemsData || []);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {

      const {
        data: profile,
      } = await supabase
        .from("profiles")
        .select("alias")
        .eq("id", user.id)
        .single();

      setAlias(
        profile?.alias ||
        user.email
      );
    }

    setLoading(false);
  }

  function descargarPDF() {

    const opciones = {
      margin: 0.2,

      filename:
        `Presupuesto-${presupuesto.numero}.pdf`,

      image: {
        type: "jpeg",
        quality: 1,
      },

      html2canvas: {
        scale: 2,
      },

      jsPDF: {
        unit: "in",
        format: "a4",
        orientation: "portrait",
      },

      pagebreak: {
        mode: ["avoid-all", "css", "legacy"],
        avoid: [".no-break"],
      },
    };

    html2pdf()
      .set(opciones)
      .from(hojaRef.current)
      .save();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-300 flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  const simbolo =
    presupuesto.moneda === "USD"
      ? "USD $"
      : "$";

  const fecha =
    new Date(
      presupuesto.created_at
    ).toLocaleDateString();

  return (
    <div className="min-h-screen bg-zinc-300 p-6">

      <div className="max-w-5xl mx-auto">

        <div className="flex justify-between mb-6 print:hidden">

          <Link
            to={`/presupuesto/${id}`}
            className="bg-black text-white px-5 py-3 rounded font-bold"
          >
            X Cerrar
          </Link>

          <div className="flex gap-4">

            <button
              onClick={() =>
                window.print()
              }
              className="bg-zinc-700 text-white px-5 py-3 rounded font-bold"
            >
              Imprimir
            </button>

            <button
              onClick={
                descargarPDF
              }
              className="bg-black text-white px-5 py-3 rounded font-bold"
            >
              Descargar PDF
            </button>

          </div>

        </div>

        <div
          ref={hojaRef}
          className="bg-white text-black p-10 shadow-2xl"
        >

          <div className="flex justify-between border-b pb-6 no-break">

            <div>

              <h1 className="text-4xl font-black">
                MCH
              </h1>

              <p className="font-semibold mt-1">
                Seguridad Electrónica
              </p>

              <div className="mt-5 text-sm leading-6">

                <p>Lomas de Zamora</p>
                <p>Buenos Aires</p>
                <p>Tel: 11 2667-0854</p>
                <p>mchsolucioneselectronicas@hotmail.com</p>
                <p>CUIT: 23-33915525-9</p>

              </div>

            </div>

            <div className="text-right">

              <p className="text-sm font-semibold">
                PRESUPUESTO
              </p>

              <p className="text-3xl font-black mt-2">
                {presupuesto.numero}
              </p>

              <p className="mt-4 text-sm">
                Fecha: {fecha}
              </p>

            </div>

          </div>

          <div className="mt-8 border-b pb-6 no-break">

            <div className="grid grid-cols-2 gap-8">

              <div>

                <p className="text-sm font-bold">
                  CLIENTE
                </p>

                <p className="mt-2 text-lg font-semibold">
                  {presupuesto.cliente_empresa || "-"}
                </p>

                {presupuesto.cliente_contacto && (

                  <p className="text-sm text-zinc-600 mt-2">
                    Contacto:
                    {" "}
                    {presupuesto.cliente_contacto}
                  </p>

                )}

              </div>

              <div>

                <p className="text-sm font-bold">
                  DATOS DE CONTACTO
                </p>

                <p className="mt-2 text-zinc-700">
                  Tel:
                  {" "}
                  {presupuesto.cliente_telefono || "-"}
                </p>

                <p className="mt-1 text-zinc-700 break-all">
                  Email:
                  {" "}
                  {presupuesto.cliente_email || "-"}
                </p>

                <p className="mt-1 text-zinc-700">
                  Dirección:
                  {" "}
                  {presupuesto.cliente_direccion || "-"}
                </p>

              </div>

            </div>

            <div className="mt-10">

              <p className="text-2xl font-bold">
                {presupuesto.descripcion_corta || "-"}
              </p>

              <div className="mt-5 whitespace-pre-wrap leading-relaxed text-zinc-700">
                {presupuesto.descripcion_larga || "-"}
              </div>

            </div>

          </div>

          <div className="mt-10">

            <table className="w-full border-collapse">

              <thead>

                <tr className="bg-zinc-100 border-y">

                  <th className="text-left p-3 text-sm">
                    Descripción
                  </th>

                  <th className="text-center p-3 text-sm w-24">
                    Cant.
                  </th>

                  <th className="text-right p-3 text-sm w-40">
                    Precio
                  </th>

                  <th className="text-right p-3 text-sm w-40">
                    Subtotal
                  </th>

                </tr>

              </thead>

              <tbody>

                {items.map((item) => (

                  <tr
                    key={item.id}
                    className="border-b"
                  >

                    <td className="p-3 text-sm">
                      {item.descripcion}
                    </td>

                    <td className="p-3 text-center text-sm">
                      {item.cantidad}
                    </td>

                    <td className="p-3 text-right text-sm">

                      {simbolo}

                      {Number(
                        item.precio
                      ).toLocaleString()}

                    </td>

                    <td className="p-3 text-right text-sm font-bold">

                      {simbolo}

                      {Number(
                        item.subtotal
                      ).toLocaleString()}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          <div className="flex justify-end mt-10 no-break">

            <div className="w-80 border p-5">

              <div className="flex justify-between mb-3">

                <span className="font-semibold">
                  Subtotal
                </span>

                <span>
                  {simbolo}
                  {Number(
                    presupuesto.subtotal
                  ).toLocaleString()}
                </span>

              </div>

              <div className="flex justify-between mb-3">

                <span className="font-semibold">
                  IVA
                </span>

                <span>
                  {simbolo}
                  {Number(
                    presupuesto.iva
                  ).toLocaleString()}
                </span>

              </div>

              <div className="flex justify-between border-t pt-4 text-2xl font-black">

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

          <div className="mt-10 text-xs leading-5 border-t pt-5 text-zinc-700 no-break">

            <p className="font-bold text-black mb-2">
              Condiciones Comerciales
            </p>

            <p>
              Los importes son válidos por 5 días debido a la inestabilidad monetaria.
              El pago debe estar acreditado al momento de finalizar el trabajo;
              de lo contrario, se aplicará mora del 3% por día hasta que se acredite el pago.
              Pago efectivo o transferencia.
              Otros medios de pago pueden incluir recargos.
              Incluye configuración y puesta en marcha salvo aclaración previa.
              No incluye trabajos civiles, cañerías o cablecanal salvo aclaración.
            </p>

            <p className="mt-4 text-zinc-500">
              Generado por:
              {" "}
              {alias}
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}