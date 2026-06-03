import React from "react";
import logo from "../assets/logo.png";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [modo, setModo] = React.useState("login");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmarPassword, setConfirmarPassword] = React.useState("");

  const [procesando, setProcesando] = React.useState(false);

  function limpiarPasswords() {
    setPassword("");
    setConfirmarPassword("");
  }

  function cambiarModo(nuevoModo) {
    setModo(nuevoModo);
    limpiarPasswords();
  }

  async function registrarse() {
    if (procesando) return;

    if (!email.trim()) {
      alert("Ingresar email");
      return;
    }

    if (!password) {
      alert("Ingresar contraseña");
      return;
    }

    if (password !== confirmarPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    setProcesando(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      alert(error.message);
      setProcesando(false);
      return;
    }

    const user = data.user;

    if (user) {
      const { error: profileError } = await supabase.from("profiles").upsert(
        [
          {
            id: user.id,
            email: user.email,
            alias: null,
            rol: "pendiente",
            activo: true,
          },
        ],
        {
          onConflict: "id",
        }
      );

      if (profileError) {
        alert(profileError.message);
        setProcesando(false);
        return;
      }
    }

    alert(
      "Usuario registrado. Un administrador deberá asignar alias y permisos."
    );

    cambiarModo("login");
    setProcesando(false);
  }

  async function iniciarSesion() {
    if (procesando) return;

    if (!email.trim()) {
      alert("Ingresar email");
      return;
    }

    if (!password) {
      alert("Ingresar contraseña");
      return;
    }

    setProcesando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      alert(error.message);
      setProcesando(false);
      return;
    }

    setProcesando(false);
  }

  async function recuperarPassword() {
    if (procesando) return;

    if (!email.trim()) {
      alert("Ingresar email");
      return;
    }

    setProcesando(true);

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: window.location.origin,
      }
    );

    if (error) {
      alert(error.message);
      setProcesando(false);
      return;
    }

    alert("Te enviamos un email para recuperar la contraseña.");

    cambiarModo("login");
    setProcesando(false);
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

        {modo === "login" && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-black text-black">
                Iniciar sesión
              </h1>

              <p className="text-gray-500 mt-2">
                Acceso a MCH Presupuestos
              </p>
            </div>

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
              disabled={procesando}
              className="w-full bg-black text-white p-4 rounded-xl text-lg font-bold hover:bg-orange-500 transition disabled:opacity-60"
            >
              {procesando ? "Ingresando..." : "Iniciar sesión"}
            </button>

            <button
              type="button"
              onClick={() => cambiarModo("recuperar")}
              className="w-full text-gray-600 hover:text-orange-500 font-bold py-2"
            >
              Olvidé mi contraseña
            </button>

            <div className="border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => cambiarModo("registro")}
                className="w-full bg-orange-500 text-white p-4 rounded-xl text-lg font-bold hover:bg-orange-600 transition"
              >
                Crear cuenta
              </button>
            </div>
          </div>
        )}

        {modo === "registro" && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-black text-black">
                Crear cuenta
              </h1>

              <p className="text-gray-500 mt-2">
                Luego un administrador asignará alias y permisos.
              </p>
            </div>

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

            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              className="w-full border-2 border-gray-300 p-4 rounded-xl"
            />

            <button
              onClick={registrarse}
              disabled={procesando}
              className="w-full bg-orange-500 text-white p-4 rounded-xl text-lg font-bold hover:bg-orange-600 transition disabled:opacity-60"
            >
              {procesando ? "Registrando..." : "Registrarse"}
            </button>

            <button
              type="button"
              onClick={() => cambiarModo("login")}
              className="w-full bg-gray-200 text-gray-800 p-4 rounded-xl text-lg font-bold hover:bg-gray-300 transition"
            >
              Volver al login
            </button>
          </div>
        )}

        {modo === "recuperar" && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-black text-black">
                Recuperar contraseña
              </h1>

              <p className="text-gray-500 mt-2">
                Ingresá tu email y te enviaremos un enlace de recuperación.
              </p>
            </div>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-gray-300 p-4 rounded-xl"
            />

            <button
              onClick={recuperarPassword}
              disabled={procesando}
              className="w-full bg-orange-500 text-white p-4 rounded-xl text-lg font-bold hover:bg-orange-600 transition disabled:opacity-60"
            >
              {procesando ? "Enviando..." : "Enviar enlace"}
            </button>

            <button
              type="button"
              onClick={() => cambiarModo("login")}
              className="w-full bg-gray-200 text-gray-800 p-4 rounded-xl text-lg font-bold hover:bg-gray-300 transition"
            >
              Volver al login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
