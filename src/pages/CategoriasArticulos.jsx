import React from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

export default function CategoriasArticulos() {
  const [categorias, setCategorias] = React.useState([]);
  const [nombre, setNombre] = React.useState("");

  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastMensaje, setToastMensaje] = React.useState("");
  const [toastTipo, setToastTipo] = React.useState("ok");

  const [modalVisible, setModalVisible] = React.useState(false);
  const [categoriaEliminar, setCategoriaEliminar] = React.useState(null);

  React.useEffect(() => {
    obtenerCategorias();
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

  async function crearCategoria() {
    const nombreLimpio = nombre.trim();

    if (!nombreLimpio) {
      mostrarToast("Ingresar categoría", "error");
      return;
    }

    const { error } = await supabase
      .from("articulo_categorias")
      .insert([{ nombre: nombreLimpio }]);

    if (error) {
      mostrarToast(error.message, "error");
      return;
    }

    setNombre("");
    mostrarToast("Categoría creada", "ok");
    obtenerCategorias();
  }

  function solicitarEliminarCategoria(id) {
    setCategoriaEliminar(id);
    setModalVisible(true);
  }

  async function confirmarEliminarCategoria() {
    if (!categoriaEliminar) return;

    const { error } = await supabase
      .from("articulo_categorias")
      .delete()
      .eq("id", categoriaEliminar);

    if (error) {
      mostrarToast(
        "No se pudo eliminar. Puede estar usada por artículos.",
        "error"
      );
      return;
    }

    setModalVisible(false);
    setCategoriaEliminar(null);

    mostrarToast("Categoría eliminada", "ok");
    obtenerCategorias();
  }

  return (
    <>
      <ConfirmModal
        visible={modalVisible}
        titulo="Eliminar categoría"
        mensaje="Esta acción eliminará la categoría. Si está usada por artículos, el sistema puede impedirlo."
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        onCancelar={() => {
          setModalVisible(false);
          setCategoriaEliminar(null);
        }}
        onConfirmar={confirmarEliminarCategoria}
      />

      <Toast
        mensaje={toastMensaje}
        tipo={toastTipo}
        visible={toastVisible}
      />

      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-5xl font-bold text-orange-500">
                Categorías
              </h1>

              <p className="text-zinc-400 mt-3">
                Clasificación de artículos
              </p>
            </div>

            <Link
              to="/articulos"
              className="bg-zinc-700 hover:bg-zinc-600 px-5 py-3 rounded-xl font-bold"
            >
              Volver
            </Link>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Nueva categoría"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
              />

              <button
                onClick={crearCategoria}
                className="bg-orange-500 hover:bg-orange-600 px-6 py-4 rounded-2xl font-bold"
              >
                Agregar categoría
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {categorias.map((categoria) => (
              <div
                key={categoria.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex justify-between items-center"
              >
                <p className="text-xl font-bold">{categoria.nombre}</p>

                <button
                  onClick={() => solicitarEliminarCategoria(categoria.id)}
                  className="bg-red-500 hover:bg-red-600 px-5 py-3 rounded-xl font-bold"
                >
                  Eliminar
                </button>
              </div>
            ))}

            {categorias.length === 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center text-zinc-500">
                No hay categorías cargadas.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}