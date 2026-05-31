import React from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Toast from "../components/Toast";

export default function Liquidaciones() {
  const FECHA_INICIO_LIQUIDACIONES = "2026-05-26";

  const [loading, setLoading] = React.useState(true);
  const [presupuestos, setPresupuestos] = React.useState([]);
  const [items, setItems] = React.useState([]);
  const [liquidaciones, setLiquidaciones] = React.useState([]);
  const [gastos, setGastos] = React.useState([]);
  const [historial, setHistorial] = React.useState([]);
  const [socios, setSocios] = React.useState([]);

  const [presupuestoActivo, setPresupuestoActivo] = React.useState(null);

  const [socioGasto, setSocioGasto] = React.useState("");
  const [conceptoGasto, setConceptoGasto] = React.useState("");
  const [montoGasto, setMontoGasto] = React.useState("");

  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastMensaje, setToastMensaje] = React.useState("");
  const [toastTipo, setToastTipo] = React.useState("ok");

  React.useEffect(() => {
    cargarDatos();
  }, []);

  function mostrarToast(mensaje, tipo = "ok") {
    setToastMensaje(mensaje);
    setToastTipo(tipo);
    setToastVisible(true);

    setTimeout(() => {
      setToastVisible(false);
    }, 2500);
  }

  async function cargarDatos() {
    setLoading(true);

    const { data: presupuestosData, error } = await supabase
      .from("presupuestos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      mostrarToast(error.message, "error");
      setLoading(false);
      return;
    }

    const lista = (presupuestosData || []).filter((presupuesto) => {
      if (!presupuesto.created_at) return false;

      const fechaOk =
        new Date(presupuesto.created_at) >=
        new Date(FECHA_INICIO_LIQUIDACIONES);

      const estadoOk =
        presupuesto.estado === "Aprobado" ||
        presupuesto.estado === "Finalizado";

      return fechaOk && estadoOk;
    });

    const ids = lista.map((presupuesto) => presupuesto.id);

    let itemsData = [];
    let liquidacionesData = [];
    let gastosData = [];
    let historialData = [];

    if (ids.length > 0) {
      const { data: itemsResp, error: errorItems } = await supabase
        .from("presupuesto_items")
        .select("*")
        .in("presupuesto_id", ids);

      if (errorItems) {
        mostrarToast(errorItems.message, "error");
      }

      itemsData = itemsResp || [];

      const { data: liquidacionesResp, error: errorLiquidaciones } =
        await supabase
          .from("liquidaciones")
          .select("*")
          .in("presupuesto_id", ids);

      if (errorLiquidaciones) {
        mostrarToast(errorLiquidaciones.message, "error");
      }

      liquidacionesData = liquidacionesResp || [];

      const { data: gastosResp, error: errorGastos } = await supabase
        .from("liquidacion_gastos")
        .select("*")
        .in("presupuesto_id", ids)
        .order("created_at", { ascending: false });

      if (errorGastos) {
        mostrarToast(errorGastos.message, "error");
      }

      gastosData = gastosResp || [];

      const { data: historialResp, error: errorHistorial } = await supabase
        .from("liquidacion_historial")
        .select("*")
        .in("presupuesto_id", ids)
        .order("created_at", { ascending: false });

      if (errorHistorial) {
        mostrarToast(errorHistorial.message, "error");
      }

      historialData = historialResp || [];
    }

    const { data: sociosData, error: errorSocios } = await supabase
      .from("profiles")
      .select("id, alias, email, rol, activo")
      .eq("rol", "socio")
      .eq("activo", true)
      .order("alias");

    if (errorSocios) {
      mostrarToast(errorSocios.message, "error");
    }

    const sociosActivos = sociosData || [];

    setSocios(sociosActivos);

    if (!socioGasto && sociosActivos.length > 0) {
      setSocioGasto(sociosActivos[0].alias || sociosActivos[0].email);
    }

    setPresupuestos(lista);
    setItems(itemsData);
    setLiquidaciones(liquidacionesData);
    setGastos(gastosData);
    setHistorial(historialData);

    if (presupuestoActivo) {
      const actualizado = lista.find(
        (presupuesto) => presupuesto.id === presupuestoActivo.id
      );

      setPresupuestoActivo(actualizado || null);
    }

    setLoading(false);
  }

  function formatoMoneda(valor) {
    return `$${Number(valor || 0).toLocaleString("es-AR")}`;
  }

  function obtenerItemsPresupuesto(presupuestoId) {
    return items.filter((item) => item.presupuesto_id === presupuestoId);
  }

  function obtenerGastosPresupuesto(presupuestoId) {
    return gastos.filter((gasto) => gasto.presupuesto_id === presupuestoId);
  }

  function obtenerHistorialPresupuesto(presupuestoId) {
    return historial.filter((evento) => evento.presupuesto_id === presupuestoId);
  }

  function obtenerLiquidacion(presupuestoId) {
    return liquidaciones.find(
      (liquidacion) => liquidacion.presupuesto_id === presupuestoId
    );
  }

  function calcularResumen(presupuesto) {
    const itemsPresupuesto = obtenerItemsPresupuesto(presupuesto.id);
    const gastosPresupuesto = obtenerGastosPresupuesto(presupuesto.id);

    const costoProveedor = itemsPresupuesto.reduce((acc, item) => {
      const tipo = `${item.tipo || ""}`.toLowerCase().trim();

      if (tipo !== "material") return acc;

      const cantidad = Number(item.cantidad) || 0;
      const costoUnitario = Number(item.costo ?? 0) || 0;

      return acc + cantidad * costoUnitario;
    }, 0);

    const precioFinal = Number(presupuesto.total) || 0;
    const gananciaBruta = precioFinal - costoProveedor;

    const gastosPorSocio = socios.map((socio) => {
      const nombreSocio = socio.alias || socio.email;

      const totalGastos = gastosPresupuesto
        .filter((gasto) => gasto.socio === nombreSocio)
        .reduce((acc, gasto) => acc + (Number(gasto.monto) || 0), 0);

      return {
        id: socio.id,
        nombre: nombreSocio,
        gastos: totalGastos,
      };
    });

    const gastosTotales = gastosPorSocio.reduce(
      (acc, socio) => acc + socio.gastos,
      0
    );

    const cantidadSocios = socios.length || 1;
    const gananciaNeta = gananciaBruta - gastosTotales;
    const partePorSocio = gananciaNeta / cantidadSocios;

    const cobroPorSocio = gastosPorSocio.map((socio) => ({
      ...socio,
      cobra: partePorSocio + socio.gastos,
    }));

    return {
      precioFinal,
      costoProveedor,
      gananciaBruta,
      gastosPorSocio,
      gastosTotales,
      cantidadSocios,
      gananciaNeta,
      partePorSocio,
      cobroPorSocio,
    };
  }

  async function obtenerUsuarioActual() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        user: null,
        alias: "Usuario",
      };
    }

    const { data: perfil } = await supabase
      .from("profiles")
      .select("alias")
      .eq("id", user.id)
      .single();

    return {
      user,
      alias: perfil?.alias || "Usuario",
    };
  }

  async function registrarHistorial(liquidacionId, presupuestoId, accion, detalle) {
    const { user, alias } = await obtenerUsuarioActual();

    await supabase.from("liquidacion_historial").insert([
      {
        liquidacion_id: liquidacionId || null,
        presupuesto_id: presupuestoId,
        accion,
        detalle,
        user_id: user?.id || null,
        user_alias: alias,
      },
    ]);
  }

  async function crearLiquidacionSiNoExiste(presupuestoId) {
    const existente = obtenerLiquidacion(presupuestoId);

    if (existente) return existente;

    const { data, error } = await supabase
      .from("liquidaciones")
      .insert([
        {
          presupuesto_id: presupuestoId,
          proveedor_pagado: false,
          estado: "Abierta",
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    await registrarHistorial(
      data.id,
      presupuestoId,
      "Crear liquidación",
      "Se creó la liquidación del presupuesto."
    );

    setLiquidaciones((actuales) => [...actuales, data]);

    return data;
  }

  async function agregarGasto() {
    try {
      if (!presupuestoActivo) return;

      const liquidacion = await crearLiquidacionSiNoExiste(presupuestoActivo.id);

      if (liquidacion.estado === "Saldada") {
        mostrarToast("La liquidación está saldada y bloqueada", "error");
        return;
      }

      if (!socioGasto) {
        mostrarToast("No hay socio seleccionado", "error");
        return;
      }

      if (!conceptoGasto.trim()) {
        mostrarToast("Ingresar concepto del gasto", "error");
        return;
      }

      const monto = Number(montoGasto) || 0;

      if (monto <= 0) {
        mostrarToast("Ingresar monto válido", "error");
        return;
      }

      const { user } = await obtenerUsuarioActual();

      const { data, error } = await supabase
        .from("liquidacion_gastos")
        .insert([
          {
            liquidacion_id: liquidacion.id,
            presupuesto_id: presupuestoActivo.id,
            socio: socioGasto,
            concepto: conceptoGasto.trim(),
            monto,
            created_by: user?.id || null,
          },
        ])
        .select()
        .single();

      if (error) {
        mostrarToast(error.message, "error");
        return;
      }

      await registrarHistorial(
        liquidacion.id,
        presupuestoActivo.id,
        "Agregar gasto",
        `${socioGasto} · ${conceptoGasto.trim()} · ${formatoMoneda(monto)}`
      );

      if (data) {
        setGastos((actuales) => [data, ...actuales]);
      }

      setConceptoGasto("");
      setMontoGasto("");

      await cargarDatos();
      mostrarToast("Gasto agregado", "ok");
    } catch (error) {
      console.error(error);
      mostrarToast(error.message || "No se pudo agregar el gasto", "error");
    }
  }

  async function eliminarGasto(gasto) {
    try {
      const liquidacion = obtenerLiquidacion(gasto.presupuesto_id);

      if (liquidacion?.estado === "Saldada") {
        mostrarToast("La liquidación está saldada y bloqueada", "error");
        return;
      }

      const confirmar = window.confirm("¿Eliminar este gasto?");

      if (!confirmar) return;

      const { error } = await supabase
        .from("liquidacion_gastos")
        .delete()
        .eq("id", gasto.id);

      if (error) {
        mostrarToast(error.message, "error");
        return;
      }

      await registrarHistorial(
        gasto.liquidacion_id,
        gasto.presupuesto_id,
        "Eliminar gasto",
        `${gasto.socio} · ${gasto.concepto} · ${formatoMoneda(gasto.monto)}`
      );

      setGastos((actuales) =>
        actuales.filter((gastoActual) => gastoActual.id !== gasto.id)
      );

      await cargarDatos();
      mostrarToast("Gasto eliminado", "ok");
    } catch (error) {
      console.error(error);
      mostrarToast(error.message || "No se pudo eliminar el gasto", "error");
    }
  }

  async function cambiarProveedorPagado(presupuesto) {
    const liquidacion = await crearLiquidacionSiNoExiste(presupuesto.id);

    if (liquidacion.estado === "Saldada") {
      mostrarToast("La liquidación está saldada y bloqueada", "error");
      return;
    }

    const nuevoEstado = !liquidacion.proveedor_pagado;

    const { error } = await supabase
      .from("liquidaciones")
      .update({
        proveedor_pagado: nuevoEstado,
        updated_at: new Date().toISOString(),
      })
      .eq("id", liquidacion.id);

    if (error) {
      mostrarToast(error.message, "error");
      return;
    }

    await registrarHistorial(
      liquidacion.id,
      presupuesto.id,
      "Estado proveedor",
      nuevoEstado
        ? "Proveedor marcado como pagado."
        : "Proveedor marcado como pendiente."
    );

    await cargarDatos();
    mostrarToast("Estado proveedor actualizado", "ok");
  }

  async function saldarLiquidacion(presupuesto) {
    const liquidacion = await crearLiquidacionSiNoExiste(presupuesto.id);

    if (liquidacion.estado === "Saldada") {
      mostrarToast("La liquidación ya está saldada", "error");
      return;
    }

    const confirmar = window.confirm(
      "Al saldar esta liquidación quedará bloqueada.\n\n¿Deseás continuar?"
    );

    if (!confirmar) return;

    const { user } = await obtenerUsuarioActual();

    const { error } = await supabase
      .from("liquidaciones")
      .update({
        estado: "Saldada",
        cerrada_at: new Date().toISOString(),
        cerrada_por: user?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", liquidacion.id);

    if (error) {
      mostrarToast(error.message, "error");
      return;
    }

    await registrarHistorial(
      liquidacion.id,
      presupuesto.id,
      "Saldar liquidación",
      "La liquidación fue saldada y bloqueada."
    );

    await cargarDatos();
    mostrarToast("Liquidación saldada", "ok");
  }

  async function reabrirLiquidacion(presupuesto) {
    const liquidacion = obtenerLiquidacion(presupuesto.id);

    if (!liquidacion) {
      mostrarToast("No existe liquidación para reabrir", "error");
      return;
    }

    const confirmar = window.confirm(
      "La liquidación volverá a quedar editable.\n\n¿Deseás reabrirla?"
    );

    if (!confirmar) return;

    const { user } = await obtenerUsuarioActual();

    const { error } = await supabase
      .from("liquidaciones")
      .update({
        estado: "Abierta",
        reabierta_at: new Date().toISOString(),
        reabierta_por: user?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", liquidacion.id);

    if (error) {
      mostrarToast(error.message, "error");
      return;
    }

    await registrarHistorial(
      liquidacion.id,
      presupuesto.id,
      "Reabrir liquidación",
      "La liquidación fue reabierta para edición."
    );

    await cargarDatos();
    mostrarToast("Liquidación reabierta", "ok");
  }

  const liquidacionActiva = presupuestoActivo
    ? obtenerLiquidacion(presupuestoActivo.id)
    : null;

  const bloqueada = liquidacionActiva?.estado === "Saldada";

  const resumenActivo = presupuestoActivo
    ? calcularResumen(presupuestoActivo)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Cargando liquidaciones...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6">
      <Toast mensaje={toastMensaje} tipo={toastTipo} visible={toastVisible} />

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-orange-500">
              Liquidaciones
            </h1>

            <p className="text-zinc-500 mt-3">
              Cierre operativo de presupuestos aprobados/finalizados
            </p>

            <p className="text-zinc-600 text-sm mt-2">
              Inicio liquidaciones: 26/05/2026
            </p>
          </div>

          <Link
            to="/"
            className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-xl font-bold"
          >
            Volver
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.25fr] gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 md:p-6">
            <h2 className="text-2xl font-black text-orange-500 mb-4">
              Presupuestos
            </h2>

            <div className="space-y-3 max-h-[75vh] overflow-auto pr-1">
              {presupuestos.map((presupuesto) => {
                const resumen = calcularResumen(presupuesto);
                const liquidacion = obtenerLiquidacion(presupuesto.id);
                const activo = presupuestoActivo?.id === presupuesto.id;

                return (
                  <button
                    key={presupuesto.id}
                    onClick={() => setPresupuestoActivo(presupuesto)}
                    className={
                      activo
                        ? "w-full text-left bg-orange-500/10 border border-orange-500/40 rounded-2xl p-4"
                        : "w-full text-left bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 rounded-2xl p-4"
                    }
                  >
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black truncate">
                          Presupuesto {presupuesto.numero || "-"}
                        </p>

                        <p className="text-zinc-400 text-sm mt-1 truncate">
                          {presupuesto.cliente_empresa ||
                            presupuesto.cliente ||
                            "-"}
                        </p>
                      </div>

                      <span
                        className={
                          liquidacion?.estado === "Saldada"
                            ? "bg-green-500/20 text-green-300 px-3 py-2 rounded-xl text-xs font-bold h-fit"
                            : "bg-blue-500/20 text-blue-300 px-3 py-2 rounded-xl text-xs font-bold h-fit"
                        }
                      >
                        {liquidacion?.estado || "Abierta"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div>
                        <p className="text-zinc-500 text-xs">Precio final</p>
                        <p className="text-green-400 font-bold">
                          {formatoMoneda(resumen.precioFinal)}
                        </p>
                      </div>

                      <div>
                        <p className="text-zinc-500 text-xs">Proveedor</p>
                        <p className="text-red-400 font-bold">
                          {formatoMoneda(resumen.costoProveedor)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}

              {presupuestos.length === 0 && (
                <div className="text-center text-zinc-500 p-6">
                  No hay presupuestos aprobados o finalizados.
                </div>
              )}
            </div>
          </div>

          {!presupuestoActivo ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center text-zinc-500">
              Seleccioná un presupuesto para liquidar.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-2xl font-black text-orange-500">
                      Presupuesto {presupuestoActivo.numero || "-"}
                    </h2>

                    <p className="text-zinc-400 mt-1">
                      {presupuestoActivo.cliente_empresa ||
                        presupuestoActivo.cliente ||
                        "-"}
                    </p>
                  </div>

                  <span
                    className={
                      bloqueada
                        ? "bg-green-500/20 text-green-300 px-4 py-3 rounded-2xl font-bold"
                        : "bg-blue-500/20 text-blue-300 px-4 py-3 rounded-2xl font-bold"
                    }
                  >
                    {bloqueada ? "Saldada / bloqueada" : "Abierta"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-zinc-500 text-sm">Precio final</p>
                    <p className="text-green-400 font-black text-2xl mt-2">
                      {formatoMoneda(resumenActivo.precioFinal)}
                    </p>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-zinc-500 text-sm">Proveedor/materiales</p>
                    <p className="text-red-400 font-black text-2xl mt-2">
                      {formatoMoneda(resumenActivo.costoProveedor)}
                    </p>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-zinc-500 text-sm">Ganancia bruta</p>
                    <p className="text-orange-500 font-black text-2xl mt-2">
                      {formatoMoneda(resumenActivo.gananciaBruta)}
                    </p>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-zinc-500 text-sm">Gastos totales</p>
                    <p className="text-red-400 font-black text-2xl mt-2">
                      {formatoMoneda(resumenActivo.gastosTotales)}
                    </p>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-zinc-500 text-sm">Ganancia neta</p>
                    <p className="text-orange-500 font-black text-2xl mt-2">
                      {formatoMoneda(resumenActivo.gananciaNeta)}
                    </p>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-zinc-500 text-sm">
                      Parte por socio ({resumenActivo.cantidadSocios})
                    </p>
                    <p className="text-white font-black text-2xl mt-2">
                      {formatoMoneda(resumenActivo.partePorSocio)}
                    </p>
                  </div>

                  {resumenActivo.cobroPorSocio.map((socio) => (
                    <div
                      key={socio.id}
                      className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                    >
                      <p className="text-zinc-500 text-sm">
                        {socio.nombre} cobra
                      </p>

                      <p className="text-green-400 font-black text-2xl mt-2">
                        {formatoMoneda(socio.cobra)}
                      </p>

                      <p className="text-zinc-500 text-xs mt-2">
                        Gastos: {formatoMoneda(socio.gastos)}
                      </p>
                    </div>
                  ))}

                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-zinc-500 text-sm">Proveedor</p>

                    <button
                      disabled={bloqueada}
                      onClick={() => cambiarProveedorPagado(presupuestoActivo)}
                      className={
                        liquidacionActiva?.proveedor_pagado
                          ? "mt-2 bg-green-500/20 text-green-300 px-4 py-3 rounded-2xl font-bold disabled:opacity-60"
                          : "mt-2 bg-red-500/20 text-red-300 px-4 py-3 rounded-2xl font-bold disabled:opacity-60"
                      }
                    >
                      {liquidacionActiva?.proveedor_pagado
                        ? "Pagado"
                        : "Pendiente"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 md:p-6">
                <h3 className="text-2xl font-black text-orange-500 mb-4">
                  Gastos
                </h3>

                {!bloqueada && socios.length === 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-2xl p-4 mb-5 font-bold">
                    No hay socios activos. Activá usuarios con rol socio desde Admin.
                  </div>
                )}

                {!bloqueada && socios.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_160px_auto] gap-3 mb-5">
                    <select
                      value={socioGasto}
                      onChange={(e) => setSocioGasto(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                    >
                      {socios.length === 0 && (
                        <option value="">Sin socios activos</option>
                      )}

                      {socios.map((socio) => {
                        const nombreSocio = socio.alias || socio.email;

                        return (
                          <option key={socio.id} value={nombreSocio}>
                            {nombreSocio}
                          </option>
                        );
                      })}
                    </select>

                    <input
                      type="text"
                      placeholder="Concepto: combustible, peaje, viáticos..."
                      value={conceptoGasto}
                      onChange={(e) => setConceptoGasto(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                    />

                    <input
                      type="number"
                      placeholder="Monto"
                      value={montoGasto}
                      onChange={(e) => setMontoGasto(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                    />

                    <button
                      onClick={agregarGasto}
                      className="bg-orange-500 hover:bg-orange-600 px-5 py-4 rounded-2xl font-bold"
                    >
                      Agregar
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {obtenerGastosPresupuesto(presupuestoActivo.id).map((gasto) => (
                    <div
                      key={gasto.id}
                      className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center gap-3"
                    >
                      <div>
                        <p className="font-bold">
                          {gasto.socio} · {gasto.concepto}
                        </p>

                        <p className="text-zinc-500 text-sm">
                          {new Date(gasto.created_at).toLocaleString("es-AR")}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <p className="text-red-400 font-black">
                          {formatoMoneda(gasto.monto)}
                        </p>

                        {!bloqueada && (
                          <button
                            onClick={() => eliminarGasto(gasto)}
                            className="bg-red-500 hover:bg-red-600 px-4 h-10 rounded-xl font-black"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {obtenerGastosPresupuesto(presupuestoActivo.id).length === 0 && (
                    <div className="text-center text-zinc-500 p-5">
                      No hay gastos cargados.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 md:p-6">
                <h3 className="text-2xl font-black text-orange-500 mb-4">
                  Acciones
                </h3>

                <div className="flex flex-col md:flex-row gap-3">
                  {!bloqueada ? (
                    <button
                      onClick={() => saldarLiquidacion(presupuestoActivo)}
                      className="bg-green-600 hover:bg-green-700 px-6 py-4 rounded-2xl font-bold"
                    >
                      Saldar y bloquear
                    </button>
                  ) : (
                    <button
                      onClick={() => reabrirLiquidacion(presupuestoActivo)}
                      className="bg-orange-500 hover:bg-orange-600 px-6 py-4 rounded-2xl font-bold"
                    >
                      Reabrir liquidación
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 md:p-6">
                <h3 className="text-2xl font-black text-orange-500 mb-4">
                  Historial
                </h3>

                <div className="space-y-2 max-h-72 overflow-auto">
                  {obtenerHistorialPresupuesto(presupuestoActivo.id).map(
                    (evento) => (
                      <div
                        key={evento.id}
                        className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                      >
                        <p className="font-bold">{evento.accion}</p>

                        {evento.detalle && (
                          <p className="text-zinc-400 text-sm mt-1">
                            {evento.detalle}
                          </p>
                        )}

                        <p className="text-zinc-600 text-xs mt-2">
                          {evento.user_alias || "Usuario"} ·{" "}
                          {new Date(evento.created_at).toLocaleString("es-AR")}
                        </p>
                      </div>
                    )
                  )}

                  {obtenerHistorialPresupuesto(presupuestoActivo.id).length ===
                    0 && (
                    <div className="text-center text-zinc-500 p-5">
                      Sin historial todavía.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
