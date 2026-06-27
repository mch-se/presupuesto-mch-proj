import React from "react";
import { supabase } from "../lib/supabase";
import { Link, useNavigate, useParams } from "react-router-dom";
import Toast from "../components/Toast";
import ClientePanel from "../components/ClientePanel";
import PlantillasPanel from "../components/PlantillasPanel";
import BibliotecaPanel from "../components/BibliotecaPanel";
import ItemsPresupuesto from "../components/ItemsPresupuesto";
import MenuFlotante from "../components/MenuFlotante";
import ResumenTotal from "../components/ResumenTotal";
import ImportadorUniversal from "../components/ImportadorUniversal";
import ClienteFormulario from "../components/ClienteFormulario";
import { seleccionarContacto } from "../lib/contactosPermisos";


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
  const [mostrarFormularioCliente, setMostrarFormularioCliente] =
    React.useState(false);
  const [clienteFormTipo, setClienteFormTipo] = React.useState("Particular");
  const [clienteFormEmpresa, setClienteFormEmpresa] = React.useState("");
  const [clienteFormContacto, setClienteFormContacto] = React.useState("");
  const [clienteFormTelefono, setClienteFormTelefono] = React.useState("");
  const [clienteFormEmail, setClienteFormEmail] = React.useState("");
  const [clienteFormDireccion, setClienteFormDireccion] = React.useState("");
  const [clienteFormObservaciones, setClienteFormObservaciones] =
    React.useState("");

  const [items, setItems] = React.useState([]);
  const [itemExpandido, setItemExpandido] = React.useState(null);
  const [numeroPresupuesto, setNumeroPresupuesto] = React.useState("");

  const [mostrarBiblioteca, setMostrarBiblioteca] = React.useState(false);
  const [mostrarSelectorBiblioteca, setMostrarSelectorBiblioteca] =
    React.useState(false);
  const [articulos, setArticulos] = React.useState([]);
  const [articulosCargados, setArticulosCargados] = React.useState(false);
  const [busquedaArticulo, setBusquedaArticulo] = React.useState("");
  const [categoriaBusquedaArticulo, setCategoriaBusquedaArticulo] = React.useState("Todas");
  const [mostrarFiltroCategoriasArticulo, setMostrarFiltroCategoriasArticulo] = React.useState(false);
  const [mostrarResumenTotal, setMostrarResumenTotal] = React.useState(false);

  const [mostrarPlantillas, setMostrarPlantillas] = React.useState(false);
  const [mostrarMenuFlotante, setMostrarMenuFlotante] = React.useState(false);
  const [plantillas, setPlantillas] = React.useState([]);
  const [busquedaPlantilla, setBusquedaPlantilla] = React.useState("");

  const [categorias, setCategorias] = React.useState([]);
  const [tipos, setTipos] = React.useState([]);

  const [guardando, setGuardando] = React.useState(false);

  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastMensaje, setToastMensaje] = React.useState("");
  const [toastTipo, setToastTipo] = React.useState("ok");

  const importadorCsvRef = React.useRef(null);

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

  React.useEffect(() => {
    console.info("[Contactos] Estado temporal actualizado", {
      origen: "presupuesto",
      mostrarFormularioCliente,
      tipo: clienteFormTipo,
      empresa: clienteFormEmpresa,
      telefono: clienteFormTelefono,
      email: clienteFormEmail,
    });

    if (mostrarFormularioCliente) {
      console.info("[Contactos] Mostrando formulario", {
        origen: "presupuesto",
      });
    }
  }, [
    mostrarFormularioCliente,
    clienteFormTipo,
    clienteFormEmpresa,
    clienteFormTelefono,
    clienteFormEmail,
  ]);

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

    setItems(
      (itemsData || []).map((item) => ({
        ...item,
        precio_costo: item.precio_costo ?? item.costo ?? 0,
        costo: item.precio_costo ?? item.costo ?? 0,
        precio_final: item.precio_final ?? item.precio ?? 0,
        precio_base_trabajo: item.precio_base_trabajo ?? item.precio ?? 0,
        descuento_trabajo: item.descuento_trabajo ?? 0,
        recargo_trabajo: item.recargo_trabajo ?? 0,
        actualizar_biblioteca: false,
      }))
    );
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
    setArticulosCargados(true);
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
    console.info("[Contactos] importarContacto inicio", {
      origen: "presupuesto",
    });
    console.info("[Contactos] Entrando importarContacto", {
      origen: "presupuesto",
    });
    setMostrarMenuCliente(false);

    try {
      console.info("[Contactos] antes de await seleccionarContacto", {
        origen: "presupuesto",
      });
      const contactos = await seleccionarContacto();
      console.info("[Contactos] después de await seleccionarContacto", {
        origen: "presupuesto",
      });
      console.info("[Contactos] Contacto recibido en React", {
        origen: "presupuesto",
        contactos,
      });
      console.info("[Contactos] contacto recibido en pantalla", {
        origen: "presupuesto",
        contactos,
      });

      const contactoImportado = contactos?.[0];

      if (!contactoImportado) {
        return;
      }

      const nombre = contactoImportado.name?.[0] || "";
      const telefonoContacto = contactoImportado.tel?.[0] || "";
      const emailContacto = contactoImportado.email?.[0] || "";
      const organizacionContacto = contactoImportado.organization?.[0] || "";

      console.info("[Contactos] Contacto seleccionado");
      console.info("[Contactos] Precargando formulario de cliente");
      console.info("[Contactos] Seteando estado temporal", {
        tipo: organizacionContacto ? "Empresa" : "Particular",
        empresa: organizacionContacto || nombre,
        telefono: telefonoContacto,
        email: emailContacto,
      });

      setClienteFormTipo(organizacionContacto ? "Empresa" : "Particular");
      setClienteFormEmpresa(organizacionContacto || nombre);
      setClienteFormContacto("");
      setClienteFormTelefono(telefonoContacto);
      setClienteFormEmail(emailContacto);
      setClienteFormDireccion("");
      setClienteFormObservaciones("");
      console.info("[Contactos] abriendo formulario", {
        origen: "presupuesto",
      });
      console.info("[Contactos] Abriendo formulario", {
        origen: "presupuesto",
      });
      setMostrarFormularioCliente(true);
      setMostrarDatosCliente(false);
      setMostrarClientes(false);

      mostrarToast("Contacto importado. Revisá y guardá el cliente.", "ok");
      return;

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

      if (error?.code === "CONTACTS_UNSUPPORTED") {
        mostrarToast(
          "Este dispositivo no permite importar contactos. Cargá el cliente manualmente.",
          "error"
        );
        return;
      }

      if (error?.code === "CONTACTS_PERMISSION_DENIED") {
        mostrarToast("Permiso de contactos denegado", "error");
        return;
      }

      mostrarToast("No se pudo importar el contacto", "error");
    }
  }

  function cerrarFormularioCliente() {
    setMostrarFormularioCliente(false);
    setClienteFormTipo("Particular");
    setClienteFormEmpresa("");
    setClienteFormContacto("");
    setClienteFormTelefono("");
    setClienteFormEmail("");
    setClienteFormDireccion("");
    setClienteFormObservaciones("");
  }

  async function guardarClienteImportado() {
    if (clienteFormTipo === "Empresa" && !clienteFormEmpresa) {
      mostrarToast("Ingresar empresa", "error");
      return;
    }

    if (clienteFormTipo === "Particular" && !clienteFormEmpresa) {
      mostrarToast("Ingresar persona", "error");
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
      tipo: clienteFormTipo,
      empresa: clienteFormEmpresa,
      contacto: clienteFormTipo === "Empresa" ? clienteFormContacto : "",
      telefono: clienteFormTelefono,
      email: clienteFormEmail,
      direccion: clienteFormDireccion,
      observaciones: clienteFormObservaciones,
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

    console.info("[Contactos] Cliente guardado");

    setClientes((actuales) => [clienteCreado, ...actuales]);
    seleccionarCliente(clienteCreado);
    cerrarFormularioCliente();

    console.info("[Contactos] Cliente seleccionado en presupuesto");
    mostrarToast("Cliente creado y seleccionado", "ok");
  }

  function limpiarClienteSeleccionado() {
    setClienteSeleccionado(null);
    setCliente("");
    setClienteTelefono("");
    setClienteEmail("");
    setClienteDireccion("");
    setMostrarMenuCliente(false);
  }

  function esTipoTrabajo(item) {
    return `${item?.tipo || ""}`.toLowerCase().trim() === "trabajo";
  }

  function calcularPrecioTrabajo(precioBase, descuento, recargo) {
    const base = Number(precioBase) || 0;
    const porcentajeDescuento = Number(descuento) || 0;
    const porcentajeRecargo = Number(recargo) || 0;

    return (
      base -
      base * (porcentajeDescuento / 100) +
      base * (porcentajeRecargo / 100)
    );
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
        precio_costo: 0,
        costo: 0,
        precio_final: 0,
        precio_base_trabajo: 0,
        descuento_trabajo: 0,
        recargo_trabajo: 0,
        articulo_id: null,
        actualizar_biblioteca: false,
      },
    ]);
  }

  function actualizarItem(index, campo, valor) {
    const nuevosItems = [...items];

    nuevosItems[index][campo] = valor;

    if (campo === "precio_costo") {
      nuevosItems[index].costo = valor;
    }

    if (campo === "precio") {
      nuevosItems[index].precio_final = valor;
    }

    if (
      campo === "precio_base_trabajo" ||
      campo === "descuento_trabajo" ||
      campo === "recargo_trabajo"
    ) {
      const itemActualizado = nuevosItems[index];

      const precioTrabajo = calcularPrecioTrabajo(
        itemActualizado.precio_base_trabajo,
        itemActualizado.descuento_trabajo,
        itemActualizado.recargo_trabajo
      );

      itemActualizado.precio = precioTrabajo;
      itemActualizado.precio_final = precioTrabajo;
    }

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

  async function actualizarBibliotecaDesdeItems(itemsBase) {
    const itemsActualizar = (itemsBase || []).filter(
      (item) => item.actualizar_biblioteca && item.articulo_id
    );

    for (const item of itemsActualizar) {
      const tipo = `${item.tipo || ""}`.toLowerCase().trim();

      const precioCosto =
        Number(item.precio_costo ?? item.costo ?? 0) || 0;

      const precioFinal =
        Number(item.precio_final ?? item.precio ?? 0) || 0;

      const datosArticulo = {
        precio_final: precioFinal,
        precio: precioFinal,
      };

      if (tipo === "material") {
        datosArticulo.precio_costo = precioCosto;
        datosArticulo.costo = precioCosto;
      }

      if (tipo === "trabajo") {
        datosArticulo.precio_base_trabajo =
          Number(item.precio_base_trabajo ?? item.precio ?? 0) || 0;

        datosArticulo.descuento_trabajo =
          Number(item.descuento_trabajo ?? 0) || 0;

        datosArticulo.recargo_trabajo =
          Number(item.recargo_trabajo ?? 0) || 0;
      }

      const { error } = await supabase
        .from("articulos")
        .update(datosArticulo)
        .eq("id", item.articulo_id);

      if (error) {
        throw error;
      }
    }
  }


  function agregarArticuloAlPresupuesto(articulo) {
    const precioCosto =
      Number(articulo.precio_costo ?? articulo.costo ?? 0) || 0;

    const precioFinal =
      Number(articulo.precio_final ?? articulo.precio ?? 0) || 0;

    const precioBaseTrabajo =
      Number(articulo.precio_base_trabajo ?? articulo.precio ?? 0) || 0;

    const descuentoTrabajo =
      Number(articulo.descuento_trabajo ?? 0) || 0;

    const recargoTrabajo =
      Number(articulo.recargo_trabajo ?? 0) || 0;

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
        precio: precioFinal,
        precio_costo: precioCosto,
        costo: precioCosto,
        precio_final: precioFinal,
        precio_base_trabajo: precioBaseTrabajo,
        descuento_trabajo: descuentoTrabajo,
        recargo_trabajo: recargoTrabajo,
        articulo_id: articulo.id || null,
        actualizar_biblioteca: false,
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
      precio_costo: item.precio_costo ?? item.costo ?? 0,
      costo: item.precio_costo ?? item.costo ?? 0,
      precio_final: item.precio_final ?? item.precio ?? 0,
      precio_base_trabajo: item.precio_base_trabajo ?? item.precio ?? 0,
      descuento_trabajo: item.descuento_trabajo ?? 0,
      recargo_trabajo: item.recargo_trabajo ?? 0,
      articulo_id: item.articulo_id || null,
      actualizar_biblioteca: false,
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
          precio_costo: Number(item.precio_costo ?? item.costo ?? 0) || 0,
          costo: Number(item.precio_costo ?? item.costo ?? 0) || 0,
          precio_final: Number(item.precio_final ?? item.precio ?? 0) || 0,
          precio_base_trabajo: Number(item.precio_base_trabajo ?? item.precio ?? 0) || 0,
          descuento_trabajo: Number(item.descuento_trabajo ?? 0) || 0,
          recargo_trabajo: Number(item.recargo_trabajo ?? 0) || 0,
          articulo_id: item.articulo_id || null,
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
          precio_costo: Number(item.precio_costo ?? item.costo ?? 0) || 0,
          costo: Number(item.precio_costo ?? item.costo ?? 0) || 0,
          precio_final: Number(item.precio_final ?? item.precio ?? 0) || 0,
          precio_base_trabajo: Number(item.precio_base_trabajo ?? item.precio ?? 0) || 0,
          descuento_trabajo: Number(item.descuento_trabajo ?? 0) || 0,
          recargo_trabajo: Number(item.recargo_trabajo ?? 0) || 0,
          articulo_id: item.articulo_id || null,
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

      await actualizarBibliotecaDesdeItems(items);

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

    const coincideBusqueda = texto.includes(
      busquedaArticulo.toLowerCase()
    );

    const coincideCategoria =
      categoriaBusquedaArticulo === "Todas"
        ? true
        : `${articulo.categoria || ""}`.toLowerCase() ===
          categoriaBusquedaArticulo.toLowerCase();

    return coincideBusqueda && coincideCategoria;
  });

  const plantillasFiltradas = plantillas.filter((plantilla) =>
    `${plantilla.nombre || ""} ${plantilla.descripcion || ""}`
      .toLowerCase()
      .includes(busquedaPlantilla.toLowerCase())
  );

  return (
    <>
      <Toast mensaje={toastMensaje} tipo={toastTipo} visible={toastVisible} />

      <ImportadorUniversal
        ref={importadorCsvRef}
        contexto="presupuesto"
        articulos={articulos}
        categorias={categorias}
        tipos={tipos}
        setItems={setItems}
        obtenerArticulos={obtenerArticulos}
        mostrarToast={mostrarToast}
        autoImportarCompartido={
          articulosCargados && categorias.length > 0 && tipos.length > 0
        }
      />

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

          <ClientePanel
            cliente={cliente}
            setCliente={setCliente}
            setClienteSeleccionado={setClienteSeleccionado}
            mostrarMenuCliente={mostrarMenuCliente}
            setMostrarMenuCliente={setMostrarMenuCliente}
            mostrarClientes={mostrarClientes}
            setMostrarClientes={setMostrarClientes}
            mostrarDatosCliente={mostrarDatosCliente}
            setMostrarDatosCliente={setMostrarDatosCliente}
            busquedaCliente={busquedaCliente}
            setBusquedaCliente={setBusquedaCliente}
            clientesFiltrados={clientesFiltrados}
            seleccionarCliente={seleccionarCliente}
            importarContactoCliente={importarContactoCliente}
            limpiarClienteSeleccionado={limpiarClienteSeleccionado}
            clienteTelefono={clienteTelefono}
            setClienteTelefono={setClienteTelefono}
            clienteEmail={clienteEmail}
            setClienteEmail={setClienteEmail}
            clienteDireccion={clienteDireccion}
            setClienteDireccion={setClienteDireccion}
            moneda={moneda}
            setMoneda={setMoneda}
            validoHasta={validoHasta}
            setValidoHasta={setValidoHasta}
            descripcionCorta={descripcionCorta}
            setDescripcionCorta={setDescripcionCorta}
            descripcionLarga={descripcionLarga}
            setDescripcionLarga={setDescripcionLarga}
          />

          {mostrarFormularioCliente && (
            <div className="mb-4">
              <ClienteFormulario
                tipo={clienteFormTipo}
                setTipo={setClienteFormTipo}
                empresa={clienteFormEmpresa}
                setEmpresa={setClienteFormEmpresa}
                contacto={clienteFormContacto}
                setContacto={setClienteFormContacto}
                telefono={clienteFormTelefono}
                setTelefono={setClienteFormTelefono}
                email={clienteFormEmail}
                setEmail={setClienteFormEmail}
                direccion={clienteFormDireccion}
                setDireccion={setClienteFormDireccion}
                observaciones={clienteFormObservaciones}
                setObservaciones={setClienteFormObservaciones}
                onGuardar={guardarClienteImportado}
                onCancelar={cerrarFormularioCliente}
              />
            </div>
          )}

          <PlantillasPanel
            mostrarPlantillas={mostrarPlantillas}
            busquedaPlantilla={busquedaPlantilla}
            setBusquedaPlantilla={setBusquedaPlantilla}
            plantillasFiltradas={plantillasFiltradas}
            agregarPlantillaAlPresupuesto={agregarPlantillaAlPresupuesto}
          />

          <BibliotecaPanel
            mostrarBiblioteca={mostrarBiblioteca}
            busquedaArticulo={busquedaArticulo}
            setBusquedaArticulo={setBusquedaArticulo}
            categoriaBusquedaArticulo={categoriaBusquedaArticulo}
            setCategoriaBusquedaArticulo={setCategoriaBusquedaArticulo}
            mostrarFiltroCategoriasArticulo={mostrarFiltroCategoriasArticulo}
            setMostrarFiltroCategoriasArticulo={setMostrarFiltroCategoriasArticulo}
            categorias={categorias}
            articulosFiltrados={articulosFiltrados}
            moneda={moneda}
            agregarArticuloAlPresupuesto={agregarArticuloAlPresupuesto}
          />

          <ItemsPresupuesto
            items={items}
            itemExpandido={itemExpandido}
            setItemExpandido={setItemExpandido}
            actualizarItem={actualizarItem}
            eliminarItem={eliminarItem}
            esTipoTrabajo={esTipoTrabajo}
            moneda={moneda}
          />


          <MenuFlotante
            mostrarMenuFlotante={mostrarMenuFlotante}
            setMostrarMenuFlotante={setMostrarMenuFlotante}
            mostrarBiblioteca={mostrarBiblioteca}
            setMostrarBiblioteca={setMostrarBiblioteca}
            setMostrarPlantillas={setMostrarPlantillas}
            agregarItemManual={agregarItemManual}
            onImportarCsv={() => importadorCsvRef.current?.abrir()}
          />

          <ResumenTotal
            items={items}
            moneda={moneda}
            subtotal={subtotal}
            total={total}
            mostrarResumenTotal={mostrarResumenTotal}
            setMostrarResumenTotal={setMostrarResumenTotal}
            guardarPresupuesto={guardarPresupuesto}
            guardando={guardando}
          />

        </div>
      </div>
    </>
  );
}
