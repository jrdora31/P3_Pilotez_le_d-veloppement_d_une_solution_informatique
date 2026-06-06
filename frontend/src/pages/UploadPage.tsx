import { Clipboard, FileText, FolderClock, LogIn, UploadCloud } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { uploadFile } from "../api";
import { getAccessToken, getCurrentUser } from "../auth-storage";
import { UploadResponse } from "../types";

const EXPIRATION_OPTIONS = [
  { days: 1, label: "Une journée" },
  { days: 2, label: "Deux jours" },
  { days: 3, label: "Trois jours" },
  { days: 4, label: "Quatre jours" },
  { days: 5, label: "Cinq jours" },
  { days: 6, label: "Six jours" },
  { days: 7, label: "Sept jours" }
];

export default function UploadPage() {
  const user = getCurrentUser();
  const token = getAccessToken();
  const [file, setFile] = useState<File | null>(null);
  const [expirationDays, setExpirationDays] = useState(1);
  const [sharePassword, setSharePassword] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [copyNotice, setCopyNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
  const [uploadedExpirationDays, setUploadedExpirationDays] = useState<number | null>(null);

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
      setUploadedExpirationDays(expirationDays);
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
    <main className="upload-shell gradient-page">
      <header className="simple-header">
        <Link to="/" className="brand-text">
          DataShare
        </Link>
        <nav className="topbar-actions" aria-label="Navigation principale">
          {user ? (
            <Link to="/account" className="dark-nav-button">
              <FolderClock aria-hidden="true" size={12} />
              Mon espace
            </Link>
          ) : (
            <Link to="/login" className="dark-nav-button">
              <LogIn aria-hidden="true" size={12} />
              Se connecter
            </Link>
          )}
        </nav>
      </header>

      <input
        id="upload-file"
        className="sr-only"
        type="file"
        aria-label="Fichier"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />

      {!file && !uploadResponse ? (
        <section className="upload-home" aria-labelledby="upload-title">
          <h1 id="upload-title" className="sr-only">
            Partager un fichier
          </h1>
          <p className="upload-question">Tu veux partager un fichier ?</p>
          <label className="upload-orb" htmlFor="upload-file" aria-label="Choisir un fichier">
            <UploadCloud aria-hidden="true" size={36} />
          </label>
        </section>
      ) : null}

      {file ? (
        <section className="center-stage" aria-labelledby="upload-form-title">
          <form onSubmit={handleSubmit} className="upload-panel" noValidate>
            <h1 id="upload-form-title">Ajouter un fichier</h1>

            <div className="selected-file">
              <FileText aria-hidden="true" size={18} />
              <div>
                <strong>{file.name}</strong>
                <span>{formatFileSize(file.size)}</span>
              </div>
              <label className="outline-mini-button" htmlFor="upload-file">
                Changer
              </label>
            </div>

            {error ? <p className="notice error">{error}</p> : null}

            {file.size > 1_000_000_000 ? <p className="inline-danger">La taille des fichiers est limitée à 1 Go</p> : null}

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

            <label>
              Expiration
              <select value={expirationDays} onChange={(event) => setExpirationDays(Number(event.target.value))}>
                {EXPIRATION_OPTIONS.map((option) => (
                  <option key={option.days} value={option.days}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {user ? (
              <label>
                Tags
                <input
                  type="text"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="tag1, tag2, tag3"
                />
              </label>
            ) : null}

            <button
              type="submit"
              className="primary-button"
              aria-label="Générer le lien"
              disabled={isSubmitting || file.size > 1_000_000_000}
            >
              <UploadCloud aria-hidden="true" size={16} />
              {isSubmitting ? "Téléversement..." : "Téléverser"}
            </button>
          </form>
        </section>
      ) : null}

      {uploadResponse ? (
        <section className="center-stage" aria-labelledby="upload-success-title">
          <div className="upload-panel success-panel">
            <h1 id="upload-success-title">Ajouter un fichier</h1>
            <div className="selected-file">
              <FileText aria-hidden="true" size={18} />
              <div>
                <strong>{uploadResponse.file.originalName}</strong>
                <span>{formatFileSize(uploadResponse.file.size)}</span>
              </div>
            </div>
            <p className="success-copy">
              Félicitations, ton fichier sera conservé chez nous pendant {formatRetentionDuration(uploadedExpirationDays)} !
            </p>
            <div className="share-result">
              <span className="sr-only">Lien de partage</span>
              <a href={uploadResponse.shareLink.url}>{uploadResponse.shareLink.url}</a>
            </div>
            <button type="button" className="primary-button narrow-button" aria-label="Copier" onClick={copyShareUrl}>
              <Clipboard aria-hidden="true" size={16} />
              Copier le lien
            </button>
            {copyNotice ? <p className="inline-success">{copyNotice}</p> : null}
          </div>
        </section>
      ) : null}

      <p className="page-footer">Copyright DataShare® 2025</p>
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

function splitTags(rawTags: string): string[] {
  return rawTags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formatRetentionDuration(expirationDays: number | null): string {
  const selectedOption = EXPIRATION_OPTIONS.find((option) => option.days === expirationDays);

  if (!selectedOption) {
    return "la durée sélectionnée";
  }

  return selectedOption.label.toLowerCase();
}
