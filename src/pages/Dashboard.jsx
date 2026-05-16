import React from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { obtenerDolarBNA } from "../lib/dolar";

export default function Dashboard() {
  const [hora, setHora] = React.useState(new Date());
  const [alias, setAlias] = React.useState("");
  const [dolar, setDolar] = React.useState(null);
  const [actualizandoDolar, setActualizandoDolar] = React.useState(false);

  const [contadores, setContadores] = React.useState({
    presupuestos: 0,
    clientes: 0,
    articulos: 0,
    plantillas: 0,
  });

  React.useEffect(() => {
    obtenerAlias();
    cargarDolar();
    cargarContadores();

    const intervaloHora = setInterval(() => {
      setHora(new Date());
    }, 1000);

    const intervaloDolar = setInterval(() => {
      cargarDolar();
    }, 3600000);

    return () => {
      clearInterval(intervaloHora);
      clearInterval(intervaloDolar);
    };
  }, []);

  async function cargarDolar() {
    setActualizandoDolar(true);

    const data = await obtenerDolarBNA();

    if (data) {
      setDolar(data);
    }

    setActualizandoDolar(false);
  }

  async function cargarContadores() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const [
      presupuestos,
      clientes,
      articulos,
      plantillas,
    ] = await Promise.all([
      supabase
        .from("presupuestos")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),

      supabase
        .from("clientes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),

      supabase
        .from("articulos")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),

      supabase
        .from("plantillas")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

    setContadores({
      presupuestos: presupuestos.count || 0,
      clientes: clientes.count || 0,
      articulos: articulos.count || 0,
      plantillas: plantillas.count || 0,
    });
  }

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
      titulo: "Nuevo",
      subtitulo: "Presupuesto",
      link: "/presupuestos",
      color: "bg-orange-500 hover:bg-orange-600",
      contador: null,
    },
    {
      titulo: "Historial",
      subtitulo: "Presupuestos",
      link: "/historial",
      color: "bg-zinc-800 hover:bg-zinc-700",
      contador: contadores.presupuestos,
    },
    {
      titulo: "Clientes",
      subtitulo: "Base de datos",
      link: "/clientes",
      color: "bg-zinc-800 hover:bg-zinc-700",
      contador: contadores.clientes,
    },
    {
      titulo: "Artículos",
      subtitulo: "Biblioteca",
      link: "/articulos",
      color: "bg-zinc-800 hover:bg-zinc-700",
      contador: contadores.articulos,
    },
    {
      titulo: "Plantillas",
      subtitulo: "Presupuestos rápidos",
      link: "/plantillas",
      color: "bg-zinc-800 hover:bg-zinc-700",
      contador: contadores.plantillas,
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

            <button
              onClick={cargarDolar}
              disabled={actualizandoDolar}
              className="text-left text-sm md:text-base text-green-400 mt-2 hover:text-green-300 transition-all disabled:opacity-60"
            >
              {actualizandoDolar && "Actualizando..."}

              {!actualizandoDolar && dolar && (
                <>
                  Dólar BNA: Compra ${dolar.compra} / Venta ${dolar.venta}{" "}
                  <span className="text-zinc-500">
                    (
                    Actualizado{" "}
                    {dolar.fecha.toLocaleString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    )
                  </span>
                </>
              )}

              {!actualizandoDolar && !dolar && "Actualizar dólar BNA"}
            </button>
          </div>

          <div className="flex flex-wrap gap-3 items-stretch lg:items-center">
            <Link
              to="/importar"
              className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-3 rounded-2xl text-sm font-bold flex items-center justify-center"
            >
              Importar
            </Link>

            <Link
              to="/micuenta"
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl px-5 py-3 min-w-[180px] transition-all"
            >
              <p className="text-zinc-500 text-xs">
                Usuario
              </p>

              <p className="font-bold text-lg">
                {alias}
              </p>
            </Link>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3 min-w-[160px] flex flex-col justify-center">
              <p className="text-zinc-400 text-sm">
                {hora.toLocaleDateString()}
              </p>

              <p className="text-orange-500 font-bold">
                {hora.toLocaleTimeString()}
              </p>
            </div>

            <button
              onClick={cerrarSesion}
              className="bg-red-500 hover:bg-red-600 px-5 py-3 rounded-2xl font-bold"
            >
              Salir
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 md:gap-6">
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
                {card.contador !== null ? (
                  <div>
                    <p className="text-zinc-400 text-sm">
                      Total
                    </p>

                    <p className="text-4xl font-black text-white">
                      {card.contador}
                    </p>
                  </div>
                ) : (
                  <div className="w-10 h-1 bg-white/50 rounded-full" />
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}