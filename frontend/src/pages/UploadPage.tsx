import { Clipboard, FolderClock, LogIn, Send, UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { uploadFile } from "../api";
import { getAccessToken, getCurrentUser } from "../auth-storage";
import markUrl from "../assets/datashare-mark.svg";
import { UploadResponse } from "../types";

export default function UploadPage() {
  const user = getCurrentUser();
  const token = getAccessToken();
  const [file, setFile] = useState<File | null>(null);
  const [expirationDays, setExpirationDays] = useState(7);
  const [sharePassword, setSharePassword] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [copyNotice, setCopyNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCopyNotice("");

    if (!file) {
      setError("Sélectionnez un fichier.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await uploadFile({
        file,
        expirationDays,
        sharePassword: sharePassword.trim() || undefined,
        tags: user ? splitTags(tags) : undefined,
        accessToken: token
      });
      setUploadResponse(response);
      setFile(null);
      setTags("");
      setSharePassword("");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Le téléversement a échoué.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyShareUrl() {
    if (!uploadResponse) {
      return;
    }

    await navigator.clipboard.writeText(uploadResponse.shareLink.url);
    setCopyNotice("Lien copié.");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link to="/" className="account-brand">
          <img src={markUrl} alt="" className="brand-link-mark" />
          <span>DataShare</span>
        </Link>
        <nav className="topbar-actions" aria-label="Navigation principale">
          {user ? (
            <Link to="/account" className="secondary-button compact-button">
              <FolderClock aria-hidden="true" size={18} />
              Mon espace
            </Link>
          ) : (
            <>
              <Link to="/login" className="secondary-button compact-button">
                <LogIn aria-hidden="true" size={18} />
                Connexion
              </Link>
              <Link to="/register" className="primary-link-button compact-button">
                <UserPlus aria-hidden="true" size={18} />
                Compte
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="upload-layout">
        <div className="upload-copy">
          <p className="eyebrow">Téléversement</p>
          <h1>Partager un fichier</h1>
          <p className="muted">
            {user
              ? "Le fichier sera ajouté à votre espace personnel."
              : "Le lien sera disponible sans rattachement à un compte."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="upload-panel" noValidate>
          {error ? <p className="notice error">{error}</p> : null}

          <label>
            Fichier
            <input
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              required
            />
          </label>

          <div className="form-grid">
            <label>
              Expiration
              <input
                type="number"
                min={1}
                max={7}
                value={expirationDays}
                onChange={(event) => setExpirationDays(Number(event.target.value))}
              />
            </label>

            <label>
              Mot de passe
              <input
                type="password"
                minLength={6}
                value={sharePassword}
                onChange={(event) => setSharePassword(event.target.value)}
                placeholder="Optionnel"
              />
            </label>
          </div>

          {user ? (
            <label>
              Tags
              <input
                type="text"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="facture, projet"
              />
            </label>
          ) : null}

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            <Send aria-hidden="true" size={18} />
            {isSubmitting ? "Téléversement..." : "Générer le lien"}
          </button>

          {uploadResponse ? (
            <div className="share-result">
              <span>Lien de partage</span>
              <a href={uploadResponse.shareLink.url}>{uploadResponse.shareLink.url}</a>
              <button type="button" className="secondary-button" onClick={copyShareUrl}>
                <Clipboard aria-hidden="true" size={18} />
                Copier
              </button>
              {copyNotice ? <p className="inline-success">{copyNotice}</p> : null}
            </div>
          ) : null}
        </form>
      </section>
    </main>
  );
}

function splitTags(rawTags: string): string[] {
  return rawTags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
