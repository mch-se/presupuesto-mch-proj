import React from "react";

import {
  Link,
} from "react-router-dom";

export default function Dashboard() {

  const cards = [

    {
      titulo: "Nuevo Presupuesto",
      descripcion:
        "Crear nuevo presupuesto",
      link: "/presupuestos",
      color:
        "bg-orange-500 hover:bg-orange-600",
    },

    {
      titulo: "Historial",
      descripcion:
        "Ver presupuestos guardados",
      link: "/historial",
      color:
        "bg-zinc-700 hover:bg-zinc-600",
    },

    {
      titulo: "Clientes",
      descripcion:
        "Administrar clientes",
      link: "/clientes",
      color:
        "bg-zinc-700 hover:bg-zinc-600",
    },

    {
      titulo: "Artículos",
      descripcion:
        "Biblioteca de artículos",
      link: "/articulos",
      color:
        "bg-zinc-700 hover:bg-zinc-600",
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

          <Link
            to="/importar"
            className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 rounded-xl text-sm font-bold"
          >
            Importar
          </Link>

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