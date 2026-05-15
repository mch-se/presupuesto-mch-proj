import React from "react";
import * as XLSX from "xlsx";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

export default function ImportarDatos() {
  const [clientesFile, setClientesFile] = React.useState(null);
  const [articulosFile, setArticulosFile] = React.useState(null);
  const [presupuestosFile, setPresupuestosFile] = React.useState(null);
  const [mensaje, setMensaje] = React.useState("");

  function limpiar(valor) {
    if (valor === null || valor === undefined) return "";
    return String(valor).replace(/\u00A0/g, " ").trim();
  }

  function numero(valor) {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
  }

  function fecha(valor) {
    if (!valor) return null;

    if (typeof valor === "number") {
      const d = XLSX.SSF.parse_date_code(valor);
      if (!d) return null;
      return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
    }

    const texto = limpiar(valor);
    const partes = texto.split("/");

    if (partes.length === 3) {
      let [d, m, y] = partes;
      if (y.length === 2) y = `20${y}`;
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }

    return null;
  }

  async function leerExcel(file) {
    const buffer = await file.arrayBuffer();
    return XLSX.read(buffer, { type: "array", cellDates: false });
  }

  async function importarTodo() {
    if (!clientesFile || !articulosFile || !presupuestosFile) {
      alert("Seleccioná los 3 archivos: clientes, artículos y presupuestos");
      return;
    }

    setMensaje("Leyendo archivos...");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const wbClientes = await leerExcel(clientesFile);
    const wbArticulos = await leerExcel(articulosFile);
    const wbPresupuestos = await leerExcel(presupuestosFile);

    const clientesRows = XLSX.utils.sheet_to_json(
      wbClientes.Sheets[wbClientes.SheetNames[0]]
    );

    const articulosRows = XLSX.utils.sheet_to_json(
      wbArticulos.Sheets[wbArticulos.SheetNames[0]]
    );

    const presupuestosRows = XLSX.utils.sheet_to_json(
      wbPresupuestos.Sheets["Presupuestos"]
    );

    const detallesRows = XLSX.utils.sheet_to_json(
      wbPresupuestos.Sheets["Detalles de presupuesto"]
    );

    setMensaje("Importando clientes...");

    const clientes = clientesRows
      .map((fila) => {
        const oldNumero = limpiar(fila["Número"]);
        const empresa = limpiar(fila["Nombre"]);
        const contacto = limpiar(fila["Persona de contacto"]);
        const telefono =
          limpiar(fila["Móvil"]) || limpiar(fila["Teléfono"]);

        return {
          user_id: user.id,
          old_numero: oldNumero,
          tipo: contacto ? "Empresa" : "Particular",
          empresa,
          contacto,
          telefono,
          email: limpiar(fila["Correo electrónico"]),
          direccion: [
            limpiar(fila["Dirección de la calle"]),
            limpiar(fila["Ciudad"]),
            limpiar(fila["Código postal"]),
          ]
            .filter(Boolean)
            .join(" - "),
          observaciones: limpiar(fila["Información Adicional"]),
        };
      })
      .filter((c) => c.empresa);

    if (clientes.length > 0) {
      const { error } = await supabase.from("clientes").insert(clientes);
      if (error) {
        alert(error.message);
        setMensaje("");
        return;
      }
    }

    const { data: clientesDb } = await supabase
      .from("clientes")
      .select("*")
      .eq("user_id", user.id);

    const clientesPorNumero = {};
    const clientesPorNombre = {};

    (clientesDb || []).forEach((c) => {
      if (c.old_numero) clientesPorNumero[c.old_numero] = c;
      if (c.empresa) clientesPorNombre[c.empresa.toLowerCase()] = c;
    });

    setMensaje("Importando artículos...");

    const articulos = articulosRows
      .map((fila) => ({
        user_id: user.id,
        descripcion: limpiar(fila["Descripción"]),
        detalle: limpiar(fila["Descripción larga"]),
        precio: numero(fila["Precio"]),
        costo: numero(fila["Precio de coste"]),
        tipo: limpiar(fila["Tipo de artículo"]) || "Material",
        categoria: limpiar(fila["Tipo de artículo"]) || "Material",
        proveedor: "Migración app anterior",
        moneda: "ARS",
      }))
      .filter((a) => a.descripcion);

    if (articulos.length > 0) {
      const { error } = await supabase.from("articulos").insert(articulos);
      if (error) {
        alert(error.message);
        setMensaje("");
        return;
      }
    }

    setMensaje("Importando presupuestos...");

    const presupuestosInsertar = presupuestosRows
      .map((fila) => {
        const oldClienteNumero = limpiar(fila["Número de cliente"]);
        const nombreCliente = limpiar(fila["Nombre del cliente"]);
        const clienteRelacionado =
          clientesPorNumero[oldClienteNumero] ||
          clientesPorNombre[nombreCliente.toLowerCase()];

        return {
          user_id: user.id,
          numero: limpiar(fila["Número"]),
          old_numero: limpiar(fila["Número"]),
          old_cliente_numero: oldClienteNumero,

          cliente: nombreCliente,
          cliente_id: clienteRelacionado?.id || null,
          cliente_empresa: nombreCliente,
          cliente_contacto: limpiar(fila["Persona de contacto"]),
          cliente_telefono:
            limpiar(fila["Móvil"]) || limpiar(fila["Teléfono"]),
          cliente_email: limpiar(fila["Correo electrónico"]),
          cliente_direccion: [
            limpiar(fila["Dirección de la calle"]),
            limpiar(fila["Ciudad"]),
            limpiar(fila["Código postal"]),
          ]
            .filter(Boolean)
            .join(" - "),

          descripcion_corta: limpiar(fila["Breve descripción"]),
          descripcion_larga: limpiar(fila["Texto"]),

          estado:
            limpiar(fila["Estatus"]) === "CLOSED"
              ? "Finalizado"
              : "Pendiente",

          moneda: "ARS",
          subtotal: numero(fila["Cantidad total"]),
          iva: 0,
          total: numero(fila["Cantidad a pagar"]) || numero(fila["Cantidad total"]),
          created_at: fecha(fila["Fecha de presupuesto"]) || undefined,
          valido_hasta: fecha(fila["Válido hasta"]),
        };
      })
      .filter((p) => p.numero);

    const { data: presupuestosCreados, error: errorPresupuestos } =
      await supabase
        .from("presupuestos")
        .insert(presupuestosInsertar)
        .select();

    if (errorPresupuestos) {
      alert(errorPresupuestos.message);
      setMensaje("");
      return;
    }

    const presupuestosPorNumero = {};

    (presupuestosCreados || []).forEach((p) => {
      presupuestosPorNumero[String(p.numero)] = p;
    });

    setMensaje("Importando items de presupuestos...");

    const items = detallesRows
      .map((fila) => {
        const numeroPresupuesto = limpiar(fila["Número de presupuesto"]);
        const presupuesto = presupuestosPorNumero[numeroPresupuesto];

        if (!presupuesto) return null;

        const cantidad = numero(fila["Cantidad"]);
        const precio = numero(fila["Precio"]);
        const subtotal =
          numero(fila["Cantidad_1"]) ||
          numero(fila["Monto antes del descuento"]) ||
          cantidad * precio;

        return {
          presupuesto_id: presupuesto.id,
          descripcion: limpiar(fila["Descripción del artículo"]),
          detalle: limpiar(fila["Texto"]),
          cantidad,
          precio,
          subtotal,
          tipo: limpiar(fila["Tipo de artículo"]) || "Material",
        };
      })
      .filter(Boolean);

    if (items.length > 0) {
      const { error } = await supabase.from("presupuesto_items").insert(items);
      if (error) {
        alert(error.message);
        setMensaje("");
        return;
      }
    }

    setMensaje(
      `Migración completa: ${clientes.length} clientes, ${articulos.length} artículos, ${presupuestosInsertar.length} presupuestos, ${items.length} items.`
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-bold text-orange-500">
              Importar Datos
            </h1>

            <p className="text-zinc-400 mt-3">
              Migración única desde la aplicación anterior
            </p>
          </div>

          <Link
            to="/"
            className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-xl font-bold"
          >
            Volver
          </Link>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-3">Clientes.xlsx</h2>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setClientesFile(e.target.files[0])}
              className="block w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3">Artículos.xlsx</h2>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setArticulosFile(e.target.files[0])}
              className="block w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3">Presupuestos.xlsx</h2>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setPresupuestosFile(e.target.files[0])}
              className="block w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />
          </div>

          <button
            onClick={importarTodo}
            className="w-full bg-orange-500 hover:bg-orange-600 p-5 rounded-2xl text-xl font-bold"
          >
            Importar Todo
          </button>

          {mensaje && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 font-bold">
              {mensaje}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}