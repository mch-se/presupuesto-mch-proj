import React from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

export default function TiposArticulos() {
  const [tipos, setTipos] = React.useState([]);
  const [nombre, setNombre] = React.useState("");

  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastMensaje, setToastMensaje] = React.useState("");
  const [toastTipo, setToastTipo] = React.useState("ok");

  const [modalVisible, setModalVisible] = React.useState(false);
  const [tipoEliminar, setTipoEliminar] = React.useState(null);

  React.useEffect(() => {
    obtenerTipos();
  }, []);

  function mostrarToast(mensaje, tipo = "ok") {
    setToastMensaje(mensaje);
    setToastTipo(tipo);
    setToastVisible(true);

    setTimeout(() => {
      setToastVisible(false);
    }, 2500);
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

  async function crearTipo() {
    const nombreLimpio = nombre.trim();

    if (!nombreLimpio) {
      mostrarToast("Ingresar tipo", "error");
      return;
    }

    const { error } = await supabase
      .from("articulo_tipos")
      .insert([{ nombre: nombreLimpio }]);

    if (error) {
      mostrarToast(error.message, "error");
      return;
    }

    setNombre("");
    mostrarToast("Tipo creado", "ok");
    obtenerTipos();
  }

  function solicitarEliminarTipo(id) {
    setTipoEliminar(id);
    setModalVisible(true);
  }

  async function confirmarEliminarTipo() {
    if (!tipoEliminar) return;

    const { error } = await supabase
      .from("articulo_tipos")
      .delete()
      .eq("id", tipoEliminar);

    if (error) {
      mostrarToast(
        "No se pudo eliminar. Puede estar usado por artículos.",
        "error"
      );
      return;
    }

    setModalVisible(false);
    setTipoEliminar(null);

    mostrarToast("Tipo eliminado", "ok");
    obtenerTipos();
  }

  return (
    <>
      <ConfirmModal
        visible={modalVisible}
        titulo="Eliminar tipo"
        mensaje="Esta acción eliminará el tipo. Si está usado por artículos, el sistema puede impedirlo."
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        onCancelar={() => {
          setModalVisible(false);
          setTipoEliminar(null);
        }}
        onConfirmar={confirmarEliminarTipo}
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
                Tipos
              </h1>

              <p className="text-zinc-400 mt-3">
                Clasificación operativa
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
                placeholder="Nuevo tipo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
              />

              <button
                onClick={crearTipo}
                className="bg-orange-500 hover:bg-orange-600 px-6 py-4 rounded-2xl font-bold"
              >
                Agregar tipo
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {tipos.map((tipo) => (
              <div
                key={tipo.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex justify-between items-center"
              >
                <p className="text-xl font-bold">{tipo.nombre}</p>

                <button
                  onClick={() => solicitarEliminarTipo(tipo.id)}
                  className="bg-red-500 hover:bg-red-600 px-5 py-3 rounded-xl font-bold"
                >
                  Eliminar
                </button>
              </div>
            ))}

            {tipos.length === 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center text-zinc-500">
                No hay tipos cargados.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}