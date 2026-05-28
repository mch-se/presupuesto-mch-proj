import React from "react";
import { supabase } from "../lib/supabase";

export default function Analiticas() {
  const FECHA_INICIO_ESTADISTICAS = "2026-05-26";
  const [loading, setLoading] = React.useState(true);

  const [stats, setStats] = React.useState({
    mes: 0,
    enviados: 0,
    aprobados: 0,
    efectividad: 0,
  });

  const [presupuestosRentabilidad, setPresupuestosRentabilidad] =
    React.useState([]);

  const [seleccionados, setSeleccionados] = React.useState([]);

  React.useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);

    const hoy = new Date();

    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const { data: presupuestos, error } = await supabase
      .from("presupuestos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const lista = (presupuestos || []).filter((p) => {
      if (!p.created_at) return false;

      return (
        new Date(p.created_at) >=
        new Date(FECHA_INICIO_ESTADISTICAS)
      );
    });

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

    const aprobadosFinalizados = lista.filter(
      (p) => p.estado === "Aprobado" || p.estado === "Finalizado"
    );

    const ids = aprobadosFinalizados.map((p) => p.id);

    let items = [];

    if (ids.length > 0) {
      const { data: itemsData, error: errorItems } = await supabase
        .from("presupuesto_items")
        .select("*")
        .in("presupuesto_id", ids);

      if (errorItems) {
        console.error(errorItems);
      }

      items = itemsData || [];
    }

    const rentabilidad = aprobadosFinalizados.map((presupuesto) => {
      const itemsPresupuesto = items.filter(
        (item) => item.presupuesto_id === presupuesto.id
      );

      const costoMateriales = itemsPresupuesto.reduce((acc, item) => {
        const tipo = `${item.tipo || ""}`.toLowerCase().trim();

        const esMaterial = tipo === "material";

        if (!esMaterial) return acc;

        const cantidad = Number(item.cantidad) || 0;

        const costoUnitario =
          Number(item.precio_costo ?? item.costo ?? 0) || 0;

        return acc + cantidad * costoUnitario;
      }, 0);

      const totalFinal = Number(presupuesto.total) || 0;
      const gananciaEmpresa = totalFinal - costoMateriales;
      const gananciaIndividual = gananciaEmpresa / 2;

      return {
        id: presupuesto.id,
        numero: presupuesto.numero || "-",
        cliente:
          presupuesto.cliente_empresa ||
          presupuesto.cliente ||
          "-",
        estado: presupuesto.estado || "-",
        fecha: presupuesto.created_at || "",
        totalFinal,
        costoMateriales,
        gananciaEmpresa,
        gananciaIndividual,
      };
    });

    setPresupuestosRentabilidad(rentabilidad);

    setStats({
      mes: presupuestosMes.length,
      enviados,
      aprobados,
      efectividad,
    });

    setLoading(false);
  }

  function alternarSeleccion(id) {
    setSeleccionados((actuales) =>
      actuales.includes(id)
        ? actuales.filter((itemId) => itemId !== id)
        : [...actuales, id]
    );
  }

  function limpiarSeleccion() {
    setSeleccionados([]);
  }

  const presupuestosSeleccionados = presupuestosRentabilidad.filter((p) =>
    seleccionados.includes(p.id)
  );

  const resumenSeleccion = presupuestosSeleccionados.reduce(
    (acc, presupuesto) => {
      acc.precioFinal += presupuesto.totalFinal;
      acc.costoMateriales += presupuesto.costoMateriales;
      acc.gananciaEmpresa += presupuesto.gananciaEmpresa;
      acc.gananciaIndividual += presupuesto.gananciaIndividual;
      return acc;
    },
    {
      precioFinal: 0,
      costoMateriales: 0,
      gananciaEmpresa: 0,
      gananciaIndividual: 0,
    }
  );

  function formatoMoneda(valor) {
    return `$${Number(valor || 0).toLocaleString("es-AR")}`;
  }

  function tarjetaMini(titulo, valor) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
        <p className="text-zinc-500 text-sm">{titulo}</p>

        <h2 className="text-3xl font-black mt-3 text-orange-500">
          {valor}
        </h2>
      </div>
    );
  }

  function tarjetaGrande(titulo, valor, descripcion) {
    return (
      <div className="bg-zinc-900 border border-orange-500/30 rounded-3xl p-6 md:p-8">
        <p className="text-zinc-400 text-lg">{titulo}</p>

        <h2 className="text-4xl md:text-5xl font-black mt-5 text-orange-500">
          {valor}
        </h2>

        {descripcion && (
          <p className="text-zinc-500 text-sm mt-3">{descripcion}</p>
        )}
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
    <div className="min-h-screen bg-black text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 md:mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-orange-500">
            Estadísticas
          </h1>

          <p className="text-zinc-500 mt-3">
            Métricas comerciales y operativas
          </p>

          <p className="text-zinc-600 text-sm mt-2">
            Inicio estadísticas: 26/05/2026
          </p>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {tarjetaMini("Presupuestos del mes", stats.mes)}
          {tarjetaMini("Enviados", stats.enviados)}
          {tarjetaMini("Aprobados", stats.aprobados)}
          {tarjetaMini("Efectividad %", `${stats.efectividad}%`)}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {tarjetaGrande(
            "Ganancia empresa",
            seleccionados.length > 0
              ? formatoMoneda(resumenSeleccion.gananciaEmpresa)
              : "-",
            seleccionados.length > 0
              ? `${seleccionados.length} presupuesto(s) seleccionado(s)`
              : "Seleccioná uno o más presupuestos para calcular"
          )}

          {tarjetaGrande(
            "Ganancia individual",
            seleccionados.length > 0
              ? formatoMoneda(resumenSeleccion.gananciaIndividual)
              : "-",
            "Cálculo fijo dividido entre 2"
          )}
        </div>

        {seleccionados.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <p className="text-zinc-500 text-sm">Precio final seleccionado</p>
              <p className="text-green-400 font-black text-3xl mt-3">
                {formatoMoneda(resumenSeleccion.precioFinal)}
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <p className="text-zinc-500 text-sm">
                Costo materiales / proveedor
              </p>
              <p className="text-red-400 font-black text-3xl mt-3">
                {formatoMoneda(resumenSeleccion.costoMateriales)}
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <p className="text-zinc-500 text-sm">Presupuestos seleccionados</p>
              <p className="text-orange-500 font-black text-3xl mt-3">
                {seleccionados.length}
              </p>
            </div>
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-black text-orange-500">
                Presupuestos aprobados y finalizados
              </h2>

              <p className="text-zinc-500 mt-2">
                Seleccioná uno o varios presupuestos para ver rentabilidad.
              </p>
            </div>

            {seleccionados.length > 0 && (
              <button
                onClick={limpiarSeleccion}
                className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-2xl font-bold"
              >
                Limpiar selección
              </button>
            )}
          </div>

          <div className="hidden md:grid grid-cols-[140px_1fr_170px_170px_150px_80px] gap-4 px-4 py-3 text-sm text-zinc-500 border-b border-zinc-800">
            <span>Número</span>
            <span>Cliente</span>
            <span className="text-right">Costo materiales</span>
            <span className="text-right">Precio final</span>
            <span>Estado</span>
            <span className="text-right">Sel.</span>
          </div>

          <div className="space-y-3 md:space-y-0">
            {presupuestosRentabilidad.map((presupuesto) => {
              const seleccionado = seleccionados.includes(presupuesto.id);

              return (
                <button
                  key={presupuesto.id}
                  onClick={() => alternarSeleccion(presupuesto.id)}
                  className={
                    seleccionado
                      ? "w-full text-left bg-orange-500/10 border border-orange-500/40 md:border-t-0 md:border-x-0 md:border-b rounded-2xl md:rounded-none p-4 md:grid md:grid-cols-[140px_1fr_170px_170px_150px_80px] gap-4 items-center"
                      : "w-full text-left bg-zinc-950 border border-zinc-800 md:border-t-0 md:border-x-0 md:border-b rounded-2xl md:rounded-none p-4 md:grid md:grid-cols-[140px_1fr_170px_170px_150px_80px] gap-4 items-center hover:bg-zinc-900"
                  }
                >
                  <div>
                    <p className="text-zinc-500 text-xs md:hidden">Número</p>
                    <p className="font-bold">{presupuesto.numero}</p>
                  </div>

                  <div className="mt-3 md:mt-0">
                    <p className="text-zinc-500 text-xs md:hidden">Cliente</p>
                    <p className="font-bold truncate">{presupuesto.cliente}</p>
                  </div>

                  <div className="mt-3 md:mt-0 md:text-right">
                    <p className="text-zinc-500 text-xs md:hidden">
                      Costo materiales
                    </p>
                    <p className="text-red-400 font-bold">
                      {formatoMoneda(presupuesto.costoMateriales)}
                    </p>
                  </div>

                  <div className="mt-3 md:mt-0 md:text-right">
                    <p className="text-zinc-500 text-xs md:hidden">
                      Precio final
                    </p>
                    <p className="text-green-400 font-black">
                      {formatoMoneda(presupuesto.totalFinal)}
                    </p>
                  </div>

                  <div className="mt-3 md:mt-0">
                    <span
                      className={
                        presupuesto.estado === "Finalizado"
                          ? "inline-block bg-green-500/20 text-green-300 px-3 py-2 rounded-xl text-sm font-bold"
                          : "inline-block bg-blue-500/20 text-blue-300 px-3 py-2 rounded-xl text-sm font-bold"
                      }
                    >
                      {presupuesto.estado}
                    </span>
                  </div>

                  <div className="mt-4 md:mt-0 flex md:justify-end">
                    <span
                      className={
                        seleccionado
                          ? "inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500 text-white font-black"
                          : "inline-flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700"
                      }
                    >
                      {seleccionado ? "✓" : ""}
                    </span>
                  </div>
                </button>
              );
            })}

            {presupuestosRentabilidad.length === 0 && (
              <div className="p-8 text-center text-zinc-500">
                No hay presupuestos aprobados o finalizados.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
