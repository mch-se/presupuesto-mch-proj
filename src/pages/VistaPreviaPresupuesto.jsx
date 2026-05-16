import React from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import html2pdf from "html2pdf.js";

export default function VistaPreviaPresupuesto() {
  const { id } = useParams();

  const [presupuesto, setPresupuesto] = React.useState(null);
  const [items, setItems] = React.useState([]);
  const [configuracion, setConfiguracion] = React.useState(null);
  const [alias, setAlias] = React.useState("");

  const hojaRef = React.useRef(null);

  React.useEffect(() => {
    cargarPresupuesto();
  }, []);

  async function cargarPresupuesto() {
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("alias")
        .eq("id", user.id)
        .single();

      setAlias(profile?.alias || user.email);
    }

    if (data.user_id) {
      const { data: configData } = await supabase
        .from("configuracion_usuario")
        .select("*")
        .eq("user_id", data.user_id)
        .single();

      setConfiguracion(configData || null);
    }
  }

  function descargarPDF() {
    const opciones = {
      margin: 0.25,
      filename: `Presupuesto-${presupuesto.numero}.pdf`,
      image: {
        type: "jpeg",
        quality: 1,
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
      },
      jsPDF: {
        unit: "in",
        format: "a4",
        orientation: "portrait",
      },
      pagebreak: {
        mode: ["css", "legacy"],
        avoid: [".bloque-corto"],
      },
    };

    html2pdf()
      .set(opciones)
      .from(hojaRef.current)
      .save();
  }

  if (!presupuesto) {
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

  const condiciones =
    configuracion?.condiciones_comerciales ||
    `Los importes son válidos por 5 días debido a la inestabilidad monetaria.
El pago debe estar acreditado al momento de finalizar el trabajo; de lo contrario, se aplicará mora del 3% por día hasta que se acredite el pago.
Pago efectivo o transferencia.
Otros medios de pago pueden incluir recargos.
Incluye configuración y puesta en marcha salvo aclaración previa.
No incluye trabajos civiles, cañerías o cablecanal salvo aclaración.`;

  const generadoPor =
    configuracion?.firma_pdf ||
    alias ||
    "MCH Seguridad Electrónica";

  return (
    <div className="min-h-screen bg-zinc-300 p-4 md:p-8">

      <div className="max-w-5xl mx-auto">

        <div className="no-print flex justify-between items-center mb-6">

          <Link
            to={`/presupuesto/${id}`}
            className="bg-zinc-700 hover:bg-zinc-600 text-white px-5 py-3 rounded-2xl font-bold"
          >
            Volver
          </Link>

          <button
            onClick={descargarPDF}
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-2xl font-bold"
          >
            Descargar PDF
          </button>

        </div>

        <div
          ref={hojaRef}
          className="bg-white text-black p-10 md:p-12"
        >

          <div className="flex justify-between items-start border-b pb-8 bloque-corto">

            <div>

              <h1 className="text-5xl font-black text-orange-500">
                MCH
              </h1>

              <p className="text-zinc-600 mt-2 text-lg">
                Seguridad Electrónica
              </p>

              <p className="text-zinc-500 mt-4">
                Presupuesto N°
                {" "}
                {presupuesto.numero}
              </p>

            </div>

            <div className="text-right text-zinc-500">

              {new Date(
                presupuesto.created_at
              ).toLocaleDateString()}

            </div>

          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">

            <div>

              <p className="text-zinc-500 text-sm">
                Cliente
              </p>

              <p className="font-bold text-2xl mt-1">
                {presupuesto.cliente_empresa ||
                  presupuesto.cliente}
              </p>

              {presupuesto.cliente_contacto && (

                <p className="text-zinc-600 mt-3">
                  {presupuesto.cliente_contacto}
                </p>

              )}

              {presupuesto.cliente_telefono && (

                <p className="text-zinc-600">
                  {presupuesto.cliente_telefono}
                </p>

              )}

              {presupuesto.cliente_email && (

                <p className="text-zinc-600">
                  {presupuesto.cliente_email}
                </p>

              )}

              {presupuesto.cliente_direccion && (

                <p className="text-zinc-600">
                  {presupuesto.cliente_direccion}
                </p>

              )}

            </div>

            <div>

              {presupuesto.descripcion_corta && (

                <p className="font-bold text-lg mb-5">
                  {presupuesto.descripcion_corta}
                </p>

              )}

              {presupuesto.descripcion_larga && (

                <p className="text-zinc-700 whitespace-pre-wrap leading-relaxed">
                  {presupuesto.descripcion_larga}
                </p>

              )}

            </div>

          </div>

          <div className="mt-12">

            <table className="w-full border-collapse">

              <thead>

                <tr className="border-b-2 border-zinc-300">

                  <th className="text-left py-4">
                    Descripción
                  </th>

                  <th className="text-center py-4">
                    Cantidad
                  </th>

                  <th className="text-right py-4">
                    Precio
                  </th>

                  <th className="text-right py-4">
                    Total
                  </th>

                </tr>

              </thead>

              <tbody>

                {items.map((item, index) => {

                  const subtotal =
                    (Number(item.cantidad) || 0) *
                    (Number(item.precio) || 0);

                  return (

                    <tr
  key={index}
  className="border-b border-zinc-200 bloque-corto"
>
                      <td className="py-5">
                        {item.descripcion}
                      </td>

                     <td className="py-5">

  <p className="font-semibold">
    {item.descripcion}
  </p>

  {item.detalle && (

    <p className="text-zinc-600 text-sm mt-2 whitespace-pre-wrap leading-relaxed">
      {item.detalle}
    </p>

  )}

</td>
                      <td className="text-right py-5">

                        {simbolo}

                        {Number(
                          item.precio
                        ).toLocaleString()}

                      </td>

                      <td className="text-right py-5 font-bold">

                        {simbolo}

                        {subtotal.toLocaleString()}

                      </td>

                    </tr>

                  );

                })}

                <tr className="border-t-2 border-black bloque-corto">

                  <td
                    colSpan="3"
                    className="py-4 text-right font-black text-xl"
                  >
                    TOTAL
                  </td>

                  <td className="py-4 text-right font-black text-xl">

                    {simbolo}

                    {Number(
                      presupuesto.total
                    ).toLocaleString()}

                  </td>

                </tr>

                <tr className="bloque-corto">

                  <td
                    colSpan="4"
                    className="text-right text-zinc-500 text-xs pb-2"
                  >
                    Factura C - IVA no discriminado
                  </td>

                </tr>

              </tbody>

            </table>

          </div>

          <div className="mt-8 border-t pt-6 text-xs text-zinc-700 bloque-corto">

            <p className="font-bold text-black mb-3">
              Condiciones comerciales
            </p>

            <p className="whitespace-pre-wrap leading-relaxed">
              {condiciones}
            </p>

            <p className="mt-4 text-zinc-500">
              Generado por:
              {" "}
              {generadoPor}
            </p>

            {configuracion?.pie_presupuesto && (

              <p className="mt-3 text-zinc-500 whitespace-pre-wrap">
                {configuracion.pie_presupuesto}
              </p>

            )}

          </div>

        </div>

      </div>

    </div>
  );
}