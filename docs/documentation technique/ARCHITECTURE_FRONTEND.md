# Architecture front-end et correspondance Figma

Ce document décrit la correspondance entre les maquettes Figma desktop de DataShare, les routes front-end et les fichiers React qui les implémentent.

## Correspondance maquettes -> routes -> composants

| Frame Figma desktop | Route front-end | Fichier React principal |
| --- | --- | --- |
| Téléversement / Desktop - état initial | `/` | `frontend/src/pages/UploadPage.tsx` |
| Téléversement / Desktop - fichier sélectionné | `/` | `frontend/src/pages/UploadPage.tsx` |
| Téléversement / Desktop - lien généré | `/` | `frontend/src/pages/UploadPage.tsx` |
| Login / Desktop | `/login` | `frontend/src/pages/LoginPage.tsx` |
| Création de compte / Desktop | `/register` | `frontend/src/pages/RegisterPage.tsx` |
| Téléchargement / Desktop - lien actif | `/download/:token` | `frontend/src/pages/DownloadPage.tsx` |
| Téléchargement / Desktop - lien expiré ou erreur | `/download/:token` | `frontend/src/pages/DownloadPage.tsx` |
| Mon espace / Desktop - accueil connecté | `/account` | `frontend/src/pages/AccountPage.tsx` |

## Correspondance composants UI Figma -> code

| Composant Figma | Utilisation dans l'application | Emplacement actuel dans le code |
| --- | --- | --- |
| Header Component | En-tête DataShare, bouton connexion ou espace personnel | Pages React + styles globaux dans `frontend/src/styles.css` |
| Input Component | Email, mot de passe, confirmation, mot de passe de partage | `LoginPage.tsx`, `RegisterPage.tsx`, `UploadPage.tsx`, `DownloadPage.tsx` |
| Select Component | Choix de la durée d'expiration du lien | `UploadPage.tsx` + `styles.css` |
| Button Component | Connexion, création de compte, téléversement, téléchargement, suppression | Pages React + classes CSS globales |
| Callout Component | Messages d'information, succès ou erreur | Pages React + classes `notice`, `success`, `error` dans `styles.css` |
| Switch Component | Filtre Tous / Actifs / Expirés dans l'espace utilisateur | `AccountPage.tsx` |

## Organisation technique du front

| Élément | Rôle |
| --- | --- |
| `frontend/src/App.tsx` | Définit les routes principales de l'application avec React Router |
| `frontend/src/pages/` | Contient les pages reliées aux routes : upload, login, register, download, account |
| `frontend/src/api.ts` | Centralise les appels HTTP vers l'API back-end |
| `frontend/src/types.ts` | Définit les types TypeScript des données échangées avec l'API |
| `frontend/src/auth-storage.ts` | Gère la sauvegarde locale du JWT et de l'utilisateur connecté |
| `frontend/src/styles.css` | Centralise les styles globaux, les couleurs, les espacements et les composants visuels simples |
