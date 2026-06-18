import React from "react";
import { supabase } from "../lib/supabase";

function normalizarSku(sku) {
  return `${sku || ""}`.trim().toUpperCase();
}

function normalizarNumero(valor) {
  const texto = `${valor || ""}`
    .replace(/\$/g, "")
    .replace(/\s/g, "")
    .trim();

  if (!texto) return 0;

  if (texto.includes(",") && texto.includes(".")) {
    return Number(texto.replace(/\./g, "").replace(/,/g, ".")) || 0;
  }

  if (texto.includes(",")) {
    return Number(texto.replace(/,/g, ".")) || 0;
  }

  return Number(texto) || 0;
}

function esNumeroValido(valor) {
  const numero = normalizarNumero(valor);
  return Number.isFinite(numero) && numero >= 0;
}

function parsearCsvBasico(texto) {
  const filas = [];
  let fila = [];
  let campo = "";
  let dentroComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const char = texto[i];
    const siguiente = texto[i + 1];

    if (char === '"') {
      if (dentroComillas && siguiente === '"') {
        campo += '"';
        i++;
      } else {
        dentroComillas = !dentroComillas;
      }
      continue;
    }

    if (char === "," && !dentroComillas) {
      fila.push(campo.trim());
      campo = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !dentroComillas) {
      if (char === "\r" && siguiente === "\n") i++;
      fila.push(campo.trim());

      if (fila.some((valor) => `${valor || ""}`.trim() !== "")) {
        filas.push(fila);
      }

      fila = [];
      campo = "";
      continue;
    }

    campo += char;
  }

  fila.push(campo.trim());

  if (fila.some((valor) => `${valor || ""}`.trim() !== "")) {
    filas.push(fila);
  }

  return filas;
}

function parsearCsvTolerante(texto) {
  const filas = parsearCsvBasico(texto);

  if (filas.length <= 1) return [];

  const articulos = [];
  let buffer = [];

  function intentarCerrarBuffer() {
    if (buffer.length < 5) return false;

    const cantidad = normalizarNumero(buffer[0]);
    const sku = normalizarSku(buffer[1]);
    const costoTexto = buffer[buffer.length - 2];
    const precioTexto = buffer[buffer.length - 1];

    if (!cantidad || !sku) return false;
    if (!esNumeroValido(costoTexto) || !esNumeroValido(precioTexto)) return false;

    const descripcion = buffer
      .slice(2, buffer.length - 2)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    articulos.push({
      cantidad,
      sku,
      descripcion: sku,
      detalle: descripcion,
      costo_gremio: normalizarNumero(costoTexto),
      precio_publico: normalizarNumero(precioTexto),
    });

    buffer = [];
    return true;
  }

  for (let i = 1; i < filas.length; i++) {
    const fila = filas[i].map((campo) => `${campo || ""}`.trim());

    if (fila.length === 0) continue;

    const empiezaNuevoArticulo =
      esNumeroValido(fila[0]) && normalizarNumero(fila[0]) > 0 && Boolean(fila[1]);

    if (empiezaNuevoArticulo && buffer.length > 0) {
      intentarCerrarBuffer();
    }

    if (buffer.length === 0) {
      buffer = [...fila];
    } else {
      const continuacion = fila[0] === "" ? fila.slice(1) : fila;
      buffer = [...buffer, ...continuacion];
    }

    intentarCerrarBuffer();
  }

  return articulos.filter(
    (articulo) =>
      articulo.cantidad > 0 &&
      articulo.sku &&
      articulo.precio_publico >= 0 &&
      articulo.costo_gremio >= 0
  );
}

function detectarCategoriaInicial(item, categorias, existente) {
  if (existente?.categoria_id) return existente.categoria_id;

  const texto = `${item.sku || ""} ${item.detalle || ""}`.toLowerCase();

  const buscarCategoria = (palabras) =>
    categorias.find((categoria) =>
      palabras.some((palabra) =>
        `${categoria.nombre || ""}`.toLowerCase().includes(palabra)
      )
    );

  if (
    texto.includes("cerradura") ||
    texto.includes("hikvision") ||
    texto.includes("access") ||
    texto.includes("wiegand") ||
    texto.includes("mifare") ||
    texto.includes("reader") ||
    texto.includes("control")
  ) {
    return buscarCategoria(["acceso", "control"])?.id || null;
  }

  if (
    texto.includes("bateria") ||
    texto.includes("batería") ||
    texto.includes("soporte") ||
    texto.includes("fuente") ||
    texto.includes("gabinete") ||
    texto.includes("tag")
  ) {
    return (
      buscarCategoria(["accesorio", "generico", "genérico", "varios"])?.id ||
      null
    );
  }

  return null;
}

const ImportadorCsv = React.forwardRef(function ImportadorCsv(
  { articulos, categorias, tipos, setItems, obtenerArticulos, mostrarToast },
  ref
) {
  const inputCsvRef = React.useRef(null);
  const [procesando, setProcesando] = React.useState(false);

  React.useImperativeHandle(ref, () => ({
    abrir() {
      if (procesando) return;
      inputCsvRef.current?.click();
    },
  }));

  function obtenerTipoMaterial() {
    return (
      tipos.find((tipo) =>
        `${tipo.nombre || ""}`.toLowerCase().includes("material")
      ) || null
    );
  }

  async function procesarArchivoCsv(evento) {
    const archivo = evento.target.files?.[0];
    evento.target.value = "";

    if (!archivo || procesando) return;

    setProcesando(true);

    try {
      const texto = await archivo.text();
      const articulosCsv = parsearCsvTolerante(texto);

      if (articulosCsv.length === 0) {
        mostrarToast("No se encontraron artículos válidos en el CSV", "error");
        return;
      }

      const tipoMaterial = obtenerTipoMaterial();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        mostrarToast("Sesión no válida", "error");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("alias")
        .eq("id", user.id)
        .single();

      const alias = profile?.alias || "Administrador";
      const itemsParaPresupuesto = [];
      let nuevos = 0;
      let actualizados = 0;

      for (const item of articulosCsv) {
        const existente = articulos.find(
          (articulo) => normalizarSku(articulo.sku) === item.sku
        );

        const categoriaId = detectarCategoriaInicial(item, categorias, existente);
        const categoriaSeleccionada = categorias.find(
          (categoria) => categoria.id === categoriaId
        );

        const datosArticulo = {
          sku: item.sku,
          descripcion: item.descripcion,
          detalle: item.detalle || "",
          proveedor: "CSV proveedor",
          moneda: "ARS",
          categoria_id: categoriaId || null,
          categoria: categoriaSeleccionada?.nombre || existente?.categoria || "",
          tipo_id: tipoMaterial?.id || existente?.tipo_id || null,
          tipo: tipoMaterial?.nombre || existente?.tipo || "Material",
          precio_costo: item.costo_gremio,
          costo: item.costo_gremio,
          precio_final: item.precio_publico,
          precio: item.precio_publico,
          frecuente: true,
          importado_proveedor: true,
          origen_pdf: "CSV proveedor",
          usado_count: Math.max(Number(existente?.usado_count || 0), 11),
        };

        let articuloId = existente?.id || null;

        if (existente?.id) {
          const { error } = await supabase
            .from("articulos")
            .update(datosArticulo)
            .eq("id", existente.id);

          if (error) throw error;
          actualizados++;
        } else {
          const { data: articuloCreado, error } = await supabase
            .from("articulos")
            .insert([
              {
                ...datosArticulo,
                user_id: user.id,
                cargado_por: user.id,
                cargado_por_alias: alias,
              },
            ])
            .select()
            .single();

          if (error) throw error;
          articuloId = articuloCreado?.id || null;
          nuevos++;
        }

        itemsParaPresupuesto.push({
          descripcion: item.descripcion,
          detalle: item.detalle || "",
          categoria_id: categoriaId || "",
          tipo_id: tipoMaterial?.id || "",
          categoria: categoriaSeleccionada?.nombre || existente?.categoria || "",
          tipo: tipoMaterial?.nombre || existente?.tipo || "Material",
          cantidad: item.cantidad || 1,
          precio: item.precio_publico,
          precio_costo: item.costo_gremio,
          costo: item.costo_gremio,
          precio_final: item.precio_publico,
          articulo_id: articuloId,
          actualizar_biblioteca: false,
        });
      }

      setItems((actuales) => [...actuales, ...itemsParaPresupuesto]);
      await obtenerArticulos();

      mostrarToast(
        `CSV importado: ${nuevos} nuevos, ${actualizados} actualizados`,
        "ok"
      );
    } catch (error) {
      console.error(error);
      mostrarToast(error.message || "Error al importar CSV", "error");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <input
      ref={inputCsvRef}
      type="file"
      accept=".csv,text/csv"
      onChange={procesarArchivoCsv}
      className="hidden"
    />
  );
});

export default ImportadorCsv;
