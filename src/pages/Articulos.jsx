import React from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function Articulos() {
  const [descripcion, setDescripcion] = React.useState("");
  const [detalle, setDetalle] = React.useState("");
  const [precioCosto, setPrecioCosto] = React.useState("");
  const [precioFinal, setPrecioFinal] = React.useState("");
  const [frecuente, setFrecuente] = React.useState(false);
  const [importadoProveedor, setImportadoProveedor] = React.useState(false);
  const [origenPdf, setOrigenPdf] = React.useState("");
  const [categoriaId, setCategoriaId] = React.useState("");
  const [tipoId, setTipoId] = React.useState("");
  const [proveedor, setProveedor] = React.useState("");
  const [moneda, setMoneda] = React.useState("ARS");
  const [usadoCount, setUsadoCount] = React.useState(0);

  const [articulos, setArticulos] = React.useState([]);
  const [categorias, setCategorias] = React.useState([]);
  const [tipos, setTipos] = React.useState([]);

  const [busqueda, setBusqueda] = React.useState("");
  const [filtroCategoria, setFiltroCategoria] = React.useState("Todas");
  const [filtroTipo, setFiltroTipo] = React.useState("Todos");

  const [editandoId, setEditandoId] = React.useState(null);
  const [mostrarFormulario, setMostrarFormulario] = React.useState(false);
  const [mostrarFiltros, setMostrarFiltros] = React.useState(false);
  const [menuAbierto, setMenuAbierto] = React.useState(null);
  const [menuConfigAbierto, setMenuConfigAbierto] = React.useState(false);
  const [articuloVer, setArticuloVer] = React.useState(null);

  const [menuImportarAbierto, setMenuImportarAbierto] = React.useState(false);
  const [tipoImportacion, setTipoImportacion] = React.useState(null);
  const [previewImportacion, setPreviewImportacion] = React.useState([]);
  const [mostrarPreviewImportacion, setMostrarPreviewImportacion] =
    React.useState(false);
  const [categoriaImportacionId, setCategoriaImportacionId] =
    React.useState("");
  const [procesandoPdf, setProcesandoPdf] = React.useState(false);

  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastMensaje, setToastMensaje] = React.useState("");
  const [toastTipo, setToastTipo] = React.useState("ok");

  const [modalVisible, setModalVisible] = React.useState(false);
  const [articuloEliminar, setArticuloEliminar] = React.useState(null);

  const formularioRef = React.useRef(null);
  const inputPdfRef = React.useRef(null);

  React.useEffect(() => {
    obtenerCategorias();
    obtenerTipos();
    obtenerArticulos();
  }, []);

  function mostrarToast(mensaje, tipo = "ok") {
    setToastMensaje(mensaje);
    setToastTipo(tipo);
    setToastVisible(true);

    setTimeout(() => {
      setToastVisible(false);
    }, 2500);
  }

  async function obtenerCategorias() {
    const { data, error } = await supabase
      .from("articulo_categorias")
      .select("*")
      .order("nombre");

    if (error) {
      mostrarToast(error.message, "error");
      return;
    }

    setCategorias(data || []);
  }

  async function obtenerTipos() {
    const { data, error } = await supabase
      .from("articulo_tipos")
      .select("*")
      .order("nombre");

    if (error) {
      mostrarToast(error.message, "error");
      return;
    }

    setTipos(data || []);
  }

  async function obtenerArticulos() {
    const { data, error } = await supabase.from("articulos").select("*");

    if (error) {
      mostrarToast(error.message, "error");
      return;
    }

    setArticulos(data || []);
  }

  function nombreCategoria(articulo) {
    const encontrada = categorias.find(
      (categoria) => categoria.id === articulo.categoria_id
    );

    return encontrada?.nombre || articulo.categoria || "-";
  }

  function nombreTipo(articulo) {
    const encontrado = tipos.find((tipo) => tipo.id === articulo.tipo_id);

    return encontrado?.nombre || articulo.tipo || "-";
  }

  function limpiarFormulario() {
    setDescripcion("");
    setDetalle("");
    setPrecioCosto("");
    setPrecioFinal("");
    setFrecuente(false);
    setImportadoProveedor(false);
    setOrigenPdf("");
    setCategoriaId("");
    setTipoId("");
    setProveedor("");
    setMoneda("ARS");
    setUsadoCount(0);
    setEditandoId(null);
    setMostrarFormulario(false);
  }

  function limpiarFiltros() {
    setBusqueda("");
    setFiltroCategoria("Todas");
    setFiltroTipo("Todos");
  }

  async function guardarArticulo() {
    if (!descripcion) {
      mostrarToast("Ingresar descripción", "error");
      return;
    }

    const categoriaSeleccionada = categorias.find(
      (categoria) => categoria.id === categoriaId
    );

    const tipoSeleccionado = tipos.find((tipo) => tipo.id === tipoId);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = await supabase
      .from("profiles")
      .select("alias")
      .eq("id", user.id)
      .single();

    const alias = profile?.alias || "Administrador";

    const costoNumerico = precioCosto === "" ? 0 : Number(precioCosto) || 0;
    const finalNumerico = precioFinal === "" ? 0 : Number(precioFinal) || 0;

    const datosArticulo = {
      descripcion,
      detalle,
      precio: finalNumerico,
      costo: costoNumerico,
      precio_costo: costoNumerico,
      precio_final: finalNumerico,
      frecuente,
      importado_proveedor: importadoProveedor,
      origen_pdf: origenPdf,
      proveedor,
      moneda,
      usado_count: frecuente ? Math.max(Number(usadoCount) || 0, 11) : Number(usadoCount) || 0,
      categoria_id: categoriaId || null,
      tipo_id: tipoId || null,
      categoria: categoriaSeleccionada?.nombre || "",
      tipo: tipoSeleccionado?.nombre || "",
    };

    if (editandoId) {
      const { error } = await supabase
        .from("articulos")
        .update(datosArticulo)
        .eq("id", editandoId);

      if (error) {
        mostrarToast(error.message, "error");
        return;
      }

      mostrarToast("Artículo actualizado", "ok");
    } else {
      const { error } = await supabase.from("articulos").insert([
        {
          ...datosArticulo,
          user_id: user.id,
          cargado_por: user.id,
          cargado_por_alias: alias,
        },
      ]);

      if (error) {
        mostrarToast(error.message, "error");
        return;
      }

      mostrarToast("Artículo creado correctamente", "ok");
    }

    limpiarFormulario();
    obtenerArticulos();
  }

  function editarArticulo(articulo) {
    const categoriaEncontrada =
      articulo.categoria_id ||
      categorias.find(
        (categoria) =>
          categoria.nombre.toLowerCase() ===
          (articulo.categoria || "").toLowerCase()
      )?.id ||
      "";

    const tipoEncontrado =
      articulo.tipo_id ||
      tipos.find(
        (tipo) =>
          tipo.nombre.toLowerCase() === (articulo.tipo || "").toLowerCase()
      )?.id ||
      "";

    setDescripcion(articulo.descripcion || "");
    setDetalle(articulo.detalle || "");
    setPrecioCosto(articulo.precio_costo ?? articulo.costo ?? "");
    setPrecioFinal(articulo.precio_final ?? articulo.precio ?? "");
    setFrecuente(Boolean(articulo.frecuente) || (Number(articulo.usado_count) || 0) >= 11);
    setImportadoProveedor(Boolean(articulo.importado_proveedor));
    setOrigenPdf(articulo.origen_pdf || "");
    setCategoriaId(categoriaEncontrada);
    setTipoId(tipoEncontrado);
    setProveedor(articulo.proveedor || "");
    setMoneda(articulo.moneda || "ARS");
    setUsadoCount(articulo.usado_count || 0);
    setEditandoId(articulo.id);
    setMostrarFormulario(true);
    setMenuAbierto(null);

    setTimeout(() => {
      formularioRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  function solicitarEliminarArticulo(id) {
    setArticuloEliminar(id);
    setModalVisible(true);
    setMenuAbierto(null);
  }

  async function confirmarEliminarArticulo() {
    if (!articuloEliminar) return;

    const { error } = await supabase
      .from("articulos")
      .delete()
      .eq("id", articuloEliminar);

    if (error) {
      mostrarToast(error.message, "error");
      return;
    }

    setModalVisible(false);
    setArticuloEliminar(null);

    mostrarToast("Artículo eliminado", "ok");
    obtenerArticulos();
  }

  function esFrecuente(articulo) {
    return Boolean(articulo.frecuente) || (Number(articulo.usado_count) || 0) >= 11;
  }

  function esImportadoProveedor(articulo) {
    return Boolean(articulo.importado_proveedor);
  }

  function precioCostoArticulo(articulo) {
    return Number(articulo.precio_costo ?? articulo.costo ?? 0) || 0;
  }

  function precioFinalArticulo(articulo) {
    return Number(articulo.precio_final ?? articulo.precio ?? 0) || 0;
  }

  function IconoImportadoProveedor() {
    return (
      <span
        title="Importado proveedor"
        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-500 text-white text-lg font-black leading-none shrink-0"
      >
        ↪
      </span>
    );
  }

  function normalizarSku(sku) {
    return `${sku || ""}`.trim().toUpperCase();
  }

  function normalizarPrecio(precioTexto) {
    return Number(`${precioTexto || ""}`.replace(/\$/g, "").replace(/\./g, "").replace(/,/g, ".")) || 0;
  }

  function obtenerTipoMaterial() {
    return (
      tipos.find((tipo) =>
        `${tipo.nombre || ""}`.toLowerCase().includes("material")
      ) || null
    );
  }
  function iniciarImportacion(tipo) {
    setTipoImportacion(tipo);
    setPreviewImportacion([]);
    setCategoriaImportacionId("");
    setMostrarPreviewImportacion(false);
    setMenuImportarAbierto(false);

    setTimeout(() => {
      inputPdfRef.current?.click();
    }, 50);
  }

  async function leerTextoPdf(archivo) {
    const buffer = await archivo.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: buffer,
    }).promise;

    let textoCompleto = "";

    for (let numeroPagina = 1; numeroPagina <= pdf.numPages; numeroPagina++) {
      const pagina = await pdf.getPage(numeroPagina);
      const contenido = await pagina.getTextContent();

      const items = contenido.items
        .map((item) => ({
          texto: item.str,
          x: item.transform[4],
          y: item.transform[5],
        }))
        .filter((item) => item.texto && item.texto.trim());

      const lineas = [];

      items.forEach((item) => {
        const lineaExistente = lineas.find(
          (linea) => Math.abs(linea.y - item.y) < 4
        );

        if (lineaExistente) {
          lineaExistente.items.push(item);
        } else {
          lineas.push({
            y: item.y,
            items: [item],
          });
        }
      });

      const textoPagina = lineas
        .sort((a, b) => b.y - a.y)
        .map((linea) =>
          linea.items
            .sort((a, b) => a.x - b.x)
            .map((item) => item.texto)
            .join(" ")
        )
        .join("\n");

      textoCompleto += `\n${textoPagina}`;
    }

    return textoCompleto;
  }

  function parsearPdfIntegra(textoPdf, modo) {
    const lineas = `${textoPdf || ""}`
      .split("\n")
      .map((linea) => linea.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    const filas = [];
    let filaActual = null;
    let dentroTabla = false;

    lineas.forEach((linea) => {
      const textoMin = linea.toLowerCase();

      if (
        textoMin.includes("cant") &&
        textoMin.includes("sku") &&
        textoMin.includes("producto")
      ) {
        dentroTabla = true;
        return;
      }

      if (/^Total:/i.test(linea)) {
        if (filaActual) {
          filas.push(filaActual.trim());
          filaActual = null;
        }

        dentroTabla = false;
        return;
      }

      if (!dentroTabla) return;

      if (/^\d+(?:[.,]\d+)?\s+/.test(linea)) {
        if (filaActual) {
          filas.push(filaActual.trim());
        }

        filaActual = linea;
      } else if (filaActual) {
        filaActual += ` ${linea}`;
      }
    });

    if (filaActual) {
      filas.push(filaActual.trim());
    }

    function separarSkuYDetalle(resto) {
      const texto = `${resto || ""}`.replace(/\s+/g, " ").trim();

      const matchPack = texto.match(
        /^(PACK\s+10\s+TAGS\s+MIFARE\s+BLANCO)\s+(.+)$/i
      );

      if (matchPack) {
        return {
          sku: matchPack[1],
          detalle: matchPack[2],
        };
      }

      const palabras = texto.split(" ").filter(Boolean);

      const iniciosProducto = [
        "portero",
        "monitor",
        "switch",
        "dvr",
        "camara",
        "cámara",
        "par",
        "fuente",
        "zapatilla",
        "disco",
        "central",
        "lector",
        "bateria",
        "batería",
        "cerradura",
        "herraje",
        "soporte",
        "kit",
        "sensor",
        "modulo",
        "módulo",
        "control",
        "teclado",
        "detector",
        "sirena",
        "balun",
        "cable",
        "gabinete",
      ];

      const posiblesCortes = [];

      palabras.forEach((palabra, index) => {
        if (index === 0) return;

        const desdeAca = palabras.slice(index).join(" ").toLowerCase();

        if (
          iniciosProducto.some((inicio) =>
            desdeAca.startsWith(`${inicio} `)
          )
        ) {
          posiblesCortes.push(index);
        }
      });

      if (posiblesCortes.length > 0) {
        const corte = posiblesCortes[0];

        return {
          sku: palabras.slice(0, corte).join(" "),
          detalle: palabras.slice(corte).join(" "),
        };
      }

      // Fallback conservador: evita poner toda la descripción larga como SKU.
      // Toma hasta 4 palabras como código corto y deja el resto como detalle.
      const corteFallback = Math.min(4, Math.max(1, palabras.length - 1));

      return {
        sku: palabras.slice(0, corteFallback).join(" "),
        detalle: palabras.slice(corteFallback).join(" "),
      };
    }

    return filas
      .map((fila) => {
        const preciosTexto = fila.match(/\$\s*[\d.]+(?:,\d+)?/g) || [];

        if (preciosTexto.length === 0) return null;

        const precios = preciosTexto
          .map((precioTexto) => normalizarPrecio(precioTexto))
          .filter((precio) => precio > 0);

        if (precios.length === 0) return null;

        const sinPrecios = fila
          .replace(/\$\s*[\d.]+(?:,\d+)?/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        const matchBase = sinPrecios.match(/^(\d+(?:[.,]\d+)?)\s+(.+)$/);

        if (!matchBase) return null;

        const cantidad =
          Number(`${matchBase[1] || "1"}`.replace(",", ".")) || 1;
        const resto = matchBase[2];

        const { sku, detalle } = separarSkuYDetalle(resto);

        const precioElegido =
          modo === "gremio" && precios.length >= 2
            ? precios[1]
            : precios[0];

        return {
          cantidad,
          sku: normalizarSku(sku),
          descripcion: sku.trim(),
          detalle: `${detalle || ""}`.trim(),
          precio: precioElegido,
        };
      })
      .filter(
        (item) =>
          item &&
          item.sku &&
          item.descripcion &&
          item.detalle &&
          item.precio > 0
      );
  }

  function detectarCategoriaInicial(item, existente) {
    if (existente?.categoria_id) {
      return existente.categoria_id;
    }

    const texto = `${item.sku || ""} ${item.descripcion || ""}`.toLowerCase();

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
      return buscarCategoria(["acceso", "control"])?.id || "";
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
        ""
      );
    }

    return "";
  }

  function actualizarCategoriaPreview(index, categoriaIdNueva) {
    setPreviewImportacion((actual) =>
      actual.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              categoria_id: categoriaIdNueva,
            }
          : item
      )
    );
  }

  function actualizarCampoPreview(index, campo, valor) {
    setPreviewImportacion((actual) =>
      actual.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [campo]: valor,
              ...(campo === "sku"
                ? {
                    sku: normalizarSku(valor),
                    descripcion: valor,
                  }
                : {}),
            }
          : item
      )
    );
  }


  async function procesarArchivoPdf(evento) {
    const archivo = evento.target.files?.[0];

    evento.target.value = "";

    if (!archivo || !tipoImportacion) return;

    setProcesandoPdf(true);

    try {
      const textoPdf = await leerTextoPdf(archivo);
      const itemsDetectados = parsearPdfIntegra(textoPdf, tipoImportacion);

      if (itemsDetectados.length === 0) {
        mostrarToast("No se detectaron artículos en el PDF", "error");
        return;
      }

      const preview = itemsDetectados.map((item) => {
        const existente = articulos.find(
          (articulo) => normalizarSku(articulo.sku) === item.sku
        );

        return {
          ...item,
          existe: Boolean(existente),
          articuloId: existente?.id || null,
          categoria_id: detectarCategoriaInicial(item, existente),
          precioActualCosto: precioCostoArticulo(existente || {}),
          precioActualFinal: precioFinalArticulo(existente || {}),
        };
      });

      setPreviewImportacion(preview);
      setMostrarPreviewImportacion(true);
      mostrarToast("PDF leído correctamente", "ok");
    } catch (error) {
      console.error(error);
      mostrarToast("No se pudo leer el PDF", "error");
    } finally {
      setProcesandoPdf(false);
    }
  }

  async function confirmarImportacionPdf() {
    if (previewImportacion.length === 0) {
      mostrarToast("No hay artículos para importar", "error");
      return;
    }

    const faltanCategorias = previewImportacion.some(
      (item) => !item.categoria_id
    );

    if (faltanCategorias) {
      mostrarToast("Seleccioná categoría en todos los artículos", "error");
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
    const origen = tipoImportacion === "gremio" ? "PDF gremio" : "PDF final";

    try {
      for (const item of previewImportacion) {
        const categoriaSeleccionada = categorias.find(
          (categoria) => categoria.id === item.categoria_id
        );

        const datosBase = {
          sku: item.sku,
          descripcion: item.descripcion,
          detalle: item.detalle || "",
          proveedor: "Integra",
          moneda: "ARS",
          categoria_id: item.categoria_id || null,
          categoria: categoriaSeleccionada?.nombre || "",
          tipo_id: tipoMaterial?.id || null,
          tipo: tipoMaterial?.nombre || "Material",
          frecuente: true,
          importado_proveedor: true,
          origen_pdf: origen,
          usado_count: 11,
        };

        if (tipoImportacion === "gremio") {
          datosBase.precio_costo = item.precio;
          datosBase.costo = item.precio;
        }

        if (tipoImportacion === "final") {
          datosBase.precio_final = item.precio;
          datosBase.precio = item.precio;
        }

        if (item.existe && item.articuloId) {
          const { error } = await supabase
            .from("articulos")
            .update(datosBase)
            .eq("id", item.articuloId);

          if (error) throw error;
        } else {
          const { error } = await supabase.from("articulos").insert([
            {
              ...datosBase,
              user_id: user.id,
              cargado_por: user.id,
              cargado_por_alias: alias,
              precio_costo:
                tipoImportacion === "gremio" ? item.precio : 0,
              costo:
                tipoImportacion === "gremio" ? item.precio : 0,
              precio_final:
                tipoImportacion === "final" ? item.precio : 0,
              precio:
                tipoImportacion === "final" ? item.precio : 0,
            },
          ]);

          if (error) throw error;
        }
      }

      mostrarToast("Importación completada", "ok");
      setMostrarPreviewImportacion(false);
      setPreviewImportacion([]);
      setTipoImportacion(null);
      obtenerArticulos();
    } catch (error) {
      console.error(error);
      mostrarToast(error.message || "Error al importar artículos", "error");
    }
  }

  function detalleCorto(texto) {
    if (!texto) return "";
    if (texto.length <= 140) return texto;
    return `${texto.slice(0, 140)}...`;
  }

  const articulosFiltrados = articulos
    .filter((articulo) => {
      const categoriaTexto = nombreCategoria(articulo);
      const tipoTexto = nombreTipo(articulo);

      const texto = `
        ${articulo.descripcion || ""}
        ${articulo.detalle || ""}
        ${categoriaTexto || ""}
        ${tipoTexto || ""}
        ${articulo.proveedor || ""}
        ${articulo.origen_pdf || ""}
        ${articulo.cargado_por_alias || ""}
      `.toLowerCase();

      const coincideBusqueda = texto.includes(busqueda.toLowerCase());

      const coincideCategoria =
        filtroCategoria === "Todas"
          ? true
          : categoriaTexto.toLowerCase() === filtroCategoria.toLowerCase();

      const coincideTipo =
        filtroTipo === "Todos"
          ? true
          : tipoTexto.toLowerCase() === filtroTipo.toLowerCase();

      return coincideBusqueda && coincideCategoria && coincideTipo;
    })
    .sort((a, b) => {
      const usoA = Number(a.usado_count) || 0;
      const usoB = Number(b.usado_count) || 0;

      if (usoB !== usoA) return usoB - usoA;

      return (a.descripcion || "").localeCompare(b.descripcion || "");
    });

  return (
    <>
      <ConfirmModal
        visible={modalVisible}
        titulo="Eliminar artículo"
        mensaje="Esta acción eliminará el artículo definitivamente."
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        onCancelar={() => {
          setModalVisible(false);
          setArticuloEliminar(null);
        }}
        onConfirmar={confirmarEliminarArticulo}
      />

      <Toast mensaje={toastMensaje} tipo={toastTipo} visible={toastVisible} />

      <input
        ref={inputPdfRef}
        type="file"
        accept="application/pdf"
        onChange={procesarArchivoPdf}
        className="hidden"
      />

      {(menuAbierto || menuConfigAbierto || menuImportarAbierto) && (
        <div
          onClick={() => {
            setMenuAbierto(null);
            setMenuConfigAbierto(false);
            setMenuImportarAbierto(false);
            setMenuImportarAbierto(false);
          }}
          className="fixed inset-0 z-40 bg-transparent"
        />
      )}
      {mostrarPreviewImportacion && (
        <div className="fixed inset-0 z-[95] bg-black/80 p-4 flex items-center justify-center">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 md:p-6 w-full max-w-5xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-start gap-4 mb-5">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-orange-500">
                  Preview importación {tipoImportacion === "gremio" ? "gremio" : "final"}
                </h2>

                <p className="text-zinc-500 mt-1">
                  Revisá los artículos antes de guardar.
                </p>
              </div>

              <button
                onClick={() => {
                  setMostrarPreviewImportacion(false);
                  setPreviewImportacion([]);
                }}
                className="bg-zinc-800 hover:bg-zinc-700 w-11 h-11 rounded-2xl font-black"
              >
                ✕
              </button>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
              <p className="text-zinc-300 font-bold">
                Categoría individual por artículo
              </p>

              <p className="text-zinc-500 text-sm mt-2">
                Seleccioná la categoría en cada fila. Tipo automático: Material.
                Proveedor: Integra. Los importados quedan marcados como frecuentes.
              </p>
            </div>

            <div className="space-y-2">
              {previewImportacion.map((item, index) => (
                <div
                  key={`${item.sku}-${index}`}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-[180px_1fr_150px_220px_120px] gap-3 md:items-start"
                >
                  <div>
                    <p className="text-zinc-500 text-xs mb-1">SKU</p>

                    <input
                      type="text"
                      value={item.sku || ""}
                      onChange={(e) =>
                        actualizarCampoPreview(index, "sku", e.target.value)
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm font-bold"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-zinc-500 text-xs mb-1">Producto / detalle</p>

                    <textarea
                      value={item.detalle || ""}
                      onChange={(e) =>
                        actualizarCampoPreview(index, "detalle", e.target.value)
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm min-h-20"
                    />
                  </div>

                  <div>
                    <p className="text-zinc-500 text-xs mb-1">
                      {tipoImportacion === "gremio" ? "Costo gremio" : "Precio final"}
                    </p>

                    <input
                      type="number"
                      value={item.precio || 0}
                      onChange={(e) =>
                        actualizarCampoPreview(index, "precio", Number(e.target.value) || 0)
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm font-black text-green-400"
                    />
                  </div>

                  <div>
                    <p className="text-zinc-500 text-xs mb-1">Categoría</p>

                    <select
                      value={item.categoria_id || ""}
                      onChange={(e) =>
                        actualizarCategoriaPreview(index, e.target.value)
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm"
                    >
                      <option value="">Seleccionar</option>

                      {categorias.map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span
                      className={
                        item.existe
                          ? "inline-block bg-blue-500/20 text-blue-300 px-3 py-2 rounded-xl text-sm font-bold"
                          : "inline-block bg-green-500/20 text-green-300 px-3 py-2 rounded-xl text-sm font-bold"
                      }
                    >
                      {item.existe ? "Actualizar" : "Nuevo"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={confirmarImportacionPdf}
                className="bg-orange-500 hover:bg-orange-600 px-6 py-4 rounded-2xl font-bold"
              >
                Importar {previewImportacion.length} artículos
              </button>

              <button
                onClick={() => {
                  setMostrarPreviewImportacion(false);
                  setPreviewImportacion([]);
                }}
                className="bg-zinc-700 hover:bg-zinc-600 px-6 py-4 rounded-2xl font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {articuloVer && (
        <div className="fixed inset-0 z-[90] bg-black/80 p-4 flex items-center justify-center">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-start gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-black text-orange-500">
                  {articuloVer.descripcion}
                </h2>

                <p className="text-zinc-500 mt-2">
                  Detalle completo del artículo
                </p>
              </div>

              <button
                onClick={() => setArticuloVer(null)}
                className="bg-zinc-800 hover:bg-zinc-700 w-12 h-12 rounded-2xl font-black"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-900 rounded-2xl p-4">
                <p className="text-zinc-500 text-sm">Categoría</p>
                <p className="font-bold mt-1">{nombreCategoria(articuloVer)}</p>
              </div>

              <div className="bg-zinc-900 rounded-2xl p-4">
                <p className="text-zinc-500 text-sm">Tipo</p>
                <p className="font-bold mt-1">{nombreTipo(articuloVer)}</p>
              </div>

              <div className="bg-zinc-900 rounded-2xl p-4">
                <p className="text-zinc-500 text-sm">Proveedor</p>
                <p className="font-bold mt-1">{articuloVer.proveedor || "-"}</p>
              </div>

              <div className="bg-zinc-900 rounded-2xl p-4">
                <p className="text-zinc-500 text-sm">Estado</p>
                <div className="flex items-center gap-2 mt-2">
                  {esFrecuente(articuloVer) && (
                    <span title="Artículo frecuente" className="text-2xl">
                      🔥
                    </span>
                  )}

                  {esImportadoProveedor(articuloVer) && <IconoImportadoProveedor />}

                  {!esFrecuente(articuloVer) && !esImportadoProveedor(articuloVer) && (
                    <span className="text-zinc-500">Manual</span>
                  )}
                </div>
              </div>

              <div className="bg-zinc-900 rounded-2xl p-4">
                <p className="text-zinc-500 text-sm">Costo gremio</p>
                <p className="font-bold mt-1 text-red-400">
                  {articuloVer.moneda === "USD" ? "USD $" : "$"}
                  {precioCostoArticulo(articuloVer).toLocaleString()}
                </p>
              </div>

              <div className="bg-zinc-900 rounded-2xl p-4">
                <p className="text-zinc-500 text-sm">Precio final</p>
                <p className="font-black text-green-400 text-2xl mt-1">
                  {articuloVer.moneda === "USD" ? "USD $" : "$"}
                  {precioFinalArticulo(articuloVer).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-4 mt-4">
              <p className="text-zinc-500 text-sm mb-2">Descripción larga</p>

              <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {articuloVer.detalle || "-"}
              </p>
            </div>

            {articuloVer.origen_pdf && (
              <p className="text-zinc-500 text-sm mt-5">
                Origen PDF: {articuloVer.origen_pdf}
              </p>
            )}

            <p className="text-zinc-500 text-sm mt-2">
              Cargado por: {articuloVer.cargado_por_alias || "Administrador"}
            </p>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-black text-white p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-5 mb-8">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-orange-500">
                  Artículos
                </h1>

                <p className="text-zinc-400 mt-3">Biblioteca profesional</p>
              </div>

              <div className="relative flex gap-3 shrink-0">
                <div className="relative">
                  <button
                    onClick={() => setMenuImportarAbierto(!menuImportarAbierto)}
                    disabled={procesandoPdf}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 px-5 py-3 rounded-xl font-bold"
                  >
                    {procesandoPdf ? "Leyendo..." : "Importar ▾"}
                  </button>

                  {menuImportarAbierto && (
                    <div className="absolute right-0 top-14 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden z-50 min-w-52 shadow-2xl">
                      <button
                        onClick={() => iniciarImportacion("gremio")}
                        className="w-full text-left px-5 py-4 hover:bg-zinc-800 font-bold"
                      >
                        📥 Importar gremio
                      </button>

                      <button
                        onClick={() => iniciarImportacion("final")}
                        className="w-full text-left px-5 py-4 hover:bg-zinc-800 font-bold"
                      >
                        📥 Importar final
                      </button>
                    </div>
                  )}
                </div>

                <Link
                  to="/"
                  className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-xl font-bold"
                >
                  Volver
                </Link>

                <button
                  onClick={() => setMenuConfigAbierto(!menuConfigAbierto)}
                  className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-xl font-black text-2xl leading-none"
                >
                  ⋮
                </button>

                {menuConfigAbierto && (
                  <div className="absolute right-0 top-14 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden z-50 min-w-48 shadow-2xl">
                    <Link
                      to="/config/categorias"
                      className="block px-5 py-4 hover:bg-zinc-800 font-bold"
                    >
                      Categorías
                    </Link>

                    <Link
                      to="/config/tipos"
                      className="block px-5 py-4 hover:bg-zinc-800 font-bold"
                    >
                      Tipos
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div ref={formularioRef} className="mb-6">
            {!mostrarFormulario ? (
              <button
                onClick={() => setMostrarFormulario(true)}
                className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl p-4 transition-all"
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-2xl font-black">
                    +
                  </div>

                  <p className="text-lg font-black text-white">
                    Agregar artículo
                  </p>
                </div>
              </button>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-black text-orange-500">
                      {editandoId ? "Editar artículo" : "Nuevo artículo"}
                    </h2>

                    <p className="text-zinc-500 mt-1">
                      Completar información del artículo
                    </p>
                  </div>

                  <button
                    onClick={limpiarFormulario}
                    className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-2xl font-bold"
                  >
                    Cerrar
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <input
                    type="text"
                    placeholder="Descripción corta"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                  />

                  <select
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                  >
                    <option value="">Seleccionar categoría</option>

                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>

                  <select
                    value={tipoId}
                    onChange={(e) => setTipoId(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                  >
                    <option value="">Seleccionar tipo</option>

                    {tipos.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.nombre}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Proveedor"
                    value={proveedor}
                    onChange={(e) => setProveedor(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                  />

                  <input
                    type="number"
                    placeholder="Costo gremio"
                    value={precioCosto}
                    onChange={(e) => setPrecioCosto(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                  />

                  <input
                    type="number"
                    placeholder="Precio final"
                    value={precioFinal}
                    onChange={(e) => setPrecioFinal(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                  />

                  <select
                    value={moneda}
                    onChange={(e) => setMoneda(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                  >
                    <option value="ARS">ARS $</option>
                    <option value="USD">USD $</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Origen PDF / proveedor"
                    value={origenPdf}
                    onChange={(e) => setOrigenPdf(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                  />

                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3">
                    <label className="flex items-center gap-3 font-bold">
                      <input
                        type="checkbox"
                        checked={frecuente}
                        onChange={(e) => setFrecuente(e.target.checked)}
                        className="w-5 h-5"
                      />
                      🔥 Frecuente
                    </label>

                    <label className="flex items-center gap-3 font-bold">
                      <input
                        type="checkbox"
                        checked={importadoProveedor}
                        onChange={(e) => setImportadoProveedor(e.target.checked)}
                        className="w-5 h-5"
                      />
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white font-black">
                          ↪
                        </span>
                        Importado proveedor
                      </span>
                    </label>
                  </div>

                  <textarea
                    placeholder="Descripción larga / detalle"
                    value={detalle}
                    onChange={(e) => setDetalle(e.target.value)}
                    className="md:col-span-2 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 min-h-28"
                  />
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={guardarArticulo}
                    className="bg-orange-500 hover:bg-orange-600 px-6 py-4 rounded-2xl font-bold"
                  >
                    {editandoId ? "Actualizar" : "Guardar"}
                  </button>

                  <button
                    onClick={limpiarFormulario}
                    className="bg-zinc-700 hover:bg-zinc-600 px-6 py-4 rounded-2xl font-bold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-6">
            <div className="flex gap-3">
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className="bg-zinc-800 hover:bg-zinc-700 px-5 rounded-2xl text-2xl"
              >
                🔍
              </button>

              <input
                type="text"
                placeholder="Buscar artículos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
              />
            </div>

            {mostrarFiltros && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                >
                  <option>Todas</option>

                  {categorias.map((categoria) => (
                    <option key={categoria.id}>{categoria.nombre}</option>
                  ))}
                </select>

                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                >
                  <option>Todos</option>

                  {tipos.map((tipo) => (
                    <option key={tipo.id}>{tipo.nombre}</option>
                  ))}
                </select>

                <button
                  onClick={limpiarFiltros}
                  className="bg-orange-500 hover:bg-orange-600 rounded-2xl p-4 font-bold"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {articulosFiltrados.map((articulo) => (
              <div
                key={articulo.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 md:p-5"
              >
                <div className="flex justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-lg md:text-xl font-bold truncate">
                        {articulo.descripcion}
                      </p>

                      {esFrecuente(articulo) && (
                        <span title="Artículo frecuente" className="text-xl shrink-0">
                          🔥
                        </span>
                      )}

                      {esImportadoProveedor(articulo) && (
                        <IconoImportadoProveedor />
                      )}
                    </div>

                    {articulo.detalle && (
                      <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                        {detalleCorto(articulo.detalle)}
                      </p>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_180px_180px] gap-2 mt-3 items-stretch">
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
                        <p className="text-zinc-500 text-xs">Categoría</p>
                        <p className="text-white font-bold truncate">
                          {nombreCategoria(articulo)}
                        </p>
                      </div>

                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
                        <p className="text-zinc-500 text-xs">Tipo</p>
                        <p className="text-white font-bold truncate">
                          {nombreTipo(articulo)}
                        </p>
                      </div>

                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
                        <p className="text-zinc-500 text-xs">Costo gremio</p>
                        <p className="text-red-400 font-bold">
                          {articulo.moneda === "USD" ? "USD $" : "$"}
                          {precioCostoArticulo(articulo).toLocaleString()}
                        </p>
                      </div>

                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
                        <p className="text-zinc-500 text-xs">Precio final</p>
                        <p className="text-green-400 font-black">
                          {articulo.moneda === "USD" ? "USD $" : "$"}
                          {precioFinalArticulo(articulo).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative shrink-0">
                    <button
                      onClick={() =>
                        setMenuAbierto(
                          menuAbierto === articulo.id ? null : articulo.id
                        )
                      }
                      className="w-12 h-12 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-3xl font-black"
                    >
                      ⋮
                    </button>

                    {menuAbierto === articulo.id && (
                      <div className="absolute right-0 top-14 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden z-50 min-w-44 shadow-2xl">
                        <button
                          onClick={() => {
                            setArticuloVer(articulo);
                            setMenuAbierto(null);
                          }}
                          className="w-full text-left px-5 py-4 hover:bg-zinc-800 font-bold"
                        >
                          Ver
                        </button>

                        <button
                          onClick={() => editarArticulo(articulo)}
                          className="w-full text-left px-5 py-4 hover:bg-zinc-800 font-bold"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => solicitarEliminarArticulo(articulo.id)}
                          className="w-full text-left px-5 py-4 hover:bg-red-500/20 text-red-400 font-bold"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {articulosFiltrados.length === 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center text-zinc-500">
                No hay artículos encontrados.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}