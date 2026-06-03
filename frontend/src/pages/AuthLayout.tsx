interface AuthLayoutProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  title: string;
}

export default function AuthLayout({ children, footer, title }: AuthLayoutProps) {
  return (
    <main className="auth-shell gradient-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-card">
          <h1 id="auth-title">{title}</h1>
          {children}
          {footer ? <div className="auth-footer">{footer}</div> : null}
        </div>
      </section>
    </main>
  );
}
