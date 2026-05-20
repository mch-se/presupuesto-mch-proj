import React from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { obtenerDolarBNA } from "../lib/dolar";

export default function Dashboard() {
  const [hora, setHora] = React.useState(new Date());

  const [alias, setAlias] = React.useState("");

  const [rol, setRol] = React.useState(null);

  const [loadingPerfil, setLoadingPerfil] = React.useState(true);

  const [dolar, setDolar] = React.useState(null);

  const [actualizandoDolar, setActualizandoDolar] =
    React.useState(false);

  const [contadores, setContadores] = React.useState({
    presupuestos: 0,
    clientes: 0,
    articulos: 0,
    plantillas: 0,
  });

  const [ultimosPresupuestos, setUltimosPresupuestos] =
    React.useState([]);

  React.useEffect(() => {
    obtenerPerfil();

    cargarDolar();

    cargarContadores();

    cargarActividad();

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

  async function obtenerPerfil() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("alias, rol")
        .eq("id", user.id)
        .single();

      setAlias(data?.alias || user.email);

      setRol(data?.rol || "pendiente");
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPerfil(false);
    }
  }

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

    const [presupuestos, clientes, articulos, plantillas] =
      await Promise.all([
        supabase
          .from("presupuestos")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("clientes")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("articulos")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("plantillas")
          .select("id", {
            count: "exact",
            head: true,
          }),
      ]);

    setContadores({
      presupuestos: presupuestos.count || 0,
      clientes: clientes.count || 0,
      articulos: articulos.count || 0,
      plantillas: plantillas.count || 0,
    });
  }

  async function cargarActividad() {
    const { data: presupuestos } = await supabase
      .from("presupuestos")
      .select(`
        id,
        cliente,
        total,
        created_at,
        generado_por_alias
      `)
      .order("created_at", {
        ascending: false,
      })
      .limit(5);

    setUltimosPresupuestos(presupuestos || []);
  }

  const cardsOperativas = [
    {
      titulo: "Nuevo",
      subtitulo: "Presupuesto",
      link: "/presupuestos",
      color: "bg-orange-500 hover:bg-orange-600",
      contador: null,
    },

    {
      titulo: "Presupuestos",
      subtitulo: "Guardados",
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

    ...(rol === "admin"
      ? [
          {
            titulo: "Admin",
            subtitulo: "Usuarios",
            link: "/admin/usuarios",
            color: "bg-red-600 hover:bg-red-700",
            contador: null,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex flex-col xl:flex-row xl:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl md:text-6xl font-black text-orange-500">
              Inicio
            </h1>

            <p className="text-zinc-400 text-sm md:text-lg mt-2">
              Bienvenido{" "}
              <span className="text-white font-bold">
                {alias}
              </span>
            </p>

            <button
              onClick={cargarDolar}
              disabled={actualizandoDolar}
              className="text-left text-sm md:text-base text-green-400 mt-4 hover:text-green-300 transition-all disabled:opacity-60"
            >
              {actualizandoDolar && "Actualizando..."}

              {!actualizandoDolar &&
                dolar && (
                  <>
                    Dólar BNA: Compra $
                    {dolar.compra}
                    {" / "}
                    Venta $
                    {dolar.venta}

                    <span className="text-zinc-500">
                      {" "}
                      (
                      Actualizado{" "}
                      {dolar.fecha.toLocaleString(
                        "es-AR",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                      )
                    </span>
                  </>
                )}

              {!actualizandoDolar &&
                !dolar &&
                "Actualizar dólar BNA"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 min-w-[170px]">
              <p className="text-zinc-500 text-sm">
                Fecha
              </p>

              <p className="text-xl font-black mt-2">
                {hora.toLocaleDateString()}
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 min-w-[170px]">
              <p className="text-zinc-500 text-sm">
                Hora
              </p>

              <p className="text-orange-500 text-xl font-black mt-2">
                {hora.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {!loadingPerfil &&
          rol === "pendiente" && (
            <div className="bg-zinc-900 border border-orange-500 rounded-3xl p-8 mb-8">
              <h2 className="text-3xl font-black text-orange-500">
                Usuario pendiente de aprobación
              </h2>

              <p className="text-zinc-300 mt-4 text-lg leading-relaxed">
                Tu cuenta todavía no tiene permisos operativos.
                <br />
                Un administrador debe asignarte un rol
                para comenzar a utilizar el sistema.
              </p>
            </div>
          )}

        {!loadingPerfil &&
          rol !== "pendiente" && (
            <>
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6 mb-10">
                             {cardsOperativas.map((card) => (
                  <Link
                    key={card.titulo}
                    to={card.link}
                    className={`${card.color} rounded-3xl p-5 md:p-8 min-h-[160px] flex flex-col justify-between transition-all active:scale-[0.98]`}
                  >
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black leading-tight whitespace-normal">
                        {card.titulo}
                      </h2>

                      <p className="mt-2 text-sm md:text-lg opacity-80 break-words">
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

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black">
                      Últimos presupuestos
                    </h2>

                    <Link
                      to="/historial"
                      className="text-orange-500 font-bold"
                    >
                      Ver todos
                    </Link>
                  </div>

                  <div className="space-y-4">
                    {ultimosPresupuestos.map(
                      (presupuesto) => (
                        <Link
                          to={`/presupuesto/${presupuesto.id}`}
                          key={presupuesto.id}
                          className="block bg-zinc-950 border border-zinc-800 rounded-2xl p-4 hover:border-orange-500 transition-all"
                        >
                          <div className="flex justify-between gap-4">
                            <div>
                              <p className="font-bold text-lg">
                                {presupuesto.cliente ||
                                  "Sin cliente"}
                              </p>

                              <p className="text-zinc-500 text-sm mt-1">
                                Generado por{" "}
                                {presupuesto.generado_por_alias ||
                                  "Administrador"}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-orange-500 font-black text-xl">
                                $
                                {Number(
                                  presupuesto.total || 0
                                ).toLocaleString()}
                              </p>

                              <p className="text-zinc-500 text-sm mt-1">
                                {new Date(
                                  presupuesto.created_at
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </Link>
                      )
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
      </div>
    </div>
  );
}