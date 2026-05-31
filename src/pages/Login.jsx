import React from "react";
import logo from "../assets/logo.png";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  async function registrarse() {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    const user = data.user;

    if (user) {
      await supabase.from("profiles").insert([
        {
          id: user.id,
          email: user.email,
          rol: "pendiente",
          activo: true,
        },
      ]);
    }

    alert(
      "Usuario registrado. Un administrador deberá asignar alias y permisos."
    );
  }

  async function iniciarSesion() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-3xl p-10 shadow-2xl">

        <div className="flex justify-center mb-8">
          <img
            src={logo}
            alt="MCH"
            className="h-36 object-contain"
          />
        </div>

        <div className="space-y-4">

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-2 border-gray-300 p-4 rounded-xl"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border-2 border-gray-300 p-4 rounded-xl"
          />

          <button
            onClick={iniciarSesion}
            className="w-full bg-black text-white p-4 rounded-xl text-lg font-bold hover:bg-orange-500 transition"
          >
            Iniciar Sesión
          </button>

          <button
            onClick={registrarse}
            className="w-full bg-orange-500 text-white p-4 rounded-xl text-lg font-bold hover:bg-orange-600 transition"
          >
            Registrarse
          </button>

        </div>
      </div>
    </div>
  );
}