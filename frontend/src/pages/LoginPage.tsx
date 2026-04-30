import { LogIn } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginUser } from "../api";
import { saveAuth } from "../auth-storage";
import AuthLayout from "./AuthLayout";

interface LocationState {
  notice?: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const auth = await loginUser({ email, password });
      saveAuth(auth);
      navigate("/account", { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Identifiants invalides.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Connexion"
      footer={
        <p>
          Pas encore de compte ? <Link to="/register">Créer un compte</Link>
        </p>
      }
    >
      {state?.notice ? <p className="notice success">{state.notice}</p> : null}
      {error ? <p className="notice error">{error}</p> : null}

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Mot de passe
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <button type="submit" className="primary-button" disabled={isSubmitting}>
          <LogIn aria-hidden="true" size={18} />
          {isSubmitting ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </AuthLayout>
  );
}
