import React from "react";

import { supabase } from "../lib/supabase";

import {
  Link,
} from "react-router-dom";

export default function Articulos() {

  const [descripcion, setDescripcion] =
    React.useState("");

  const [precio, setPrecio] =
    React.useState("");

  const [costo, setCosto] =
    React.useState("");

  const [categoria, setCategoria] =
    React.useState("");

  const [proveedor, setProveedor] =
    React.useState("");

  const [moneda, setMoneda] =
    React.useState("ARS");

  const [articulos, setArticulos] =
    React.useState([]);

  const [busqueda, setBusqueda] =
    React.useState("");

  const [editandoId, setEditandoId] =
    React.useState(null);

  React.useEffect(() => {
    obtenerArticulos();
  }, []);

  async function obtenerArticulos() {

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } =
      await supabase
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

  function limpiarFormulario() {

    setDescripcion("");
    setPrecio("");
    setCosto("");
    setCategoria("");
    setProveedor("");
    setMoneda("ARS");

    setEditandoId(null);
  }

  async function guardarArticulo() {

    if (!descripcion) {
      alert(
        "Ingresar descripción"
      );
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (editandoId) {

      const { error } =
        await supabase
          .from("articulos")
          .update({
            descripcion,
            precio,
            costo,
            categoria,
            proveedor,
            moneda,
          })

          .eq(
            "id",
            editandoId
          );

      if (error) {
        alert(error.message);
        return;
      }

      alert(
        "Artículo actualizado"
      );

    } else {

      const { error } =
        await supabase
          .from("articulos")
          .insert([
            {
              descripcion,
              precio,
              costo,
              categoria,
              proveedor,
              moneda,
              user_id:
                user.id,
            },
          ]);

      if (error) {
        alert(error.message);
        return;
      }

      alert(
        "Artículo creado"
      );
    }

    limpiarFormulario();

    obtenerArticulos();
  }

  function editarArticulo(
    articulo
  ) {

    setDescripcion(
      articulo.descripcion || ""
    );

    setPrecio(
      articulo.precio || ""
    );

    setCosto(
      articulo.costo || ""
    );

    setCategoria(
      articulo.categoria || ""
    );

    setProveedor(
      articulo.proveedor || ""
    );

    setMoneda(
      articulo.moneda || "ARS"
    );

    setEditandoId(
      articulo.id
    );
  }

  async function eliminarArticulo(
    id
  ) {

    const confirmar =
      window.confirm(
        "Eliminar artículo?"
      );

    if (!confirmar) return;

    const { error } =
      await supabase
        .from("articulos")
        .delete()
        .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    obtenerArticulos();
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="flex justify-between items-center mb-10">

          <div>

            <h1 className="text-5xl font-bold text-orange-500">
              Artículos
            </h1>

            <p className="text-zinc-400 mt-3">
              Biblioteca profesional
            </p>

          </div>

          <Link
            to="/"
            className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-xl font-bold"
          >
            Volver
          </Link>

        </div>

        {/* FORM */}

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-10">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <input
              type="text"
              placeholder="Descripción"
              value={descripcion}
              onChange={(e) =>
                setDescripcion(
                  e.target.value
                )
              }
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />

            <input
              type="text"
              placeholder="Categoría"
              value={categoria}
              onChange={(e) =>
                setCategoria(
                  e.target.value
                )
              }
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />

            <input
              type="text"
              placeholder="Proveedor"
              value={proveedor}
              onChange={(e) =>
                setProveedor(
                  e.target.value
                )
              }
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />

            <input
              type="number"
              placeholder="Costo"
              value={costo}
              onChange={(e) =>
                setCosto(
                  e.target.value
                )
              }
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />

            <input
              type="number"
              placeholder="Precio Venta"
              value={precio}
              onChange={(e) =>
                setPrecio(
                  e.target.value
                )
              }
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            />

            <select
              value={moneda}
              onChange={(e) =>
                setMoneda(
                  e.target.value
                )
              }
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
            >

              <option value="ARS">
                ARS $
              </option>

              <option value="USD">
                USD $
              </option>

            </select>

          </div>

          <div className="flex gap-4 mt-8">

            <button
              onClick={
                guardarArticulo
              }
              className="bg-orange-500 hover:bg-orange-600 px-6 py-4 rounded-2xl font-bold"
            >

              {editandoId
                ? "Actualizar"
                : "Guardar"}

            </button>

            <button
              onClick={
                limpiarFormulario
              }
              className="bg-zinc-700 hover:bg-zinc-600 px-6 py-4 rounded-2xl font-bold"
            >
              Limpiar
            </button>

          </div>

        </div>

        {/* BUSCADOR */}

        <div className="mb-8">

          <input
            type="text"
            placeholder="Buscar artículo..."
            value={busqueda}
            onChange={(e) =>
              setBusqueda(
                e.target.value
              )
            }
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
          />

        </div>

        {/* TABLA */}

        <div className="space-y-4">

          {articulos

            .filter((articulo) =>
              articulo.descripcion
                ?.toLowerCase()

                .includes(
                  busqueda.toLowerCase()
                )
            )

            .map((articulo) => (

              <div
                key={articulo.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex justify-between items-center"
              >

                <div className="grid grid-cols-5 gap-6 w-full">

                  <div>

                    <p className="text-zinc-500 text-sm">
                      Descripción
                    </p>

                    <p className="text-xl font-bold mt-2">
                      {
                        articulo.descripcion
                      }
                    </p>

                  </div>

                  <div>

                    <p className="text-zinc-500 text-sm">
                      Categoría
                    </p>

                    <p className="mt-2">
                      {
                        articulo.categoria
                      }
                    </p>

                  </div>

                  <div>

                    <p className="text-zinc-500 text-sm">
                      Proveedor
                    </p>

                    <p className="mt-2">
                      {
                        articulo.proveedor
                      }
                    </p>

                  </div>

                  <div>

                    <p className="text-zinc-500 text-sm">
                      Costo
                    </p>

                    <p className="mt-2">

                      {articulo.moneda ===
                      "USD"
                        ? "USD $"
                        : "$"}

                      {Number(
                        articulo.costo
                      ).toLocaleString()}

                    </p>

                  </div>

                  <div>

                    <p className="text-zinc-500 text-sm">
                      Venta
                    </p>

                    <p className="mt-2 text-orange-500 font-bold">

                      {articulo.moneda ===
                      "USD"
                        ? "USD $"
                        : "$"}

                      {Number(
                        articulo.precio
                      ).toLocaleString()}

                    </p>

                  </div>

                </div>

                <div className="flex gap-4 ml-8">

                  <button
                    onClick={() =>
                      editarArticulo(
                        articulo
                      )
                    }

                    className="bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-xl font-bold"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() =>
                      eliminarArticulo(
                        articulo.id
                      )
                    }

                    className="bg-red-500 hover:bg-red-600 px-5 py-3 rounded-xl font-bold"
                  >
                    Eliminar
                  </button>

                </div>

              </div>
            ))}

        </div>

      </div>

    </div>
  );
}