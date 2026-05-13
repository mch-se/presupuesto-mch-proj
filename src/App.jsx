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
    nuevos[index][campo] = campo === "descripcion" ? valor : Number(valor);
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
      <div className="w-full max-w-4xl bg-white shadow-2xl p-10 text-sm">
        <div className="flex justify-between items-start border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold uppercase">
              MCH Soluciones Electrónicas
            </h1>
            <p className="mt-2">Lomas de Zamora - Buenos Aires</p>
            <p>Tel: 11 2667-0854</p>
            <p>mchsolucioneselectronicas@hotmail.com</p>
            <p>IVA Responsable Inscripto</p>
          </div>

          <div className="text-right">
            <h2 className="text-2xl font-bold">PRESUPUESTO</h2>
            <p className="mt-2">
              <strong>Fecha:</strong> {fechaActual}
            </p>
            <p>
              <strong>N°:</strong> 1924
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-8 border-b pb-6">
          <div>
            <p className="font-semibold mb-2">Cliente</p>
            <input
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Nombre del cliente"
              className="w-full border p-2"
            />
          </div>

          <div>
            <p className="font-semibold mb-2">Trabajo</p>
            <input
              value={trabajo}
              onChange={(e) => setTrabajo(e.target.value)}
              placeholder="Ej: Instalación CCTV"
              className="w-full border p-2"
            />
          </div>
        </div>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Detalle</h3>

            <button
              onClick={agregarItem}
              className="bg-black text-white px-4 py-2"
            >
              Agregar Item
            </button>
          </div>

          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Cantidad</th>
                <th className="border p-2 text-left">Descripción</th>
                <th className="border p-2 text-left">Precio Unitario</th>
                <th className="border p-2 text-left">Subtotal</th>
                <th className="border p-2"></th>
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
                        actualizarItem(index, "cantidad", e.target.value)
                      }
                      className="w-full"
                    />
                  </td>

                  <td className="border p-2">
                    <input
                      value={item.descripcion}
                      onChange={(e) =>
                        actualizarItem(index, "descripcion", e.target.value)
                      }
                      placeholder="Descripción"
                      className="w-full"
                    />
                  </td>

                  <td className="border p-2 w-40">
                    <input
                      type="number"
                      value={item.precio}
                      onChange={(e) =>
                        actualizarItem(index, "precio", e.target.value)
                      }
                      className="w-full"
                    />
                  </td>

                  <td className="border p-2 font-medium w-40">
                    $ {(item.cantidad * item.precio).toFixed(2)}
                  </td>

                  <td className="border p-2 w-20 text-center">
                    <button
                      onClick={() => eliminarItem(index)}
                      className="bg-red-500 text-white px-2 py-1"
                    >
                      X
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-3">Condiciones</h3>

            <div className="text-sm space-y-2 text-gray-700 leading-relaxed">
              <p>
                Los importes son válidos por 5 días debido a la inestabilidad
                monetaria.
              </p>

              <p>
                Pago en efectivo o transferencia al finalizar el trabajo.
              </p>

              <p>
                Otros medios de pago pueden tener recargo adicional.
              </p>

              <p>
                Incluye configuración y puesta en marcha.
              </p>
            </div>
          </div>

          <div className="border p-6 flex flex-col justify-center">
            <div className="flex justify-between mb-3 text-lg">
              <span>Subtotal</span>
              <span>$ {subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between mb-3 text-lg">
              <span>IVA 21%</span>
              <span>$ {iva.toFixed(2)}</span>
            </div>

            <div className="border-t pt-4 flex justify-between text-3xl font-bold">
              <span>Total</span>
              <span>$ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-end">
          <button
            onClick={() => window.print()}
            className="bg-black text-white px-6 py-3 text-lg"
          >
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
