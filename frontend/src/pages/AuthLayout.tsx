import { Link } from "react-router-dom";
import markUrl from "../assets/datashare-mark.svg";

interface AuthLayoutProps {
  children: React.ReactNode;
  footer: React.ReactNode;
  title: string;
}

export default function AuthLayout({ children, footer, title }: AuthLayoutProps) {
  return (
    <main className="auth-shell">
      <section className="brand-panel" aria-label="DataShare">
        <img src={markUrl} alt="DataShare" className="brand-mark" />
        <div>
          <p className="brand-name">DataShare</p>
          <p className="brand-line">Transfert de fichiers</p>
        </div>
      </section>

      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-card">
          <Link to="/login" className="brand-link" aria-label="Retour à la connexion">
            <img src={markUrl} alt="" className="brand-link-mark" />
            <span>DataShare</span>
          </Link>
          <h1 id="auth-title">{title}</h1>
          {children}
          <div className="auth-footer">{footer}</div>
        </div>
      </section>
    </main>
  );
}
