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

Sur ce poste de développement, la base PostgreSQL existe déjà sous forme d'un container Docker nommé `datashare-postgres`. La commande suivante démarre ce container existant :

```bash
npm run db:up
```

Cette commande exécute :

```bash
docker start datashare-postgres
```

Elle ne crée pas de nouveau container. Elle suppose que le container `datashare-postgres` existe déjà et expose PostgreSQL sur le port `5432` avec les valeurs de `backend/.env.example` :

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=datashare
```

Commandes utiles :

```bash
npm run db:logs
npm run db:down
```

`npm run db:down` arrête le container sans le supprimer.

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


| élément | technologie choisie | alternatives | justification |
| ------- | ------------------- | ------------ | ------------- |
| a       | b                   | c            | d             |
| a       | b                   | c            | d             |
   
