import React from "react";
import { supabase } from "../lib/supabase";
import { Link, useNavigate, useParams } from "react-router-dom";
import Toast from "../components/Toast";

export default function Presupuestos() {
  const navigate = useNavigate();
  const { id } = useParams();
  const modoEdicion = !!id;

  const [cliente, setCliente] = React.useState("");
  const [descripcionCorta, setDescripcionCorta] = React.useState("");
  const [descripcionLarga, setDescripcionLarga] = React.useState("");
  const [moneda, setMoneda] = React.useState("ARS");

  const [clienteSeleccionado, setClienteSeleccionado] = React.useState(null);
  const [clientes, setClientes] = React.useState([]);
  const [mostrarClientes, setMostrarClientes] = React.useState(false);
  const [busquedaCliente, setBusquedaCliente] = React.useState("");
  const [clienteTelefono, setClienteTelefono] = React.useState("");
  const [clienteEmail, setClienteEmail] = React.useState("");
  const [clienteDireccion, setClienteDireccion] = React.useState("");

  const [items, setItems] = React.useState([]);
  const [numeroPresupuesto, setNumeroPresupuesto] = React.useState("");

  const [mostrarBiblioteca, setMostrarBiblioteca] = React.useState(false);
  const [articulos, setArticulos] = React.useState([]);
  const [busquedaArticulo, setBusquedaArticulo] = React.useState("");

  const [mostrarPlantillas, setMostrarPlantillas] = React.useState(false);
  const [plantillas, setPlantillas] = React.useState([]);
  const [busquedaPlantilla, setBusquedaPlantilla] = React.useState("");

  const [guardando, setGuardando] = React.useState(false);

  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastMensaje, setToastMensaje] = React.useState("");
  const [toastTipo, setToastTipo] = React.useState("ok");

  React.useEffect(() => {
    obtenerArticulos();
    obtenerClientes();
    obtenerPlantillas();

    if (modoEdicion) {
      cargarPresupuesto();
    } else {
      generarNumeroPresupuesto();
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

    const puedeEditar =
      rol === "admin" ||
      rol === "socio" ||
      esPropio;

    if (!puedeEditar) {
      mostrarToast(
        "No tenés permisos para editar este presupuesto",
        "error"
      );

      navigate("/historial");
      return;
    }

    setCliente(data.cliente_empresa || data.cliente || "");
    setDescripcionCorta(data.descripcion_corta || "");
    setDescripcionLarga(data.descripcion_larga || "");
    setMoneda(data.moneda || "ARS");
    setNumeroPresupuesto(data.numero || "");

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
  }

  function limpiarClienteSeleccionado() {
    setClienteSeleccionado(null);
    setCliente("");
    setClienteTelefono("");
    setClienteEmail("");
    setClienteDireccion("");
  }

  function agregarItemManual() {
    setItems([
      ...items,
      {
        descripcion: "",
        detalle: "",
        cantidad: "",
        precio: "",
      },
    ]);
  }

  function actualizarItem(index, campo, valor) {
    const nuevosItems = [...items];
    nuevosItems[index][campo] = valor;
    setItems(nuevosItems);
  }

  function eliminarItem(index) {
    setItems(items.filter((_, i) => i !== index));
  }

  function agregarArticuloAlPresupuesto(articulo) {
    setItems([
      ...items,
      {
        descripcion: articulo.descripcion,
        detalle: articulo.detalle || "",
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
      descripcion: item.descripcion,
      detalle: item.detalle || "",
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

      const datosCliente = {
        cliente_id: clienteSeleccionado?.id || null,
        cliente_empresa: clienteSeleccionado?.empresa || cliente || "",
        cliente_contacto: clienteSeleccionado?.contacto || "",
        cliente_telefono: clienteTelefono || "",
        cliente_email: clienteEmail || "",
        cliente_direccion: clienteDireccion || "",
      };

      const datosPresupuesto = {
        cliente,
        descripcion_corta: descripcionCorta,
        descripcion_larga: descripcionLarga,
        subtotal,
        iva,
        total,
        estado: "Edición",
        moneda,
        tipo_factura: "C",
        aplica_iva: false,
        ...datosCliente,
      };

      if (modoEdicion) {
        const { error } = await supabase
          .from("presupuestos")
          .update(datosPresupuesto)
          .eq("id", id);

        if (error) {
          mostrarToast(error.message, "error");
          setGuardando(false);
          return;
        }

        await supabase
          .from("presupuesto_items")
          .delete()
          .eq("presupuesto_id", id);

        const nuevosItems = items.map((item) => ({
          presupuesto_id: id,
          descripcion: item.descripcion,
          detalle: item.detalle || "",
          cantidad: Number(item.cantidad) || 0,
          precio: Number(item.precio) || 0,
          subtotal:
            (Number(item.cantidad) || 0) *
            (Number(item.precio) || 0),
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
              ...datosPresupuesto,
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
          cantidad: Number(item.cantidad) || 0,
          precio: Number(item.precio) || 0,
          subtotal:
            (Number(item.cantidad) || 0) *
            (Number(item.precio) || 0),
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
      <Toast
        mensaje={toastMensaje}
        tipo={toastTipo}
        visible={toastVisible}
      />

      <div className="min-h-screen bg-black text-white p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-orange-500">
                {modoEdicion ? "Editar Presupuesto" : "Nuevo Presupuesto"}
              </h1>

              <p className="text-zinc-400 mt-2">
                Presupuesto N° {numeroPresupuesto}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={guardarPresupuesto}
                disabled={guardando}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 px-5 py-3 rounded-2xl font-bold"
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>

              <Link
                to="/"
                className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-2xl font-bold"
              >
                Volver
              </Link>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Cliente"
                    value={cliente}
                    onChange={(e) => {
                      setCliente(e.target.value);
                      setClienteSeleccionado(null);
                    }}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                  />

                  <button
                    onClick={() => setMostrarClientes(!mostrarClientes)}
                    className="bg-zinc-700 hover:bg-zinc-600 px-5 rounded-2xl font-bold"
                  >
                    Buscar
                  </button>
                </div>

                {clienteSeleccionado && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-green-400 font-bold">
                      Cliente seleccionado
                    </p>

                    <button
                      onClick={limpiarClienteSeleccionado}
                      className="mt-3 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl font-bold"
                    >
                      Limpiar cliente
                    </button>
                  </div>
                )}

                {mostrarClientes && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3">
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
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                />
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Descripción corta"
                  value={descripcionCorta}
                  onChange={(e) => setDescripcionCorta(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                />

                <textarea
                  placeholder="Descripción larga"
                  value={descripcionLarga}
                  onChange={(e) => setDescripcionLarga(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 min-h-[220px]"
                />

                <select
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                >
                  <option value="ARS">Pesos Argentinos</option>
                  <option value="USD">Dólares</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => setMostrarBiblioteca(!mostrarBiblioteca)}
              className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-2xl font-bold"
            >
              Biblioteca de artículos
            </button>

            <button
              onClick={agregarItemManual}
              className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-2xl font-bold"
            >
              Agregar ítem manual
            </button>

            <button
              onClick={() => setMostrarPlantillas(!mostrarPlantillas)}
              className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-2xl font-bold"
            >
              Agregar plantilla
            </button>
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
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex justify-between gap-4"
                  >
                    <div>
                      <p className="font-bold text-lg">{articulo.descripcion}</p>

                      {articulo.detalle && (
                        <p className="text-zinc-500 text-sm mt-1 whitespace-pre-wrap">
                          {articulo.detalle}
                        </p>
                      )}

                      <p className="text-zinc-400 mt-2">
                        {moneda === "USD" ? "USD $" : "$"}
                        {Number(articulo.precio).toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => agregarArticuloAlPresupuesto(articulo)}
                      className="bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-xl font-bold self-center"
                    >
                      Agregar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 grid grid-cols-12 gap-4"
              >
                <div className="col-span-12 md:col-span-6">
                  <input
                    type="text"
                    placeholder="Descripción"
                    value={item.descripcion}
                    onChange={(e) =>
                      actualizarItem(index, "descripcion", e.target.value)
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                  />

                  <textarea
                    placeholder="Descripción larga / detalle"
                    value={item.detalle || ""}
                    onChange={(e) =>
                      actualizarItem(index, "detalle", e.target.value)
                    }
                    className="w-full mt-3 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 min-h-24 text-zinc-300"
                  />
                </div>

                <div className="col-span-4 md:col-span-2">
                  <input
                    type="number"
                    placeholder="Cant."
                    value={item.cantidad}
                    onChange={(e) =>
                      actualizarItem(index, "cantidad", e.target.value)
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                  />
                </div>

                <div className="col-span-4 md:col-span-2">
                  <input
                    type="number"
                    placeholder="Precio"
                    value={item.precio}
                    onChange={(e) =>
                      actualizarItem(index, "precio", e.target.value)
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                  />
                </div>

                <div className="col-span-3 md:col-span-1 flex items-center justify-center font-bold text-orange-500">
                  {moneda === "USD" ? "USD $" : "$"}
                  {(
                    (Number(item.cantidad) || 0) *
                    (Number(item.precio) || 0)
                  ).toLocaleString()}
                </div>

                <div className="col-span-1 flex items-center justify-end">
                  <button
                    onClick={() => eliminarItem(index)}
                    className="bg-red-500 hover:bg-red-600 px-4 py-3 rounded-xl font-bold"
                  >
                    X
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md ml-auto">
            <div className="space-y-4 text-xl">
              <div className="flex justify-between">
                <span>Subtotal</span>

                <span>
                  {moneda === "USD" ? "USD $" : "$"}
                  {subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-3xl font-black text-orange-500 border-t border-zinc-800 pt-5">
                <span>Total</span>

                <span>
                  {moneda === "USD" ? "USD $" : "$"}
                  {total.toLocaleString()}
                </span>
              </div>

              <p className="text-zinc-500 text-sm">
                Factura C - IVA no discriminado
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}