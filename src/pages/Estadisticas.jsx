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
  const [loading, setLoading] = React.useState(true);

  const [stats, setStats] = React.useState({
    mes: 0,
    enviados: 0,
    aprobados: 0,
    efectividad: 0,
    manoObra: 0,
  });

  const [grafico, setGrafico] = React.useState([]);

  React.useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);

    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const { data: presupuestos, error } = await supabase
      .from("presupuestos")
      .select("*");

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const lista = presupuestos || [];

    const presupuestosMes = lista.filter((p) => {
      if (!p.created_at) return false;
      return new Date(p.created_at) >= inicioMes;
    });

    const enviados = presupuestosMes.filter(
      (p) =>
        p.fecha_enviado ||
        p.estado === "Enviado" ||
        p.estado === "Aprobado" ||
        p.estado === "Finalizado"
    ).length;

    const aprobados = presupuestosMes.filter(
      (p) => p.estado === "Aprobado" || p.estado === "Finalizado"
    ).length;

    const efectividad =
      enviados > 0 ? Math.round((aprobados / enviados) * 100) : 0;

    const presupuestosFinalizadosMes = presupuestosMes.filter(
      (p) => p.estado === "Finalizado"
    );

    const idsFinalizados = presupuestosFinalizadosMes.map((p) => p.id);

    let manoObra = 0;

    if (idsFinalizados.length > 0) {
      const { data: items, error: errorItems } = await supabase
        .from("presupuesto_items")
        .select("*")
        .in("presupuesto_id", idsFinalizados);

      if (errorItems) {
        console.error(errorItems);
      }

      (items || []).forEach((item) => {
        const esTrabajo =
          (item.tipo || "").toLowerCase().trim() === "trabajo";

        if (esTrabajo) {
          const subtotalItem =
            Number(item.subtotal) ||
            (Number(item.cantidad) || 0) * (Number(item.precio) || 0);

          manoObra += subtotalItem;
        }
      });
    }

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

    const agrupados = meses.map((mes) => ({
      mes,
      aprobados: 0,
    }));

    lista.forEach((p) => {
      if (p.estado !== "Aprobado" && p.estado !== "Finalizado") return;
      if (!p.created_at) return;

      const fecha = new Date(p.created_at);
      const mes = fecha.getMonth();

      agrupados[mes].aprobados += 1;
    });

    setGrafico(agrupados);

    setStats({
      mes: presupuestosMes.length,
      enviados,
      aprobados,
      efectividad,
      manoObra,
    });

    setLoading(false);
  }

  function tarjeta(titulo, valor) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
        <p className="text-zinc-500 text-sm">{titulo}</p>

        <h2 className="text-4xl font-black mt-4 text-orange-500">
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5 mb-10">
          {tarjeta("Presupuestos del mes", stats.mes)}

          {tarjeta("Enviados", stats.enviados)}

          {tarjeta("Aprobados", stats.aprobados)}

          {tarjeta("Efectividad %", `${stats.efectividad}%`)}

          {tarjeta(
            "Ganancia mano de obra",
            `$${stats.manoObra.toLocaleString("es-AR")}`
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={grafico}>
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="aprobados" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}