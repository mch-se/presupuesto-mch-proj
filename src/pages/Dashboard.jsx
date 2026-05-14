import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import { supabase } from "../lib/supabase";

export default function Dashboard({ cerrarSesion }) {
  const [horaActual, setHoraActual] = React.useState(
    new Date()
  );

  const [alias, setAlias] = React.useState("");

  React.useEffect(() => {
    obtenerAlias();

    const intervalo = setInterval(() => {
      setHoraActual(new Date());
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

    if (data) {
      setAlias(data.alias);
    }
  }

  const fecha = horaActual.toLocaleDateString();

  const hora = horaActual.toLocaleTimeString();

  const cards = [
    {
      titulo: "Presupuestos",
      descripcion: "Crear y administrar presupuestos",
      ruta: "/presupuestos",
    },
    {
      titulo: "Artículos",
      descripcion: "Materiales y mano de obra",
      ruta: "/articulos",
    },
    {
      titulo: "Clientes",
      descripcion: "Administración de clientes",
      ruta: "/clientes",
    },
    {
      titulo: "Data / Recursos",
      descripcion: "Fotos, videos y documentación",
      ruta: "/recursos",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">

      <div className="max-w-7xl mx-auto p-6">

        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 shadow-2xl">

          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 border-b border-zinc-800 pb-6">

            <div className="flex items-center gap-5">

              <img
                src={logo}
                alt="MCH"
                className="h-28 object-contain"
              />

              <div>
                <h1 className="text-4xl font-bold">
                  Panel Principal
                </h1>

                <p className="text-zinc-400 mt-2">
                  Bienvenido a MCH Presupuestos
                </p>
              </div>
            </div>

            <div className="text-right">

              <p className="text-zinc-400">
                {fecha}
              </p>

              <p className="text-zinc-400">
                {hora}
              </p>

              <p className="mt-3 text-orange-500 font-semibold text-lg">
                {alias}
              </p>

              <button
                onClick={cerrarSesion}
                className="mt-4 bg-orange-500 hover:bg-orange-600 transition px-5 py-3 rounded-xl font-bold"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">

            {cards.map((card) => (
              <Link
                key={card.titulo}
                to={card.ruta}
                className="bg-zinc-950 border border-zinc-800 rounded-3xl p-10 hover:border-orange-500 hover:scale-[1.02] transition duration-300"
              >
                <h2 className="text-3xl font-bold text-orange-500 mb-4">
                  {card.titulo}
                </h2>

                <p className="text-zinc-400 text-lg">
                  {card.descripcion}
                </p>
              </Link>
            ))}
          </div>

          <Link
            to="/analiticas"
            className="block mt-10 bg-orange-500 hover:bg-orange-600 transition rounded-3xl p-8 text-center"
          >
            <h2 className="text-3xl font-bold">
              Analíticas
            </h2>

            <p className="mt-3 text-lg">
              Estadísticas y métricas del negocio
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}