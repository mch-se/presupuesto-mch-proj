import React from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    obtenerSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function obtenerSesion() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setUser(session?.user ?? null);
    setLoading(false);
  }

  async function registrarse() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Usuario registrado correctamente");
  }

  async function iniciarSesion() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl">
        Cargando...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded shadow-xl w-full max-w-md">
          <h1 className="text-3xl font-bold mb-8 text-center">
            MCH Presupuestos
          </h1>

          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-3 rounded"
            />

            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border p-3 rounded"
            />

            <button
              onClick={iniciarSesion}
              className="w-full bg-black text-white p-3 rounded"
            >
              Iniciar Sesión
            </button>

            <button
              onClick={registrarse}
              className="w-full bg-gray-700 text-white p-3 rounded"
            >
              Registrarse
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 p-6">
      <div className="max-w-5xl mx-auto bg-white p-10 shadow-xl rounded">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold">
              Presupuesto MCH
            </h1>

            <p className="text-gray-600 mt-2">
              Usuario: {user.email}
            </p>
          </div>

          <button
            onClick={cerrarSesion}
            className="bg-red-500 text-white px-5 py-3 rounded"
          >
            Cerrar Sesión
          </button>
        </div>

        <div className="text-xl">
          Sistema listo para continuar.
        </div>
      </div>
    </div>
  );
}