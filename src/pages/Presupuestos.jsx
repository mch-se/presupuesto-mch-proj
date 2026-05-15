import React from "react";
import { supabase } from "../lib/supabase";
import { Link, useNavigate, useParams } from "react-router-dom";

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

  React.useEffect(() => {
    obtenerArticulos();
    obtenerClientes();

    if (modoEdicion) {
      cargarPresupuesto();
    } else {
      generarNumeroPresupuesto();
    }
  }, []);

  async function cargarPresupuesto() {
    const { data, error } = await supabase
      .from("presupuestos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      alert(error.message);
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

    const numero = presupuestosHoy.length + 1;

    setNumeroPresupuesto(`${numero}-${fechaTexto}`);
  }

  async function obtenerArticulos() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("articulos")
      .select("*")
      .eq("user_id", user.id)
      .order("descripcion");

    if (error) {
      alert(error.message);
      return;
    }

    setArticulos(data || []);
  }

  async function obtenerClientes() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("user_id", user.id)
      .order("empresa");

    if (error) {
      alert(error.message);
      return;
    }

    setClientes(data || []);
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
        cantidad: 1,
        precio: articulo.precio || 0,
      },
    ]);

    setMostrarBiblioteca(false);
  }

  const subtotal = items.reduce((acc, item) => {
    const cantidad = Number(item.cantidad) || 0;
    const precio = Number(item.precio) || 0;
    return acc + cantidad * precio;
  }, 0);

  const iva = subtotal * 0.21;
  const total = subtotal + iva;

  async function guardarPresupuesto() {
    if (!cliente) {
      alert("Ingresar o seleccionar cliente");
      return;
    }

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
      estado: "Pendiente",
      moneda,
      ...datosCliente,
    };

    if (modoEdicion) {
      const { error } = await supabase
        .from("presupuestos")
        .update(datosPresupuesto)
        .eq("id", id);

      if (error) {
        alert(error.message);
        return;
      }

      await supabase
        .from("presupuesto_items")
        .delete()
        .eq("presupuesto_id", id);

      const nuevosItems = items.map((item) => ({
        presupuesto_id: id,
        descripcion: item.descripcion,
        cantidad: Number(item.cantidad) || 0,
        precio: Number(item.precio) || 0,
        subtotal: (Number(item.cantidad) || 0) * (Number(item.precio) || 0),
      }));

      await supabase.from("presupuesto_items").insert(nuevosItems);

      alert("Presupuesto actualizado");
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: presupuesto, error } = await supabase
        .from("presupuestos")
        .insert([
          {
            numero: numeroPresupuesto,
            user_id: user.id,
            ...datosPresupuesto,
          },
        ])
        .select()
        .single();

      if (error) {
        alert(error.message);
        return;
      }

      const itemsInsertar = items.map((item) => ({
        presupuesto_id: presupuesto.id,
        descripcion: item.descripcion,
        cantidad: Number(item.cantidad) || 0,
        precio: Number(item.precio) || 0,
        subtotal: (Number(item.cantidad) || 0) * (Number(item.precio) || 0),
      }));

      await supabase.from("presupuesto_items").insert(itemsInsertar);

      alert("Presupuesto guardado");
    }

    navigate("/historial");
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

  const articulosFiltrados = articulos.filter((articulo) =>
    articulo.descripcion
      ?.toLowerCase()
      .includes(busquedaArticulo.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-bold text-orange-500">
              {modoEdicion ? "Editar Presupuesto" : "Nuevo Presupuesto"}
            </h1>
          </div>

          <div className="flex gap-4">
            <button
              onClick={guardarPresupuesto}
              className="bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-xl font-bold"
            >
              {modoEdicion ? "Actualizar" : "Guardar"}
            </button>

            <Link
              to="/historial"
              className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-xl font-bold"
            >
              Volver
            </Link>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <input
              type="text"
              value={numeroPresupuesto}
              disabled
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />

            <div className="md:col-span-2">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Cliente"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                />

                <button
                  onClick={() => setMostrarClientes(true)}
                  className="bg-zinc-700 hover:bg-zinc-600 px-5 rounded-2xl font-bold"
                >
                  Buscar
                </button>
              </div>
            </div>

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
              placeholder="Descripción corta"
              value={descripcionCorta}
              onChange={(e) => setDescripcionCorta(e.target.value)}
              className="md:col-span-4 bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />

            <textarea
              placeholder="Descripción larga"
              value={descripcionLarga}
              onChange={(e) => setDescripcionLarga(e.target.value)}
              className="md:col-span-4 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 min-h-36"
            />

            {(clienteTelefono ||
              clienteEmail ||
              clienteDireccion ||
              clienteSeleccionado) && (
              <div className="md:col-span-4 bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="text-orange-500 font-bold">
                      Cliente seleccionado
                    </p>

                    <p className="text-zinc-400 mt-2">
                      Contacto: {clienteSeleccionado?.contacto || "-"}
                    </p>

                    <p className="text-zinc-400">
                      Teléfono: {clienteTelefono || "-"}
                    </p>

                    <p className="text-zinc-400">
                      Email: {clienteEmail || "-"}
                    </p>

                    <p className="text-zinc-400">
                      Dirección: {clienteDireccion || "-"}
                    </p>
                  </div>

                  <button
                    onClick={limpiarClienteSeleccionado}
                    className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl font-bold self-start"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-4">
              <button
                onClick={() => setMostrarBiblioteca(true)}
                className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-xl font-bold"
              >
                Biblioteca de Artículos
              </button>

              <button
                onClick={agregarItemManual}
                className="bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-xl font-bold"
              >
                Agregar Item Manual
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 mb-4 px-2 text-zinc-400 font-bold">
            <div className="col-span-6">Descripción</div>
            <div className="col-span-2">Cantidad</div>
            <div className="col-span-2">Precio</div>
            <div className="col-span-2">Subtotal</div>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => {
              const subtotalItem =
                (Number(item.cantidad) || 0) * (Number(item.precio) || 0);

              return (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-4 bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                >
                  <div className="col-span-6">
                    <input
                      type="text"
                      value={item.descripcion}
                      onChange={(e) =>
                        actualizarItem(index, "descripcion", e.target.value)
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.cantidad}
                      onChange={(e) =>
                        actualizarItem(index, "cantidad", e.target.value)
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.precio}
                      onChange={(e) =>
                        actualizarItem(index, "precio", e.target.value)
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3"
                    />
                  </div>

                  <div className="col-span-1 flex items-center text-orange-500 font-bold">
                    {moneda === "USD" ? "USD $" : "$"}
                    {subtotalItem.toLocaleString()}
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => eliminarItem(index)}
                      className="bg-red-500 hover:bg-red-600 px-4 rounded-xl font-bold"
                    >
                      X
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-10 flex justify-end">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-md">
            <div className="space-y-4 text-2xl">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>
                  {moneda === "USD" ? "USD $" : "$"}
                  {subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span>IVA</span>
                <span>
                  {moneda === "USD" ? "USD $" : "$"}
                  {iva.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-4xl font-bold text-orange-500 pt-6 border-t border-zinc-800">
                <span>Total</span>
                <span>
                  {moneda === "USD" ? "USD $" : "$"}
                  {total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {mostrarClientes && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-auto p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-4xl font-bold text-orange-500">
                Seleccionar Cliente
              </h2>

              <button
                onClick={() => setMostrarClientes(false)}
                className="bg-red-500 hover:bg-red-600 px-5 py-3 rounded-xl font-bold"
              >
                X
              </button>
            </div>

            <input
              type="text"
              placeholder="Buscar cliente..."
              value={busquedaCliente}
              onChange={(e) => setBusquedaCliente(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mb-8"
            />

            <div className="space-y-4">
              {clientesFiltrados.map((clienteItem) => (
                <div
                  key={clienteItem.id}
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex justify-between items-center gap-6"
                >
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="bg-orange-500 px-3 py-1 rounded-xl text-sm font-bold">
                        {clienteItem.tipo}
                      </span>

                      <p className="text-2xl font-bold">
                        {clienteItem.empresa}
                      </p>
                    </div>

                    {clienteItem.tipo === "Empresa" && (
                      <p className="text-zinc-400 mt-2">
                        Contacto: {clienteItem.contacto || "-"}
                      </p>
                    )}

                    <p className="text-zinc-400 mt-2">
                      Teléfono: {clienteItem.telefono || "-"}
                    </p>

                    <p className="text-zinc-400">
                      Email: {clienteItem.email || "-"}
                    </p>

                    <p className="text-zinc-400">
                      Dirección: {clienteItem.direccion || "-"}
                    </p>
                  </div>

                  <button
                    onClick={() => seleccionarCliente(clienteItem)}
                    className="bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-xl font-bold"
                  >
                    Seleccionar
                  </button>
                </div>
              ))}

              {clientesFiltrados.length === 0 && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500">
                  No hay clientes encontrados.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {mostrarBiblioteca && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-auto p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-4xl font-bold text-orange-500">
                Biblioteca de Artículos
              </h2>

              <button
                onClick={() => setMostrarBiblioteca(false)}
                className="bg-red-500 hover:bg-red-600 px-5 py-3 rounded-xl font-bold"
              >
                X
              </button>
            </div>

            <input
              type="text"
              placeholder="Buscar artículo..."
              value={busquedaArticulo}
              onChange={(e) => setBusquedaArticulo(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mb-8"
            />

            <div className="space-y-4">
              {articulosFiltrados.map((articulo) => (
                <div
                  key={articulo.id}
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex justify-between items-center"
                >
                  <div>
                    <p className="text-2xl font-bold">{articulo.descripcion}</p>

                    {articulo.detalle && (
                      <p className="text-zinc-500 mt-2 text-sm">
                        {articulo.detalle}
                      </p>
                    )}

                    <p className="text-zinc-400 mt-2">
                      {articulo.moneda === "USD" ? "USD $" : "$"}
                      {Number(articulo.precio).toLocaleString()}
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

              {articulosFiltrados.length === 0 && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500">
                  No hay artículos encontrados.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}