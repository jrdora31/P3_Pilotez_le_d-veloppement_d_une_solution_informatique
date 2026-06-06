import { CloudDownload, FileText, Info, LoaderCircle, OctagonAlert, TriangleAlert } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { downloadSharedFile, getShareLink } from "../api";
import { ShareLinkPublic } from "../types";

export default function DownloadPage() {
  const { token } = useParams();
  const [shareLink, setShareLink] = useState<ShareLinkPublic | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadShareLink() {
      if (!token) {
        setError("Lien introuvable.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await getShareLink(token);

        if (isMounted) {
          setShareLink(response);
        }
      } catch (shareError) {
        if (isMounted) {
          setError(shareError instanceof Error ? shareError.message : "Lien introuvable.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadShareLink();

    return () => {
      isMounted = false;
    };
  }, [token]);

  async function handleDownload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !shareLink) {
      return;
    }

    setError("");
    setIsDownloading(true);

    try {
      const blob = await downloadSharedFile(token, password || undefined);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = shareLink.fileName;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Le téléchargement a échoué.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <main className="download-shell gradient-page">
      <header className="simple-header">
        <Link to="/" className="brand-text">
          DataShare
        </Link>
        <Link to="/login" className="dark-nav-button">
          Se connecter
        </Link>
      </header>

      <section className="center-stage" aria-live="polite">
        {isLoading ? (
          <div className="download-panel">
            <p className="loading-line">
              <LoaderCircle aria-hidden="true" size={18} />
              Chargement...
            </p>
          </div>
        ) : null}

        {!isLoading && error && !shareLink ? (
          <div className="download-panel compact-message-panel">
            <h1>Télécharger un fichier</h1>
            <Callout variant="error">{error}</Callout>
          </div>
        ) : null}

        {shareLink ? (
          <div className="download-panel">
            <h1 aria-label={shareLink.fileName}>Télécharger un fichier</h1>

            {shareLink.status === "expired" ? (
              <Callout variant="error">Ce fichier n'est plus disponible en téléchargement car il a expiré.</Callout>
            ) : (
              <>
                <div className="selected-file">
                  <FileText aria-hidden="true" size={18} />
                  <div>
                    <strong>{shareLink.fileName}</strong>
                    <span>{formatFileSize(shareLink.fileSize)}</span>
                  </div>
                </div>

                {shareLink.expiresAt ? (
                  <Callout variant={getExpirationCalloutVariant(shareLink.expiresAt)}>
                    {formatExpirationNotice(shareLink.expiresAt)}
                  </Callout>
                ) : (
                  <span className="sr-only">Aucune</span>
                )}

                {error ? <Callout variant="error">{error}</Callout> : null}

                <form onSubmit={handleDownload} className="auth-form">
                  {shareLink.passwordRequired ? (
                    <label>
                      Mot de passe
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Saisissez le mot de passe..."
                        required
                      />
                    </label>
                  ) : null}

                  <button type="submit" className="primary-button" disabled={isDownloading}>
                    <CloudDownload aria-hidden="true" size={16} />
                    {isDownloading ? "Téléchargement..." : "Télécharger"}
                  </button>
                </form>
              </>
            )}
          </div>
        ) : null}
      </section>

      <p className="page-footer">Copyright DataShare® 2025</p>
    </main>
  );
}

type CalloutVariant = "info" | "warning" | "error";

interface CalloutProps {
  children: React.ReactNode;
  variant: CalloutVariant;
}

function Callout({ children, variant }: CalloutProps) {
  const Icon = variant === "info" ? Info : variant === "warning" ? TriangleAlert : OctagonAlert;

  return (
    <p className={`callout ${variant}`}>
      <Icon aria-hidden="true" size={14} />
      <span>{children}</span>
    </p>
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

function getExpirationCalloutVariant(value: string): CalloutVariant {
  return getRemainingDays(value) <= 1 ? "warning" : "info";
}

function formatExpirationNotice(value: string): string {
  const days = getRemainingDays(value);

  if (days <= 0) {
    return "Ce fichier expire aujourd'hui.";
  }

  if (days === 1) {
    return "Ce fichier expirera demain.";
  }

  return `Ce fichier expirera dans ${days} jours.`;
}

function getRemainingDays(value: string): number {
  const expiration = new Date(value);
  const today = new Date();
  const millisecondsPerDay = 86_400_000;

  return Math.ceil((expiration.getTime() - today.getTime()) / millisecondsPerDay);
}
