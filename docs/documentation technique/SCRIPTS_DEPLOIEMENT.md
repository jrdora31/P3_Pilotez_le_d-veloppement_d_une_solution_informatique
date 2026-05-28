# Scripts de déploiement et d'exécution - DataShare

Ce document clarifie ce que le livrable appelle "scripts de déploiement". Dans ce projet, il ne s'agit pas encore d'un script vers un hébergeur précis comme Vercel, Render, Railway ou un serveur VPS. Le projet est un MVP local : les scripts importants sont donc les commandes reproductibles qui permettent d'installer, vérifier, builder et lancer l'application.

## Où sont les scripts ?

Les scripts sont déclarés dans le fichier racine :

```text
package.json
```

Ils pilotent les deux workspaces npm :

- `backend/`
- `frontend/`

## Installation

Commande :

```bash
npm install
```

Rôle :

- installe les dépendances du monorepo ;
- respecte les versions figées dans `package-lock.json`.

## Configuration

Copier le fichier d'exemple :

```bash
cp backend/.env.example backend/.env
```

Variables importantes :

```env
PORT=3000
FRONTEND_PUBLIC_URL=http://localhost:5173
FRONTEND_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=datashare
DATABASE_SSL=false
TYPEORM_SYNCHRONIZE=true
JWT_SECRET=replace-this-local-development-secret
JWT_EXPIRES_IN=1h
```

Pour une production réelle, `JWT_SECRET` devrait être remplacé par une valeur longue et aléatoire, et `TYPEORM_SYNCHRONIZE` devrait passer à `false`.

## Base de données locale avec Docker

Le backend NestJS ne lance pas PostgreSQL automatiquement. Avant `npm run backend:dev`, il faut donc disposer d'une base PostgreSQL accessible avec les variables de `backend/.env`.

### Création du container PostgreSQL depuis VS Code

Pré-requis : Docker Desktop doit être lancé.

Depuis le terminal intégré de VS Code, à la racine du projet, vérifier d'abord si le container existe déjà :

```bash
docker ps -a --filter "name=datashare-postgres"
```

Si aucun container `datashare-postgres` n'apparaît, le créer avec la commande suivante :

```bash
docker run --name datashare-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=datashare -p 5432:5432 -d postgres:16
```

Cette commande :

- télécharge l'image PostgreSQL si elle n'est pas déjà présente ;
- crée un container nommé `datashare-postgres` ;
- crée une base nommée `datashare` ;
- expose PostgreSQL sur le port local `5432`.

La commande `docker run` sert uniquement à la création initiale. Si le container existe déjà, il faut le démarrer avec :

```bash
npm run db:up
```

Les valeurs utilisées correspondent aux variables de `backend/.env.example` :

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=datashare
```

Si le port `5432` est déjà utilisé par un autre PostgreSQL local, il faut soit arrêter l'autre service, soit modifier le port exposé et adapter `DATABASE_PORT` dans `backend/.env`.

Pour vérifier que le container est lancé :

```bash
docker ps --filter "name=datashare-postgres"
```

### Démarrage et arrêt du container

Une fois le container créé, les scripts npm suivants permettent de le piloter depuis le terminal VS Code :

```bash
npm run db:up
npm run db:logs
npm run db:down
```

- `npm run db:up` démarre le container existant avec `docker start datashare-postgres` ;
- `npm run db:logs` affiche les logs PostgreSQL du container ;
- `npm run db:down` arrête le container sans le supprimer.

### Création des tables et relations

En local, la création des tables est gérée automatiquement par TypeORM au démarrage du backend, grâce à la variable :

```env
TYPEORM_SYNCHRONIZE=true
```

Quand `npm run backend:dev` démarre, NestJS charge les entités TypeORM déclarées dans le backend et synchronise le schéma PostgreSQL.

Le schéma détaillé de la base n'est pas recopié dans ce document. Il est documenté dans :

```text
docs/Architecture/Schema_structure_BDD_MCD.drawio.svg
```

Il n'y a donc pas de script SQL manuel à lancer pour créer les tables en environnement local. Les tables correspondant au modèle `users`, `files` et `share_links` sont créées à partir des entités TypeORM au démarrage du backend. Pour une production réelle, `TYPEORM_SYNCHRONIZE` doit passer à `false` et les changements de schéma doivent être gérés avec des migrations versionnées.

## Développement local

Ordre recommandé :

```bash
npm install
cp backend/.env.example backend/.env
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

Résultat attendu :

- API NestJS disponible sur `http://localhost:3000` ;
- frontend Vite disponible sur `http://localhost:5173` ou `http://127.0.0.1:5173`.

Si `npm run backend:dev` affiche `ECONNREFUSED` sur `localhost:5432`, cela signifie que PostgreSQL n'est pas démarré ou que les variables `DATABASE_*` ne correspondent pas à la base disponible.

## Compte de test local

Pour les vérifications manuelles en local, un compte de test peut être utilisé :

```text
Email : test@test.com
Mot de passe : 12345678
```

Ce compte est destiné uniquement à l'environnement local de développement.

## Validation avant livraison

Tests backend :

```bash
npm run backend:test
```

Tests e2e backend :

```bash
npm run backend:test:e2e
```

Tests frontend :

```bash
npm run frontend:test
```

Couverture backend :

```bash
npm run backend:coverage
```

Couverture frontend :

```bash
npm run frontend:coverage
```

Vérification OpenAPI :

```bash
npm run openapi:lint
```

## Build

Compiler le backend :

```bash
npm run backend:build
```

Compiler le frontend :

```bash
npm run frontend:build
```

Résultat attendu :

- le backend compile sans erreur TypeScript ;
- le frontend vérifie TypeScript et génère un build Vite.

## Lancement après build

Démarrer le backend compilé :

```bash
npm run backend:start
```

Prévisualiser le frontend buildé :

```bash
npm run frontend:preview
```

Cette étape sert surtout à vérifier que les builds générés sont exploitables. Elle ne remplace pas un vrai déploiement sur serveur.

## Documentation API

Servir Swagger UI :

```bash
npm run swagger
```

Rôle :

- ouvrir la documentation interactive basée sur `docs/OpenAPI/openapi.yaml` ;
- vérifier visuellement les endpoints disponibles.

## Proposition de procédure de déploiement futur

Si le projet devait être déployé en production, la procédure recommandée serait :

1. Choisir un hébergeur pour le frontend et le backend.
2. Créer une base PostgreSQL distante.
3. Configurer les variables d'environnement sur l'hébergeur.
4. Passer `TYPEORM_SYNCHRONIZE=false`.
5. Ajouter des migrations TypeORM.
6. Remplacer le stockage local par un stockage objet.
7. Lancer les tests et builds dans une CI.
8. Déployer le frontend et le backend.
9. Vérifier les routes critiques après déploiement.

## Conclusion

Pour le MVP, les "scripts de déploiement" correspondent principalement aux scripts npm d'installation, validation, build et lancement. Ils sont suffisants pour rendre le projet exécutable et vérifiable par un évaluateur. Un script de déploiement vers un hébergeur précis pourra être ajouté plus tard, quand l'environnement cible sera défini.
