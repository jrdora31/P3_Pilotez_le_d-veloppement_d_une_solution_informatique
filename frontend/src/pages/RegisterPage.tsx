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
    <AuthLayout title="Créer un compte">
      {error ? <p className="notice error">{error}</p> : null}

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            placeholder="Saisissez votre email..."
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
            placeholder="Saisissez votre mot de passe..."
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <label>
          Vérification du mot de passe
          <input
            type="password"
            aria-label="Confirmation"
            autoComplete="new-password"
            minLength={8}
            placeholder="Saisissez le à nouveau..."
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            required
          />
        </label>

        <Link to="/login" className="auth-inline-link">
          J'ai déjà un compte
        </Link>

        <button type="submit" className="primary-button" aria-label="Créer le compte" disabled={isSubmitting}>
          {isSubmitting ? "Création..." : "Créer mon compte"}
        </button>
      </form>
    </AuthLayout>
  );
}
