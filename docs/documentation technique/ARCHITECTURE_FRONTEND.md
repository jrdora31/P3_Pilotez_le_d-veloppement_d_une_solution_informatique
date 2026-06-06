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
| Callout Component | Messages d'information, alerte ou erreur | `DownloadPage.tsx` + classes `.callout`, `.info`, `.warning`, `.error` dans `styles.css` |
| Switch Component | Filtre Tous / Actifs / Expirés dans l'espace utilisateur | `AccountPage.tsx` |

## Captures Figma vs implémentation

Les captures ci-dessous permettent de comparer chaque frame Figma desktop avec l'écran réellement livré dans DataShare.

| Parcours | Route front-end | Capture Figma | Capture DataShare |
| --- | --- | --- | --- |
| Téléversement - état initial | `/` | [Figma upload](figma-comparaison/figma/upload.png) | [DataShare upload](figma-comparaison/DATASHARE/upload.png) |
| Téléversement - fichier sélectionné | `/` | [Figma upload set variables](figma-comparaison/figma/upload_set_variables.png) | [DataShare upload set variables](figma-comparaison/DATASHARE/upload_set_variables.png) |
| Téléversement - lien généré | `/` | [Figma upload with link](figma-comparaison/figma/upload_with_link.png) | [DataShare upload with link](figma-comparaison/DATASHARE/upload_with_link.png) |
| Login | `/login` | [Figma login](figma-comparaison/figma/login.png) | [DataShare login](figma-comparaison/DATASHARE/login.png) |
| Création de compte | `/register` | [Figma register](figma-comparaison/figma/register.png) | [DataShare register](figma-comparaison/DATASHARE/register.png) |
| Téléchargement - mot de passe | `/download/:token` | [Figma download with password](<figma-comparaison/figma/download_with password.png>) | [DataShare download with password](figma-comparaison/DATASHARE/download_with_password.png) |
| Téléchargement - expiration proche | `/download/:token` | [Figma download soon expire](figma-comparaison/figma/download_soon_expire.png) | [DataShare download soon expired](figma-comparaison/DATASHARE/download_soon_expired.png) |
| Téléchargement - fichier expiré | `/download/:token` | [Figma download expired](figma-comparaison/figma/download_expired.png) | [DataShare download expired](figma-comparaison/DATASHARE/download_expired.png) |

## Captures des composants Figma vs DataShare

Les captures ci-dessous permettent de vérifier que les composants du design system Figma sont bien repris dans les écrans DataShare.

| Composant ou écran | Capture Figma | Capture DataShare |
| --- | --- | --- |
| Header Component | [Figma header](figma-comparaison/figma/Header.png) | Utilisé sur quasiment toutes les pages, notamment [`/`](figma-comparaison/DATASHARE/upload.png) |
| Input Component | [Figma input](figma-comparaison/figma/input.png) | [DataShare upload set variables](figma-comparaison/DATASHARE/upload_set_variables.png) |
| Select Component | [Figma select](figma-comparaison/figma/select.png) | [DataShare upload set variables](figma-comparaison/DATASHARE/upload_set_variables.png) |
| Button Component | [Figma button](figma-comparaison/figma/button.png) | [DataShare button](figma-comparaison/DATASHARE/button.png) |
| Callout Component | [Figma callout](figma-comparaison/figma/callout.png) | [Mot de passe](figma-comparaison/DATASHARE/download_with_password.png), [expiration proche](figma-comparaison/DATASHARE/download_soon_expired.png), [fichier expiré](figma-comparaison/DATASHARE/download_expired.png) |
| Switch Component | [Figma switch](figma-comparaison/figma/switch.png) | [DataShare switch](figma-comparaison/DATASHARE/switch.png) |
| Login | [Figma login](figma-comparaison/figma/login.png) | [DataShare login](figma-comparaison/DATASHARE/login.png) |
| Création de compte | [Figma register](figma-comparaison/figma/register.png) | [DataShare register](figma-comparaison/DATASHARE/register.png) |

## Organisation technique du front

| Élément | Rôle |
| --- | --- |
| `frontend/src/App.tsx` | Définit les routes principales de l'application avec React Router |
| `frontend/src/pages/` | Contient les pages reliées aux routes : upload, login, register, download, account |
| `frontend/src/api.ts` | Centralise les appels HTTP vers l'API back-end |
| `frontend/src/types.ts` | Définit les types TypeScript des données échangées avec l'API |
| `frontend/src/auth-storage.ts` | Gère la sauvegarde locale du JWT et de l'utilisateur connecté |
| `frontend/src/styles.css` | Centralise les styles globaux, les couleurs, les espacements et les composants visuels simples |
