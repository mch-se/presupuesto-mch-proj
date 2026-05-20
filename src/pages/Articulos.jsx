import React from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

export default function Articulos() {
  const [descripcion, setDescripcion] = React.useState("");
  const [detalle, setDetalle] = React.useState("");
  const [precio, setPrecio] = React.useState("");
  const [costo, setCosto] = React.useState("");
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

  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastMensaje, setToastMensaje] = React.useState("");
  const [toastTipo, setToastTipo] = React.useState("ok");

  const [modalVisible, setModalVisible] = React.useState(false);
  const [articuloEliminar, setArticuloEliminar] = React.useState(null);

  const formularioRef = React.useRef(null);

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
    setPrecio("");
    setCosto("");
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

    const datosArticulo = {
      descripcion,
      detalle,
      precio: precio === "" ? 0 : precio,
      costo: costo === "" ? 0 : costo,
      proveedor,
      moneda,
      usado_count: Number(usadoCount) || 0,
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
    setPrecio(articulo.precio || "");
    setCosto(articulo.costo || "");
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

      {(menuAbierto || menuConfigAbierto) && (
        <div
          onClick={() => {
            setMenuAbierto(null);
            setMenuConfigAbierto(false);
          }}
          className="fixed inset-0 z-40 bg-transparent"
        />
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
                <p className="text-zinc-500 text-sm">Usos</p>
                <p className="font-bold mt-1">
                  {Number(articuloVer.usado_count) || 0}
                </p>
              </div>

              <div className="bg-zinc-900 rounded-2xl p-4">
                <p className="text-zinc-500 text-sm">Costo</p>
                <p className="font-bold mt-1">
                  {articuloVer.moneda === "USD" ? "USD $" : "$"}
                  {Number(articuloVer.costo || 0).toLocaleString()}
                </p>
              </div>

              <div className="bg-zinc-900 rounded-2xl p-4">
                <p className="text-zinc-500 text-sm">Venta</p>
                <p className="font-black text-orange-500 text-2xl mt-1">
                  {articuloVer.moneda === "USD" ? "USD $" : "$"}
                  {Number(articuloVer.precio || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-4 mt-4">
              <p className="text-zinc-500 text-sm mb-2">Descripción larga</p>

              <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {articuloVer.detalle || "-"}
              </p>
            </div>

            <p className="text-zinc-500 text-sm mt-5">
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
                    placeholder="Costo"
                    value={costo}
                    onChange={(e) => setCosto(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                  />

                  <input
                    type="number"
                    placeholder="Precio Venta"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
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
                    type="number"
                    placeholder="Usos"
                    value={usadoCount}
                    onChange={(e) => setUsadoCount(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                  />

                  <textarea
                    placeholder="Descripción larga / detalle"
                    value={detalle}
                    onChange={(e) => setDetalle(e.target.value)}
                    className="md:col-span-1 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 min-h-28"
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

                      {(Number(articulo.usado_count) || 0) >= 11 && (
                        <span title="Artículo frecuente" className="text-xl">
                          🔥
                        </span>
                      )}
                    </div>

                    {articulo.detalle && (
                      <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                        {detalleCorto(articulo.detalle)}
                      </p>
                    )}

                    <p className="text-orange-500 font-black text-xl mt-3">
                      {articulo.moneda === "USD" ? "USD $" : "$"}
                      {Number(articulo.precio || 0).toLocaleString()}
                    </p>
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