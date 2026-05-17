import React from "react";

export default function Toast({
  mensaje,
  tipo = "ok",
  visible,
}) {

  if (!visible) return null;

  const colores = {

    ok:
      "bg-green-600 border-green-500",

    error:
      "bg-red-600 border-red-500",

    info:
      "bg-orange-500 border-orange-400",
  };

  return (
    <div className="fixed top-6 right-6 z-[9999] animate-[fadeIn_.25s_ease]">

      <div
        className={`
          ${colores[tipo]}
          border
          text-white
          px-6
          py-4
          rounded-2xl
          shadow-2xl
          min-w-[280px]
          max-w-[420px]
          font-semibold
        `}
      >

        {mensaje}

      </div>

    </div>
  );
}