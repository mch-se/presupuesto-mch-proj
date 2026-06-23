import React from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { useLocation } from "react-router-dom";

const SharedFile = registerPlugin("SharedFile");

function esRutaImportadora(pathname) {
  return pathname.startsWith("/articulos") || pathname.startsWith("/presupuestos");
}

export default function ArchivoCompartidoHandler() {
  const location = useLocation();
  const locationRef = React.useRef(location.pathname);

  React.useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  React.useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    async function procesarPendiente() {
      try {
        const resultado = await SharedFile.getPendingFileInfo();

        if (resultado?.fileName) {
          abrirImportador();
        }
      } catch (error) {
        console.error(error);
      }
    }

    function recibirArchivoCompartido() {
      abrirImportador();
    }

    procesarPendiente();
    window.addEventListener("mchSharedFileReceived", recibirArchivoCompartido);

    return () => {
      window.removeEventListener("mchSharedFileReceived", recibirArchivoCompartido);
    };
  }, []);

  function abrirImportador() {
    if (esRutaImportadora(locationRef.current)) {
      window.dispatchEvent(new CustomEvent("mchImportarArchivoCompartido"));
    }
  }

  return null;
}
