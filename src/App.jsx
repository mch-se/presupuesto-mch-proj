import React from "react";

export default function App() {
  const [cliente, setCliente] = React.useState("");
  const [trabajo, setTrabajo] = React.useState("");
  const [items, setItems] = React.useState([
    { descripcion: "", cantidad: 1, precio: 0 },
  ]);

  const agregarItem = () => {
    setItems([
      ...items,
      { descripcion: "", cantidad: 1, precio: 0 },
    ]);
  };

  const actualizarItem = (index, campo, valor) => {
    const nuevos = [...items];
    nuevos[index][campo] =
      campo === "descripcion" ? valor : Number(valor);

    setItems(nuevos);
  };

  const eliminarItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce(
    (acc, item) => acc + item.cantidad * item.precio,
    0
  );

  const iva = subtotal * 0.21;
  const total = subtotal + iva;

  const fechaActual = new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-gray-200 p-6 flex justify-center">
      <div className="w-full max-w-5xl bg-white shadow-2xl p-10 text-sm">

        {/* ENCABEZADO */}
        <div className="flex justify-between items-start border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold uppercase">
              MCH Soluciones Electrónicas
            </h1>

            <div className="mt-3 text-gray-700 leading-6">
              <p>Lomas de Zamora - Buenos Aires</p>
              <p>Tel: 11 2667-0854</p>
              <p>mchsolucioneselectronicas@hotmail.com</p>
              <p>IVA Responsable Inscripto</p>
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-3xl font-bold">
              PRESUPUESTO
            </h2>

            <div className="mt-4 space-y-1">
              <p>
                <strong>Fecha:</strong> {fechaActual}
              </p>

              <p>
                <strong>N°:</strong> 1924
              </p>
            </div>
          </div>
        </div>

        {/* DATOS CLIENTE */}
        <div className="grid md:grid-cols-2 gap-6 mt-8 border-b pb-6">

          <div>
            <label className="font-semibold block mb-2">
              Cliente
            </label>

            <input
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Nombre del cliente"
              className="w-full border border-gray-300 p-3 rounded"
            />
          </div>

          <div>
            <label className="font-semibold block mb-2">
              Trabajo
            </label>

            <input
              type="text"
              value={trabajo}
              onChange={(e) => setTrabajo(e.target.value)}
              placeholder="Ej: Instalación CCTV"
              className="w-full border border-gray-300 p-3 rounded"
            />
          </div>
        </div>

        {/* TABLA */}
        <div className="mt-8">

          <div className="flex justify-between items-center mb-5">
            <h3 className="text-2xl font-bold">
              Detalle del Trabajo
            </h3>

            <button
              onClick={agregarItem}
              className="bg-black text-white px-5 py-3 rounded hover:bg-gray-800"
            >
              Agregar Item
            </button>
          </div>

          <div className="overflow-auto">
            <table className="w-full border border-gray-300">

              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-3 text-left">
                    Cant.
                  </th>

                  <th className="border p-3 text-left">
                    Descripción
                  </th>

                  <th className="border p-3 text-left">
                    Precio Unit.
                  </th>

                  <th className="border p-3 text-left">
                    Subtotal
                  </th>

                  <th className="border p-3">
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>

                    <td className="border p-2 w-24">
                      <input
                        type="number"
                        value={item.cantidad}
                        onChange={(e) =>
                          actualizarItem(
                            index,
                            "cantidad",
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded"
                      />
                    </td>

                    <td className="border p-2">
                      <input
                        type="text"
                        value={item.descripcion}
                        onChange={(e) =>
                          actualizarItem(
                            index,
                            "descripcion",
                            e.target.value
                          )
                        }
                        placeholder="Descripción del trabajo o producto"
                        className="w-full p-2 border rounded"
                      />
                    </td>

                    <td className="border p-2 w-40">
                      <input
                        type="number"
                        value={item.precio}
                        onChange={(e) =>
                          actualizarItem(
                            index,
                            "precio",
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded"
                      />
                    </td>

                    <td className="border p-2 font-semibold w-40">
                      $
                      {" "}
                      {(item.cantidad * item.precio).toFixed(2)}
                    </td>

                    <td className="border p-2 text-center w-20">
                      <button
                        onClick={() => eliminarItem(index)}
                        className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                      >
                        X
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </div>

        {/* TOTALES Y CONDICIONES */}
        <div className="mt-10 grid md:grid-cols-2 gap-10">

          <div>
            <h3 className="text-xl font-bold mb-4">
              Condiciones
            </h3>

            <div className="space-y-3 text-gray-700 leading-relaxed">

              <p>
                • Los importes tienen validez por 5 días.
              </p>

              <p>
                • Pago contado efectivo o transferencia.
              </p>

              <p>
                • Otros medios de pago pueden incluir recargos.
              </p>

              <p>
                • Incluye instalación y configuración.
              </p>

              <p>
                • Garantía según condiciones del fabricante.
              </p>

            </div>
          </div>

          <div className="border border-gray-300 p-6 rounded shadow-sm">

            <div className="flex justify-between mb-4 text-lg">
              <span>Subtotal</span>

              <span>
                $
                {" "}
                {subtotal.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between mb-4 text-lg">
              <span>IVA 21%</span>

              <span>
                $
                {" "}
                {iva.toFixed(2)}
              </span>
            </div>

            <div className="border-t pt-4 flex justify-between text-3xl font-bold">
              <span>Total</span>

              <span>
                $
                {" "}
                {total.toFixed(2)}
              </span>
            </div>

          </div>
        </div>

        {/* BOTÓN */}
        <div className="mt-10 flex justify-end">

          <button
            onClick={() => window.print()}
            className="bg-black text-white px-8 py-4 rounded text-lg hover:bg-gray-800"
          >
            Imprimir / Guardar PDF
          </button>

        </div>

      </div>
    </div>
  );
}