# Documentation de maintenance

Dernière mise à jour : 2026-05-26.

## Objectif

Ce document décrit la maintenance des dépendances de DataShare : fréquence des contrôles, procédure de mise à jour et risques à surveiller.

Il reste volontairement synthétique pour correspondre au livrable demandé.

## Fréquence de maintenance

| Moment | Objectif | Actions |
| --- | --- | --- |
| A chaque session de développement | Eviter les régressions simples | `npm run backend:test`, `npm run frontend:test` |
| Si une route API change | Garder le contrat API cohérent | `npm run openapi:lint` |
| Avant une livraison ou une soutenance | Valider un état stable | tests backend/frontend, e2e backend, builds, audit production |
| Une fois par mois si le projet continue | Eviter l'accumulation de dette technique | `npm outdated`, `npm audit`, `npm audit --omit=dev` |

Validation avant livraison :

```bash
npm run backend:test
npm run backend:test:e2e
npm run frontend:test
npm run backend:build
npm run frontend:build
npm audit --omit=dev
```

## Procédure de mise à jour des dépendances

### 1. Isoler le changement

Pour une petite correction, travailler sur `dev` peut suffire. Pour une mise à jour importante, créer une branche dédiée :

```bash
git checkout -b maintenance/update-dependencies-YYYY-MM-DD
```

### 2. Faire le diagnostic

```bash
npm outdated
npm audit
npm audit --omit=dev
```

Priorité de traitement :

1. vulnérabilités de production ;
2. vulnérabilités de développement ;
3. mises à jour patch ou mineure ;
4. mises à jour majeure, plus risquées.

### 3. Corriger les vulnérabilités

Correction des dépendances utilisées en production :

```bash
npm audit fix --omit=dev
```

Correction incluant aussi les outils de développement :

```bash
npm audit fix
```

### 4. Mettre à jour les paquets

Mise à jour compatible :

```bash
npm update
```

Mise à jour ciblée :

```bash
npm install <package>@<version> --workspace backend
npm install <package>@<version> --workspace frontend
```

Pour NestJS, React, Vite, TypeORM ou Vitest, éviter de tout mettre à jour en même temps. Ces dépendances structurent le projet et doivent être testées soigneusement. (faire les MAJ 1 par 1 et tester derrière)

### 5. Valider

Après chaque mise à jour :

```bash
npm run backend:test
npm run backend:test:e2e
npm run frontend:test
npm run backend:build
npm run frontend:build
npm audit --omit=dev
```

Relire aussi `package-lock.json` pour vérifier qu'il n'y a pas de suppression massive, de changement de registry ou d'ajout de dépendance inattendue.

## Risques principaux

| Dépendance | Risque | Vérification |
| --- | --- | --- |
| NestJS | Incompatibilité entre modules NestJS, TypeORM, JWT ou tests | Tests backend et e2e |
| TypeORM | Changement dans les relations, requêtes ou schéma SQL | Tester inscription, upload, partage, liste des fichiers |
| React / React Router | Problème de rendu ou de navigation | Tester accueil, inscription, connexion, compte, lien public |
| Vite | Problème de build ou bundle trop lourd | `npm run frontend:build` |
| Vitest / Testing Library | Tests cassés par un changement d'environnement | `npm run frontend:test` |
| bcrypt / JWT | Connexion ou validation des tokens cassée | Tester inscription, connexion, accès compte |

## Point TypeORM

Dans ce projet, `TYPEORM_SYNCHRONIZE=true` veut dire que TypeORM peut adapter automatiquement la base PostgreSQL à partir des entités du code.

Exemples :

- si une entité est ajoutée, TypeORM peut créer une table ;
- si une propriété est ajoutée, TypeORM peut créer une colonne ;
- si un type change, TypeORM peut modifier une colonne ;
- si le code ne correspond plus au schéma, TypeORM peut altérer la structure existante.

En local, c'est pratique car la base sert au développement. Sur une base partagée ou hébergée, c'est risqué : un simple changement de code peut modifier la structure de la base pour tout le monde. Dans ce cas, il faudrait utiliser `TYPEORM_SYNCHRONIZE=false` et gérer les changements avec des migrations.

## Etat connu au 2026-05-26

Dernier contrôle documenté :

- `npm audit` : 0 vulnérabilité ;
- `npm audit --omit=dev` : 0 vulnérabilité de production ;
- tests backend, frontend, e2e et builds : réussis.

Les vulnérabilités précédemment détectées dans des dépendances transitives de développement ont été corrigées par mise à jour contrôlée, puis validées par les tests et builds.
## Purge des fichiers expirés

La maintenance applicative inclut une purge des fichiers expirés afin d'éviter que le stockage local et la base de données conservent indéfiniment des fichiers qui ne sont plus accessibles via un lien de partage valide.

La logique principale est centralisée dans `FilesService.purgeExpiredFiles()` (`backend/src/files/files.service.ts`). Cette méthode recherche les liens de partage expirés en base de données, regroupe les fichiers concernés, supprime les fichiers physiques du disque via `LocalFileStorageService.deleteFile()`, puis retire les enregistrements correspondants de la base de données.

La purge peut être déclenchée manuellement par la route protégée `POST /maintenance/expired-files/purge`, exposée dans `MaintenanceController` (`backend/src/files/maintenance.controller.ts`). Cette route utilise une protection JWT afin d'éviter qu'un utilisateur anonyme puisse lancer une opération de suppression globale.

La purge est également lancée automatiquement par `FilesExpirationScheduler` (`backend/src/files/files-expiration.scheduler.ts`). Au démarrage du module, le scheduler calcule l'intervalle à partir des variables d'environnement `FILE_PURGE_INTERVAL_MS` ou `FILE_PURGE_INTERVAL_HOURS`, puis appelle régulièrement `FilesService.purgeExpiredFiles()` avec `setInterval`. La purge automatique peut être désactivée avec `DISABLE_FILE_PURGE_INTERVAL=true`.
