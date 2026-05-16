import React from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const [hora, setHora] = React.useState(new Date());
  const [alias, setAlias] = React.useState("");

  React.useEffect(() => {
    obtenerAlias();

    const intervalo = setInterval(() => {
      setHora(new Date());
    }, 1000);

    return () => clearInterval(intervalo);
  }, []);

  async function obtenerAlias() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("alias")
      .eq("id", user.id)
      .single();

    setAlias(data?.alias || user.email);
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
  }

  const cards = [
    {
      titulo: "Nuevo Presupuesto",
      descripcion: "Crear nuevo presupuesto",
      link: "/presupuestos",
      color: "bg-orange-500 hover:bg-orange-600",
    },
    {
      titulo: "Historial",
      descripcion: "Ver presupuestos guardados",
      link: "/historial",
      color: "bg-zinc-700 hover:bg-zinc-600",
    },
    {
      titulo: "Clientes",
      descripcion: "Administrar clientes",
      link: "/clientes",
      color: "bg-zinc-700 hover:bg-zinc-600",
    },
    {
      titulo: "Artículos",
      descripcion: "Biblioteca de artículos",
      link: "/articulos",
      color: "bg-zinc-700 hover:bg-zinc-600",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-6xl font-black text-orange-500">
              MCH
            </h1>

            <p className="text-zinc-400 mt-3 text-xl">
              Sistema de Presupuestos
            </p>
          </div>

          <div className="text-right">
            <Link
              to="/importar"
              className="inline-block bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 rounded-xl text-sm font-bold mb-4"
            >
              Importar
            </Link>

            <p className="text-zinc-400 text-sm">
              Usuario
            </p>

            <p className="text-xl font-bold">
              {alias}
            </p>

            <p className="text-zinc-400 mt-3">
              {hora.toLocaleDateString()}
            </p>

            <p className="text-orange-500 font-bold">
              {hora.toLocaleTimeString()}
            </p>

            <button
              onClick={cerrarSesion}
              className="mt-4 bg-red-500 hover:bg-red-600 px-5 py-3 rounded-xl font-bold"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {cards.map((card) => (
            <Link
              key={card.titulo}
              to={card.link}
              className={`${card.color} rounded-3xl p-8 transition-all`}
            >
              <h2 className="text-3xl font-bold">
                {card.titulo}
              </h2>

              <p className="mt-4 text-lg opacity-80">
                {card.descripcion}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}