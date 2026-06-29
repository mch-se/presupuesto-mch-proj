import { useEffect, useRef } from "react";

export default function useBorrador({
  clave,
  datos,
  restaurar,
  habilitado = true,
}) {
  const restaurandoRef = useRef(true);

  useEffect(() => {
    if (!habilitado) {
      return;
    }

    const guardado = localStorage.getItem(clave);

    if (!guardado) {
      restaurandoRef.current = false;
      return;
    }

    try {
      const borrador = JSON.parse(guardado);

      setTimeout(() => {
        restaurar(borrador);
        restaurandoRef.current = false;
      }, 0);
    } catch (e) {
      console.error(
        "[BORRADOR] Error al restaurar",
        e
      );
      restaurandoRef.current = false;
    }
  }, [clave, restaurar, habilitado]);

  useEffect(() => {
    if (!habilitado) {
      return;
    }

    if (restaurandoRef.current) {
      return;
    }

    localStorage.setItem(
      clave,
      JSON.stringify(datos)
    );
  }, [clave, datos, habilitado]);

  return {
    restaurandoRef,
  };
}