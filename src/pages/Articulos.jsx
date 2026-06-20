import React from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import ArticuloLista from "../components/ArticuloLista";
import ArticuloFormulario from "../components/ArticuloFormulario";
import ArticuloVerModal from "../components/ArticuloVerModal";
import ArticuloFiltros from "../components/ArticuloFiltros";
import ArticuloImportador from "../components/ArticuloImportador";


export default function Articulos() {
  const [descripcion, setDescripcion] = React.useState("");
  const [detalle, setDetalle] = React.useState("");
  const [precioCosto, setPrecioCosto] = React.useState("");
  const [precioFinal, setPrecioFinal] = React.useState("");
  const [precioBaseTrabajo, setPrecioBaseTrabajo] = React.useState("");
  const [descuentoTrabajo, setDescuentoTrabajo] = React.useState("");
  const [recargoTrabajo, setRecargoTrabajo] = React.useState("");
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
  const [categoriaBusqueda, setCategoriaBusqueda] = React.useState("Todas");
  const [mostrarFiltroCategorias, setMostrarFiltroCategorias] = React.useState(false);
  const [menuAbierto, setMenuAbierto] = React.useState(null);
  const [menuConfigAbierto, setMenuConfigAbierto] = React.useState(false);
  const [articuloVer, setArticuloVer] = React.useState(null);

  const [menuImportarAbierto, setMenuImportarAbierto] = React.useState(false);
  const [previewImportacion, setPreviewImportacion] = React.useState([]);
  const [mostrarPreviewImportacion, setMostrarPreviewImportacion] =
    React.useState(false);
  const [procesandoImportacion, setProcesandoImportacion] = React.useState(false);

  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastMensaje, setToastMensaje] = React.useState("");
  const [toastTipo, setToastTipo] = React.useState("ok");

  const [modalVisible, setModalVisible] = React.useState(false);
  const [articuloEliminar, setArticuloEliminar] = React.useState(null);

  const formularioRef = React.useRef(null);
  const inputCsvRef = React.useRef(null);

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

  function esTipoTrabajo(nombre) {
    return `${nombre || ""}`.toLowerCase().includes("trabajo");
  }

  function esTrabajoFormulario() {
    const tipoSeleccionado = tipos.find((tipo) => tipo.id === tipoId);

    return esTipoTrabajo(tipoSeleccionado?.nombre);
  }

  function esTrabajoArticulo(articulo) {
    return esTipoTrabajo(nombreTipo(articulo));
  }

  function calcularPrecioTrabajo(base, descuento, recargo) {
    const baseNumero = Number(base) || 0;
    const descuentoNumero = Number(descuento) || 0;
    const recargoNumero = Number(recargo) || 0;

    return (
      baseNumero -
      baseNumero * (descuentoNumero / 100) +
      baseNumero * (recargoNumero / 100)
    );
  }

  function actualizarPrecioBaseTrabajo(valor) {
    setPrecioBaseTrabajo(valor);
    setPrecioFinal(
      calcularPrecioTrabajo(valor, descuentoTrabajo, recargoTrabajo)
    );
  }

  function actualizarDescuentoTrabajo(valor) {
    setDescuentoTrabajo(valor);
    setPrecioFinal(
      calcularPrecioTrabajo(precioBaseTrabajo, valor, recargoTrabajo)
    );
  }

  function actualizarRecargoTrabajo(valor) {
    setRecargoTrabajo(valor);
    setPrecioFinal(
      calcularPrecioTrabajo(precioBaseTrabajo, descuentoTrabajo, valor)
    );
  }

  function limpiarFormulario() {
    setDescripcion("");
    setDetalle("");
    setPrecioCosto("");
    setPrecioFinal("");
    setPrecioBaseTrabajo("");
    setDescuentoTrabajo("");
    setRecargoTrabajo("");
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

    const trabajo = esTipoTrabajo(tipoSeleccionado?.nombre);

    const costoNumerico = precioCosto === "" ? 0 : Number(precioCosto) || 0;
    const finalNumerico = precioFinal === "" ? 0 : Number(precioFinal) || 0;
    const baseTrabajoNumerico =
      precioBaseTrabajo === "" ? 0 : Number(precioBaseTrabajo) || 0;
    const descuentoTrabajoNumerico =
      descuentoTrabajo === "" ? 0 : Number(descuentoTrabajo) || 0;
    const recargoTrabajoNumerico =
      recargoTrabajo === "" ? 0 : Number(recargoTrabajo) || 0;

    const datosArticulo = {
      descripcion,
      detalle,
      precio: finalNumerico,
      costo: trabajo ? 0 : costoNumerico,
      precio_costo: trabajo ? 0 : costoNumerico,
      precio_final: finalNumerico,
      precio_base_trabajo: trabajo ? baseTrabajoNumerico : 0,
      descuento_trabajo: trabajo ? descuentoTrabajoNumerico : 0,
      recargo_trabajo: trabajo ? recargoTrabajoNumerico : 0,
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
    setPrecioBaseTrabajo(
      articulo.precio_base_trabajo ?? articulo.precio_final ?? articulo.precio ?? ""
    );
    setDescuentoTrabajo(articulo.descuento_trabajo ?? "");
    setRecargoTrabajo(articulo.recargo_trabajo ?? "");
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

  function precioBaseTrabajoArticulo(articulo) {
    return (
      Number(
        articulo.precio_base_trabajo ??
          articulo.precio_final ??
          articulo.precio ??
          0
      ) || 0
    );
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
  function iniciarImportacionCsv() {
    setPreviewImportacion([]);
    setMostrarPreviewImportacion(false);
    setMenuImportarAbierto(false);

    setTimeout(() => {
      inputCsvRef.current?.click();
    }, 50);
  }

  function separarCsvLinea(linea) {
    const campos = [];
    let actual = "";
    let dentroComillas = false;

    for (let i = 0; i < linea.length; i++) {
      const caracter = linea[i];
      const siguiente = linea[i + 1];

      if (caracter === '"' && dentroComillas && siguiente === '"') {
        actual += '"';
        i += 1;
        continue;
      }

      if (caracter === '"') {
        dentroComillas = !dentroComillas;
        continue;
      }

      if (caracter === "," && !dentroComillas) {
        campos.push(actual.trim());
        actual = "";
        continue;
      }

      actual += caracter;
    }

    campos.push(actual.trim());

    return campos;
  }

  function esNumeroCsv(valor) {
    const texto = `${valor || ""}`.trim();

    if (!texto) return false;

    return /^-?\d+(?:[.,]\d+)?$/.test(
      texto.replace(/\./g, "").replace(/,/g, ".")
    );
  }

  function esArticuloCsvCompleto(campos) {
    if (!campos || campos.length < 5) return false;

    const cantidad = campos[0];
    const sku = campos[1];
    const costo = campos[campos.length - 2];
    const publico = campos[campos.length - 1];

    return (
      esNumeroCsv(cantidad) &&
      Boolean(`${sku || ""}`.trim()) &&
      esNumeroCsv(costo) &&
      esNumeroCsv(publico)
    );
  }

  function convertirCamposCsvAArticulo(campos) {
    const cantidad = Number(`${campos[0] || "1"}`.replace(/,/g, ".")) || 1;
    const sku = normalizarSku(campos[1]);
    const descripcion = campos.slice(2, -2).join(", ").replace(/\s+/g, " ").trim();
    const costoGremio = normalizarPrecio(campos[campos.length - 2]);
    const precioPublico = normalizarPrecio(campos[campos.length - 1]);

    return {
      cantidad,
      sku,
      descripcion: sku,
      detalle: descripcion,
      costo_gremio: costoGremio,
      precio_publico: precioPublico,
      precio: precioPublico,
    };
  }

  function parsearCsvProveedor(textoCsv) {
    const lineas = `${textoCsv || ""}`
      .replace(/^\uFEFF/, "")
      .replace(/\r/g, "")
      .split("\n")
      .map((linea) => linea.trim())
      .filter(Boolean);

    const articulosCsv = [];
    let acumulado = [];

    lineas.forEach((linea, index) => {
      const lineaMinuscula = linea.toLowerCase();

      if (
        index === 0 &&
        lineaMinuscula.includes("cantidad") &&
        lineaMinuscula.includes("sku")
      ) {
        return;
      }

      const camposLinea = separarCsvLinea(linea);

      acumulado = [...acumulado, ...camposLinea];

      if (esArticuloCsvCompleto(acumulado)) {
        const articulo = convertirCamposCsvAArticulo(acumulado);

        if (articulo.sku && articulo.detalle) {
          articulosCsv.push(articulo);
        }

        acumulado = [];
      }
    });

    return articulosCsv;
  }

  async function procesarArchivoCsv(evento) {
    const archivo = evento.target.files?.[0];

    evento.target.value = "";

    if (!archivo) return;

    setProcesandoImportacion(true);

    try {
      const textoCsv = await archivo.text();
      const itemsDetectados = parsearCsvProveedor(textoCsv);

      if (itemsDetectados.length === 0) {
        mostrarToast("No se detectaron artículos en el CSV", "error");
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
      mostrarToast("CSV leído correctamente", "ok");
    } catch (error) {
      console.error(error);
      mostrarToast("No se pudo leer el CSV", "error");
    } finally {
      setProcesandoImportacion(false);
    }
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
  async function confirmarImportacionCsv() {
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

    try {
      for (const item of previewImportacion) {
        const categoriaSeleccionada = categorias.find(
          (categoria) => categoria.id === item.categoria_id
        );

        const costoGremio = Number(item.costo_gremio ?? 0) || 0;
        const precioPublico = Number(item.precio_publico ?? 0) || 0;

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
          origen_pdf: "CSV",
          usado_count: 11,
          precio_costo: costoGremio,
          costo: costoGremio,
          precio_final: precioPublico,
          precio: precioPublico,
        };

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
            },
          ]);

          if (error) throw error;
        }
      }

      mostrarToast("Importación CSV completada", "ok");
      setMostrarPreviewImportacion(false);
      setPreviewImportacion([]);
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

      const coincideCategoriaBusqueda =
        categoriaBusqueda === "Todas"
          ? true
          : categoriaTexto.toLowerCase() === categoriaBusqueda.toLowerCase();

      const coincideCategoria =
        filtroCategoria === "Todas"
          ? true
          : categoriaTexto.toLowerCase() === filtroCategoria.toLowerCase();

      const coincideTipo =
        filtroTipo === "Todos"
          ? true
          : tipoTexto.toLowerCase() === filtroTipo.toLowerCase();

      return (
        coincideBusqueda &&
        coincideCategoriaBusqueda &&
        coincideCategoria &&
        coincideTipo
      );
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
        ref={inputCsvRef}
        type="file"
        accept=".csv,text/csv"
        onChange={procesarArchivoCsv}
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
      

      <ArticuloVerModal
        articuloVer={articuloVer}
        setArticuloVer={setArticuloVer}
        nombreCategoria={nombreCategoria}
        nombreTipo={nombreTipo}
        esFrecuente={esFrecuente}
        esImportadoProveedor={esImportadoProveedor}
        IconoImportadoProveedor={IconoImportadoProveedor}
        esTrabajoArticulo={esTrabajoArticulo}
        precioBaseTrabajoArticulo={precioBaseTrabajoArticulo}
        precioCostoArticulo={precioCostoArticulo}
        precioFinalArticulo={precioFinalArticulo}
      />

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
              
<ArticuloImportador
  menuImportarAbierto={menuImportarAbierto}
  setMenuImportarAbierto={setMenuImportarAbierto}
  procesandoImportacion={procesandoImportacion}
  iniciarImportacionCsv={iniciarImportacionCsv}
  mostrarPreviewImportacion={mostrarPreviewImportacion}
  setMostrarPreviewImportacion={setMostrarPreviewImportacion}
  previewImportacion={previewImportacion}
  setPreviewImportacion={setPreviewImportacion}
  categorias={categorias}
  actualizarCampoPreview={actualizarCampoPreview}
  actualizarCategoriaPreview={actualizarCategoriaPreview}
  confirmarImportacionCsv={confirmarImportacionCsv}
/>

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

          <ArticuloFormulario
            formularioRef={formularioRef}
            mostrarFormulario={mostrarFormulario}
            setMostrarFormulario={setMostrarFormulario}
            editandoId={editandoId}
            limpiarFormulario={limpiarFormulario}
            descripcion={descripcion}
            setDescripcion={setDescripcion}
            categorias={categorias}
            categoriaId={categoriaId}
            setCategoriaId={setCategoriaId}
            tipos={tipos}
            tipoId={tipoId}
            setTipoId={setTipoId}
            proveedor={proveedor}
            setProveedor={setProveedor}
            esTrabajoFormulario={esTrabajoFormulario}
            precioBaseTrabajo={precioBaseTrabajo}
            actualizarPrecioBaseTrabajo={actualizarPrecioBaseTrabajo}
            descuentoTrabajo={descuentoTrabajo}
            actualizarDescuentoTrabajo={actualizarDescuentoTrabajo}
            recargoTrabajo={recargoTrabajo}
            actualizarRecargoTrabajo={actualizarRecargoTrabajo}
            precioCosto={precioCosto}
            setPrecioCosto={setPrecioCosto}
            precioFinal={precioFinal}
            setPrecioFinal={setPrecioFinal}
            moneda={moneda}
            setMoneda={setMoneda}
            origenPdf={origenPdf}
            setOrigenPdf={setOrigenPdf}
            frecuente={frecuente}
            setFrecuente={setFrecuente}
            importadoProveedor={importadoProveedor}
            setImportadoProveedor={setImportadoProveedor}
            detalle={detalle}
            setDetalle={setDetalle}
            guardarArticulo={guardarArticulo}
          />

   <ArticuloFiltros
  busqueda={busqueda}
  setBusqueda={setBusqueda}
  mostrarFiltros={mostrarFiltros}
  setMostrarFiltros={setMostrarFiltros}
  categoriaBusqueda={categoriaBusqueda}
  setCategoriaBusqueda={setCategoriaBusqueda}
  mostrarFiltroCategorias={mostrarFiltroCategorias}
  setMostrarFiltroCategorias={setMostrarFiltroCategorias}
  filtroCategoria={filtroCategoria}
  setFiltroCategoria={setFiltroCategoria}
  filtroTipo={filtroTipo}
  setFiltroTipo={setFiltroTipo}
  categorias={categorias}
  tipos={tipos}
  limpiarFiltros={limpiarFiltros}
/>

          <ArticuloLista
            articulosFiltrados={articulosFiltrados}
            menuAbierto={menuAbierto}
            setMenuAbierto={setMenuAbierto}
            setArticuloVer={setArticuloVer}
            editarArticulo={editarArticulo}
            solicitarEliminarArticulo={solicitarEliminarArticulo}
            esFrecuente={esFrecuente}
            esImportadoProveedor={esImportadoProveedor}
            IconoImportadoProveedor={IconoImportadoProveedor}
            nombreCategoria={nombreCategoria}
            nombreTipo={nombreTipo}
            esTrabajoArticulo={esTrabajoArticulo}
            precioBaseTrabajoArticulo={precioBaseTrabajoArticulo}
            precioCostoArticulo={precioCostoArticulo}
            precioFinalArticulo={precioFinalArticulo}
            detalleCorto={detalleCorto}
          />
        </div>
      </div>
    </>
  );
}