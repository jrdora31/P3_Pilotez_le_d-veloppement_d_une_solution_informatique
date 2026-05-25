# Documentation de maintenance

Dernière mise à jour : 2026-05-11.

## Objectif du document

Ce document décrit comment maintenir DataShare dans un état sain : mises à jour de dépendances, vérifications régulières, gestion des risques, routine de release, surveillance des fichiers expirés et précautions d'exploitation.

La maintenance ne se limite pas à "mettre à jour npm". Elle consiste à garder l'application compréhensible, testée, sécurisée et capable d'évoluer sans casser les parcours essentiels.

## Vue d'ensemble du projet à maintenir

Le repository est organisé en workspaces npm :

- `backend/` pour l'API NestJS ;
- `frontend/` pour l'application React/Vite ;
- `docs/` pour la documentation projet ;
- `docs/OpenAPI/` pour le contrat d'interface ;
- `docs/quality-maintenance/` pour les procédures de qualité, sécurité, performance et maintenance.

Commandes principales :

```bash
npm run backend:dev
npm run frontend:dev
npm run backend:test
npm run frontend:test
npm run backend:build
npm run frontend:build
```

## Fréquence de maintenance recommandée

### A chaque session de développement

Objectif :

Eviter d'empiler des erreurs simples.

Actions :

```bash
npm run backend:test
npm run frontend:test
```

Si une modification touche le contrat API :

```bash
npm run openapi:lint
```

Si une modification touche la compilation TypeScript ou la configuration :

```bash
npm run backend:build
npm run frontend:build
```

### Une fois par semaine pendant le projet

Objectif :

Détecter les régressions avant qu'elles deviennent coûteuses.

Actions :

```bash
npm run backend:coverage
npm run frontend:coverage
npm audit --omit=dev
```

Vérifier aussi :

- taille du bundle frontend ;
- volume du dossier `backend/uploads` ;
- cohérence du fichier `backend/.env` local ;
- absence de secrets dans Git.

### Avant chaque livraison ou soutenance

Objectif :

Produire un état défendable et reproductible.

Actions :

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

Critères :

- tests unitaires et e2e au vert ;
- builds au vert ;
- vulnérabilités production à zéro ou justifiées ;
- couverture documentée ;
- performance frontend contrôlée ;
- documentation à jour.

### Une fois par mois si le projet continue

Objectif :

Limiter la dette de dépendances.

Actions :

```bash
npm outdated
npm audit
```

Puis décider les mises à jour par catégorie :

- patch : généralement faible risque ;
- minor : risque modéré, lire les changelogs si bibliothèque centrale ;
- major : risque élevé, traiter dans une branche dédiée.

## Procédure de mise à jour des dépendances

### 1. Créer une branche dédiée

```bash
git checkout -b maintenance/update-dependencies-YYYY-MM-DD
```

But :

Isoler les changements de dépendances pour faciliter la revue.

### 2. Lire l'état actuel

```bash
npm outdated
npm audit
npm audit --omit=dev
```

Interprétation :

- `npm outdated` indique les versions disponibles ;
- `npm audit` indique les vulnérabilités incluant les dépendances de dev ;
- `npm audit --omit=dev` indique le risque production.

### 3. Corriger d'abord les vulnérabilités de production

Si `npm audit --omit=dev` remonte une vulnérabilité élevée ou critique, elle est prioritaire.

Commande de départ :

```bash
npm audit fix --omit=dev
```

Si npm propose une correction majeure :

- ne pas appliquer aveuglément ;
- lire le package concerné ;
- vérifier les breaking changes ;
- faire la mise à jour dans une branche dédiée ;
- lancer tous les tests.

### 4. Corriger les vulnérabilités de développement

Commande :

```bash
npm audit fix
```

Cas observé le 2026-05-11 :

- `npm audit --omit=dev` : 0 vulnérabilité ;
- `npm audit` : 1 vulnérabilité `high` dans `fast-uri`, dépendance transitive de dev via `@nestjs/cli`.

Décision recommandée :

Corriger via `npm audit fix`, puis relancer les tests et builds. Comme la vulnérabilité est dans l'outillage de développement, elle est moins urgente qu'une vulnérabilité runtime, mais elle ne doit pas être oubliée.

### 5. Mettre à jour les dépendances non vulnérables

Patch ou minor ciblé :

```bash
npm update
```

Mise à jour ciblée d'un workspace :

```bash
npm install <package>@<version> --workspace backend
npm install <package>@<version> --workspace frontend
```

Exemples :

```bash
npm install @nestjs/core@latest --workspace backend
npm install vite@latest --workspace frontend
```

Attention :

Ne pas mettre à jour tout l'écosystème en même temps si une bibliothèque majeure change. Pour React, NestJS, Vite, TypeORM et Vitest, préférer des branches séparées.

### 6. Relancer la validation

Après toute mise à jour :

```bash
npm run backend:test
npm run backend:test:e2e
npm run frontend:test
npm run backend:build
npm run frontend:build
npm audit --omit=dev
```

Si la mise à jour touche le frontend :

```bash
npm run frontend:coverage
```

Si la mise à jour touche le backend :

```bash
npm run backend:coverage
```

### 7. Relire le lockfile

Fichier à vérifier :

```text
package-lock.json
```

Points à contrôler :

- pas de suppression massive inattendue ;
- pas de changement de registry ;
- pas de duplication excessive ;
- pas de dépendance inconnue ajoutée sans raison.

### 8. Documenter la décision

Dans la description de merge ou de livraison, indiquer :

- dépendances mises à jour ;
- raison de la mise à jour ;
- vulnérabilités corrigées ;
- tests exécutés ;
- risque résiduel éventuel.

## Risques liés aux mises à jour

### Backend NestJS

Risque :

NestJS repose sur plusieurs packages coordonnés. Une mise à jour partielle peut créer des incompatibilités.

Précaution :

Mettre à jour les packages NestJS ensemble et relancer les tests backend.

Packages sensibles :

- `@nestjs/common`
- `@nestjs/core`
- `@nestjs/platform-express`
- `@nestjs/typeorm`
- `@nestjs/jwt`
- `@nestjs/passport`
- `@nestjs/testing`
- `@nestjs/cli`

### TypeORM

Risque :

Une mise à jour peut modifier les comportements de relations, requêtes ou synchronisation.

Précaution :

Tester :

- création utilisateur ;
- upload fichier ;
- création lien de partage ;
- liste des fichiers ;
- purge expirée.

Point important :

`TYPEORM_SYNCHRONIZE=true` est pratique en local mais dangereux en production. En production, mettre :

```env
TYPEORM_SYNCHRONIZE=false
```

Puis introduire des migrations si le projet continue.

### React et React Router

Risque :

Une mise à jour peut changer les comportements de rendu, navigation ou tests.

Précaution :

Tester :

- `/`
- `/login`
- `/register`
- `/account`
- `/download/:token`

Relancer :

```bash
npm run frontend:test
npm run frontend:build
```

### Vite, Vitest et Testing Library

Risque :

Les outils de build/test peuvent casser la configuration, l'environnement `jsdom` ou la couverture.

Précaution :

Relancer :

```bash
npm run frontend:test
npm run frontend:coverage
npm run frontend:build
```

### bcrypt et JWT

Risque :

Une modification peut casser l'authentification ou invalider la stratégie de hash/token.

Précaution :

Relancer :

```bash
npm run backend:test
npm run backend:test:e2e
```

Vérifier manuellement qu'un utilisateur peut se connecter et que `passwordHash` n'est pas exposé.

## Maintenance de la base de données

### Variables importantes

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=datashare
DATABASE_SSL=false
TYPEORM_SYNCHRONIZE=true
```

### Local

En local, `TYPEORM_SYNCHRONIZE=true` facilite le développement parce que TypeORM peut synchroniser le schéma.

Risque :

Cette option peut modifier automatiquement le schéma. Elle ne doit pas être utilisée en production.

### Production ou environnement partagé

Recommandation :

```env
TYPEORM_SYNCHRONIZE=false
```

Puis gérer les changements de schéma avec des migrations.

Procédure future recommandée :

1. Créer une migration pour chaque changement de modèle.
2. Relire la migration.
3. Tester sur une base de préproduction.
4. Sauvegarder la base avant application.
5. Appliquer la migration.
6. Vérifier les parcours critiques.

## Maintenance du stockage de fichiers

### Dossier d'uploads

Par défaut, le backend utilise :

```text
backend/uploads
```

Ce dossier est ignoré par Git.

Contrôles réguliers :

- taille totale du dossier ;
- nombre de fichiers ;
- cohérence entre fichiers disque et métadonnées base ;
- présence de fichiers expirés non purgés.

Commande PowerShell utile :

```powershell
Get-ChildItem backend\uploads -Recurse -File |
  Measure-Object -Property Length -Sum
```

### Purge automatique

Variables :

```env
DISABLE_FILE_PURGE_INTERVAL=false
FILE_PURGE_INTERVAL_HOURS=24
FILE_PURGE_INTERVAL_MS=5000
```

Comportement :

- si `DISABLE_FILE_PURGE_INTERVAL=true`, le scheduler ne démarre pas ;
- si `FILE_PURGE_INTERVAL_MS` est défini, il prend la priorité ;
- sinon le scheduler utilise `FILE_PURGE_INTERVAL_HOURS`, par défaut 24 heures ;
- l'intervalle minimum est protégé à 1000 ms.

Usage local :

Pour tester rapidement la purge :

```env
FILE_PURGE_INTERVAL_MS=5000
```

Usage normal :

```env
FILE_PURGE_INTERVAL_HOURS=24
```

### Purge manuelle

Endpoint :

```http
POST /maintenance/expired-files/purge
Authorization: Bearer <jwt>
```

Réponse attendue :

```json
{
  "purgedFiles": 0,
  "purgedShareLinks": 0,
  "purgedBytes": 0,
  "startedAt": "2026-05-11T08:00:00.000Z",
  "finishedAt": "2026-05-11T08:00:00.100Z"
}
```

Points à vérifier :

- `purgedFiles` cohérent ;
- `purgedBytes` cohérent ;
- durée raisonnable ;
- fichiers physiques supprimés.

## Sauvegarde et restauration

Pour une production réelle, il faut sauvegarder deux choses :

- la base PostgreSQL ;
- le dossier de stockage des fichiers.

Risque :

Sauvegarder uniquement PostgreSQL ne suffit pas, car les fichiers physiques sont stockés sur disque. Sauvegarder uniquement les fichiers ne suffit pas non plus, car les liens, propriétaires et expirations sont dans la base.

Procédure recommandée :

1. Mettre l'application en mode maintenance si nécessaire.
2. Sauvegarder PostgreSQL.
3. Sauvegarder le dossier d'uploads.
4. Vérifier que les deux sauvegardes portent la même date.
5. Tester périodiquement une restauration.

## Routine de release

### Préparation

```bash
git status --short
npm install
```

Vérifier que le worktree ne contient pas de changements non compris.

### Qualité

```bash
npm run backend:test
npm run backend:test:e2e
npm run frontend:test
npm run backend:coverage
npm run frontend:coverage
```

### Build

```bash
npm run backend:build
npm run frontend:build
```

### Sécurité

```bash
npm audit --omit=dev
```

Si le scan complet est demandé :

```bash
npm audit
```

### Documentation

Vérifier :

- `docs/OpenAPI/openapi.yaml` si une route a changé ;
- `docs/quality-maintenance/TESTING.md` si des tests changent ;
- `docs/quality-maintenance/SECURITY.md` si un contrôle de sécurité change ;
- `docs/quality-maintenance/PERF.md` si le bundle ou les endpoints changent ;
- `docs/quality-maintenance/MAINTENANCE.md` si une procédure change.

## Journal de vérification 2026-05-11

Commandes exécutées :

```bash
npm audit --omit=dev
npm audit
npm ls fast-uri
npm run backend:coverage
npm run frontend:coverage
npm run backend:test:e2e
npm run backend:build
npm run frontend:build
```

Résultats :

- `npm audit --omit=dev` : 0 vulnérabilité.
- `npm audit` : 1 vulnérabilité `high` dans une dépendance transitive de développement, `fast-uri`.
- `npm ls fast-uri` : `fast-uri` vient de `@nestjs/cli -> @angular-devkit/core -> ajv`.
- Backend coverage : 24 tests réussis, 62,83 % statements.
- Frontend coverage : 19 tests réussis, 64,57 % statements.
- Backend e2e : 5 tests réussis.
- Backend build : réussi.
- Frontend build : réussi.

Remarques :

- La couverture n'atteint pas encore l'objectif indicatif de 70 %.
- La vulnérabilité npm complète concerne l'outillage de développement, pas les dépendances production d'après `npm audit --omit=dev`.
- Le test de charge backend réel reste à produire avec k6 ou une alternative PowerShell quand l'API locale et un token de partage valide sont disponibles.

## Signaux d'alerte à surveiller

Une intervention de maintenance est prioritaire si :

- `npm audit --omit=dev` remonte une vulnérabilité élevée ou critique ;
- `npm run backend:build` échoue ;
- `npm run frontend:build` échoue ;
- un lien expiré reste téléchargeable ;
- un utilisateur peut accéder aux fichiers d'un autre utilisateur ;
- le dossier d'uploads grossit sans purge ;
- la purge supprime plus de fichiers que prévu ;
- `TYPEORM_SYNCHRONIZE=true` est utilisé sur un environnement partagé ;
- le secret JWT est faible, connu ou exposé.

## Plan d'amélioration maintenance

Priorités recommandées :

1. Corriger la vulnérabilité dev `fast-uri` via mise à jour contrôlée.
2. Ajouter des tests pour atteindre au moins 70 % de couverture.
3. Ajouter des tests e2e sur upload, lien public et suppression.
4. Mettre en place des migrations TypeORM si l'application dépasse le stade MVP.
5. Ajouter un rôle administrateur pour la route de purge.
6. Ajouter un suivi simple des temps de réponse backend.
7. Documenter une procédure de sauvegarde/restauration adaptée à l'hébergement final.

