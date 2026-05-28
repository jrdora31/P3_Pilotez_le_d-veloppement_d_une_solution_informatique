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

Le frontend communique ensuite avec le backend NestJS via des requêtes HTTP. La plupart des échanges utilisent du JSON ; l'upload utilise `multipart/form-data`, car ce format permet d'envoyer dans une même requête le fichier binaire et les champs associés, comme la durée d'expiration, les tags ou le mot de passe de partage.

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

Les choix techniques ont été faits en partant des besoins du projet plutôt que de la popularité des outils. DataShare est un MVP développé seul, avec des fonctionnalités centrées sur l'upload, le partage public, les comptes utilisateurs, l'expiration des fichiers, la documentation d'API et les tests. Les priorités étaient donc la cohérence de la stack, la maintenabilité, la rapidité de développement et la robustesse des données.

Le choix principal est une stack TypeScript de bout en bout. Le frontend, le backend, les DTO, les types de réponse et une partie de la validation restent dans le même langage. Cela réduit la charge mentale, limite les erreurs de mapping entre couches et rend le projet plus simple à maintenir. Ce choix répond aussi à un objectif de montée en compétence : après une expérience Java/Angular, l'objectif était d'explorer une stack plus légère et homogène autour de TypeScript.

| Besoin | Technologie retenue | Alternatives possibles | Pourquoi ce choix plutôt que les alternatives |
| --- | --- | --- | --- |
| Cohérence globale | TypeScript front + back | Java/Spring Boot, Angular, stack mixte | Une stack mixte aurait été viable mais aurait multiplié les langages et les conversions entre couches. Pour un MVP développé seul, TypeScript partout réduit la charge mentale et limite les écarts entre DTO, API et frontend. |
| Interface web | React + TypeScript + Vite | Vue, Angular, Next.js | Vue aurait aussi permis une interface par composants. Angular aurait apporté un cadre plus complet, mais plus lourd pour une interface centrée sur quelques pages, formulaires et appels API. Next.js aurait été surtout pertinent avec du rendu serveur ou une logique fullstack. React + Vite garde un frontend léger, statique après build, cohérent avec TypeScript et séparé de l'API NestJS. |
| Routage frontend | React Router | routage manuel, Next.js router | Le projet a besoin de routes client simples, dont une route avec paramètre `/download/:token`. Un routage manuel aurait recréé une logique déjà fournie par la librairie. Le router Next.js aurait imposé Next.js alors que le projet n'a pas besoin de son architecture. |
| API backend | NestJS + TypeScript | Express, Fastify, Spring Boot | Express et Fastify auraient été viables, mais ils fournissent moins de cadre par défaut. Le backend contient validation, authentification, upload, guards, services métier, scheduler et tests : NestJS organise ces responsabilités nativement. Spring Boot aurait été robuste, mais aurait cassé la cohérence full TypeScript recherchée. |
| Base de données | PostgreSQL | MySQL, SQLite, MongoDB | MongoDB serait pertinent avec un schéma fluctuant ou documentaire. SQLite serait adapté à un prototype très local, mais moins à une évolution serveur. MySQL serait viable, mais PostgreSQL correspond très bien au modèle stable et relationnel du projet : utilisateurs, fichiers, liens, contraintes d'unicité, clés étrangères et transactions. |
| ORM | TypeORM | Prisma, Knex | Knex aurait donné plus de contrôle SQL, mais avec davantage de requêtes à écrire et maintenir. Prisma aurait été viable, mais ajoute son propre schéma et son workflow. TypeORM s'intègre directement avec NestJS et représente les tables sous forme d'entités proches du métier : `User`, `FileRecord` et `ShareLink`. |
| Authentification | JWT + Passport | sessions serveur, OAuth | Les sessions serveur auraient obligé le backend à conserver un état de connexion. Pour une API REST consommée par un frontend séparé, JWT est plus simple : le client renvoie un token signé et le backend le vérifie sur les routes privées. Passport est retenu car il s'intègre directement aux guards NestJS. OAuth serait pertinent avec une connexion via Google ou GitHub, hors périmètre du MVP. |
| Hash de mots de passe | bcryptjs | argon2, bcrypt natif | Argon2 serait plus robuste pour une production exigeante, notamment contre les attaques massives, mais ajoute plus de paramètres et de complexité. `bcrypt` natif est performant, mais dépend de modules compilés. `bcryptjs` réduit la charge d'installation et reste adapté au MVP : chaque mot de passe est salé et hashé avec un coût `12`, suffisant pour ralentir les essais automatisés sans compliquer le projet. |
| Upload | Multer | Busboy, upload direct cloud | L'upload doit envoyer le fichier et ses options métier dans la même requête : mot de passe, tags, expiration. `multipart/form-data` répond à ce besoin sans convertir le fichier en base64. Busboy serait plus bas niveau et utile pour du streaming très fin. L'upload direct cloud serait adapté avec S3 ou équivalent, mais le MVP stocke localement les fichiers ; Multer est donc le choix le plus direct avec NestJS/Express. |
| Stockage fichiers | Disque local backend | S3, Azure Blob, Cloudinary | S3, Azure Blob ou Cloudinary seraient plus adaptés à une production, surtout avec plusieurs serveurs, sauvegardes et forte volumétrie. Pour la soutenance, le stockage local permet de valider tout le parcours métier sans ajouter de dépendance cloud ni de complexité opérationnelle. |
| Documentation API | OpenAPI + Swagger UI | Postman, documentation manuelle | Postman est utile pour tester, mais ne suffit pas comme contrat API versionnable. Une documentation manuelle peut vite se désynchroniser du code. OpenAPI fournit une spécification structurée, vérifiable par lint et consultable dans Swagger UI. |
| Tests backend | Jest + Supertest | Vitest, Mocha | Jest sert aux tests unitaires et d'intégration NestJS : par exemple `files.controller.spec.ts` instancie le vrai `FilesController` avec un `FilesService` mocké pour vérifier que l'upload, la liste et la suppression sont bien délégués. Supertest complète ces tests en envoyant de vraies requêtes HTTP à l'application NestJS de test : par exemple `auth.e2e-spec.ts` teste `POST /auth/register` et `files.e2e-spec.ts` teste `POST /files` avec un fichier attaché. Vitest ou Mocha auraient été possibles, mais auraient demandé plus d'adaptation de la configuration backend existante. |
| Tests frontend | Vitest + Testing Library | Jest, Cypress | Vitest est cohérent avec Vite, qui compile déjà les composants React en TypeScript/JSX ; cela évite de maintenir une configuration Jest séparée côté frontend. Testing Library teste les comportements visibles par l'utilisateur : par exemple `App.test.tsx` vérifie qu'un fichier téléversé affiche un lien de partage, qu'une erreur de connexion apparaît ou qu'un compte sans session est redirigé. `api.test.ts` complète cela en mockant `fetch` pour vérifier les appels API, comme l'envoi d'un `FormData` vers `POST /files`. Cypress aurait été utile pour des tests navigateur complets, mais plus lourd pour le MVP. |

### Choix assumés et limites

Certains choix sont adaptés au contexte MVP mais devront être renforcés avant une mise en production :

- remplacer le stockage local par un stockage objet ;
- désactiver `TYPEORM_SYNCHRONIZE` et utiliser des migrations versionnées ;
- réserver les routes de maintenance ou de purge à un rôle administrateur ;
- ajouter un scan antivirus ou une vérification plus poussée des fichiers ;
- automatiser les tests, builds, lint OpenAPI et audits de sécurité dans une CI/CD.

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
