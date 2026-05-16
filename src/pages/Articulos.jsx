import React from "react";

import { supabase } from "../lib/supabase";

import {
  Link,
} from "react-router-dom";

export default function Articulos() {

  const [descripcion, setDescripcion] =
    React.useState("");

  const [detalle, setDetalle] =
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
    setDetalle("");
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
            detalle,
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
              detalle,
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

    setDetalle(
      articulo.detalle || ""
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

  function detalleCorto(texto) {
    if (!texto) return "";

    if (texto.length <= 120) {
      return texto;
    }

    return `${texto.slice(0, 120)}...`;
  }

  const articulosFiltrados =
    articulos.filter((articulo) => {

      const texto = `
        ${articulo.descripcion || ""}
        ${articulo.detalle || ""}
        ${articulo.categoria || ""}
        ${articulo.proveedor || ""}
      `.toLowerCase();

      return texto.includes(
        busqueda.toLowerCase()
      );
    });

  return (
    <div className="min-h-screen bg-black text-white p-6">

      <div className="max-w-7xl mx-auto">

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

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-10">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <input
              type="text"
              placeholder="Descripción corta"
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

            <textarea
              placeholder="Descripción larga / detalle"
              value={detalle}
              onChange={(e) =>
                setDetalle(
                  e.target.value
                )
              }
              className="md:col-span-3 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 min-h-28"
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

        <div className="space-y-4">

          {articulosFiltrados.map((articulo) => (

            <div
              key={articulo.id}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6"
            >

              <div className="flex flex-col xl:flex-row xl:justify-between gap-6">

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 w-full">

                  <div>

                    <p className="text-zinc-500 text-sm">
                      Descripción
                    </p>

                    <p className="text-xl font-bold mt-2">
                      {articulo.descripcion}
                    </p>

                  </div>

                  <div>

                    <p className="text-zinc-500 text-sm">
                      Categoría
                    </p>

                    <p className="mt-2">
                      {articulo.categoria}
                    </p>

                  </div>

                  <div>

                    <p className="text-zinc-500 text-sm">
                      Proveedor
                    </p>

                    <p className="mt-2">
                      {articulo.proveedor}
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

                  {articulo.detalle && (

                    <div className="md:col-span-5 border-t border-zinc-800 pt-4">

                      <p className="text-zinc-500 text-sm mb-2">
                        Descripción larga
                      </p>

                      <p className="text-zinc-300 leading-relaxed">
                        {detalleCorto(
                          articulo.detalle
                        )}
                      </p>

                    </div>

                  )}

                </div>

                <div className="flex gap-4 xl:ml-8 xl:self-center">

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

            </div>
          ))}

        </div>

      </div>

    </div>
  );
}