import { ExternalLink, FileText, LockKeyhole, LogOut, Menu, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { deleteFile, listOwnFiles } from "../api";
import { clearAuth, getAccessToken, getCurrentUser } from "../auth-storage";
import { FileListItem, FileStatusFilter } from "../types";

export default function AccountPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const token = getAccessToken();
  const [files, setFiles] = useState<FileListItem[]>([]);
  const [status, setStatus] = useState<FileStatusFilter>("all");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadFiles() {
      if (!token) {
        return;
      }

      setError("");
      setIsLoading(true);

      try {
        const response = await listOwnFiles(token, status);

        if (isMounted) {
          setFiles(response.items);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Impossible de charger les fichiers.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadFiles();

    return () => {
      isMounted = false;
    };
  }, [status, token]);

  function handleLogout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  async function handleDelete(file: FileListItem) {
    if (!token || !window.confirm(`Supprimer "${file.originalName}" ?`)) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await deleteFile(file.id, token);
      setFiles((currentFiles) => currentFiles.filter((currentFile) => currentFile.id !== file.id));
      setNotice("Fichier supprimé.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "La suppression a échoué.");
    }
  }

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="account-shell">
      <aside className="account-sidebar" aria-label="Navigation de l'espace">
        <div className="sidebar-brand">DataShare</div>
        <button type="button" className="sidebar-link">
          Mes fichiers
        </button>
        <p className="sidebar-footer">Copyright DataShare® 2025</p>
      </aside>

      <section className="account-main">
        <header className="account-topbar">
          <button type="button" className="menu-button" aria-label="Menu">
            <Menu aria-hidden="true" size={18} />
          </button>
          <div className="mobile-user">
            <span className="avatar-dot" aria-hidden="true">
              {getUserInitials(user.email)}
            </span>
            <span>{formatUserName(user.email)}</span>
          </div>
          <div className="topbar-actions">
            <button type="button" className="dark-nav-button" onClick={() => navigate("/")}>
              <Upload aria-hidden="true" size={14} />
              Ajouter des fichiers
            </button>
            <button type="button" className="logout-button" onClick={handleLogout}>
              <LogOut aria-hidden="true" size={14} />
              Déconnexion
            </button>
          </div>
        </header>

        <div className="files-workspace">
          <h1 className="sr-only">Connecté</h1>
          <p className="sr-only">{user.email}</p>

          <div className="section-heading">
            <h2>Mes fichiers</h2>
            <div className="status-switch" role="group" aria-label="Filtrer les fichiers">
              <button
                type="button"
                className={status === "all" ? "active" : ""}
                onClick={() => setStatus("all")}
              >
                Tous
              </button>
              <button
                type="button"
                className={status === "active" ? "active" : ""}
                onClick={() => setStatus("active")}
              >
                Actifs
              </button>
              <button
                type="button"
                className={status === "expired" ? "active" : ""}
                onClick={() => setStatus("expired")}
              >
                Expiré
              </button>
            </div>
          </div>

          {notice ? <p className="notice success">{notice}</p> : null}
          {error ? <p className="notice error">{error}</p> : null}
          {isLoading ? <p className="muted">Chargement...</p> : null}
          {!isLoading && files.length === 0 ? <p className="empty-state">Aucun fichier à afficher.</p> : null}

          <div className="file-list">
            {files.map((file) => (
              <article className={`file-row ${file.status === "expired" ? "expired" : ""}`} key={file.id}>
                <FileText aria-hidden="true" size={18} className="file-icon" />
                <div className="file-row-main">
                  <h3>{file.originalName}</h3>
                  <p>{formatFileExpiration(file)}</p>
                  {file.tags.length ? (
                    <div className="tag-list">
                      {file.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
                {file.status === "expired" ? (
                  <p className="expired-copy">Ce fichier à expiré, il n'est plus stocké chez nous</p>
                ) : (
                  <div className="file-actions">
                    {file.passwordProtected ? (
                      <span className="lock-indicator" title="Lien protégé par mot de passe">
                        <LockKeyhole aria-hidden="true" size={14} />
                      </span>
                    ) : null}
                    <button
                      type="button"
                      className="outline-action danger-button"
                      onClick={() => void handleDelete(file)}
                    >
                      <Trash2 aria-hidden="true" size={13} />
                      Supprimer
                    </button>
                    {file.shareUrl ? (
                      <a href={file.shareUrl} className="outline-action">
                        Accéder
                        <ExternalLink aria-hidden="true" size={13} />
                      </a>
                    ) : null}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function formatUserName(email: string): string {
  const [rawName] = email.split("@");

  return rawName
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function getUserInitials(email: string): string {
  return formatUserName(email)
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("");
}

function formatFileExpiration(file: FileListItem): string {
  if (file.status === "expired") {
    return "Expiré";
  }

  if (!file.expiresAt) {
    return "Sans expiration";
  }

  const days = getRemainingDays(file.expiresAt);

  if (days <= 0) {
    return "Expire aujourd'hui";
  }

  if (days === 1) {
    return "Expire demain";
  }

  return `Expire dans ${days} jours`;
}

function getRemainingDays(value: string): number {
  const expiration = new Date(value);
  const today = new Date();
  const millisecondsPerDay = 86_400_000;

  return Math.ceil((expiration.getTime() - today.getTime()) / millisecondsPerDay);
}
