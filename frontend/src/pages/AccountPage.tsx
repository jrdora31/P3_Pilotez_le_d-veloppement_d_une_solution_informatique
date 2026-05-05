import { Clipboard, FileText, LogOut, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { deleteFile, listOwnFiles } from "../api";
import { clearAuth, getAccessToken, getCurrentUser } from "../auth-storage";
import markUrl from "../assets/datashare-mark.svg";
import { FileListItem, FileStatusFilter } from "../types";

export default function AccountPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const token = getAccessToken();
  const [files, setFiles] = useState<FileListItem[]>([]);
  const [status, setStatus] = useState<FileStatusFilter>("active");
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

  async function handleCopy(url: string | null) {
    if (!url) {
      return;
    }

    await navigator.clipboard.writeText(url);
    setNotice("Lien copié.");
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
      <header className="account-header">
        <div className="account-brand">
          <img src={markUrl} alt="" className="brand-link-mark" />
          <span>DataShare</span>
        </div>
        <div className="topbar-actions">
          <button type="button" className="secondary-button compact-button" onClick={() => navigate("/")}>
            <Upload aria-hidden="true" size={18} />
            Téléverser
          </button>
          <button type="button" className="secondary-button compact-button" onClick={handleLogout}>
            <LogOut aria-hidden="true" size={18} />
            Déconnexion
          </button>
        </div>
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

      <section className="history-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Historique</p>
            <h2>Mes fichiers</h2>
          </div>
          <label className="compact-field">
            État
            <select value={status} onChange={(event) => setStatus(event.target.value as FileStatusFilter)}>
              <option value="active">Actifs</option>
              <option value="expired">Expirés</option>
              <option value="all">Tous</option>
            </select>
          </label>
        </div>

        {notice ? <p className="notice success">{notice}</p> : null}
        {error ? <p className="notice error">{error}</p> : null}
        {isLoading ? <p className="muted">Chargement...</p> : null}
        {!isLoading && files.length === 0 ? <p className="empty-state">Aucun fichier à afficher.</p> : null}

        <div className="file-list">
          {files.map((file) => (
            <article className="file-row" key={file.id}>
              <FileText aria-hidden="true" size={22} className="file-icon" />
              <div className="file-row-main">
                <h3>{file.originalName}</h3>
                <p>
                  {formatFileSize(file.size)} · Envoyé le {formatDate(file.createdAt)}
                  {file.expiresAt ? ` · Expire le ${formatDate(file.expiresAt)}` : ""}
                </p>
                {file.tags.length ? (
                  <div className="tag-list">
                    {file.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="file-actions">
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Copier le lien de ${file.originalName}`}
                  onClick={() => void handleCopy(file.shareUrl)}
                  disabled={!file.shareUrl}
                >
                  <Clipboard aria-hidden="true" size={18} />
                </button>
                <button
                  type="button"
                  className="icon-button danger-button"
                  aria-label={`Supprimer ${file.originalName}`}
                  onClick={() => void handleDelete(file)}
                >
                  <Trash2 aria-hidden="true" size={18} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function formatFileSize(size: number): string {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
    style: "unit",
    unit: "megabyte",
    unitDisplay: "short"
  }).format(size / 1_000_000);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
