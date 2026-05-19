import React from "react";
import { supabase } from "../lib/supabase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Analiticas() {

  const [loading, setLoading] =
    React.useState(true);

  const [stats, setStats] =
    React.useState({
      mes: 0,
      enviados: 0,
      aprobados: 0,
      efectividad: 0,
      manoObra: 0,
      individual: 0,
    });

  const [grafico, setGrafico] =
    React.useState([]);

  React.useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {

    setLoading(true);

    const hoy = new Date();

    const inicioMes =
      new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        1
      );

    const {
      data: presupuestos,
      error,
    } = await supabase
      .from("presupuestos")
      .select("*");

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const lista =
      presupuestos || [];

    const presupuestosMes =
      lista.filter((p) => {

        if (!p.created_at)
          return false;

        return (
          new Date(
            p.created_at
          ) >= inicioMes
        );
      });

    const enviados =
      presupuestosMes.filter(
        (p) =>
          p.fecha_enviado ||
          p.estado ===
            "Enviado" ||
          p.estado ===
            "Aprobado" ||
          p.estado ===
            "Finalizado"
      ).length;

    const aprobados =
      presupuestosMes.filter(
        (p) =>
          p.estado ===
            "Aprobado" ||
          p.estado ===
            "Finalizado"
      ).length;

    const efectividad =
      enviados > 0
        ? Math.round(
            (aprobados /
              enviados) *
              100
          )
        : 0;

    const presupuestosFinalizados =
      presupuestosMes.filter(
        (p) =>
          p.estado ===
          "Finalizado"
      );

    const idsFinalizados =
      presupuestosFinalizados.map(
        (p) => p.id
      );

    let manoObra = 0;

    if (
      idsFinalizados.length >
      0
    ) {

      const {
        data: items,
        error: errorItems,
      } = await supabase
        .from(
          "presupuesto_items"
        )
        .select("*")
        .in(
          "presupuesto_id",
          idsFinalizados
        );

      if (errorItems) {
        console.error(
          errorItems
        );
      }

      (items || []).forEach(
        (item) => {

          const esTrabajo =
            (
              item.tipo ||
              ""
            )
              .toLowerCase()
              .trim() ===
            "trabajo";

          if (esTrabajo) {

            const subtotal =
              Number(
                item.subtotal
              ) ||
              (
                Number(
                  item.cantidad
                ) || 0
              ) *
                (
                  Number(
                    item.precio
                  ) || 0
                );

            manoObra +=
              subtotal;
          }
        }
      );
    }

    const individual =
      manoObra / 2;

    const meses = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];

    const agrupados =
      meses.map((mes) => ({
        mes,
        aprobados: 0,
      }));

    lista.forEach((p) => {

      if (
        p.estado !==
          "Aprobado" &&
        p.estado !==
          "Finalizado"
      ) {
        return;
      }

      if (!p.created_at)
        return;

      const fecha =
        new Date(
          p.created_at
        );

      const mes =
        fecha.getMonth();

      agrupados[
        mes
      ].aprobados += 1;
    });

    setGrafico(
      agrupados
    );

    setStats({
      mes:
        presupuestosMes.length,
      enviados,
      aprobados,
      efectividad,
      manoObra,
      individual,
    });

    setLoading(false);
  }

  function tarjetaMini(
    titulo,
    valor
  ) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">

        <p className="text-zinc-500 text-sm">
          {titulo}
        </p>

        <h2 className="text-3xl font-black mt-3 text-orange-500">
          {valor}
        </h2>

      </div>
    );
  }

  function tarjetaGrande(
    titulo,
    valor
  ) {
    return (
      <div className="bg-zinc-900 border border-orange-500/30 rounded-3xl p-8">

        <p className="text-zinc-400 text-lg">
          {titulo}
        </p>

        <h2 className="text-5xl font-black mt-5 text-orange-500">
          {valor}
        </h2>

      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Cargando estadísticas...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">

      <div className="max-w-7xl mx-auto">

        <div className="mb-10">

          <h1 className="text-5xl font-black text-orange-500">
            Estadísticas
          </h1>

          <p className="text-zinc-500 mt-3">
            Métricas comerciales y operativas
          </p>

        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

          {tarjetaMini(
            "Presupuestos del mes",
            stats.mes
          )}

          {tarjetaMini(
            "Enviados",
            stats.enviados
          )}

          {tarjetaMini(
            "Aprobados",
            stats.aprobados
          )}

          {tarjetaMini(
            "Efectividad %",
            `${stats.efectividad}%`
          )}

        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">

          {tarjetaGrande(
            "Ganancia empresa",
            `$${stats.manoObra.toLocaleString(
              "es-AR"
            )}`
          )}

          {tarjetaGrande(
            "Ganancia individual",
            `$${stats.individual.toLocaleString(
              "es-AR"
            )}`
          )}

        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">

          <div className="mb-6">

            <h2 className="text-2xl font-black text-orange-500">
              Presupuestos aprobados por mes
            </h2>

            <p className="text-zinc-500 mt-2">
              Cantidad de presupuestos aprobados/finalizados
            </p>

          </div>

          <div className="h-[400px]">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={grafico}
              >

                <XAxis
                  dataKey="mes"
                />

                <YAxis />

                <Tooltip />

                <Bar
                  dataKey="aprobados"
                  radius={[
                    10,
                    10,
                    0,
                    0,
                  ]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>

    </div>
  );
}