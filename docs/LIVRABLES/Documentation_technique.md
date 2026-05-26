# Documentation technique - DataShare

Dernière mise à jour : 2026-05-26.

## Présentation de l'application

DataShare est un prototype d'application web de partage de fichiers. L'application permet à un visiteur de téléverser un fichier, de générer automatiquement un lien public, puis de transmettre ce lien à une autre personne pour téléchargement.

Le MVP ajoute aussi un espace utilisateur authentifié. Un utilisateur connecté peut créer un compte, se connecter avec un JWT, retrouver ses fichiers dans son espace personnel, associer des tags à ses fichiers, supprimer ses propres fichiers et suivre l'état actif ou expiré de ses liens de partage.

Les fonctionnalités principales couvertes sont :

- téléversement de fichier depuis le navigateur ;
- génération d'un lien public de partage ;
- téléchargement public depuis un token ;
- protection optionnelle du lien par mot de passe ;
- expiration des liens ;
- purge des fichiers expirés ;
- inscription et connexion utilisateur ;
- espace personnel avec historique des fichiers ;
- tags réservés aux utilisateurs connectés ;
- documentation API OpenAPI/Swagger ;
- suivi qualité, sécurité, performance et maintenance.

## Architecture de l'application

Le schéma d'architecture de la solution logicielle est disponible dans :

```text
docs/Architecture/schéma d’architecture de la solution logicielle.drawio.svg
```

Le schéma existant est complet pour représenter l'architecture principale du MVP. Il montre les composants essentiels : l'utilisateur, le frontend React/TypeScript, le backend NestJS, les échanges HTTPS/JSON, l'authentification JWT, la base PostgreSQL et le stockage local des fichiers téléversés.

Pour une documentation encore plus précise, le schéma peut être complété textuellement par trois éléments déjà présents dans l'implémentation :

- TypeORM assure la communication entre le backend NestJS et PostgreSQL ;
- Multer gère la réception des fichiers `multipart/form-data` côté backend ;
- un scheduler backend déclenche automatiquement la purge des fichiers expirés.

Ces compléments ne remettent pas en cause le schéma actuel. Ils détaillent simplement des mécanismes internes qui peuvent alourdir le dessin si on les ajoute visuellement.

### Vue d'ensemble

L'application suit une architecture web classique en trois zones :

| Zone | Technologie | Responsabilité |
| --- | --- | --- |
| Frontend | React, TypeScript, Vite, React Router | Interface utilisateur, navigation, formulaires, appels API |
| Backend | NestJS, TypeScript, API REST | Authentification, validation, upload, liens publics, purge |
| Données | PostgreSQL, TypeORM | Stockage des utilisateurs, fichiers et liens de partage |
| Stockage fichiers | Disque local backend | Conservation physique des fichiers téléversés |

Le frontend communique avec le backend via des requêtes HTTP. Les routes publiques, comme l'upload anonyme et le téléchargement depuis un lien, sont accessibles sans session. Les routes privées, comme l'espace utilisateur et la suppression de fichier, exigent un token JWT.

### Parcours fonctionnel principal

1. L'utilisateur téléverse un fichier depuis le frontend.
2. Le backend reçoit le fichier via Multer.
3. Le fichier physique est stocké localement dans le dossier d'uploads.
4. Les métadonnées du fichier sont enregistrées en base PostgreSQL.
5. Le backend génère un token public non prédictible.
6. Le lien de partage est retourné au frontend.
7. Une personne disposant du lien peut consulter les informations publiques du fichier.
8. Le téléchargement est autorisé si le lien existe, n'est pas expiré et si le mot de passe éventuel est correct.

### Modules backend

| Module | Rôle |
| --- | --- |
| `AuthModule` | inscription, connexion, génération JWT, validation des identifiants |
| `UsersModule` | accès aux utilisateurs et normalisation des données publiques |
| `FilesModule` | upload, liste, suppression, liens publics, stockage local, purge |
| `MaintenanceController` | route manuelle de purge des fichiers expirés |

### Pages frontend

| Page | Route | Rôle |
| --- | --- | --- |
| `UploadPage` | `/` | téléversement et génération de lien |
| `LoginPage` | `/login` | connexion utilisateur |
| `RegisterPage` | `/register` | création de compte |
| `AccountPage` | `/account` | espace personnel et liste des fichiers |
| `DownloadPage` | `/download/:token` | consultation et téléchargement public |

## Modèle de données

Le schéma du modèle de données est disponible dans :

```text
docs/Architecture/Schema_structure_BDD_MCD.drawio.svg
```

Le modèle repose sur trois entités principales : `users`, `files` et `share_links`. Le schéma graphique représente correctement les relations principales. Pour être parfaitement aligné avec le code actuel, il faut aussi mentionner le champ `tags` présent dans l'entité `files`, utilisé pour l'espace personnel des utilisateurs connectés.

### Table `users`

La table `users` stocke les comptes applicatifs.

| Champ | Type | Clé | Description |
| --- | --- | --- | --- |
| `id` | UUID | PK | identifiant unique de l'utilisateur |
| `email` | VARCHAR | UK | email unique, normalisé en minuscules |
| `password_hash` | VARCHAR |  | hash du mot de passe |
| `created_at` | TIMESTAMP |  | date de création |
| `updated_at` | TIMESTAMP |  | date de dernière mise à jour |

Le champ `password_hash` n'est pas renvoyé dans les réponses API. Dans l'entité TypeORM, il est configuré avec `select: false` pour éviter son exposition involontaire.

### Table `files`

La table `files` stocke les métadonnées des fichiers téléversés.

| Champ | Type | Clé | Description |
| --- | --- | --- | --- |
| `id` | UUID | PK | identifiant unique du fichier |
| `owner_id` | UUID | FK nullable | référence vers `users.id`, nullable pour les uploads anonymes |
| `original_name` | VARCHAR |  | nom d'origine du fichier |
| `storage_name` | VARCHAR |  | nom physique généré pour le stockage |
| `mime_type` | VARCHAR |  | type MIME du fichier |
| `size` | BIGINT |  | taille du fichier en octets |
| `storage_path` | VARCHAR |  | chemin local du fichier stocké |
| `tags` | JSON/simple-json |  | tags associés au fichier, réservés aux utilisateurs connectés |
| `created_at` | TIMESTAMP |  | date de téléversement |

La relation entre `users` et `files` est optionnelle. Un fichier peut être anonyme si `owner_id` vaut `null`. Lorsqu'un utilisateur est supprimé, la relation est configurée pour mettre `owner_id` à `null` plutôt que supprimer automatiquement les fichiers.

### Table `share_links`

La table `share_links` stocke les liens publics générés pour accéder aux fichiers.

| Champ | Type | Clé | Description |
| --- | --- | --- | --- |
| `id` | UUID | PK | identifiant unique du lien |
| `file_id` | UUID | FK | référence vers `files.id` |
| `token` | VARCHAR | UK | token public de partage |
| `password_hash` | VARCHAR nullable |  | hash du mot de passe de lien, si protection activée |
| `expires_at` | TIMESTAMP nullable |  | date d'expiration du lien |
| `created_at` | TIMESTAMP |  | date de création du lien |

Le champ `expires_at` est techniquement nullable dans le modèle. Dans le comportement actuel de l'upload, une expiration par défaut de 7 jours est appliquée si aucune durée n'est fournie.

### Relations

Un utilisateur peut posséder plusieurs fichiers. Un fichier peut appartenir à un utilisateur ou être anonyme.

Un fichier peut être partagé via un ou plusieurs liens de partage. Dans l'usage actuel, l'upload crée un lien principal immédiatement après l'enregistrement du fichier. Si un fichier est supprimé, ses liens sont supprimés en cascade.

Le lien public ne donne pas accès directement à la base de données. Il sert uniquement de clé d'accès à une route backend, qui vérifie l'existence du lien, son expiration et le mot de passe éventuel avant de streamer le fichier.

## Choix techniques

Les choix techniques privilégient une stack TypeScript homogène, simple à maintenir et adaptée à un MVP web.

| Besoin | Technologie choisie | Alternatives possibles | Justification |
| --- | --- | --- | --- |
| Interface web | React + TypeScript + Vite | Vue, Angular, Next.js | stack rapide pour construire des pages interactives et testables |
| Routage frontend | React Router | routage manuel, Next.js router | routes simples pour upload, login, compte et téléchargement |
| API backend | NestJS + TypeScript | Express, Fastify, Spring Boot | structure modulaire, DTO, guards, tests faciles à organiser |
| Base de données | PostgreSQL | MySQL, SQLite, MongoDB | base relationnelle robuste pour utilisateurs, fichiers et liens |
| ORM | TypeORM | Prisma, Knex | intégration directe avec NestJS et entités TypeScript |
| Authentification | JWT + Passport | sessions serveur, OAuth | compatible API REST et routes protégées |
| Hash de mots de passe | bcryptjs | argon2, bcrypt natif | solution éprouvée et facile à intégrer au MVP |
| Upload | Multer | Busboy, stockage direct cloud | solution standard pour `multipart/form-data` dans NestJS/Express |
| Documentation API | OpenAPI + Swagger UI | Postman, documentation manuelle | contrat clair et vérifiable avec lint |
| Tests backend | Jest + Supertest | Vitest, Mocha | outillage standard NestJS |
| Tests frontend | Vitest + Testing Library | Jest, Cypress | tests rapides orientés composants et parcours |

## API REST

Le contrat d'API est disponible dans :

```text
docs/OpenAPI/openapi.yaml
```

La documentation Swagger peut être servie avec :

```bash
npm run swagger
```

Les endpoints principaux sont :

| Méthode | Route | Accès | Rôle |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | public | créer un compte utilisateur |
| `POST` | `/auth/login` | public | connecter un utilisateur et retourner un JWT |
| `POST` | `/files` | public ou JWT optionnel | téléverser un fichier et créer un lien |
| `GET` | `/files` | JWT obligatoire | lister les fichiers de l'utilisateur connecté |
| `DELETE` | `/files/:fileId` | JWT obligatoire | supprimer un fichier appartenant à l'utilisateur |
| `GET` | `/share-links/:token` | public | consulter les informations d'un lien |
| `POST` | `/share-links/:token/download` | public | télécharger le fichier associé au lien |
| `POST` | `/maintenance/expired-files/purge` | JWT obligatoire | déclencher une purge manuelle |

Le contrat OpenAPI doit être vérifié après toute modification de route avec :

```bash
npm run openapi:lint
```

## Sécurité

La sécurité est documentée plus en détail dans :

```text
docs/LIVRABLES/quality-maintenance/SECURITY.md
```

Les protections principales sont déjà intégrées au backend :

- validation globale des entrées avec `ValidationPipe` ;
- rejet des champs non prévus grâce à `whitelist` et `forbidNonWhitelisted` ;
- hash des mots de passe utilisateurs et liens avec bcrypt coût `12` ;
- authentification JWT pour les routes privées ;
- CORS configuré via `FRONTEND_ORIGIN` ;
- token de lien public généré avec `randomBytes(18).toString("base64url")` ;
- suppression limitée aux fichiers du propriétaire connecté ;
- refus des extensions dangereuses pour l'upload ;
- limite de taille fichier à 1 Gio ;
- expiration des liens et réponse `410 Gone` pour les liens expirés ;
- purge des fichiers expirés et de leurs métadonnées.

Le scan de dépendances documenté le 2026-05-11 indique :

- `npm audit --omit=dev` : 0 vulnérabilité de production ;
- `npm audit` : 1 vulnérabilité `high` dans une dépendance transitive de développement liée à `fast-uri`.

La priorité de sécurité restante est de corriger cette vulnérabilité de développement par une mise à jour contrôlée, puis de relancer les tests et builds.

## Qualité, tests et maintenance

Les éléments de qualité, tests et maintenance sont déjà détaillés dans des fichiers dédiés :

```text
docs/LIVRABLES/quality-maintenance/TESTING.md
docs/LIVRABLES/quality-maintenance/SECURITY.md
docs/LIVRABLES/quality-maintenance/PERF.md
docs/LIVRABLES/quality-maintenance/MAINTENANCE.md
```

Cette documentation technique ne répète donc pas l'intégralité de ces fichiers. Elle en reprend les points essentiels pour donner une vue synthétique.

### Tests

Les commandes de tests disponibles sont :

```bash
npm run backend:test
npm run backend:test:e2e
npm run backend:coverage
npm run frontend:test
npm run frontend:coverage
```

Derniers résultats documentés le 2026-05-11 :

| Zone | Résultat |
| --- | --- |
| Backend coverage | 7 suites réussies, 24 tests réussis, 62,83 % statements |
| Frontend coverage | 3 fichiers de tests réussis, 19 tests réussis, 64,57 % statements |
| Backend e2e | 1 suite réussie, 5 tests e2e réussis |

L'objectif indicatif de 70 % de couverture globale n'est pas encore atteint. La stratégie documentée consiste à ne pas ajouter de tests artificiels, mais à couvrir en priorité les parcours critiques : upload, lien public, téléchargement protégé, suppression et purge.

### Performance

Le suivi de performance est documenté dans :

```text
docs/LIVRABLES/quality-maintenance/PERF.md
```

Les budgets frontend sont respectés au dernier contrôle documenté :

| Mesure | Résultat 2026-05-11 |
| --- | ---: |
| JavaScript initial brut | 238,01 kB |
| JavaScript initial gzip | 74,31 kB |
| CSS brut | 6,35 kB |
| CSS gzip | 1,93 kB |
| Build Vite | réussi en 2,14 s |

Les endpoints backend à surveiller en priorité sont `POST /files`, `GET /share-links/:token`, `POST /share-links/:token/download` et `GET /files`.

### Maintenance

La maintenance est documentée dans :

```text
docs/LIVRABLES/quality-maintenance/MAINTENANCE.md
```

La routine recommandée avant livraison est :

```bash
npm run backend:test
npm run backend:test:e2e
npm run frontend:test
npm run backend:coverage
npm run frontend:coverage
npm run backend:build
npm run frontend:build
npm audit --omit=dev
```

Les points de maintenance importants sont :

- conserver `backend/.env` hors Git ;
- remplacer `JWT_SECRET` par une valeur forte selon l'environnement ;
- passer `TYPEORM_SYNCHRONIZE=false` en production ;
- ajouter des migrations TypeORM si le projet dépasse le MVP ;
- surveiller le dossier `backend/uploads` ;
- vérifier régulièrement la purge des fichiers expirés ;
- relancer `npm audit --omit=dev` avant livraison ;
- mettre à jour la documentation OpenAPI si une route change.

## Scripts d'exécution et de déploiement

Les scripts de lancement, test, build et vérification sont centralisés dans le `package.json` racine.

Les commandes principales sont :

```bash
npm install
npm run backend:dev
npm run frontend:dev
npm run backend:build
npm run frontend:build
npm run backend:start
npm run frontend:preview
npm run swagger
```

Le document dédié est disponible dans :

```text
docs/LIVRABLES/SCRIPTS_DEPLOIEMENT.md
```

Le projet est actuellement un MVP local. Il ne contient pas encore de script de déploiement vers un hébergeur précis, car l'environnement cible n'est pas défini. Les scripts existants permettent cependant d'installer, tester, builder et lancer l'application de manière reproductible.

## Utilisation de l'IA

L'IA a été utilisée comme assistance au développement, sous pilotage du développeur et à partir de prompts rédigés pour guider les tâches. Son usage s'est inscrit dans une approche de vibe coding, avec une supervision humaine continue.

Les principaux usages ont été :

- aide à la génération de fonctionnalités ;
- assistance à la structuration du code ;
- aide à l'écriture et à la correction de tests ;
- assistance pour la documentation technique ;
- supervision et correction de points repérés pendant le développement ;
- reformulation et organisation de certains livrables.

L'IA n'a pas remplacé la validation du projet. Les propositions de code, de tests et de documentation ont été relues, ajustées et vérifiées par le développeur selon les besoins du MVP.

### Apports constatés

L'apport principal a été un gain de temps monstrueux sur le code. L'assistance a permis d'avancer plus vite sur la structure des fonctionnalités, les corrections, les tests et les documents de livraison.

Pour la rédaction des documents, l'aide a également été intéressante : elle a facilité la mise en forme, la synthèse et l'organisation des informations déjà présentes dans le projet.

### Limites constatées

La limite principale vient de la taille du contexte. Quand beaucoup de fichiers, contraintes et discussions sont mélangés, les propositions peuvent devenir fouillies ou moins ciblées. Il reste donc nécessaire de cadrer précisément les prompts, de relire les résultats et de corriger les incohérences éventuelles.

L'utilisation de l'IA demande aussi une vigilance sur les détails techniques : cohérence avec le code réel, exactitude des commandes, non-régression des tests, sécurité et conformité avec les consignes du projet.

## Limites actuelles et évolutions possibles

Le projet couvre le périmètre d'un MVP. Pour une mise en production réelle, plusieurs améliorations seraient nécessaires :

- ajouter une CI/CD ;
- définir un hébergeur cible ;
- introduire des migrations TypeORM ;
- remplacer le stockage local par un stockage objet ;
- ajouter une sauvegarde coordonnée de PostgreSQL et des fichiers ;
- ajouter un scan antivirus des fichiers téléversés ;
- créer un rôle administrateur pour la route de purge ;
- renforcer les tests e2e sur les fichiers et liens publics ;
- atteindre ou dépasser l'objectif indicatif de 70 % de couverture ;
- produire des mesures backend réelles avec k6 ou un outil équivalent.

## Annexes

Documents utiles :

| Document | Emplacement |
| --- | --- |
| Schéma d'architecture | `docs/Architecture/schéma d’architecture de la solution logicielle.drawio.svg` |
| Modèle de données | `docs/Architecture/Schema_structure_BDD_MCD.drawio.svg` |
| Contrat OpenAPI | `docs/OpenAPI/openapi.yaml` |
| Swagger UI | `docs/OpenAPI/swagger.html` |
| README détaillé | `docs/LIVRABLES/README.md` |
| Scripts de déploiement | `docs/LIVRABLES/SCRIPTS_DEPLOIEMENT.md` |
| Tests | `docs/LIVRABLES/quality-maintenance/TESTING.md` |
| Sécurité | `docs/LIVRABLES/quality-maintenance/SECURITY.md` |
| Performance | `docs/LIVRABLES/quality-maintenance/PERF.md` |
| Maintenance | `docs/LIVRABLES/quality-maintenance/MAINTENANCE.md` |
