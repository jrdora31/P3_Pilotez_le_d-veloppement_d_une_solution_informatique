# Stack technique et infrastructure code - DataShare

Objectif : avoir une vue claire de tout ce qui compose le projet cote code, build, tests, documentation et runtime.

## 1. Vue d'ensemble

DataShare est organise comme un monorepo npm avec deux workspaces :

```text
PROJET_3/
|-- package.json                 # scripts racine + workspaces npm
|-- package-lock.json            # verrouillage des versions installees
|-- jest.config.cjs              # config Jest racine, delegue au backend
|-- scripts/
|   `-- serve-swagger.mjs        # petit serveur Node pour ouvrir Swagger UI
|-- frontend/                    # application web React
|-- backend/                     # API REST NestJS
`-- docs/                        # OpenAPI, schemas, fiches et ressources
```

Phrase simple :

> Le projet est un monorepo TypeScript. Le frontend est une application React construite avec Vite, le backend est une API NestJS, la base de donnees est PostgreSQL via TypeORM, et les tests sont separes entre Vitest cote frontend et Jest cote backend.

## 2. Infrastructure racine

Fichiers principaux :

- `package.json` : declare les workspaces `backend` et `frontend`, puis centralise les commandes npm.
- `package-lock.json` : fige les versions installees pour rendre l'installation reproductible.
- `jest.config.cjs` : permet de lancer Jest depuis la racine en ciblant le projet backend.
- `scripts/serve-swagger.mjs` : serveur HTTP Node minimal pour servir `docs/OpenAPI/swagger.html`.
- `PROJET_3.code-workspace` : configuration VS Code du workspace.

Scripts racine utiles :

```text
npm run frontend:dev       # lance Vite en dev
npm run frontend:build     # verifie TypeScript puis build Vite
npm run frontend:test      # lance Vitest
npm run frontend:coverage  # couverture frontend

npm run backend:dev        # lance NestJS en watch
npm run backend:build      # build NestJS
npm run backend:test       # tests unitaires backend
npm run backend:coverage   # couverture backend
npm run backend:test:e2e   # tests end-to-end backend

npm run swagger            # sert la documentation Swagger UI
npm run openapi:lint       # lint du contrat OpenAPI avec Redocly via npx
```

Comment lire les dependances :

- `dependencies` : briques necessaires pour faire tourner l'application.
- `devDependencies` : briques utiles seulement pour developper, tester, typer ou construire le projet.

## 3. Frontend

Arborescence :

```text
frontend/
|-- package.json
|-- vite.config.ts
|-- tsconfig.json
|-- tsconfig.node.json
|-- index.html
`-- src/
    |-- main.tsx
    |-- App.tsx
    |-- api.ts
    |-- auth-storage.ts
    |-- types.ts
    |-- styles.css
    |-- assets/
    |   `-- datashare-mark.svg
    |-- pages/
    |   |-- UploadPage.tsx
    |   |-- DownloadPage.tsx
    |   |-- LoginPage.tsx
    |   |-- RegisterPage.tsx
    |   |-- AccountPage.tsx
    |   `-- AuthLayout.tsx
    `-- test/
        `-- setup.ts
```

Technologies frontend :

- TypeScript + TSX : langage du frontend. Il est utilise dans `frontend/src/**/*.ts` et `frontend/src/**/*.tsx`. TypeScript ajoute du typage au JavaScript, et TSX permet d'ecrire des composants React avec une syntaxe proche du HTML.
- React `19` : librairie d'interface. Elle sert a construire les composants et les pages visibles par l'utilisateur, par exemple `UploadPage.tsx`, `LoginPage.tsx`, `AccountPage.tsx` et `DownloadPage.tsx`.
- React DOM `19` : pont entre React et le navigateur. Il est utilise dans `frontend/src/main.tsx` avec `createRoot(...)` pour afficher l'application React dans la page HTML.
- Vite `6` : outil de developpement et de build du frontend. Il est configure dans `frontend/vite.config.ts` et lance par `npm run frontend:dev`. Il demarre le serveur local, recharge vite l'application pendant le code, puis genere les fichiers optimises avec `vite build`.
- `@vitejs/plugin-react` : plugin qui branche React dans Vite. Il est utilise dans `frontend/vite.config.ts` pour que Vite comprenne correctement les fichiers React/TSX.
- `react-router-dom` `6` : gestionnaire de routes cote navigateur. Il est utilise dans `frontend/src/main.tsx` et `frontend/src/App.tsx` pour associer une URL a une page, par exemple `/login` vers `LoginPage`.
- `lucide-react` : librairie d'icones React. Elle est utilisee dans les pages comme `UploadPage.tsx`, `AccountPage.tsx`, `LoginPage.tsx` ou `DownloadPage.tsx` pour afficher des icones dans l'interface.
- CSS classique : couche de style visuel. Le fichier principal est `frontend/src/styles.css`; il gere la mise en page, les couleurs, les boutons, les formulaires et les messages.
- `fetch` natif : outil navigateur pour appeler l'API backend. Il est centralise dans `frontend/src/api.ts`, qui contient les fonctions `loginUser`, `uploadFile`, `listOwnFiles`, `downloadSharedFile`, etc.
- `localStorage` : stockage local du navigateur. Il est centralise dans `frontend/src/auth-storage.ts` et sert a garder le token JWT et l'utilisateur connecte entre deux chargements de page.
- `VITE_API_URL` : variable d'environnement frontend. Elle indique au frontend l'adresse du backend. Si elle n'est pas definie, `frontend/src/api.ts` utilise `http://localhost:3000`.

Dependances frontend :

| Dependence | Type | Ou elle agit | Role concret |
| --- | --- | --- | --- |
| `react` `^19.0.0` | Application | `frontend/src/**/*.tsx` | Construire les composants d'interface. |
| `react-dom` `^19.0.0` | Application | `frontend/src/main.tsx` | Monter React dans le DOM du navigateur. |
| `react-router-dom` `^6.28.0` | Application | `App.tsx`, `main.tsx`, pages | Gerer la navigation entre les pages. |
| `lucide-react` `^0.468.0` | Application | pages React | Afficher des icones propres et reutilisables. |
| `typescript` `^5.7.2` | Dev/build | `tsconfig.json`, scripts `build` | Verifier les types avant le build. |
| `vite` `^6.0.3` | Dev/build | `vite.config.ts`, scripts `dev/build/preview` | Lancer le frontend et generer le build final. |
| `@vitejs/plugin-react` `^4.3.4` | Dev/build | `vite.config.ts` | Ajouter le support React a Vite. |
| `vitest` `^4.1.5` | Test | fichiers `*.test.ts(x)` | Executer les tests frontend. |
| `@vitest/coverage-v8` `^4.1.5` | Test | `npm run frontend:coverage` | Calculer la couverture des tests frontend. |
| `jsdom` `^29.1.1` | Test | `vite.config.ts` | Simuler un navigateur dans les tests. |
| `@testing-library/react` `^16.3.2` | Test | `App.test.tsx` | Rendre les composants React dans les tests. |
| `@testing-library/user-event` `^14.6.1` | Test | `App.test.tsx` | Simuler les clics et saisies utilisateur. |
| `@testing-library/jest-dom` `^6.9.1` | Test | `src/test/setup.ts` | Ajouter des assertions lisibles sur le DOM. |
| `@types/react` `^19.0.1` | Typage | TypeScript | Fournir les types React a TypeScript. |
| `@types/react-dom` `^19.0.2` | Typage | TypeScript | Fournir les types React DOM a TypeScript. |

Routes frontend :

```text
/                  -> UploadPage
/login             -> LoginPage
/register          -> RegisterPage
/account           -> AccountPage
/download/:token   -> DownloadPage
*                  -> redirection vers /login
```

Configuration importante :

- `vite.config.ts` fixe le serveur dev sur `127.0.0.1:5173`.
- `tsconfig.json` active le mode strict TypeScript.
- `jsx` est configure en `react-jsx`.

## 4. Tests frontend

Outils :

- Vitest `4` : moteur de test du frontend. Il lit les fichiers `*.test.ts` et `*.test.tsx`, puis execute les tests avec `npm run frontend:test`.
- jsdom : faux navigateur pour les tests. Il permet de tester une page React sans ouvrir Chrome ou Firefox.
- Testing Library React : outil de test centre utilisateur. Il sert a afficher un composant dans le test et a chercher ce que l'utilisateur verrait a l'ecran.
- Testing Library User Event : outil de simulation utilisateur. Il sert a reproduire des actions comme cliquer, taper dans un champ ou envoyer un formulaire.
- Jest DOM matchers : extensions d'assertions. Elles permettent d'ecrire des attentes lisibles comme "cet element est visible" ou "ce bouton est dans la page".
- `@vitest/coverage-v8` : outil de couverture. Il indique quelles parties du code frontend sont executees par les tests.

Fichiers de tests :

```text
frontend/src/App.test.tsx
frontend/src/api.test.ts
frontend/src/auth-storage.test.ts
frontend/src/test/setup.ts
```

Ce qui est couvert :

- Parcours d'upload anonyme.
- Connexion et inscription.
- Espace compte et historique des fichiers.
- Redirection sans session.
- Deconnexion.
- Appels API et remontes d'erreur.
- Sauvegarde, lecture et nettoyage de la session locale.

## 5. Backend

Arborescence :

```text
backend/
|-- package.json
|-- nest-cli.json
|-- tsconfig.json
|-- tsconfig.build.json
|-- .env.example
|-- test/
|   |-- auth.e2e-spec.ts
|   `-- jest-e2e.json
`-- src/
    |-- main.ts
    |-- app.module.ts
    |-- auth/
    |   |-- auth.module.ts
    |   |-- auth.controller.ts
    |   |-- auth.service.ts
    |   |-- jwt.strategy.ts
    |   |-- optional-jwt-auth.guard.ts
    |   |-- auth-response.type.ts
    |   |-- authenticated-user.type.ts
    |   |-- jwt-payload.type.ts
    |   `-- dto/
    |       |-- login.dto.ts
    |       `-- register.dto.ts
    |-- users/
    |   |-- users.module.ts
    |   |-- users.service.ts
    |   |-- user.entity.ts
    |   `-- public-user.type.ts
    |-- files/
    |   |-- files.module.ts
    |   |-- files.controller.ts
    |   |-- files.service.ts
    |   |-- share-links.controller.ts
    |   |-- maintenance.controller.ts
    |   |-- local-file-storage.service.ts
    |   |-- files-expiration.scheduler.ts
    |   |-- file-record.entity.ts
    |   |-- share-link.entity.ts
    |   |-- files-response.types.ts
    |   |-- uploaded-request-file.type.ts
    |   `-- dto/
    |       |-- upload-file.dto.ts
    |       |-- list-files-query.dto.ts
    |       `-- download-file.dto.ts
    `-- types/
        `-- multer.d.ts
```

Technologies backend :

- TypeScript : langage du backend. Il est utilise dans `backend/src/**/*.ts` pour typer les controllers, services, DTO, entites et tests.
- NestJS `11` : framework backend. Il structure l'API avec des modules, controllers, services, guards et pipes. Les fichiers principaux sont `app.module.ts`, `main.ts`, puis les modules `auth`, `users` et `files`.
- Node.js : runtime serveur. C'est l'environnement qui execute le backend NestJS et les scripts npm.
- PostgreSQL : base de donnees relationnelle. Elle stocke les metadonnees de l'application : utilisateurs, fichiers, liens de partage, expirations et proprietaires.
- TypeORM `0.3` : ORM, c'est le pont entre TypeScript et PostgreSQL. Il transforme les classes `User`, `FileRecord` et `ShareLink` en tables SQL, puis fournit des repositories pour lire et ecrire les donnees.
- `@nestjs/config` : gestion de configuration. Il lit les variables d'environnement, par exemple `PORT`, `DATABASE_HOST`, `JWT_SECRET`, `FRONTEND_ORIGIN` dans `backend/.env`.
- JWT : format de token d'authentification. Apres connexion, le backend genere un token que le frontend garde dans `localStorage` et renvoie dans l'en-tete `Authorization`.
- `@nestjs/jwt` : outil NestJS pour signer les tokens JWT. Il est configure dans `backend/src/auth/auth.module.ts`.
- Passport + `@nestjs/passport` : couche d'authentification. Elle permet d'utiliser des guards comme `AuthGuard("jwt")` pour proteger des routes.
- `passport-jwt` : strategie Passport qui sait lire et verifier un JWT. Elle est utilisee dans `backend/src/auth/jwt.strategy.ts`.
- `bcryptjs` : outil de hash de mots de passe. Il sert a ne jamais stocker les mots de passe en clair, ni pour les comptes utilisateurs, ni pour les liens de partage proteges.
- `class-validator` : validation des DTO. Il verifie par exemple qu'un email est valide, qu'un mot de passe a une taille minimale, ou qu'un champ optionnel respecte les contraintes.
- `class-transformer` : transformation des DTO. Il convertit ou normalise certaines entrees, par exemple nettoyer un email ou transformer une valeur de formulaire.
- `ValidationPipe` : brique NestJS qui applique les validations DTO globalement. Il est active dans `backend/src/main.ts`.
- `@nestjs/platform-express` + Multer : gestion de l'upload. Cette brique recoit les fichiers envoyes en `multipart/form-data` sur `POST /files`.
- Stockage disque local : stockage physique des fichiers televerses. Les fichiers sont places dans `backend/uploads/` pendant le prototype.
- `FilesExpirationScheduler` + `setInterval` : programmation de purge. Le scheduler declenche regulierement la suppression des fichiers expires.

Dependances backend :

| Dependence | Type | Ou elle agit | Role concret |
| --- | --- | --- | --- |
| `@nestjs/common` `^11.0.0` | Application | controllers, services, pipes | Fournir les briques NestJS courantes : `Controller`, `Injectable`, exceptions, `ValidationPipe`. |
| `@nestjs/core` `^11.0.0` | Application | `main.ts` | Demarrer l'application NestJS avec `NestFactory`. |
| `@nestjs/config` `^4.0.0` | Application | `app.module.ts`, `.env` | Lire la configuration depuis les variables d'environnement. |
| `@nestjs/jwt` `^11.0.0` | Application | `auth.module.ts`, `auth.service.ts` | Creer les tokens JWT de connexion. |
| `@nestjs/passport` `^11.0.0` | Application | guards, `jwt.strategy.ts` | Brancher Passport dans NestJS pour proteger les routes. |
| `@nestjs/platform-express` `^11.0.0` | Application | `files.module.ts`, upload | Gerer les requetes HTTP via Express et l'upload Multer. |
| `@nestjs/typeorm` `^11.0.0` | Application | `app.module.ts`, modules metier | Brancher TypeORM dans NestJS et injecter les repositories. |
| `typeorm` `^0.3.20` | Application | entites et services | Dialoguer avec PostgreSQL via des classes et repositories. |
| `pg` `^8.13.1` | Application | connexion TypeORM | Pilote PostgreSQL utilise par TypeORM. |
| `bcryptjs` `^2.4.3` | Application | `auth.service.ts`, `files.service.ts` | Hasher et comparer les mots de passe. |
| `class-validator` `^0.14.1` | Application | fichiers `dto/*.ts` | Valider les donnees entrantes. |
| `class-transformer` `^0.5.1` | Application | fichiers `dto/*.ts` | Transformer/nettoyer les donnees entrantes. |
| `passport` `^0.7.0` | Application | auth | Moteur general d'authentification. |
| `passport-jwt` `^4.0.1` | Application | `jwt.strategy.ts` | Extraire et verifier un token JWT. |
| `reflect-metadata` `^0.2.2` | Application | NestJS/TypeORM | Support technique des decorators TypeScript. |
| `rxjs` `^7.8.1` | Application | NestJS interne | Librairie reactive utilisee par NestJS. |
| `@nestjs/cli` `^11.0.0` | Dev/build | scripts `build`, `start` | Fournir les commandes `nest build`, `nest start`. |
| `@nestjs/testing` `^11.0.0` | Test | tests backend | Creer des modules NestJS de test. |
| `jest` `^29.7.0` | Test | fichiers `*.spec.ts` | Executer les tests backend. |
| `ts-jest` `^29.2.5` | Test | config Jest | Permettre a Jest de lire du TypeScript. |
| `supertest` `^7.0.0` | Test e2e | `backend/test/auth.e2e-spec.ts` | Appeler l'API HTTP dans les tests end-to-end. |
| `source-map-support` `^0.5.21` | Dev/debug | runtime test/build | Rendre les erreurs TypeScript plus lisibles. |
| `ts-loader` `^9.5.1` | Dev/build | build NestJS | Charger/compiler TypeScript dans la chaine NestJS. |
| `ts-node` `^10.9.2` | Dev | execution TS | Executer ponctuellement du TypeScript sans build complet. |
| `typescript` `^5.7.2` | Dev/build | `tsconfig*.json` | Verifier et compiler le code TypeScript. |
| `@types/*` | Typage | TypeScript | Ajouter les types de Node, Jest, bcrypt, Passport JWT et Supertest. |

Modules backend :

- `AppModule` : charge la configuration, TypeORM, puis les modules metier.
- `UsersModule` : gestion des utilisateurs.
- `AuthModule` : inscription, connexion, JWT, strategie Passport.
- `FilesModule` : upload, liste, suppression, liens publics, purge.

Endpoints principaux :

```text
POST   /auth/register
POST   /auth/login
POST   /files
GET    /files
DELETE /files/:fileId
GET    /share-links/:token
POST   /share-links/:token/download
POST   /maintenance/expired-files/purge
```

## 6. Donnees et persistence

Entites TypeORM :

```text
users
|-- id
|-- email
|-- password_hash
|-- created_at
`-- updated_at

files
|-- id
|-- owner_id nullable
|-- original_name
|-- storage_name
|-- mime_type
|-- size
|-- storage_path
|-- tags
`-- created_at

share_links
|-- id
|-- file_id
|-- token unique
|-- password_hash nullable
|-- expires_at nullable
`-- created_at
```

Relations :

- Un utilisateur peut avoir plusieurs fichiers.
- Un fichier peut etre anonyme, donc `owner_id` peut etre nul.
- Un fichier peut avoir plusieurs liens de partage.
- Si un fichier est supprime, ses liens de partage sont supprimes en cascade.

Configuration base :

- Variables dans `backend/.env.example`.
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`.
- `DATABASE_SSL` pour activer SSL si besoin.
- `TYPEORM_SYNCHRONIZE=true` pour le prototype.

Point a expliquer :

> Pour un prototype, `synchronize` simplifie la creation des tables. En production, il faudrait passer a des migrations TypeORM pour controler les evolutions de schema.

## 7. Tests backend

Outils :

- Jest `29` : moteur de test du backend. Il execute les fichiers `*.spec.ts` avec `npm run backend:test`.
- ts-jest : adaptateur TypeScript pour Jest. Il permet d'executer les tests backend sans convertir manuellement les fichiers `.ts` en `.js`.
- `@nestjs/testing` : outils de test NestJS. Il permet de creer un module de test avec des services/controllers et des dependances remplacees par des mocks.
- Supertest : outil de test HTTP. Il est utilise dans le test e2e pour appeler l'API comme le ferait un client.
- Couverture Jest : rapport indiquant quelles lignes backend sont executees par les tests, avec les formats `text`, `lcov`, `html` et `json-summary`.

Fichiers de tests :

```text
backend/src/auth/auth.service.spec.ts
backend/src/auth/auth.controller.spec.ts
backend/src/auth/jwt.strategy.spec.ts
backend/src/auth/dto/auth.dto.spec.ts
backend/src/users/users.service.spec.ts
backend/src/files/files.service.spec.ts
backend/test/auth.e2e-spec.ts
```

Ce qui est couvert :

- Creation de compte.
- Refus email deja utilise.
- Validation mot de passe et confirmation.
- Connexion JWT.
- Mauvais identifiants.
- DTO d'authentification.
- Upload connecte avec tags, expiration et mot de passe.
- Refus des tags en upload anonyme.
- Liste des fichiers actifs.
- Lien public protege par mot de passe.
- Purge des fichiers expires et suppression physique.
- E2E auth via API HTTP.

## 8. Documentation et contrat API

Arborescence documentation :

```text
docs/
|-- OpenAPI/
|   |-- openapi.yaml
|   `-- swagger.html
|-- Architecture/
|   |-- schema d'architecture de la solution logicielle.drawio.svg
|   `-- Schema_structure_BDD_MCD.drawio.svg
|-- ressources_projet_3/
`-- AI docs/
    |-- FICHES_REVISION_SOUTENANCE.md
    |-- STEP1_DIAGRAMS.md
    |-- STEP1_GUIDE.md
    |-- STEP4_IA_USAGE.md
    `-- STACK_INFRA_CODE.md
```

OpenAPI documente :

- Les routes d'authentification.
- L'upload de fichier en `multipart/form-data`.
- La liste et la suppression des fichiers.
- Les liens de partage publics.
- Le telechargement public.
- La route de maintenance de purge.
- Les schemas de requete/reponse.
- Le bearer JWT.

## 9. Fichiers generes ou runtime

Ces elements existent pendant le developpement mais ne sont pas du code source a presenter comme une brique applicative :

- `node_modules/` : dependances installees par npm.
- `frontend/node_modules/.vite/deps/` : cache genere par Vite.
- `backend/uploads/` : fichiers televerses pendant les essais.
- `coverage/` ou `backend/coverage/` et `frontend/coverage/` : rapports de couverture.
- `dist/` ou `build/` : sorties de compilation si generees.
- `.tmp/` : fichiers temporaires locaux.

## 10. Resume oral tres court

> Mon infrastructure code est separee en trois blocs. A la racine, npm workspaces orchestre le frontend et le backend. Le frontend utilise React, Vite, TypeScript, React Router et Vitest. Le backend utilise NestJS, TypeScript, PostgreSQL, TypeORM, JWT, Passport, bcrypt, class-validator et Jest. La documentation technique est portee par OpenAPI, Swagger UI et les schemas d'architecture. Les fichiers utilisateurs sont stockes localement dans le prototype, tandis que les metadonnees sont conservees en base PostgreSQL.
