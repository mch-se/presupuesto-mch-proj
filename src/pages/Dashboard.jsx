import React from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Dashboard() {

  const [hora, setHora] =
    React.useState(new Date());

  const [alias, setAlias] =
    React.useState("");

  React.useEffect(() => {

    obtenerAlias();

    const intervalo =
      setInterval(() => {
        setHora(new Date());
      }, 1000);

    return () =>
      clearInterval(intervalo);

  }, []);

  async function obtenerAlias() {

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } =
      await supabase
        .from("profiles")
        .select("alias")
        .eq("id", user.id)
        .single();

    setAlias(
      data?.alias ||
      user.email
    );
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
  }

  const cards = [

    {
      titulo: "Nuevo",
      subtitulo: "Presupuesto",
      link: "/presupuestos",
      color:
        "bg-orange-500 hover:bg-orange-600",
    },

    {
      titulo: "Historial",
      subtitulo: "Presupuestos",
      link: "/historial",
      color:
        "bg-zinc-800 hover:bg-zinc-700",
    },

    {
      titulo: "Clientes",
      subtitulo: "Base de datos",
      link: "/clientes",
      color:
        "bg-zinc-800 hover:bg-zinc-700",
    },

    {
      titulo: "Artículos",
      subtitulo: "Biblioteca",
      link: "/articulos",
      color:
        "bg-zinc-800 hover:bg-zinc-700",
    },

  ];

  return (
    <div className="min-h-screen bg-black text-white">

      <div className="max-w-7xl mx-auto p-4 md:p-6">

        <div className="flex flex-col lg:flex-row lg:justify-between gap-6 mb-8">

          <div>

            <h1 className="text-4xl md:text-6xl font-black text-orange-500">
              MCH
            </h1>

            <p className="text-zinc-400 text-sm md:text-lg mt-1">
              Sistema de Presupuestos
            </p>

          </div>

          <div className="flex flex-col md:flex-row gap-3 md:items-center">

            <Link
              to="/importar"
              className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-3 rounded-2xl text-sm font-bold text-center"
            >
              Importar
            </Link>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">

              <p className="text-zinc-500 text-xs">
                Usuario
              </p>

              <p className="font-bold text-lg">
                {alias}
              </p>

              <div className="mt-3 text-sm">

                <p className="text-zinc-400">
                  {hora.toLocaleDateString()}
                </p>

                <p className="text-orange-500 font-bold">
                  {hora.toLocaleTimeString()}
                </p>

              </div>

            </div>

            <button
              onClick={
                cerrarSesion
              }
              className="bg-red-500 hover:bg-red-600 px-5 py-4 rounded-2xl font-bold"
            >
              Salir
            </button>

          </div>

        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">

          {cards.map((card) => (

            <Link
              key={card.titulo}
              to={card.link}
              className={`${card.color} rounded-3xl p-5 md:p-8 min-h-[150px] md:min-h-[220px] flex flex-col justify-between transition-all active:scale-[0.98]`}
            >

              <div>

                <h2 className="text-2xl md:text-4xl font-black leading-tight">
                  {card.titulo}
                </h2>

                <p className="mt-2 text-sm md:text-lg opacity-80">
                  {card.subtitulo}
                </p>

              </div>

              <div className="mt-6">

                <div className="w-10 h-1 bg-white/50 rounded-full" />

              </div>

            </Link>

          ))}

        </div>

      </div>

    </div>
  );
}