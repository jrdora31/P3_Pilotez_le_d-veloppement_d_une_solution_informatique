import { LogOut } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { clearAuth, getAccessToken, getCurrentUser } from "../auth-storage";
import markUrl from "../assets/datashare-mark.svg";

export default function AccountPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const token = getAccessToken();

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  function handleLogout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  return (
    <main className="account-shell">
      <header className="account-header">
        <div className="account-brand">
          <img src={markUrl} alt="" className="brand-link-mark" />
          <span>DataShare</span>
        </div>
        <button type="button" className="secondary-button" onClick={handleLogout}>
          <LogOut aria-hidden="true" size={18} />
          Déconnexion
        </button>
      </header>

      <section className="account-panel">
        <p className="eyebrow">Mon espace</p>
        <h1>Connecté</h1>
        <dl className="account-details">
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Compte créé le</dt>
            <dd>{new Intl.DateTimeFormat("fr-FR").format(new Date(user.createdAt))}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
