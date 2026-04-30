import { UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api";
import AuthLayout from "./AuthLayout";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== passwordConfirmation) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);

    try {
      await registerUser({ email, password, passwordConfirmation });
      navigate("/login", {
        replace: true,
        state: {
          notice: "Compte créé. Vous pouvez maintenant vous connecter."
        }
      });
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "La création du compte a échoué.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Créer un compte"
      footer={
        <p>
          Déjà inscrit ? <Link to="/login">Se connecter</Link>
        </p>
      }
    >
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
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <label>
          Confirmation
          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            required
          />
        </label>

        <button type="submit" className="primary-button" disabled={isSubmitting}>
          <UserPlus aria-hidden="true" size={18} />
          {isSubmitting ? "Création..." : "Créer le compte"}
        </button>
      </form>
    </AuthLayout>
  );
}
