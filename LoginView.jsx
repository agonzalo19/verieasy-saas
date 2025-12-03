import { useState } from "react";
import { useAuth } from "./AuthContext";

const LoginView = () => {
  const { signIn, signUp, loading } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nifCif, setNifCif] = useState("");
  const [nombreFiscal, setNombreFiscal] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const isSignup = mode === "signup";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");

    try {
      if (isSignup) {
        const { error: signUpError } = await signUp({
          email,
          password,
          nifCif,
          nombreFiscal,
        });
        if (signUpError) throw signUpError;
        setStatus("Registro creado. Revisa tu correo para confirmar.");
      } else {
        const { error: signInError } = await signIn({ email, password });
        if (signInError) throw signInError;
        setStatus("Sesión iniciada correctamente.");
      }
    } catch (err) {
      setError(err.message || "Error inesperado. Intenta nuevamente.");
    }
  };

  const toggleMode = () => {
    setMode(isSignup ? "login" : "signup");
    setError("");
    setStatus("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur shadow-2xl rounded-2xl p-8 border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
              Verieasy
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              {isSignup ? "Crear cuenta" : "Iniciar sesión"}
            </h1>
          </div>
          <button
            type="button"
            onClick={toggleMode}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {isSignup ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {isSignup && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  NIF/CIF
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  value={nifCif}
                  onChange={(e) => setNifCif(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre Fiscal
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  value={nombreFiscal}
                  onChange={(e) => setNombreFiscal(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {status && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              {status}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg py-3 transition disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
          >
            {loading
              ? "Procesando..."
              : isSignup
              ? "Crear cuenta"
              : "Ingresar"}
          </button>
        </form>

        <p className="text-xs text-slate-500 mt-6 text-center">
          Al continuar aceptas nuestras políticas de privacidad y términos de
          servicio.
        </p>
      </div>
    </div>
  );
};

export default LoginView;
