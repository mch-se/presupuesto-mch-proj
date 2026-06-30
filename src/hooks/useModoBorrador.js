import { useState } from "react";

export default function useModoBorrador() {
  const [
    modoBorrador,
    setModoBorrador,
  ] = useState("manual");

  function activarManual() {
    setModoBorrador("manual");
  }

  function activarImportacion() {
    setModoBorrador(
      "importacion"
    );
  }

  return {
    modoBorrador,
    activarManual,
    activarImportacion,
  };
}