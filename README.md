# DataShare

Ce README est le point d'entrée du repository. Il centralise la présentation du projet, son architecture, les commandes utiles et l'emplacement des documents demandés pour la soutenance.

## Présentation

DataShare est un prototype d'application web de partage de fichiers. L'utilisateur peut déposer un fichier, générer un lien public, protéger ce lien avec un mot de passe optionnel, définir une expiration et retrouver ses fichiers dans un espace personnel lorsqu'il est connecté.

Le projet répond aux besoins principaux suivants :

- téléverser un fichier depuis une interface web ;
- générer automatiquement un lien de partage ;
- télécharger un fichier depuis un lien public ;
- créer un compte utilisateur ;
- se connecter avec un JWT ;
- consulter son espace personnel ;
- organiser ses fichiers avec des tags ;
- supprimer ses propres fichiers ;
- protéger un lien avec un mot de passe ;
- gérer l'expiration et la purge des fichiers expirés.

## Stack technique

| Zone | Technologies | Rôle |
| --- | --- | --- |
| Frontend | React, TypeScript, Vite, React Router | Interface web, navigation, formulaires, pages utilisateur |
| Backend | NestJS, TypeScript | API REST, validation, authentification, logique métier |
| Base de données | PostgreSQL, TypeORM | Stockage des utilisateurs, fichiers et liens de partage |
| Authentification | JWT, Passport, bcryptjs | Connexion, routes protégées, hash des mots de passe |
| Upload | Multer | Réception des fichiers `multipart/form-data` |
| Tests | Jest, Vitest, Testing Library, Supertest | Tests backend, frontend et e2e |
| Documentation | OpenAPI, Swagger, Markdown | Contrat API et documentation technique |

## Structure du repository

```text
PROJET_3/
|-- package.json
|-- package-lock.json
|-- jest.config.cjs
|-- scripts/
|   `-- serve-swagger.mjs
|-- backend/
|   |-- package.json
|   |-- src/
|   |-- test/
|   `-- .env.example
|-- frontend/
|   |-- package.json
|   |-- src/
|   `-- vite.config.ts
`-- docs/
    |-- Architecture/
    |-- OpenAPI/
    `-- documentation technique/
        |-- SCRIPTS_DEPLOIEMENT.md
        |-- ARCHITECTURE_FRONTEND.md
        `-- quality-maintenance/
            |-- MAINTENANCE.md
            |-- PERF.md
            |-- SECURITY.md
            |-- TESTING.md
```

## Installation

Prérequis :

- Node.js LTS ;
- npm ;
- PostgreSQL ou Docker Desktop pour lancer PostgreSQL en container ;
- Git.

Installer les dépendances depuis la racine du repository :

```bash
npm install
```

Créer le fichier d'environnement backend à partir de l'exemple :

```bash
cp backend/.env.example backend/.env
```

Adapter les variables de connexion PostgreSQL et le secret JWT dans `backend/.env`.

Si PostgreSQL n'est pas installé localement, lancer le container Docker existant :

```bash
npm run db:up
```

## Exécution en développement

Ordre recommandé :

```bash
npm run db:up
npm run backend:dev
npm run frontend:dev
```

Lancer le backend :

```bash
npm run backend:dev
```

Lancer le frontend :

```bash
npm run frontend:dev
```

Adresses locales par défaut :

- frontend : `http://localhost:5173` ou `http://127.0.0.1:5173` ;
- backend : `http://localhost:3000`.

Compte de test local :

```text
Email : test@test.com
Mot de passe : 12345678
```

Ce compte sert uniquement aux vérifications manuelles en environnement local.

## Tests et qualité

Commandes principales :

```bash
npm run backend:test
npm run backend:test:e2e
npm run backend:coverage
npm run frontend:test
npm run frontend:coverage
npm run backend:build
npm run frontend:build
npm run openapi:lint
```

Les documents de suivi qualité sont dans [docs/documentation technique/quality-maintenance/](docs/documentation%20technique/quality-maintenance/).

Fichiers disponibles :

- `TESTING.md` : stratégie de tests et résultats de couverture ;
- `SECURITY.md` : sécurité, scan npm et risques résiduels ;
- `PERF.md` : suivi de performance ;
- `MAINTENANCE.md` : maintenance, mises à jour et routine de release.

## Build et scripts de déploiement

Les scripts de build et d'exécution sont définis dans le `package.json` racine. Pour le livrable, le document dédié est [docs/documentation technique/SCRIPTS_DEPLOIEMENT.md](docs/documentation%20technique/SCRIPTS_DEPLOIEMENT.md).

Le projet ne contient pas encore de script de déploiement vers un hébergeur précis, car aucun environnement de production cible n'est défini. En revanche, le repository contient les commandes nécessaires pour installer, tester, builder et lancer le projet de manière reproductible.

## Documentation API

Le contrat API est disponible dans [docs/OpenAPI/openapi.yaml](docs/OpenAPI/openapi.yaml).

Pour ouvrir Swagger UI :

```bash
npm run swagger
```

Pour vérifier le contrat OpenAPI :

```bash
npm run openapi:lint
```

## Documents de conception

Les schémas sont disponibles dans [docs/Architecture/](docs/Architecture/).

Ils couvrent :

- l'architecture de la solution logicielle ;
- le modèle de données avec les entités principales.

## Preuves et ressources versionnées

Les preuves de tests, sécurité, performance et maintenance sont regroupées dans [docs/documentation technique/quality-maintenance/](docs/documentation%20technique/quality-maintenance/).

Ce dossier contient notamment :

- les résultats de tests et de couverture ;
- les captures d'écran de preuve ;
- les exports JSON de performance ;
- les notes de sécurité, performance et maintenance.

## Historique Git

Le repository conserve l'historique de commits du projet. Il permet de suivre les principales étapes :

- initialisation du repository ;
- conception des schémas ;
- mise en place OpenAPI/Swagger ;
- authentification ;
- gestion des fichiers et liens de partage ;
- parcours frontend ;
- tests et couverture ;
- documentation et usage de l'IA.

Avant le dépôt final, vérifier :

```bash
git status --short
git log --oneline --decorate --graph --all -n 30
```

## Limites connues

Le projet est un MVP. Pour une production réelle, il faudrait ajouter :

- un hébergement cible documenté ;
- une CI/CD ;
- des migrations TypeORM ;
- un stockage objet externe ;
- une stratégie de sauvegarde/restauration ;
- un scan antivirus des fichiers ;
- une gestion de rôles pour les routes de maintenance.
