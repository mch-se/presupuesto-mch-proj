import React from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { supabase } from "../lib/supabase";
import { Link, useNavigate, useParams } from "react-router-dom";
import Toast from "../components/Toast";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function Presupuestos() {
  const navigate = useNavigate();
  const { id } = useParams();
  const modoEdicion = !!id;

  const [cliente, setCliente] = React.useState("");
  const [descripcionCorta, setDescripcionCorta] = React.useState("");
  const [descripcionLarga, setDescripcionLarga] = React.useState("");
  const [moneda, setMoneda] = React.useState("ARS");
  const [validoHasta, setValidoHasta] = React.useState("");

  const [clienteSeleccionado, setClienteSeleccionado] = React.useState(null);
  const [clientes, setClientes] = React.useState([]);
  const [mostrarClientes, setMostrarClientes] = React.useState(false);
  const [mostrarMenuCliente, setMostrarMenuCliente] = React.useState(false);
  const [mostrarDatosCliente, setMostrarDatosCliente] = React.useState(false);
  const [busquedaCliente, setBusquedaCliente] = React.useState("");
  const [clienteTelefono, setClienteTelefono] = React.useState("");
  const [clienteEmail, setClienteEmail] = React.useState("");
  const [clienteDireccion, setClienteDireccion] = React.useState("");

  const [items, setItems] = React.useState([]);
  const [itemExpandido, setItemExpandido] = React.useState(null);
  const [numeroPresupuesto, setNumeroPresupuesto] = React.useState("");

  const [mostrarBiblioteca, setMostrarBiblioteca] = React.useState(false);
  const [mostrarSelectorBiblioteca, setMostrarSelectorBiblioteca] =
    React.useState(false);
  const [articulos, setArticulos] = React.useState([]);
  const [busquedaArticulo, setBusquedaArticulo] = React.useState("");

  const [mostrarPlantillas, setMostrarPlantillas] = React.useState(false);
  const [mostrarMenuFlotante, setMostrarMenuFlotante] = React.useState(false);
  const [plantillas, setPlantillas] = React.useState([]);
  const [busquedaPlantilla, setBusquedaPlantilla] = React.useState("");

  const [categorias, setCategorias] = React.useState([]);
  const [tipos, setTipos] = React.useState([]);

  const [menuImportarProveedorAbierto, setMenuImportarProveedorAbierto] =
    React.useState(false);
  const [tipoImportacionProveedor, setTipoImportacionProveedor] =
    React.useState(null);
  const [previewImportacionProveedor, setPreviewImportacionProveedor] =
    React.useState([]);
  const [mostrarPreviewImportacionProveedor, setMostrarPreviewImportacionProveedor] =
    React.useState(false);
  const [procesandoPdfProveedor, setProcesandoPdfProveedor] =
    React.useState(false);

  const [guardando, setGuardando] = React.useState(false);

  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastMensaje, setToastMensaje] = React.useState("");
  const [toastTipo, setToastTipo] = React.useState("ok");

  const inputPdfProveedorRef = React.useRef(null);

  React.useEffect(() => {
    obtenerCategorias();
    obtenerTipos();
    obtenerArticulos();
    obtenerClientes();
    obtenerPlantillas();

    if (modoEdicion) {
      cargarPresupuesto();
    } else {
      generarNumeroPresupuesto();
      generarValidezDefault();
    }
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

  function nombreCategoriaPorId(categoriaId) {
    const encontrada = categorias.find(
      (categoria) => categoria.id === categoriaId
    );

    return encontrada?.nombre || "";
  }

  function nombreTipoPorId(tipoId) {
    const encontrado = tipos.find((tipo) => tipo.id === tipoId);

    return encontrado?.nombre || "";
  }

  function generarValidezDefault() {
    const hoy = new Date();
    hoy.setDate(hoy.getDate() + 7);
    setValidoHasta(hoy.toISOString().split("T")[0]);
  }

  async function cargarPresupuesto() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: perfil } = await supabase
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    const rol = perfil?.rol || "pendiente";

    const { data, error } = await supabase
      .from("presupuestos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      mostrarToast(error.message, "error");
      navigate("/historial");
      return;
    }

    const esPropio = data.user_id === user.id;
    const puedeEditar = rol === "admin" || rol === "socio" || esPropio;

    if (!puedeEditar) {
      mostrarToast("No tenés permisos para editar este presupuesto", "error");
      navigate("/historial");
      return;
    }

    setCliente(data.cliente_empresa || data.cliente || "");
    setDescripcionCorta(data.descripcion_corta || "");
    setDescripcionLarga(data.descripcion_larga || "");
    setMoneda(data.moneda || "ARS");
    setNumeroPresupuesto(data.numero || "");

    if (data.valido_hasta) {
      setValidoHasta(data.valido_hasta);
    } else {
      const fechaBase = data.created_at ? new Date(data.created_at) : new Date();
      fechaBase.setDate(fechaBase.getDate() + 7);
      setValidoHasta(fechaBase.toISOString().split("T")[0]);
    }

    setClienteSeleccionado(
      data.cliente_id
        ? {
            id: data.cliente_id,
            empresa: data.cliente_empresa,
            contacto: data.cliente_contacto,
            telefono: data.cliente_telefono,
            email: data.cliente_email,
            direccion: data.cliente_direccion,
          }
        : null
    );

    setClienteTelefono(data.cliente_telefono || "");
    setClienteEmail(data.cliente_email || "");
    setClienteDireccion(data.cliente_direccion || "");

    const { data: itemsData } = await supabase
      .from("presupuesto_items")
      .select("*")
      .eq("presupuesto_id", id);

    setItems(itemsData || []);
  }

  async function generarNumeroPresupuesto() {
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, "0");
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const anio = hoy.getFullYear();
    const fechaTexto = `${dia}-${mes}-${anio}`;

    const { data } = await supabase.from("presupuestos").select("numero");

    const presupuestosHoy =
      data?.filter((p) => p.numero?.includes(fechaTexto)) || [];

    setNumeroPresupuesto(`${presupuestosHoy.length + 1}-${fechaTexto}`);
  }

  async function obtenerArticulos() {
    const { data, error } = await supabase
      .from("articulos")
      .select("*")
      .order("descripcion");

    if (error) {
      mostrarToast(error.message, "error");
      return;
    }

    setArticulos(data || []);
  }

  async function obtenerClientes() {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("empresa");

    if (error) {
      mostrarToast(error.message, "error");
      return;
    }

    setClientes(data || []);
  }

  async function obtenerPlantillas() {
    const { data, error } = await supabase
      .from("plantillas")
      .select("*")
      .order("nombre");

    if (error) {
      mostrarToast(error.message, "error");
      return;
    }

    setPlantillas(data || []);
  }

  function seleccionarCliente(clienteElegido) {
    setClienteSeleccionado(clienteElegido);
    setCliente(clienteElegido.empresa || "");
    setClienteTelefono(clienteElegido.telefono || "");
    setClienteEmail(clienteElegido.email || "");
    setClienteDireccion(clienteElegido.direccion || "");
    setMostrarClientes(false);
    setMostrarMenuCliente(false);
    setMostrarDatosCliente(false);
  }

  async function importarContactoCliente() {
    setMostrarMenuCliente(false);

    if (!("contacts" in navigator) || !navigator.contacts?.select) {
      mostrarToast(
        "Este dispositivo no permite importar contactos. Cargá el cliente manualmente.",
        "error"
      );
      return;
    }

    try {
      const contactos = await navigator.contacts.select(
        ["name", "tel", "email"],
        { multiple: false }
      );

      const contactoImportado = contactos?.[0];

      if (!contactoImportado) {
        return;
      }

      const nombre = contactoImportado.name?.[0] || "";
      const telefonoContacto = contactoImportado.tel?.[0] || "";
      const emailContacto = contactoImportado.email?.[0] || "";

      if (!nombre) {
        mostrarToast("El contacto no tiene nombre válido", "error");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        mostrarToast("Sesión no válida", "error");
        return;
      }

      const { data: perfil } = await supabase
        .from("profiles")
        .select("alias")
        .eq("id", user.id)
        .single();

      const alias = perfil?.alias || "Administrador";

      const datosCliente = {
        tipo: "Particular",
        empresa: nombre,
        contacto: "",
        telefono: telefonoContacto,
        email: emailContacto,
        direccion: "",
        observaciones: "Importado desde contactos",
        user_id: user.id,
        cargado_por: user.id,
        cargado_por_alias: alias,
      };

      const { data: clienteCreado, error } = await supabase
        .from("clientes")
        .insert([datosCliente])
        .select()
        .single();

      if (error) {
        mostrarToast(error.message, "error");
        return;
      }

      setClientes((actuales) => [clienteCreado, ...actuales]);
      seleccionarCliente(clienteCreado);

      mostrarToast("Contacto importado y seleccionado", "ok");
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      mostrarToast("No se pudo importar el contacto", "error");
    }
  }

  function limpiarClienteSeleccionado() {
    setClienteSeleccionado(null);
    setCliente("");
    setClienteTelefono("");
    setClienteEmail("");
    setClienteDireccion("");
    setMostrarMenuCliente(false);
  }

  function normalizarSku(sku) {
    return `${sku || ""}`.trim().toUpperCase();
  }

  function normalizarPrecio(precioTexto) {
    return Number(
      `${precioTexto || ""}`
        .replace(/\$/g, "")
        .replace(/\./g, "")
        .replace(/,/g, ".")
    ) || 0;
  }

  function obtenerTipoMaterial() {
    return (
      tipos.find((tipo) =>
        `${tipo.nombre || ""}`.toLowerCase().includes("material")
      ) || null
    );
  }

  function precioFinalArticulo(articulo) {
    return Number(articulo.precio_final ?? articulo.precio ?? 0) || 0;
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

  function actualizarCategoriaPreviewProveedor(index, categoriaIdNueva) {
    setPreviewImportacionProveedor((actual) =>
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

  function iniciarImportacionProveedor(tipo) {
    setTipoImportacionProveedor(tipo);
    setPreviewImportacionProveedor([]);
    setMostrarPreviewImportacionProveedor(false);
    setMenuImportarProveedorAbierto(false);
    setMostrarMenuFlotante(false);

    setTimeout(() => {
      inputPdfProveedorRef.current?.click();
    }, 50);
  }

  async function leerTextoPdfProveedor(archivo) {
    const buffer = await archivo.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: buffer,
    }).promise;

    const todasLasLineas = [];

    for (let numeroPagina = 1; numeroPagina <= pdf.numPages; numeroPagina++) {
      const pagina = await pdf.getPage(numeroPagina);
      const contenido = await pagina.getTextContent();

      const itemsPdf = contenido.items
        .map((item) => ({
          texto: item.str,
          x: item.transform[4],
          y: item.transform[5],
        }))
        .filter((item) => item.texto && item.texto.trim());

      const lineas = [];

      itemsPdf.forEach((item) => {
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

      const lineasOrdenadas = lineas
        .sort((a, b) => b.y - a.y)
        .map((linea) => {
          const itemsOrdenados = linea.items.sort((a, b) => a.x - b.x);

          return {
            y: linea.y,
            texto: itemsOrdenados.map((item) => item.texto).join(" ").trim(),
            items: itemsOrdenados,
          };
        });

      todasLasLineas.push(...lineasOrdenadas);
    }

    return todasLasLineas;
  }

  function parsearPdfProveedorIntegra(lineasPdf, modo) {
    const lineas = (lineasPdf || [])
      .map((linea) => {
        if (typeof linea === "string") {
          return {
            texto: linea,
            items: [],
            y: 0,
          };
        }

        return {
          texto: linea.texto || "",
          items: linea.items || [],
          y: linea.y || 0,
        };
      })
      .filter((linea) => linea.texto && linea.texto.trim());

    const limpiarTexto = (texto) =>
      `${texto || ""}`.replace(/\s+/g, " ").trim();

    const elegirPrecio = (precios) => {
      if (!precios || precios.length === 0) return 0;

      return modo === "gremio" && precios.length >= 2
        ? precios[1]
        : precios[0];
    };

    const indiceHeader = lineas.findIndex((linea) => {
      const texto = `${linea.texto || ""}`.toLowerCase();

      return (
        texto.includes("cant") &&
        texto.includes("sku") &&
        texto.includes("producto")
      );
    });

    if (indiceHeader === -1) {
      return [];
    }

    const header = lineas[indiceHeader];

    const buscarX = (textoBuscado, fallback) => {
      const encontrado = header.items.find((item) =>
        `${item.texto || ""}`.toLowerCase().includes(textoBuscado)
      );

      return encontrado?.x ?? fallback;
    };

    const xCant = buscarX("cant", 25);
    const xSku = buscarX("sku", 75);
    const xProducto = buscarX("producto", 170);
    const xPrecio = buscarX("precio", 430);

    const filas = [];
    let filaActual = null;
    let dentroTabla = false;

    function cerrarFilaActual() {
      if (!filaActual) return;

      const sku = limpiarTexto(filaActual.skuPartes.join(" "));
      const detalle = limpiarTexto(filaActual.productoPartes.join(" "));
      const precio = elegirPrecio(filaActual.precios);

      if (sku && detalle && precio > 0) {
        filas.push({
          cantidad: filaActual.cantidad || 1,
          sku: normalizarSku(sku),
          descripcion: sku,
          detalle,
          precio,
        });
      }

      filaActual = null;
    }

    lineas.forEach((linea, index) => {
      const textoLinea = limpiarTexto(linea.texto);

      if (index <= indiceHeader) {
        if (index === indiceHeader) {
          dentroTabla = true;
        }

        return;
      }

      if (/^Total:/i.test(textoLinea)) {
        cerrarFilaActual();
        dentroTabla = false;
        return;
      }

      if (!dentroTabla) return;

      const itemsOrdenados = linea.items || [];

      const itemCantidad = itemsOrdenados.find((item) => {
        const texto = `${item.texto || ""}`.trim();

        return (
          item.x >= xCant - 30 &&
          item.x < xSku + 10 &&
          /^\d+$/.test(texto)
        );
      });

      if (itemCantidad) {
        cerrarFilaActual();

        filaActual = {
          cantidad: Number(itemCantidad.texto) || 1,
          skuPartes: [],
          productoPartes: [],
          precios: [],
        };
      }

      if (!filaActual) return;

      const preciosLinea = textoLinea.match(/\$\s*[\d.]+(?:,\d+)?/g) || [];

      preciosLinea.forEach((precioTexto) => {
        const precio = normalizarPrecio(precioTexto);

        if (precio > 0) {
          filaActual.precios.push(precio);
        }
      });

      itemsOrdenados.forEach((item) => {
        const texto = `${item.texto || ""}`.trim();

        if (!texto) return;
        if (item === itemCantidad) return;
        if (/^\$/.test(texto)) return;
        if (/^[\d.]+(?:,\d+)?$/.test(texto) && item.x >= xPrecio - 40) return;

        if (item.x >= xSku - 20 && item.x < xProducto - 10) {
          filaActual.skuPartes.push(texto);
          return;
        }

        if (item.x >= xProducto - 20 && item.x < xPrecio - 20) {
          filaActual.productoPartes.push(texto);
        }
      });
    });

    cerrarFilaActual();

    return filas.filter(
      (item) =>
        item &&
        item.descripcion &&
        item.detalle &&
        item.precio > 0
    );
  }

  async function procesarArchivoPdfProveedor(evento) {
    const archivo = evento.target.files?.[0];

    evento.target.value = "";

    if (!archivo || !tipoImportacionProveedor) return;

    setProcesandoPdfProveedor(true);

    try {
      const textoPdf = await leerTextoPdfProveedor(archivo);
      const itemsDetectados = parsearPdfProveedorIntegra(
        textoPdf,
        tipoImportacionProveedor
      );

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
          precioActual: precioFinalArticulo(existente || {}),
        };
      });

      setPreviewImportacionProveedor(preview);
      setMostrarPreviewImportacionProveedor(true);
      mostrarToast("PDF leído correctamente", "ok");
    } catch (error) {
      console.error(error);
      mostrarToast("No se pudo leer el PDF", "error");
    } finally {
      setProcesandoPdfProveedor(false);
    }
  }

  async function confirmarImportacionProveedor() {
    if (previewImportacionProveedor.length === 0) {
      mostrarToast("No hay artículos para importar", "error");
      return;
    }

    const faltanCategorias = previewImportacionProveedor.some(
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
    const origen =
      tipoImportacionProveedor === "gremio" ? "PDF gremio" : "PDF final";

    const itemsParaPresupuesto = [];

    try {
      for (const item of previewImportacionProveedor) {
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

        if (tipoImportacionProveedor === "gremio") {
          datosBase.precio_costo = item.precio;
          datosBase.costo = item.precio;
        }

        if (tipoImportacionProveedor === "final") {
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
                tipoImportacionProveedor === "gremio" ? item.precio : 0,
              costo:
                tipoImportacionProveedor === "gremio" ? item.precio : 0,
              precio_final:
                tipoImportacionProveedor === "final" ? item.precio : 0,
              precio:
                tipoImportacionProveedor === "final" ? item.precio : 0,
            },
          ]);

          if (error) throw error;
        }

        itemsParaPresupuesto.push({
          descripcion: item.descripcion,
          detalle: item.detalle || "",
          categoria_id: item.categoria_id || "",
          tipo_id: tipoMaterial?.id || "",
          categoria: categoriaSeleccionada?.nombre || "",
          tipo: tipoMaterial?.nombre || "Material",
          cantidad: item.cantidad || 1,
          precio: item.precio || 0,
        });
      }

      setItems((actuales) => [...actuales, ...itemsParaPresupuesto]);

      mostrarToast("Proveedor importado al presupuesto", "ok");
      setMostrarPreviewImportacionProveedor(false);
      setPreviewImportacionProveedor([]);
      setTipoImportacionProveedor(null);
      obtenerArticulos();
    } catch (error) {
      console.error(error);
      mostrarToast(error.message || "Error al importar proveedor", "error");
    }
  }

  function agregarItemManual() {
    setItems([
      ...items,
      {
        descripcion: "",
        detalle: "",
        categoria_id: "",
        tipo_id: "",
        categoria: "",
        tipo: "",
        cantidad: 1,
        precio: 0,
      },
    ]);
  }

  function actualizarItem(index, campo, valor) {
    const nuevosItems = [...items];

    nuevosItems[index][campo] = valor;

    if (campo === "categoria_id") {
      nuevosItems[index].categoria = nombreCategoriaPorId(valor);
    }

    if (campo === "tipo_id") {
      nuevosItems[index].tipo = nombreTipoPorId(valor);
    }

    setItems(nuevosItems);
  }

  function eliminarItem(index) {
    setItems(items.filter((_, i) => i !== index));
  }

  function agregarArticuloAlPresupuesto(articulo) {
    setItems([
      ...items,
      {
        descripcion: articulo.descripcion || "",
        detalle: articulo.detalle || "",
        categoria_id: articulo.categoria_id || "",
        tipo_id: articulo.tipo_id || "",
        categoria: articulo.categoria || "",
        tipo: articulo.tipo || "",
        cantidad: 1,
        precio: articulo.precio || 0,
      },
    ]);

    setMostrarBiblioteca(false);
  }

  async function agregarPlantillaAlPresupuesto(plantilla) {
    const { data, error } = await supabase
      .from("plantilla_items")
      .select("*")
      .eq("plantilla_id", plantilla.id)
      .order("created_at", { ascending: true });

    if (error) {
      mostrarToast(error.message, "error");
      return;
    }

    const nuevosItems = (data || []).map((item) => ({
      descripcion: item.descripcion || "",
      detalle: item.detalle || "",
      categoria_id: item.categoria_id || "",
      tipo_id: item.tipo_id || "",
      categoria: item.categoria || "",
      tipo: item.tipo || "",
      cantidad: item.cantidad || 1,
      precio: item.precio || 0,
    }));

    setItems([...items, ...nuevosItems]);
    setMostrarPlantillas(false);
  }

  const subtotal = items.reduce((acc, item) => {
    const cantidad = Number(item.cantidad) || 0;
    const precio = Number(item.precio) || 0;
    return acc + cantidad * precio;
  }, 0);

  const iva = 0;
  const total = subtotal;

  async function guardarPresupuesto() {
    if (guardando) return;

    if (!cliente) {
      mostrarToast("Ingresar o seleccionar cliente", "error");
      return;
    }

    setGuardando(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        mostrarToast("Sesión no válida", "error");
        setGuardando(false);
        return;
      }

      const { data: perfil } = await supabase
        .from("profiles")
        .select("alias")
        .eq("id", user.id)
        .single();

      const alias = perfil?.alias || "Administrador";

      if (modoEdicion) {
        const { data: presupuestoActual } = await supabase
          .from("presupuestos")
          .select("estado")
          .eq("id", id)
          .single();

        if (presupuestoActual?.estado === "Finalizado") {
          const confirmar = window.confirm(
            "Este presupuesto está FINALIZADO.\n\nGuardar cambios puede afectar información operativa o histórica.\n\n¿Deseás continuar?"
          );

          if (!confirmar) {
            setGuardando(false);
            return;
          }
        }
      }

      const datosCliente = {
        cliente_id: clienteSeleccionado?.id || null,
        cliente_empresa: clienteSeleccionado?.empresa || cliente || "",
        cliente_contacto: clienteSeleccionado?.contacto || "",
        cliente_telefono: clienteTelefono || "",
        cliente_email: clienteEmail || "",
        cliente_direccion: clienteDireccion || "",
      };

      const datosPresupuestoBase = {
        cliente,
        descripcion_corta: descripcionCorta,
        descripcion_larga: descripcionLarga,
        subtotal,
        iva,
        total,
        moneda,
        tipo_factura: "C",
        aplica_iva: false,
        valido_hasta: validoHasta || null,
        ...datosCliente,
      };

      if (modoEdicion) {
        const { data: presupuestoActual } = await supabase
          .from("presupuestos")
          .select("estado, valido_hasta")
          .eq("id", id)
          .single();

        const cambioValidez =
          (presupuestoActual?.valido_hasta || "") !== (validoHasta || "");

        let estadoFinal = presupuestoActual?.estado || "Edición";

        if (estadoFinal === "Enviado" && cambioValidez) {
          estadoFinal = "Cerrado";
        }

        const { error } = await supabase
          .from("presupuestos")
          .update({
            ...datosPresupuestoBase,
            estado: estadoFinal,
          })
          .eq("id", id);

        if (error) {
          mostrarToast(error.message, "error");
          setGuardando(false);
          return;
        }

        if (presupuestoActual?.estado === "Enviado" && cambioValidez) {
          await supabase.from("presupuesto_estados").insert([
            {
              presupuesto_id: id,
              user_id: user.id,
              estado: "Cerrado",
              nota: `Validez modificada por ${alias}. Requiere reenvío.`,
            },
          ]);
        }

        await supabase
          .from("presupuesto_items")
          .delete()
          .eq("presupuesto_id", id);

        const nuevosItems = items.map((item) => ({
          presupuesto_id: id,
          descripcion: item.descripcion,
          detalle: item.detalle || "",
          categoria_id: item.categoria_id || null,
          tipo_id: item.tipo_id || null,
          categoria: item.categoria || nombreCategoriaPorId(item.categoria_id),
          tipo: item.tipo || nombreTipoPorId(item.tipo_id),
          cantidad: Number(item.cantidad) || 0,
          precio: Number(item.precio) || 0,
          subtotal: (Number(item.cantidad) || 0) * (Number(item.precio) || 0),
        }));

        if (nuevosItems.length > 0) {
          const { error: errorItems } = await supabase
            .from("presupuesto_items")
            .insert(nuevosItems);

          if (errorItems) {
            mostrarToast(errorItems.message, "error");
            setGuardando(false);
            return;
          }
        }

        mostrarToast("Presupuesto actualizado", "ok");
      } else {
        const { data: presupuesto, error } = await supabase
          .from("presupuestos")
          .insert([
            {
              numero: numeroPresupuesto,
              user_id: user.id,
              generado_por: user.id,
              generado_por_alias: alias,
              estado: "Edición",
              ...datosPresupuestoBase,
            },
          ])
          .select()
          .single();

        if (error) {
          mostrarToast(error.message, "error");
          setGuardando(false);
          return;
        }

        const itemsInsertar = items.map((item) => ({
          presupuesto_id: presupuesto.id,
          descripcion: item.descripcion,
          detalle: item.detalle || "",
          categoria_id: item.categoria_id || null,
          tipo_id: item.tipo_id || null,
          categoria: item.categoria || nombreCategoriaPorId(item.categoria_id),
          tipo: item.tipo || nombreTipoPorId(item.tipo_id),
          cantidad: Number(item.cantidad) || 0,
          precio: Number(item.precio) || 0,
          subtotal: (Number(item.cantidad) || 0) * (Number(item.precio) || 0),
        }));

        if (itemsInsertar.length > 0) {
          const { error: errorItems } = await supabase
            .from("presupuesto_items")
            .insert(itemsInsertar);

          if (errorItems) {
            mostrarToast(errorItems.message, "error");
            setGuardando(false);
            return;
          }
        }

        mostrarToast("Presupuesto guardado", "ok");
      }

      setTimeout(() => {
        navigate("/historial");
      }, 700);
    } catch (error) {
      mostrarToast(error.message, "error");
      setGuardando(false);
    }
  }

  const clientesFiltrados = clientes.filter((clienteItem) => {
    const texto = `
      ${clienteItem.tipo || ""}
      ${clienteItem.empresa || ""}
      ${clienteItem.contacto || ""}
      ${clienteItem.telefono || ""}
      ${clienteItem.email || ""}
      ${clienteItem.direccion || ""}
    `.toLowerCase();

    return texto.includes(busquedaCliente.toLowerCase());
  });

  const articulosFiltrados = articulos.filter((articulo) => {
    const texto = `
      ${articulo.descripcion || ""}
      ${articulo.detalle || ""}
      ${articulo.categoria || ""}
      ${articulo.tipo || ""}
    `.toLowerCase();

    return texto.includes(busquedaArticulo.toLowerCase());
  });

  const plantillasFiltradas = plantillas.filter((plantilla) =>
    `${plantilla.nombre || ""} ${plantilla.descripcion || ""}`
      .toLowerCase()
      .includes(busquedaPlantilla.toLowerCase())
  );

  return (
    <>
      <Toast mensaje={toastMensaje} tipo={toastTipo} visible={toastVisible} />

      <input
        ref={inputPdfProveedorRef}
        type="file"
        accept="application/pdf"
        onChange={procesarArchivoPdfProveedor}
        className="hidden"
      />

      {mostrarPreviewImportacionProveedor && (
        <div className="fixed inset-0 z-[100] bg-black/80 p-4 flex items-center justify-center">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 md:p-6 w-full max-w-5xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-start gap-4 mb-5">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-orange-500">
                  Importar proveedor al presupuesto
                </h2>

                <p className="text-zinc-500 mt-1">
                  Revisá categoría y precio antes de agregar al presupuesto.
                </p>
              </div>

              <button
                onClick={() => {
                  setMostrarPreviewImportacionProveedor(false);
                  setPreviewImportacionProveedor([]);
                }}
                className="bg-zinc-800 hover:bg-zinc-700 w-11 h-11 rounded-2xl font-black"
              >
                ✕
              </button>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
              <p className="text-zinc-300 font-bold">
                {tipoImportacionProveedor === "gremio"
                  ? "Importando precio gremio"
                  : "Importando precio final"}
              </p>

              <p className="text-zinc-500 text-sm mt-2">
                Se agregará al presupuesto y también se actualizará la biblioteca de artículos.
                Tipo automático: Material. Proveedor: Integra.
              </p>
            </div>

            <div className="space-y-2">
              {previewImportacionProveedor.map((item, index) => (
                <div
                  key={`${item.sku}-${item.descripcion}`}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-[100px_1fr_120px_140px_220px_110px] gap-3 md:items-center"
                >
                  <div>
                    <p className="text-zinc-500 text-xs">Cant.</p>
                    <p className="font-bold">{item.cantidad}</p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-zinc-500 text-xs">Artículo</p>
                    <p className="font-bold truncate">{item.descripcion}</p>
                    <p className="text-zinc-500 text-xs mt-1">SKU: {item.sku}</p>
                  </div>

                  <div>
                    <p className="text-zinc-500 text-xs">Precio</p>
                    <p className="font-black text-green-400">
                      ${Number(item.precio || 0).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-500 text-xs">Subtotal</p>
                    <p className="font-black text-orange-500">
                      ${Number((item.precio || 0) * (item.cantidad || 1)).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-500 text-xs mb-1">Categoría</p>

                    <select
                      value={item.categoria_id || ""}
                      onChange={(e) =>
                        actualizarCategoriaPreviewProveedor(index, e.target.value)
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
                onClick={confirmarImportacionProveedor}
                className="bg-orange-500 hover:bg-orange-600 px-6 py-4 rounded-2xl font-bold"
              >
                Agregar {previewImportacionProveedor.length} ítems
              </button>

              <button
                onClick={() => {
                  setMostrarPreviewImportacionProveedor(false);
                  setPreviewImportacionProveedor([]);
                }}
                className="bg-zinc-700 hover:bg-zinc-600 px-6 py-4 rounded-2xl font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-black text-white p-4 md:p-6 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-5xl font-black text-orange-500 leading-tight">
                {modoEdicion ? "Editar Presupuesto" : "Nuevo Presupuesto"}
              </h1>

              <p className="text-zinc-400 mt-1 text-xs md:text-base">
                Presupuesto N° {numeroPresupuesto}
              </p>
            </div>

            <div className="flex flex-col gap-2 shrink-0 md:grid md:grid-cols-2 md:w-auto">
              <button
                onClick={guardarPresupuesto}
                disabled={guardando}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 px-3 md:px-4 py-2 md:py-4 rounded-xl md:rounded-2xl font-bold text-sm md:text-base text-center"
              >
                {guardando ? "..." : "Guardar"}
              </button>

              <Link
                to="/"
                className="bg-zinc-700 hover:bg-zinc-600 px-3 md:px-4 py-2 md:py-4 rounded-xl md:rounded-2xl font-bold text-sm md:text-base text-center"
              >
                Volver
              </Link>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 md:p-3 mb-4">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-1.5 md:gap-2 items-center">
              <span className="text-orange-500 font-black text-sm md:text-base shrink-0">
                Cliente:
              </span>

              <input
                type="text"
                placeholder="Seleccionar"
                value={cliente}
                onChange={(e) => {
                  setCliente(e.target.value);
                  setClienteSeleccionado(null);
                }}
                className="min-w-0 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 md:px-3 py-2 text-sm"
              />

              <div className="relative shrink-0">
                <button
                  onClick={() => setMostrarMenuCliente(!mostrarMenuCliente)}
                  className="bg-zinc-800 hover:bg-zinc-700 w-9 md:w-10 h-9 md:h-10 rounded-xl text-base md:text-lg shrink-0"
                >
                  🔍
                </button>

                {mostrarMenuCliente && (
                  <div className="absolute right-0 top-11 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden z-[90] min-w-64 shadow-2xl">
                    <button
                      onClick={() => {
                        setMostrarClientes(!mostrarClientes);
                        setMostrarMenuCliente(false);
                      }}
                      className="w-full text-left px-5 py-4 hover:bg-zinc-800 font-bold"
                    >
                      👥 Buscar cliente existente
                    </button>

                    <button
                      onClick={importarContactoCliente}
                      className="w-full text-left px-5 py-4 hover:bg-zinc-800 font-bold"
                    >
                      👤 Importar contacto
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={limpiarClienteSeleccionado}
                className="bg-red-500 hover:bg-red-600 w-9 md:w-10 h-9 md:h-10 rounded-xl font-black shrink-0 text-sm md:text-base"
              >
                ✕
              </button>

              <button
                onClick={() => setMostrarDatosCliente(!mostrarDatosCliente)}
                className="bg-zinc-800 hover:bg-zinc-700 w-9 md:w-10 h-9 md:h-10 rounded-xl text-sm md:text-lg shrink-0"
              >
                {mostrarDatosCliente ? "▲" : "▼"}
              </button>
            </div>

            {mostrarClientes && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3 mt-4">
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={busquedaCliente}
                  onChange={(e) => setBusquedaCliente(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4"
                />

                <div className="max-h-72 overflow-auto space-y-2">
                  {clientesFiltrados.map((clienteItem) => (
                    <button
                      key={clienteItem.id}
                      onClick={() => seleccionarCliente(clienteItem)}
                      className="w-full text-left bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-2xl p-4"
                    >
                      <p className="font-bold">{clienteItem.empresa}</p>

                      {clienteItem.contacto && (
                        <p className="text-zinc-400 text-sm mt-1">
                          {clienteItem.contacto}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mostrarDatosCliente && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                <input
                  type="text"
                  placeholder="Teléfono"
                  value={clienteTelefono}
                  onChange={(e) => setClienteTelefono(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                />

                <input
                  type="text"
                  placeholder="Email"
                  value={clienteEmail}
                  onChange={(e) => setClienteEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                />

                <input
                  type="text"
                  placeholder="Dirección"
                  value={clienteDireccion}
                  onChange={(e) => setClienteDireccion(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 md:col-span-2"
                />

                <select
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                >
                  <option value="ARS">Pesos Argentinos</option>
                  <option value="USD">Dólares</option>
                </select>

                <div>
                  <label className="block text-zinc-400 mb-2">
                    Presupuesto válido hasta
                  </label>

                  <div className="relative">
                    <input
                      id="validoHasta"
                      type="date"
                      value={validoHasta}
                      onChange={(e) => setValidoHasta(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 pr-16 text-white"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById("validoHasta");
                        if (!input) return;
                        input.showPicker?.();
                        input.focus();
                        input.click();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-xl text-lg"
                    >
                      📅
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Descripción corta"
                  value={descripcionCorta}
                  onChange={(e) => setDescripcionCorta(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 md:col-span-2"
                />

                <textarea
                  placeholder="Descripción larga"
                  value={descripcionLarga}
                  onChange={(e) => setDescripcionLarga(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 min-h-[160px] md:col-span-2"
                />
              </div>
            )}
          </div>


          {mostrarPlantillas && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-6">
              <input
                type="text"
                placeholder="Buscar plantilla..."
                value={busquedaPlantilla}
                onChange={(e) => setBusquedaPlantilla(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mb-5"
              />

              <div className="space-y-3">
                {plantillasFiltradas.map((plantilla) => (
                  <div
                    key={plantilla.id}
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center gap-4"
                  >
                    <div>
                      <p className="font-bold text-lg">{plantilla.nombre}</p>

                      {plantilla.descripcion && (
                        <p className="text-zinc-500 text-sm mt-1">
                          {plantilla.descripcion}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => agregarPlantillaAlPresupuesto(plantilla)}
                      className="bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-xl font-bold"
                    >
                      Cargar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mostrarBiblioteca && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-6">
              <input
                type="text"
                placeholder="Buscar artículo..."
                value={busquedaArticulo}
                onChange={(e) => setBusquedaArticulo(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mb-5"
              />

              <div className="space-y-3 max-h-[420px] overflow-auto">
                {articulosFiltrados.map((articulo) => (
                  <div
                    key={articulo.id}
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center gap-4"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-lg">
                        {articulo.descripcion}
                      </p>

                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-orange-400">
                          {articulo.tipo || "-"}
                        </span>

                        <span className="text-orange-400">
                          {articulo.categoria || "-"}
                        </span>
                      </div>

                      <p className="text-zinc-400 mt-2">
                        {moneda === "USD" ? "USD $" : "$"}
                        {Number(articulo.precio || 0).toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => agregarArticuloAlPresupuesto(articulo)}
                      className="bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-xl font-bold"
                    >
                      Agregar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl overflow-hidden">
            <div className="hidden md:grid grid-cols-[90px_1fr_160px_80px] gap-4 px-4 py-3 text-sm text-zinc-500 border-b border-zinc-800">
              <span>Cant.</span>
              <span>Artículo</span>
              <span className="text-right">Total</span>
              <span className="text-right">Acción</span>
            </div>

            {items.length === 0 && (
              <div className="p-6 text-center text-zinc-500">
                No hay ítems cargados.
              </div>
            )}

            {items.map((item, index) => {
              const subtotalItem =
                (Number(item.cantidad) || 0) *
                (Number(item.precio) || 0);

              const expandido =
                itemExpandido === index;

              return (
                <div
                  key={index}
                  className="border-b border-zinc-800 last:border-b-0"
                >
                  <div className="grid grid-cols-[64px_1fr_auto_auto] md:grid-cols-[90px_1fr_160px_80px] gap-3 md:gap-4 items-center p-3 md:p-4">
                    <input
                      type="number"
                      value={item.cantidad}
                      onChange={(e) =>
                        actualizarItem(
                          index,
                          "cantidad",
                          e.target.value
                        )
                      }
                      className="w-16 md:w-20 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center font-bold"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setItemExpandido(
                          expandido ? null : index
                        )
                      }
                      className="min-w-0 text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-bold text-white truncate">
                          {item.descripcion || "Artículo sin descripción"}
                        </p>

                        <span className="text-zinc-500 text-xs shrink-0">
                          {expandido ? "▲" : "▼"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-1 text-xs">
                        <span className="text-orange-400">
                          Tipo: {item.tipo || "-"}
                        </span>

                        <span className="text-zinc-500">
                          ·
                        </span>

                        <span className="text-zinc-400">
                          Categoría: {item.categoria || "-"}
                        </span>
                      </div>
                    </button>

                    <div className="text-right">
                      <p className="text-orange-500 font-black whitespace-nowrap">
                        {moneda === "USD" ? "USD $" : "$"}
                        {subtotalItem.toLocaleString()}
                      </p>

                      <p className="text-zinc-600 text-xs md:hidden">
                        Total
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        eliminarItem(index)
                      }
                      className="bg-red-500 hover:bg-red-600 w-11 h-11 rounded-xl font-black"
                    >
                      X
                    </button>
                  </div>

                  {expandido && (
                    <div className="bg-zinc-950/70 border-t border-zinc-800 px-3 md:px-4 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-4">
                        <textarea
                          placeholder="Descripción larga / detalle"
                          value={item.detalle || ""}
                          onChange={(e) =>
                            actualizarItem(
                              index,
                              "detalle",
                              e.target.value
                            )
                          }
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 min-h-24 text-zinc-300"
                        />

                        <div>
                          <label className="block text-zinc-500 text-sm mb-2">
                            Precio unitario
                          </label>

                          <input
                            type="number"
                            value={item.precio}
                            onChange={(e) =>
                              actualizarItem(
                                index,
                                "precio",
                                e.target.value
                              )
                            }
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>


          {mostrarMenuFlotante && (
            <div className="fixed bottom-28 right-4 z-[90] flex flex-col gap-2">
              <button
                onClick={() => {
                  setMostrarBiblioteca(!mostrarBiblioteca);
                  setMostrarPlantillas(false);
                  setMostrarMenuFlotante(false);
                }}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-4 py-3 rounded-2xl text-left shadow-2xl"
              >
                📚 Biblioteca
              </button>

              <button
                onClick={() => {
                  setMostrarPlantillas(!mostrarPlantillas);
                  setMostrarBiblioteca(false);
                  setMostrarMenuFlotante(false);
                }}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-4 py-3 rounded-2xl text-left shadow-2xl"
              >
                📋 Plantilla
              </button>

              <button
                onClick={() => {
                  agregarItemManual();
                  setMostrarMenuFlotante(false);
                }}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-4 py-3 rounded-2xl text-left shadow-2xl"
              >
                ✍ Manual
              </button>

              <div className="relative">
                <button
                  onClick={() =>
                    setMenuImportarProveedorAbierto(!menuImportarProveedorAbierto)
                  }
                  className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-4 py-3 rounded-2xl text-left shadow-2xl"
                >
                  📄 Importar proveedor
                </button>

                {menuImportarProveedorAbierto && (
                  <div className="absolute right-full bottom-0 mr-2 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden z-[120] min-w-52 shadow-2xl">
                    <button
                      onClick={() => iniciarImportacionProveedor("gremio")}
                      disabled={procesandoPdfProveedor}
                      className="w-full text-left px-5 py-4 hover:bg-zinc-800 font-bold disabled:opacity-50"
                    >
                      📥 Importar gremio
                    </button>

                    <button
                      onClick={() => iniciarImportacionProveedor("final")}
                      disabled={procesandoPdfProveedor}
                      className="w-full text-left px-5 py-4 hover:bg-zinc-800 font-bold disabled:opacity-50"
                    >
                      📥 Importar final
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => setMostrarMenuFlotante(!mostrarMenuFlotante)}
            className="fixed bottom-28 right-4 z-[95] bg-orange-500 hover:bg-orange-600 w-16 h-16 rounded-full text-4xl font-light shadow-2xl"
          >
            +
          </button>

          <div className="fixed left-0 right-0 bottom-0 z-50 bg-black/90 border-t border-zinc-800 backdrop-blur">
            <div className="max-w-7xl mx-auto p-3 md:p-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 md:p-4 flex items-center justify-between gap-3">
                <div className="text-sm text-zinc-400">
                  <p>
                    {items.length} ítems
                  </p>

                  <p className="hidden sm:block">
                    Factura C - IVA no discriminado
                  </p>
                </div>

                <div className="flex items-center gap-4 md:gap-8">
                  <div className="hidden sm:block text-right">
                    <p className="text-zinc-500 text-sm">
                      Subtotal
                    </p>

                    <p className="font-bold">
                      {moneda === "USD" ? "USD $" : "$"}
                      {subtotal.toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-zinc-500 text-sm">
                      Total
                    </p>

                    <p className="text-orange-500 font-black text-xl md:text-2xl">
                      {moneda === "USD" ? "USD $" : "$"}
                      {total.toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={guardarPresupuesto}
                    disabled={guardando}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 px-4 md:px-6 py-3 rounded-xl font-bold"
                  >
                    {guardando ? "..." : "Guardar"}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
