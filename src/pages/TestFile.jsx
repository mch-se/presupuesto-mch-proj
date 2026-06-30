export default function TestFile() {
  console.log(
    "[TESTFILE] Render"
  );

  return (
    <div style={{ padding: 20 }}>
      <h1>Prueba de archivos</h1>

      <input
        type="file"
        onChange={(e) => {
          const archivo =
            e.target.files?.[0];

          alert(
            archivo
              ? `Archivo: ${archivo.name}`
              : "Sin archivo"
          );
        }}
      />
    </div>
  );
}