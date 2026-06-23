import React from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { FilePicker } from "@capawesome/capacitor-file-picker";
import * as XLSX from "xlsx";
import { supabase } from "../lib/supabase";

const SharedFile = registerPlugin("SharedFile");
const TIPOS_IMPORTACION = [
  "text/csv",
  "text/comma-separated-values",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const estadoImportacionPorContexto = new Map();

function obtenerEstadoPersistido(contexto) {
  return (
    estadoImportacionPorContexto.get(contexto) || {
      preview: [],
      mostrarPreview: false,
    }
  );
}

function persistirEstadoImportacion(contexto, estado) {
  estadoImportacionPorContexto.set(contexto, {
    ...obtenerEstadoPersistido(contexto),
    ...estado,
  });
}

function normalizarSku(sku) {
  return `${sku || ""}`.trim().toUpperCase();
}

function normalizarNumero(valor) {
  const texto = `${valor || ""}`.replace(/\$/g, "").replace(/\s/g, "").trim();

  if (!texto) return 0;
  if (texto.includes(",") && texto.includes(".")) {
    return Number(texto.replace(/\./g, "").replace(/,/g, ".")) || 0;
  }
  if (texto.includes(",")) return Number(texto.replace(/,/g, ".")) || 0;

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
        i += 1;
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
      if (char === "\r" && siguiente === "\n") i += 1;
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
  const filas = parsearCsvBasico(`${texto || ""}`.replace(/^\uFEFF/, ""));

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

    articulos.push({
      cantidad,
      sku,
      descripcion: sku,
      detalle: buffer.slice(2, -2).join(" ").replace(/\s+/g, " ").trim(),
      costo_gremio: normalizarNumero(costoTexto),
      precio_publico: normalizarNumero(precioTexto),
    });

    buffer = [];
    return true;
  }

  for (let i = 1; i < filas.length; i++) {
    const fila = filas[i].map((campo) => `${campo || ""}`.trim());
    const empiezaNuevoArticulo =
      esNumeroValido(fila[0]) && normalizarNumero(fila[0]) > 0 && Boolean(fila[1]);

    if (empiezaNuevoArticulo && buffer.length > 0) intentarCerrarBuffer();
    buffer = buffer.length === 0 ? [...fila] : [...buffer, ...(fila[0] === "" ? fila.slice(1) : fila)];
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

function convertirFilaAArticulo(fila) {
  if (!fila || fila.length < 5) return null;

  const cantidad = normalizarNumero(fila[0]);
  const sku = normalizarSku(fila[1]);
  const costoTexto = fila[fila.length - 2];
  const precioTexto = fila[fila.length - 1];

  if (!cantidad || !sku) return null;
  if (!esNumeroValido(costoTexto) || !esNumeroValido(precioTexto)) return null;

  return {
    cantidad,
    sku,
    descripcion: sku,
    detalle: fila.slice(2, -2).join(" ").replace(/\s+/g, " ").trim(),
    costo_gremio: normalizarNumero(costoTexto),
    precio_publico: normalizarNumero(precioTexto),
  };
}

async function leerXlsx(archivo) {
  const buffer = await archivo.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];

  if (!primeraHoja) return [];

  const filas = XLSX.utils.sheet_to_json(primeraHoja, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  return filas
    .map((fila) => fila.map((campo) => `${campo || ""}`.trim()))
    .filter((fila) => fila.some((campo) => campo !== ""))
    .filter((fila, index) => {
      if (index !== 0) return true;

      const textoHeader = fila.join(" ").toLowerCase();
      return !(textoHeader.includes("cantidad") && textoHeader.includes("sku"));
    })
    .map(convertirFilaAArticulo)
    .filter(Boolean);
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
    return buscarCategoria(["acceso", "control"])?.id || "";
  }

  if (
    texto.includes("bateria") ||
    texto.includes("batería") ||
    texto.includes("baterÃ­a") ||
    texto.includes("soporte") ||
    texto.includes("fuente") ||
    texto.includes("gabinete") ||
    texto.includes("tag")
  ) {
    return (
      buscarCategoria(["accesorio", "generico", "genérico", "genÃ©rico", "varios"])
        ?.id || ""
    );
  }

  return "";
}

function esArchivoImportacionSoportado(nombre) {
  const nombreNormalizado = `${nombre || ""}`.toLowerCase();
  return nombreNormalizado.endsWith(".csv") || nombreNormalizado.endsWith(".xlsx");
}

function normalizarBase64(dataBase64) {
  return `${dataBase64 || ""}`.replace(/^data:.*;base64,/, "");
}

function convertirBase64AArchivo(fileName, dataBase64, mimeType = "") {
  const base64Normalizado = normalizarBase64(dataBase64);
  const byteString = atob(base64Normalizado);
  const bytes = new Uint8Array(byteString.length);

  for (let i = 0; i < byteString.length; i++) {
    bytes[i] = byteString.charCodeAt(i);
  }

  return new File([bytes], fileName, { type: mimeType });
}

async function convertirPickedFileAArchivo(archivoElegido) {
  console.info("[ImportadorUniversal] Convirtiendo archivo de FilePicker", {
    nombre: archivoElegido?.name || null,
    mimeType: archivoElegido?.mimeType || null,
    size: archivoElegido?.size || 0,
    path: archivoElegido?.path || null,
    tieneData: Boolean(archivoElegido?.data),
    dataLength: archivoElegido?.data?.length || 0,
    tieneBlob: Boolean(archivoElegido?.blob),
  });

  if (!archivoElegido?.name || !esArchivoImportacionSoportado(archivoElegido.name)) {
    console.warn("[ImportadorUniversal] Archivo no soportado desde FilePicker", {
      nombre: archivoElegido?.name || null,
    });
    return null;
  }

  if (archivoElegido.path) {
    try {
      console.info("[ImportadorUniversal] Intentando fetch(path)", {
        path: archivoElegido.path,
      });

      const respuesta = await fetch(archivoElegido.path);
      console.info("[ImportadorUniversal] Resultado fetch(path)", {
        ok: respuesta.ok,
        status: respuesta.status,
        type: respuesta.type,
      });

      const blob = await respuesta.blob();
      console.info("[ImportadorUniversal] Blob desde fetch(path)", {
        size: blob.size,
        type: blob.type,
      });

      if (blob.size > 0) {
        const archivo = new File([blob], archivoElegido.name, {
          type: archivoElegido.mimeType || blob.type || "",
        });

        console.info("[ImportadorUniversal] File creado desde fetch(path)", {
          name: archivo.name,
          size: archivo.size,
          type: archivo.type,
        });

        return archivo;
      }
    } catch (error) {
      console.warn("[ImportadorUniversal] fetch(path) fallo", {
        path: archivoElegido.path,
        error,
      });
    }
  }

  if (archivoElegido.blob) {
    console.info("[ImportadorUniversal] Usando blob devuelto por FilePicker", {
      size: archivoElegido.blob.size,
      type: archivoElegido.blob.type,
    });

    const archivo = new File([archivoElegido.blob], archivoElegido.name, {
      type: archivoElegido.mimeType || "",
    });

    console.info("[ImportadorUniversal] File creado desde blob", {
      name: archivo.name,
      size: archivo.size,
      type: archivo.type,
    });

    return archivo;
  }

  if (archivoElegido.data) {
    console.info("[ImportadorUniversal] Usando data base64 de FilePicker", {
      dataLength: archivoElegido.data.length,
    });

    const archivo = convertirBase64AArchivo(
      archivoElegido.name,
      archivoElegido.data,
      archivoElegido.mimeType || ""
    );

    console.info("[ImportadorUniversal] File creado desde data base64", {
      name: archivo.name,
      size: archivo.size,
      type: archivo.type,
    });

    return archivo;
  }

  console.warn("[ImportadorUniversal] FilePicker no devolvio bytes utilizables");
  return null;
}

const ImportadorUniversal = React.forwardRef(function ImportadorUniversal(
  {
    contexto = "articulos",
    articulos = [],
    categorias = [],
    tipos = [],
    setItems,
    obtenerArticulos,
    mostrarToast,
    mostrarBoton = false,
    autoImportarCompartido = true,
  },
  ref
) {
  const inputCsvRef = React.useRef(null);
  const [menuAbierto, setMenuAbierto] = React.useState(false);
  const [procesando, setProcesando] = React.useState(false);
  const [preview, setPreview] = React.useState(
    () => obtenerEstadoPersistido(contexto).preview
  );
  const [mostrarPreview, setMostrarPreview] = React.useState(
    () => obtenerEstadoPersistido(contexto).mostrarPreview
  );
  const esPresupuesto = contexto === "presupuesto";

  React.useEffect(() => {
    console.info("[ImportadorUniversal] Montado", { contexto });

    return () => {
      console.warn("[ImportadorUniversal] Desmontado", { contexto });
    };
  }, [contexto]);

  React.useEffect(() => {
    const estadoPersistido = obtenerEstadoPersistido(contexto);

    if (estadoPersistido.mostrarPreview || estadoPersistido.preview.length > 0) {
      console.info("[ImportadorUniversal] Restaurando estado persistido", {
        contexto,
        mostrarPreview: estadoPersistido.mostrarPreview,
        previewLength: estadoPersistido.preview.length,
      });

      setPreview(estadoPersistido.preview);
      setMostrarPreview(estadoPersistido.mostrarPreview);
    }
  }, [contexto]);

  React.useEffect(() => {
    console.info("[ImportadorUniversal] Estado preview", {
      contexto,
      mostrarPreview,
      previewLength: preview.length,
    });
  }, [contexto, mostrarPreview, preview.length]);

  React.useImperativeHandle(ref, () => ({
    abrir() {
      iniciarImportacionCsv();
    },
    importarArchivo(archivo) {
      procesarArchivoImportacion(archivo);
    },
  }));

  React.useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!autoImportarCompartido) return;

    let cancelado = false;

    async function importarPendiente() {
      const archivoCompartido = await obtenerArchivoCompartido();

      if (!cancelado && archivoCompartido) {
        await procesarArchivoImportacion(archivoCompartido, {
          limpiarArchivoCompartido: true,
        });
      }
    }

    function recibirArchivoCompartido() {
      importarPendiente();
    }

    importarPendiente();
    window.addEventListener("mchImportarArchivoCompartido", recibirArchivoCompartido);

    return () => {
      cancelado = true;
      window.removeEventListener(
        "mchImportarArchivoCompartido",
        recibirArchivoCompartido
      );
    };
  }, [articulos, categorias, autoImportarCompartido]);

  function avisar(mensaje, tipo = "ok") {
    mostrarToast?.(mensaje, tipo);
  }

  function obtenerTipoMaterial() {
    return (
      tipos.find((tipo) =>
        `${tipo.nombre || ""}`.toLowerCase().includes("material")
      ) || null
    );
  }

  async function iniciarImportacionCsv() {
    if (procesando) return;
    limpiarPreview("iniciarImportacionCsv");
    setMenuAbierto(false);

    if (Capacitor.isNativePlatform()) {
      await abrirSelectorNativo();
      return;
    }

    const input = inputCsvRef.current;
    if (!input) {
      console.warn("[ImportadorUniversal] No se encontro el input de archivo");
      return;
    }

    console.info("[ImportadorUniversal] Abriendo selector manual de archivo");

    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
        return;
      } catch (error) {
        console.warn(
          "[ImportadorUniversal] showPicker no disponible, usando click",
          error
        );
      }
    }

    input.click();
  }

  async function abrirSelectorNativo() {
    try {
      console.info("[ImportadorUniversal] Abriendo FilePicker nativo");

      const resultado = await FilePicker.pickFiles({
        types: TIPOS_IMPORTACION,
        limit: 1,
        readData: true,
      });

      console.info("[ImportadorUniversal] Resultado completo FilePicker", resultado);

      const archivoElegido = resultado.files?.[0] || null;

      console.info("[ImportadorUniversal] Resultado FilePicker", {
        nombre: archivoElegido?.name || null,
        tipo: archivoElegido?.mimeType || null,
        tamano: archivoElegido?.size || 0,
        tieneData: Boolean(archivoElegido?.data),
        tieneBlob: Boolean(archivoElegido?.blob),
      });

      const archivo = await convertirPickedFileAArchivo(archivoElegido);

      if (!archivo) {
        avisar("Selecciona un archivo CSV o XLSX", "error");
        return;
      }

      await procesarArchivoImportacion(archivo);
    } catch (error) {
      console.error("[ImportadorUniversal] Error en abrirSelectorNativo", error);
      if (error?.message?.toLowerCase().includes("cancel")) return;
      avisar("No se pudo seleccionar el archivo", "error");
    }
  }

  async function leerArchivoImportacion(archivo) {
    const nombre = `${archivo?.name || ""}`.toLowerCase();

    if (nombre.endsWith(".xlsx")) {
      return {
        origen: "XLSX",
        articulos: await leerXlsx(archivo),
      };
    }

    return {
      origen: "CSV",
      articulos: parsearCsvTolerante(await archivo.text()),
    };
  }

  async function obtenerArchivoCompartido() {
    try {
      const resultado = await SharedFile.getPendingFile();

      if (!resultado?.fileName || !resultado?.dataBase64) return null;

      console.info("[ImportadorUniversal] Archivo desde SharedFilePlugin", {
        fileName: resultado.fileName,
        dataBase64Length: resultado.dataBase64.length,
      });

      const archivo = convertirBase64AArchivo(
        resultado.fileName,
        resultado.dataBase64
      );

      console.info("[ImportadorUniversal] File creado desde SharedFilePlugin", {
        name: archivo.name,
        size: archivo.size,
        type: archivo.type,
      });

      return archivo;
    } catch (error) {
      console.error(error);
      avisar("No se pudo leer el archivo compartido", "error");
      return null;
    }
  }

  async function procesarArchivoCsv(evento) {
    const archivo = evento.target.files?.[0];

    console.info("[ImportadorUniversal] Cambio en selector manual", {
      nombre: archivo?.name || null,
      tipo: archivo?.type || null,
      tamano: archivo?.size || 0,
    });

    if (archivo && !esArchivoImportacionSoportado(archivo.name)) {
      avisar("Selecciona un archivo CSV o XLSX", "error");
      return;
    }

    await procesarArchivoImportacion(archivo);
  }

  async function procesarArchivoImportacion(
    archivo,
    { limpiarArchivoCompartido = false } = {}
  ) {
    if (!archivo || procesando) {
      console.warn("[ImportadorUniversal] Importacion ignorada", {
        tieneArchivo: Boolean(archivo),
        procesando,
      });
      return;
    }

    setProcesando(true);

    try {
      console.info("[ImportadorUniversal] Procesando archivo", archivo.name);
      console.info("[ImportadorUniversal] Entrada procesarArchivoImportacion", {
        name: archivo.name,
        size: archivo.size,
        type: archivo.type,
        limpiarArchivoCompartido,
      });

      const { origen, articulos: articulosImportados } =
        await leerArchivoImportacion(archivo);

      if (articulosImportados.length === 0) {
        avisar(`No se encontraron articulos validos en el ${origen}`, "error");
        return;
      }

      const previewCreado = articulosImportados.map((item) => {
          const existente = articulos.find(
            (articulo) => normalizarSku(articulo.sku) === item.sku
          );

          return {
            ...item,
            existe: Boolean(existente),
            articuloId: existente?.id || null,
            categoria_id: detectarCategoriaInicial(item, categorias, existente),
            origen_importacion: origen,
          };
        });

      console.info("[ImportadorUniversal] Preview creado", {
        contexto,
        origen,
        cantidad: previewCreado.length,
      });

      persistirEstadoImportacion(contexto, {
        preview: previewCreado,
        mostrarPreview: true,
      });
      setPreview(previewCreado);
      console.info("[ImportadorUniversal] Mostrando preview", {
        contexto,
        cantidad: previewCreado.length,
      });
      setMostrarPreview(true);
      avisar(`${origen} leido correctamente`, "ok");

      if (limpiarArchivoCompartido && Capacitor.isNativePlatform()) {
        await SharedFile.clearPendingFile?.();
      }
    } catch (error) {
      console.error(error);
      avisar("No se pudo leer el archivo", "error");
    } finally {
      setProcesando(false);
    }
  }

  function actualizarPreview(index, campo, valor) {
    setPreview((actual) =>
      actual.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        const valorFinal =
          campo === "sku"
            ? normalizarSku(valor)
            : ["cantidad", "costo_gremio", "precio_publico"].includes(campo)
              ? normalizarNumero(valor)
              : valor;

        return {
          ...item,
          [campo]: valorFinal,
          ...(campo === "sku" ? { descripcion: valorFinal } : {}),
        };
      })
    );
  }

  function cerrarPreview() {
    limpiarPreview("cerrarPreview");
  }

  function limpiarPreview(motivo) {
    console.warn("[ImportadorUniversal] Limpiando preview", {
      contexto,
      motivo,
      previewLength: preview.length,
      mostrarPreview,
      stack: new Error().stack,
    });

    persistirEstadoImportacion(contexto, {
      preview: [],
      mostrarPreview: false,
    });
    setMostrarPreview(false);
    setPreview([]);
  }

  async function confirmarImportacion() {
    if (preview.length === 0) {
      avisar("No hay articulos para importar", "error");
      return;
    }

    if (preview.some((item) => !item.categoria_id)) {
      avisar("Selecciona categoria en todos los articulos", "error");
      return;
    }

    setProcesando(true);

    try {
      const tipoMaterial = obtenerTipoMaterial();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        avisar("Sesion no valida", "error");
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

      for (const item of preview) {
        const existente = articulos.find(
          (articulo) =>
            articulo.id === item.articuloId ||
            normalizarSku(articulo.sku) === normalizarSku(item.sku)
        );
        const categoriaSeleccionada = categorias.find(
          (categoria) => categoria.id === item.categoria_id
        );
        const costoGremio = Number(item.costo_gremio ?? 0) || 0;
        const precioPublico = Number(item.precio_publico ?? 0) || 0;

        const datosArticulo = {
          sku: normalizarSku(item.sku),
          descripcion: normalizarSku(item.sku),
          detalle: item.detalle || "",
          proveedor: "Integra",
          moneda: "ARS",
          categoria_id: item.categoria_id || null,
          categoria: categoriaSeleccionada?.nombre || existente?.categoria || "",
          tipo_id: tipoMaterial?.id || existente?.tipo_id || null,
          tipo: tipoMaterial?.nombre || existente?.tipo || "Material",
          frecuente: true,
          importado_proveedor: true,
          origen_pdf: item.origen_importacion || "CSV",
          usado_count: Math.max(Number(existente?.usado_count || 0), 11),
          precio_costo: costoGremio,
          costo: costoGremio,
          precio_final: precioPublico,
          precio: precioPublico,
        };

        let articuloId = existente?.id || null;

        if (existente?.id) {
          const { error } = await supabase
            .from("articulos")
            .update(datosArticulo)
            .eq("id", existente.id);

          if (error) throw error;
          actualizados += 1;
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
          nuevos += 1;
        }

        if (esPresupuesto) {
          itemsParaPresupuesto.push({
            descripcion: datosArticulo.descripcion,
            detalle: datosArticulo.detalle,
            categoria_id: datosArticulo.categoria_id || "",
            tipo_id: datosArticulo.tipo_id || "",
            categoria: datosArticulo.categoria,
            tipo: datosArticulo.tipo,
            cantidad: Number(item.cantidad) || 1,
            precio: precioPublico,
            precio_costo: costoGremio,
            costo: costoGremio,
            precio_final: precioPublico,
            precio_base_trabajo: precioPublico,
            descuento_trabajo: 0,
            recargo_trabajo: 0,
            articulo_id: articuloId,
            actualizar_biblioteca: false,
          });
        }
      }

      if (esPresupuesto && itemsParaPresupuesto.length > 0) {
        setItems?.((actuales) => [...actuales, ...itemsParaPresupuesto]);
      }

      await obtenerArticulos?.();
      limpiarPreview("confirmarImportacion:completada");
      avisar(`Importacion completada: ${nuevos} nuevos, ${actualizados} actualizados`, "ok");
    } catch (error) {
      console.error(error);
      avisar(error.message || "Error al importar articulos", "error");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <>
      <input
        ref={inputCsvRef}
        type="file"
        accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onClick={(evento) => {
          evento.currentTarget.value = "";
        }}
        onChange={procesarArchivoCsv}
        className="fixed left-0 top-0 w-px h-px opacity-0 pointer-events-none"
        tabIndex={-1}
      />

      {mostrarBoton && (
        <div className="relative">
          <button
            onClick={() => setMenuAbierto((actual) => !actual)}
            disabled={procesando}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 px-5 py-3 rounded-xl font-bold"
          >
            {procesando ? "Leyendo..." : "Importar"}
          </button>

          {menuAbierto && (
            <div className="absolute right-0 top-14 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden z-50 min-w-52 shadow-2xl">
              <button
                onClick={iniciarImportacionCsv}
                className="w-full text-left px-5 py-4 hover:bg-zinc-800 font-bold"
              >
                Importar CSV/XLSX
              </button>
            </div>
          )}
        </div>
      )}

      {mostrarPreview && (
        <div className="fixed inset-0 z-[9997] bg-black/80 p-4 flex items-center justify-center">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 md:p-6 w-full max-w-6xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-start gap-4 mb-5">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-orange-500">
                  Preview importacion
                </h2>
                <p className="text-zinc-500 mt-1">
                  Revisa los articulos antes de guardar.
                </p>
              </div>

              <button
                onClick={cerrarPreview}
                className="bg-zinc-800 hover:bg-zinc-700 w-11 h-11 rounded-2xl font-black"
              >
                x
              </button>
            </div>

            <div className="space-y-2">
              {preview.map((item, index) => (
                <div
                  key={`${item.sku}-${index}`}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-[160px_1fr_120px_130px_130px_120px] gap-3 md:items-start"
                >
                  <div>
                    <p className="text-zinc-500 text-xs mb-1">SKU</p>
                    <input
                      type="text"
                      value={item.sku || ""}
                      onChange={(e) => actualizarPreview(index, "sku", e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm font-bold"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-zinc-500 text-xs mb-1">Producto / detalle</p>
                    <textarea
                      value={item.detalle || ""}
                      onChange={(e) =>
                        actualizarPreview(index, "detalle", e.target.value)
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm min-h-20"
                    />
                  </div>

                  <div>
                    <p className="text-zinc-500 text-xs mb-1">Cantidad</p>
                    <input
                      type="number"
                      min="0"
                      value={item.cantidad || ""}
                      onChange={(e) =>
                        actualizarPreview(index, "cantidad", e.target.value)
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm"
                    />
                  </div>

                  <div>
                    <p className="text-zinc-500 text-xs mb-1">Categoria</p>
                    <select
                      value={item.categoria_id || ""}
                      onChange={(e) =>
                        actualizarPreview(index, "categoria_id", e.target.value)
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
                    <p className="text-zinc-500 text-xs mb-1">Costo</p>
                    <input
                      type="number"
                      min="0"
                      value={item.costo_gremio || ""}
                      onChange={(e) =>
                        actualizarPreview(index, "costo_gremio", e.target.value)
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="text-zinc-500 text-xs mb-1">Precio</p>
                      <input
                        type="number"
                        min="0"
                        value={item.precio_publico || ""}
                        onChange={(e) =>
                          actualizarPreview(index, "precio_publico", e.target.value)
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm"
                      />
                    </div>
                    <span
                      className={
                        item.existe
                          ? "inline-block bg-blue-500/20 text-blue-300 px-3 py-2 rounded-xl text-sm font-bold text-center"
                          : "inline-block bg-green-500/20 text-green-300 px-3 py-2 rounded-xl text-sm font-bold text-center"
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
                onClick={confirmarImportacion}
                disabled={procesando}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 px-6 py-4 rounded-2xl font-bold"
              >
                {procesando ? "Importando..." : `Importar ${preview.length} articulos`}
              </button>
              <button
                onClick={cerrarPreview}
                disabled={procesando}
                className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 px-6 py-4 rounded-2xl font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default ImportadorUniversal;
