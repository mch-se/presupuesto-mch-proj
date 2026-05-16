import React from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

export default function Plantillas() {
  const [nombre, setNombre] = React.useState("");
  const [descripcion, setDescripcion] = React.useState("");
  const [plantillas, setPlantillas] = React.useState([]);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = React.useState(null);
  const [items, setItems] = React.useState([]);
  const [articulos, setArticulos] = React.useState([]);
  const [busquedaArticulo, setBusquedaArticulo] = React.useState("");

  React.useEffect(() => {
    obtenerPlantillas();
    obtenerArticulos();
  }, []);

  async function obtenerPlantillas() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("plantillas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setPlantillas(data || []);
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

  async function crearPlantilla() {
    if (!nombre) {
      alert("Ingresar nombre de plantilla");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("plantillas").insert([
      {
        user_id: user.id,
        nombre,
        descripcion,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setNombre("");
    setDescripcion("");
    obtenerPlantillas();
  }

  async function seleccionarPlantilla(plantilla) {
    setPlantillaSeleccionada(plantilla);

    const { data, error } = await supabase
      .from("plantilla_items")
      .select("*")
      .eq("plantilla_id", plantilla.id)
      .order("created_at", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setItems(data || []);
  }

  async function eliminarPlantilla(id) {
    const confirmar = window.confirm("¿Eliminar plantilla?");

    if (!confirmar) return;

    const { error } = await supabase.from("plantillas").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setPlantillaSeleccionada(null);
    setItems([]);
    obtenerPlantillas();
  }

  async function agregarArticulo(articulo) {
    if (!plantillaSeleccionada) {
      alert("Seleccionar una plantilla");
      return;
    }

    const { error } = await supabase.from("plantilla_items").insert([
      {
        plantilla_id: plantillaSeleccionada.id,
        articulo_id: articulo.id,
        descripcion: articulo.descripcion,
        detalle: articulo.detalle || "",
        cantidad: 1,
        precio: articulo.precio || 0,
        tipo: articulo.tipo || articulo.categoria || "",
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    seleccionarPlantilla(plantillaSeleccionada);
  }

  async function actualizarItem(id, campo, valor) {
    const { error } = await supabase
      .from("plantilla_items")
      .update({
        [campo]: valor,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [campo]: valor,
            }
          : item
      )
    );
  }

  async function eliminarItem(id) {
    const { error } = await supabase
      .from("plantilla_items")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  const articulosFiltrados = articulos.filter((articulo) =>
    `${articulo.descripcion || ""} ${articulo.detalle || ""}`
      .toLowerCase()
      .includes(busquedaArticulo.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-orange-500">
              Plantillas
            </h1>

            <p className="text-zinc-400 mt-2">
              Presupuestos frecuentes prearmados
            </p>
          </div>

          <Link
            to="/"
            className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-xl font-bold"
          >
            Volver
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <h2 className="text-2xl font-bold text-orange-500 mb-4">
                Nueva plantilla
              </h2>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Ej: CCTV 4 cámaras"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                />

                <textarea
                  placeholder="Descripción interna"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 min-h-24"
                />

                <button
                  onClick={crearPlantilla}
                  className="w-full bg-orange-500 hover:bg-orange-600 p-4 rounded-2xl font-bold"
                >
                  Crear plantilla
                </button>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <h2 className="text-2xl font-bold text-orange-500 mb-4">
                Listado
              </h2>

              <div className="space-y-3">
                {plantillas.map((plantilla) => (
                  <button
                    key={plantilla.id}
                    onClick={() => seleccionarPlantilla(plantilla)}
                    className={`w-full text-left border rounded-2xl p-4 ${
                      plantillaSeleccionada?.id === plantilla.id
                        ? "bg-orange-500 border-orange-500"
                        : "bg-zinc-950 border-zinc-800 hover:bg-zinc-800"
                    }`}
                  >
                    <p className="font-bold text-lg">{plantilla.nombre}</p>

                    {plantilla.descripcion && (
                      <p className="text-sm opacity-80 mt-1">
                        {plantilla.descripcion}
                      </p>
                    )}
                  </button>
                ))}

                {plantillas.length === 0 && (
                  <p className="text-zinc-500">
                    No hay plantillas creadas.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-orange-500">
                    {plantillaSeleccionada
                      ? plantillaSeleccionada.nombre
                      : "Seleccioná una plantilla"}
                  </h2>

                  <p className="text-zinc-400 mt-1">
                    Items que se cargarán automáticamente al presupuesto
                  </p>
                </div>

                {plantillaSeleccionada && (
                  <button
                    onClick={() => eliminarPlantilla(plantillaSeleccionada.id)}
                    className="bg-red-500 hover:bg-red-600 px-5 py-3 rounded-xl font-bold"
                  >
                    Eliminar plantilla
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 grid grid-cols-12 gap-3"
                  >
                    <div className="col-span-12 md:col-span-5">
                      <input
                        value={item.descripcion || ""}
                        onChange={(e) =>
                          actualizarItem(item.id, "descripcion", e.target.value)
                        }
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3"
                      />
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <input
                        type="number"
                        value={item.cantidad || ""}
                        onChange={(e) =>
                          actualizarItem(item.id, "cantidad", e.target.value)
                        }
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3"
                      />
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <input
                        type="number"
                        value={item.precio || ""}
                        onChange={(e) =>
                          actualizarItem(item.id, "precio", e.target.value)
                        }
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3"
                      />
                    </div>

                    <div className="col-span-4 md:col-span-2 flex items-center text-orange-500 font-bold">
                      $
                      {(
                        (Number(item.cantidad) || 0) *
                        (Number(item.precio) || 0)
                      ).toLocaleString()}
                    </div>

                    <div className="col-span-12 md:col-span-1 flex justify-end">
                      <button
                        onClick={() => eliminarItem(item.id)}
                        className="bg-red-500 hover:bg-red-600 px-4 py-3 rounded-xl font-bold"
                      >
                        X
                      </button>
                    </div>
                  </div>
                ))}

                {plantillaSeleccionada && items.length === 0 && (
                  <div className="text-zinc-500 bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                    La plantilla no tiene items todavía.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <h2 className="text-2xl font-bold text-orange-500 mb-4">
                Agregar artículos
              </h2>

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
                        <p className="text-zinc-500 text-sm mt-1">
                          {articulo.detalle}
                        </p>
                      )}

                      <p className="text-zinc-400 mt-2">
                        {articulo.moneda === "USD" ? "USD $" : "$"}
                        {Number(articulo.precio).toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => agregarArticulo(articulo)}
                      className="bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-xl font-bold self-center"
                    >
                      Agregar
                    </button>
                  </div>
                ))}

                {articulosFiltrados.length === 0 && (
                  <div className="text-zinc-500 bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                    No hay artículos encontrados.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}