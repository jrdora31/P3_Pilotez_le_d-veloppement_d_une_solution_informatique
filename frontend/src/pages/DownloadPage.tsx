import { Download, KeyRound, LoaderCircle } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { downloadSharedFile, getShareLink } from "../api";
import markUrl from "../assets/datashare-mark.svg";
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
    <main className="app-shell centered-shell">
      <Link to="/" className="account-brand">
        <img src={markUrl} alt="" className="brand-link-mark" />
        <span>DataShare</span>
      </Link>

      <section className="download-panel">
        {isLoading ? (
          <p className="loading-line">
            <LoaderCircle aria-hidden="true" size={18} />
            Chargement...
          </p>
        ) : null}

        {!isLoading && error && !shareLink ? <p className="notice error">{error}</p> : null}

        {shareLink ? (
          <>
            <p className="eyebrow">Téléchargement</p>
            <h1>{shareLink.fileName}</h1>
            <dl className="file-meta">
              <div>
                <dt>Taille</dt>
                <dd>{formatFileSize(shareLink.fileSize)}</dd>
              </div>
              <div>
                <dt>Expiration</dt>
                <dd>{shareLink.expiresAt ? formatDate(shareLink.expiresAt) : "Aucune"}</dd>
              </div>
            </dl>

            {error ? <p className="notice error">{error}</p> : null}

            <form onSubmit={handleDownload} className="auth-form">
              {shareLink.passwordRequired ? (
                <label>
                  Mot de passe
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </label>
              ) : null}

              <button type="submit" className="primary-button" disabled={isDownloading}>
                {shareLink.passwordRequired ? <KeyRound aria-hidden="true" size={18} /> : <Download aria-hidden="true" size={18} />}
                {isDownloading ? "Téléchargement..." : "Télécharger"}
              </button>
            </form>
          </>
        ) : null}
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
