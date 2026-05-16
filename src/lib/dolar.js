export async function obtenerDolarBNA() {

  try {

    const response = await fetch(
      "https://api.bluelytics.com.ar/v2/latest"
    );

    const data = await response.json();

    return {
      compra:
        data.oficial.value_buy,

      venta:
        data.oficial.value_sell,

      fecha:
        new Date(data.last_update),
    };

  } catch (error) {

    console.error(
      "Error obteniendo dólar:",
      error
    );

    return null;
  }
}