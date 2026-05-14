import React from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

export default function Articulos() {
  const [tipo, setTipo] = React.useState("Material");
  const [categoria, setCategoria] = React.useState("");
  const [descripcion, setDescripcion] = React.useState("");
  const [sku, setSku] = React.useState("");
  const [costo, setCosto] = React.useState("");
  const [precio, setPrecio] = React.useState("");

  const [articulos, setArticulos] = React.useState([]);

  React.useEffect(() => {
    obtenerArticulos();
  }, []);

  async function obtenerArticulos() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("articulos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setArticulos(data);
    }
  }

  async function guardarArticulo() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("articulos")
      .insert([
        {
          user_id: user.id,
          tipo,
          categoria,
          descripcion,
          sku,
          costo,
          precio,
        },
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    setCategoria("");
    setDescripcion("");
    setSku("");
    setCosto("");
    setPrecio("");

    obtenerArticulos();
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">

      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-8">

          <div>
            <h1 className="text-5xl font-bold text-orange-500">
              Artículos
            </h1>

            <p className="text-zinc-400 mt-2">
              Materiales y mano de obra reutilizable
            </p>
          </div>

          <Link
            to="/"
            className="bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-xl font-bold"
          >
            Volver
          </Link>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

          <h2 className="text-3xl font-bold mb-8">
            Nuevo Artículo
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <p className="mb-2 text-zinc-400">
                Tipo
              </p>

              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 p-4 rounded-xl"
              >
                <option>Material</option>
                <option>Mano de obra</option>
              </select>
            </div>

            <div>
              <p className="mb-2 text-zinc-400">
                Categoría
              </p>

              <input
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Ej: CCTV"
                className="w-full bg-zinc-950 border border-zinc-700 p-4 rounded-xl"
              />
            </div>

            <div className="md:col-span-2">
              <p className="mb-2 text-zinc-400">
                Descripción
              </p>

              <input
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción"
                className="w-full bg-zinc-950 border border-zinc-700 p-4 rounded-xl"
              />
            </div>

            <div>
              <p className="mb-2 text-zinc-400">
                SKU
              </p>

              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Código/SKU"
                className="w-full bg-zinc-950 border border-zinc-700 p-4 rounded-xl"
              />
            </div>

            <div>
              <p className="mb-2 text-zinc-400">
                Costo
              </p>

              <input
                type="number"
                value={costo}
                onChange={(e) => setCosto(e.target.value)}
                placeholder="Costo"
                className="w-full bg-zinc-950 border border-zinc-700 p-4 rounded-xl"
              />
            </div>

            <div>
              <p className="mb-2 text-zinc-400">
                Precio Venta
              </p>

              <input
                type="number"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="Precio"
                className="w-full bg-zinc-950 border border-zinc-700 p-4 rounded-xl"
              />
            </div>
          </div>

          <button
            onClick={guardarArticulo}
            className="mt-8 bg-orange-500 hover:bg-orange-600 px-8 py-4 rounded-xl text-xl font-bold"
          >
            Guardar Artículo
          </button>
        </div>

        <div className="mt-10 bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

          <h2 className="text-3xl font-bold mb-8">
            Biblioteca de Artículos
          </h2>

          <div className="space-y-4">

            {articulos.map((articulo) => (
              <div
                key={articulo.id}
                className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6"
              >
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">

                  <div>
                    <p className="text-orange-500 font-bold text-xl">
                      {articulo.descripcion}
                    </p>

                    <p className="text-zinc-400 mt-2">
                      {articulo.tipo} · {articulo.categoria}
                    </p>

                    <p className="text-zinc-500 mt-1">
                      SKU: {articulo.sku || "-"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-zinc-400">
                      Costo
                    </p>

                    <p className="text-xl">
                      $ {Number(articulo.costo).toLocaleString()}
                    </p>

                    <p className="text-zinc-400 mt-3">
                      Venta
                    </p>

                    <p className="text-2xl font-bold text-orange-500">
                      $ {Number(articulo.precio).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {articulos.length === 0 && (
              <p className="text-zinc-500">
                No hay artículos cargados.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}