# Documentation technique - DataShare

Dernière mise à jour : 2026-05-26.

## Présentation de l'application

DataShare est un prototype d'application web de partage de fichiers. L'application permet à un visiteur de téléverser un fichier, de générer automatiquement un lien public, puis de transmettre ce lien à une autre personne pour téléchargement.

Le MVP ajoute aussi un espace utilisateur authentifié. Un utilisateur connecté peut créer un compte, se connecter avec un JWT, retrouver ses fichiers dans son espace personnel, associer des tags à ses fichiers, supprimer ses propres fichiers et suivre l'état actif ou expiré de ses liens de partage.

Les fonctionnalités principales couvertes sont :

- upload avec compte, avec génération d'un lien de téléchargement unique (US01) ;
- téléchargement via un lien public unique (US02) ;
- création de compte utilisateur (US03) ;
- connexion utilisateur avec JWT (US04) ;
- consultation de l'historique des fichiers envoyés (US05) ;
- suppression d'un fichier par son propriétaire (US06) ;
- upload anonyme avec lien temporaire (US07) ;
- gestion des tags pour les fichiers d'un utilisateur connecté (US08) ;
- ajout d'un mot de passe pour protéger un fichier partagé (US09) ;
- expiration automatique des fichiers et purge des données associées (US10) ;
- documentation API OpenAPI/Swagger ;
- suivi qualité, sécurité, performance et maintenance.

## Architecture de l'application

Le schéma d'architecture de la solution logicielle est disponible dans :

```text
docs/Architecture/schéma d’architecture de la solution logicielle.drawio.svg
```

### Lecture du schéma d'architecture

Le schéma se lit de gauche à droite. L'utilisateur interagit d'abord avec le frontend React/TypeScript depuis son navigateur. Ce frontend contient les pages visibles de l'application : connexion, inscription, téléversement, téléchargement public et espace personnel.

Le frontend communique ensuite avec le backend NestJS via des requêtes HTTP. La plupart des échanges utilisent du JSON ; l'upload utilise `multipart/form-data`, le format standard pour envoyer un fichier avec ses options.

Le backend centralise la logique métier : validation des DTO, authentification, gestion des fichiers, génération des liens publics, vérification des expirations et purge des fichiers expirés. Il dialogue avec PostgreSQL pour les données structurées et avec le stockage local pour les fichiers physiques.

Le schéma distingue volontairement deux types de stockage :

- PostgreSQL conserve les données métier : utilisateurs, métadonnées de fichiers et liens de partage ;
- le disque local du backend conserve le contenu réel des fichiers téléversés.

Trois mécanismes internes complètent le schéma sans l'alourdir :

- TypeORM est l'ORM entre NestJS et PostgreSQL. Il mappe les entités `User`, `FileRecord` et `ShareLink` avec les tables SQL, puis fournit des repositories utilisés par lesl services. Configuration : `backend/src/app.module.ts` et `TypeOrmModule.forFeature(...)` dans les modules métier.
- Multer reçoit les fichiers envoyés en `multipart/form-data`. Il est configuré dans `backend/src/files/files.module.ts` pour le dossier d'upload, le nom physique, la limite de taille et les extensions interdites.
- `FilesExpirationScheduler` lance la purge automatique. Il est dans `backend/src/files/files-expiration.scheduler.ts`, déclaré dans `FilesModule`, puis activé au chargement du module via `onModuleInit()`. Par défaut, il appelle `filesService.purgeExpiredFiles()` toutes les 24 heures.

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

### Lecture du schéma de données

Le schéma de données représente trois tables principales : `users`, `files` et `share_links`.

La table `users` contient les comptes de l'application. Un utilisateur peut posséder plusieurs fichiers, mais cette relation reste optionnelle côté fichier : un fichier peut aussi être anonyme si le téléversement a été fait sans connexion.

La table `files` contient les métadonnées des fichiers téléversés. Elle ne stocke pas le contenu binaire du fichier, mais les informations nécessaires pour le retrouver sur le disque local : nom d'origine, nom de stockage, type MIME, taille et chemin de stockage. Elle contient aussi `owner_id` pour rattacher le fichier à un utilisateur connecté, ainsi que `tags` pour l'organisation dans l'espace personnel.

La table `share_links` contient les liens publics associés aux fichiers. Chaque lien appartient à un fichier et porte un token public unique. Le lien peut aussi contenir un hash de mot de passe et une date d'expiration. Lorsqu'un fichier est supprimé, ses liens sont supprimés en cascade.

Le schéma graphique représente donc la séparation entre le compte utilisateur, le fichier téléversé et le lien public de partage. Cette séparation permet de gérer à la fois les uploads anonymes, les fichiers rattachés à un compte et les liens publics expirables ou protégés par mot de passe.

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
| `size` | INTEGER |  | taille du fichier en octets |
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

Les choix techniques privilégient une stack TypeScript homogène, simple à maintenir et adaptée à un MVP web. L'objectif n'était pas d'utiliser les technologies les plus complexes, mais de choisir des outils cohérents avec les besoins : téléversement de fichiers, liens publics, comptes utilisateurs, API documentée, tests et possibilité d'évolution.

| Besoin | Technologie choisie | Alternatives possibles | Justification |
| --- | --- | --- | --- |
| Interface web | React + TypeScript + Vite | Vue, Angular, Next.js | stack légère et rapide pour construire une interface interactive sans imposer un framework fullstack |
| Routage frontend | React Router | routage manuel, Next.js router | routes claires pour les pages `/`, `/login`, `/register`, `/account` et `/download/:token` |
| API backend | NestJS + TypeScript | Express, Fastify, Spring Boot | structure modulaire, DTO, guards, services, scheduler et tests faciles à organiser |
| Base de données | PostgreSQL | MySQL, SQLite, MongoDB | modèle relationnel adapté aux utilisateurs, fichiers, liens et contraintes d'unicité |
| ORM | TypeORM | Prisma, Knex | intégration directe avec NestJS et mapping explicite des entités TypeScript |
| Authentification | JWT + Passport | sessions serveur, OAuth | solution stateless adaptée à une API REST et aux routes protégées |
| Hash de mots de passe | bcryptjs | argon2, bcrypt natif | solution éprouvée, portable et suffisante pour le MVP avec un coût configuré à 12 |
| Upload | Multer | Busboy, stockage direct cloud | solution standard pour recevoir du `multipart/form-data` dans l'écosystème NestJS/Express |
| Stockage fichiers | Disque local backend | S3, Cloudinary, Azure Blob | choix simple pour un MVP local, avec une évolution possible vers un stockage objet |
| Documentation API | OpenAPI + Swagger UI | Postman, documentation manuelle | contrat API versionnable, consultable et vérifiable par lint |
| Tests backend | Jest + Supertest | Vitest, Mocha | outillage standard NestJS pour tests unitaires, services, contrôleurs et e2e API |
| Tests frontend | Vitest + Testing Library | Jest, Cypress | tests rapides orientés composants, appels API et comportements utilisateur |

### Justification détaillée des choix

La stack TypeScript de bout en bout simplifie la cohérence entre frontend, backend, DTO et modèles de réponse.

React avec Vite suffit pour une interface interactive sans imposer un framework fullstack. NestJS apporte une structure claire côté API avec modules, contrôleurs, services, DTO et guards.

PostgreSQL convient au modèle relationnel du projet : utilisateurs, fichiers, liens de partage, clés étrangères et contraintes d'unicité. TypeORM sert de couche d'accès aux données et garde les entités proches du code TypeScript.

JWT avec Passport permet de protéger les routes privées sans session serveur. Le même backend peut donc gérer les visiteurs anonymes et les utilisateurs connectés.

Le stockage local des fichiers est un choix de MVP : simple à tester et suffisant pour la soutenance. Une production réelle demanderait plutôt un stockage objet, des sauvegardes et un scan antivirus.

OpenAPI, Swagger, Jest, Supertest, Vitest et Testing Library ont été choisis pour documenter et vérifier les parcours critiques : authentification, upload, lien public, téléchargement protégé, espace utilisateur, suppression et purge.

### Choix assumés et limites

Certains choix sont acceptables pour un MVP mais devront être renforcés en production :

- le stockage local devra être remplacé par un stockage objet ;
- `TYPEORM_SYNCHRONIZE` devra être désactivé au profit de migrations ;
- la purge manuelle devra être réservée à un rôle administrateur ;
- un antivirus ou une vérification plus poussée des fichiers devra être ajouté ;
- une CI/CD devra automatiser les tests, builds, lint OpenAPI et audits.

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

Le scan de dépendances documenté le 2026-05-26 indique :

- `npm audit` : 0 vulnérabilité ;
- `npm audit --omit=dev` : 0 vulnérabilité de production.

Les vulnérabilités précédemment observées dans des dépendances transitives de développement ont été corrigées par mise à jour contrôlée, puis validées par les tests et les builds. Le risque résiduel principal n'est donc plus le scan npm, mais les limites assumées du MVP : stockage local, absence de rôle administrateur dédié et absence de scan antivirus des fichiers.

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

Derniers résultats documentés le 2026-05-26 :

| Zone | Résultat |
| --- | --- |
| Backend coverage | 13 suites réussies, 42 tests réussis, 90,87 % statements |
| Frontend coverage | 3 fichiers de tests réussis, 23 tests réussis, 84,75 % statements |
| Backend e2e | 2 suites réussies, 7 tests e2e réussis |

L'objectif indicatif de 70 % de couverture globale est atteint côté backend et frontend.

### Performance

Le suivi de performance est documenté dans :

```text
docs/LIVRABLES/quality-maintenance/PERF.md
```

Les budgets frontend sont respectés au dernier contrôle documenté le 2026-05-26 :

| Mesure | Résultat 2026-05-26 |
| --- | ---: |
| JavaScript initial brut | 238,01 kB |
| JavaScript initial gzip | 74,31 kB |
| CSS brut | 6,35 kB |
| CSS gzip | 1,93 kB |
| Build Vite | réussi en 2,04 s |

Le test k6 du 2026-05-26 sur `GET /share-links/:token` est également validé :

| Mesure backend | Résultat | Budget | Statut |
| --- | ---: | ---: | --- |
| Requêtes exécutées | 150 | indicatif | OK |
| Erreurs HTTP | 0,00 % | < 1 % | OK |
| Temps de réponse moyen | 2,72 ms | indicatif | OK |
| Temps de réponse p95 | 3,21 ms | < 500 ms | OK |

Les uploads de `100 Ko`, `5 Mo` et `50 Mo` ont aussi été testés avec succès sur `POST /files`. Les endpoints backend à surveiller en priorité restent `POST /files`, `GET /share-links/:token`, `POST /share-links/:token/download` et `GET /files`.

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
npm run openapi:lint
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
npm run db:up
npm run backend:dev
npm run frontend:dev
npm run backend:build
npm run frontend:build
npm run backend:start
npm run frontend:preview
npm run swagger
npm run openapi:lint
```

Le document dédié est disponible dans :

```text
docs/LIVRABLES/SCRIPTS_DEPLOIEMENT.md
```

Le projet est actuellement un MVP local. Il ne contient pas encore de script de déploiement vers un hébergeur précis, car l'environnement cible n'est pas défini. Les scripts existants permettent cependant d'installer, tester, builder et lancer l'application de manière reproductible.

## Utilisation de l'IA

L'IA a été utilisée comme assistance au développement, sous pilotage du développeur et à partir de prompts rédigés pour guider les tâches. Son usage s'est inscrit dans une approche de développement assisté par IA, avec une supervision humaine continue.

Les principaux usages ont été :

- aide à la génération de fonctionnalités ;
- assistance à la structuration du code ;
- aide à l'écriture et à la correction de tests ;
- assistance pour la documentation technique ;
- supervision et correction de points repérés pendant le développement ;
- reformulation et organisation de certains livrables.

L'IA n'a pas remplacé la validation du projet. Les propositions de code, de tests et de documentation ont été relues, ajustées et vérifiées par le développeur selon les besoins du MVP.

Le pilotage humain a porté sur :

- la définition des fonctionnalités à construire ;
- la vérification de la cohérence avec les spécifications ;
- l'exécution ou la relecture des tests ;
- la correction des incohérences détectées ;
- la rédaction et la sélection des éléments à conserver dans les livrables.
- l'orchestration globale du projet dans la répartition des tâches entre les différents agents IA.

### Apports constatés

L'apport principal a été un gain de temps important sur le code. L'assistance a permis d'avancer plus vite sur la structure des fonctionnalités, les corrections, les tests et les documents de livraison.

Pour la rédaction des documents, l'aide a également été intéressante : elle a facilité la mise en forme, la synthèse et l'organisation des informations déjà présentes dans le projet.

### Limites constatées

La limite principale vient de la taille du contexte. Quand beaucoup de fichiers, contraintes et discussions sont mélangés, les propositions peuvent devenir fouillies ou moins ciblées. Il reste donc nécessaire de cadrer précisément les prompts, de relire les résultats et de corriger les incohérences éventuelles.

L'utilisation de l'IA demande aussi une vigilance sur les détails techniques : cohérence avec le code réel, exactitude des commandes, non-régression des tests, sécurité et conformité avec les consignes du projet.

## Limites actuelles et évolutions possibles

Le projet couvre le périmètre d'un MVP. Pour une mise en production réelle, plusieurs améliorations seraient nécessaires :

- ajouter une CI/CD ;
- définir un hébergeur cible ;
- introduire des migrations (changements de schéma de BDD) TypeORM ;
- remplacer le stockage local par un stockage objet ;
- ajouter un scan antivirus des fichiers téléversés ;
- créer un rôle administrateur pour la route de purge ;
- renforcer les tests e2e sur les scénarios non encore couverts ;
- élargir les mesures k6 à d'autres endpoints critiques.

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
