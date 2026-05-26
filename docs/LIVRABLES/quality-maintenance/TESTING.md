# Plan de tests

Dernière mise à jour : 2026-05-26.

## Objectif du document

Ce document décrit la stratégie de tests de l'application DataShare. Il sert à expliquer ce qui est testé, comment exécuter les tests, quels résultats sont attendus, quels critères d'acceptation valident le MVP, et quelles améliorations restent à faire pour atteindre un niveau de couverture plus confortable.

DataShare est une application de partage de fichiers composée de deux workspaces npm :

- `backend/` : API NestJS, authentification JWT, stockage local des fichiers, métadonnées PostgreSQL, purge des fichiers expirés.
- `frontend/` : interface React/Vite, pages d'authentification, upload, téléchargement public et espace utilisateur.

La stratégie de tests doit donc couvrir trois niveaux :

- tests unitaires et tests d'intégration proches du code ;
- tests end-to-end API ;
- validation manuelle ou automatisée des parcours utilisateur critiques.

## Pré-requis

Avant d'exécuter les tests, installer les dépendances depuis la racine du repository :

```bash
npm install
```

Pour les tests automatisés unitaires et d'intégration actuellement présents, aucune base PostgreSQL réelle n'est nécessaire. Les tests backend utilisent principalement des services mockés ou en mémoire, et les tests frontend mockent les appels `fetch`.

Pour tester l'application complète en local, il faut en plus préparer l'environnement backend :

```bash
cp backend/.env.example backend/.env
```

Puis adapter au besoin les variables PostgreSQL dans `backend/.env`.

## Commandes de test disponibles

Les commandes sont centralisées dans le `package.json` racine.

| Commande | Rôle | Quand l'utiliser |
| --- | --- | --- |
| `npm run backend:test` | Lance les tests unitaires backend Jest | Pendant le développement backend |
| `npm run backend:coverage` | Lance Jest avec rapport de couverture backend | Avant une livraison ou une soutenance |
| `npm run backend:test:e2e` | Lance les tests end-to-end API backend | Avant validation des routes critiques |
| `npm run frontend:test` | Lance les tests frontend Vitest | Pendant le développement frontend |
| `npm run frontend:coverage` | Lance Vitest avec rapport de couverture frontend | Avant une livraison ou une soutenance |
| `npm run backend:build` | Vérifie la compilation backend | Avant fusion ou livraison |
| `npm run frontend:build` | Vérifie TypeScript et le build Vite | Avant fusion ou livraison |
| `npm run openapi:lint` | Vérifie le contrat OpenAPI | Après modification de `docs/OpenAPI/openapi.yaml` |

## Résultats vérifiés

### Backend coverage

Résultat vérifié le 2026-05-26.

Commande exécutée :

```bash
npm run backend:coverage
```

Résultat :

- 13 suites de tests réussies.
- 42 tests réussis.
- Couverture globale statements : 90,87 %.
- Couverture globale branches : 72,09 %.
- Couverture globale functions : 94,02 %.
- Couverture globale lines : 89,96 %.

**Couverture backend Jest du 2026-05-26**

![Couverture backend Jest du 2026-05-26](screenshots/backend_tests_result.png "Couverture backend Jest du 2026-05-26")

### Frontend coverage

Résultat vérifié le 2026-05-26.

Commande exécutée :

```bash
npm run frontend:coverage
```

Résultat :

- 3 fichiers de tests réussis.
- 23 tests réussis.
- Couverture globale statements : 84,75 %.
- Couverture globale branches : 73,57 %.
- Couverture globale functions : 83,05 %.
- Couverture globale lines : 85,52 %.

**Couverture frontend Vitest du 2026-05-26**

![Couverture frontend Vitest du 2026-05-26](screenshots/frontend_tests_result.png "Couverture frontend Vitest du 2026-05-26")

Interprétation :

Le frontend dépasse désormais l'objectif indicatif de 70 % au global. Les tests couvrent les appels API, le stockage de session, l'authentification, l'upload anonyme, l'upload connecté avec tags, la copie de lien, l'espace utilisateur et les parcours de téléchargement public.

Les zones qui restent les moins couvertes sont :

- `AccountPage.tsx`, notamment la copie, la suppression et les erreurs de chargement ;
- certaines branches d'erreur de `UploadPage.tsx` ;
- quelques messages d'erreur génériques dans `api.ts`.

Priorité d'amélioration :

1. Ajouter un test de suppression depuis l'espace utilisateur.
2. Ajouter un test d'erreur de chargement de l'historique.
3. Ajouter un test d'erreur d'upload.
4. Ajouter un test d'état vide ou de fichier sans lien copiable.

### Backend end-to-end

Résultat vérifié le 2026-05-26.

Commande exécutée :

```bash
npm run backend:test:e2e
```

Résultat :

- 2 suites e2e réussies.
- 7 tests e2e réussis.

Scénarios couverts :

- `POST /auth/register` retourne `201` et ne renvoie jamais `passwordHash`.
- `POST /auth/login` retourne un JWT et l'utilisateur public.
- Les données invalides retournent `400`.
- Des identifiants incorrects retournent `401`.
- Un email déjà utilisé retourne `409`.
- `POST /files` accepte un upload anonyme multipart et retourne un lien de partage.
- `GET /share-links/:token` permet de consulter un lien public actif.
- `POST /share-links/:token/download` télécharge le fichier partagé.
- Un lien protégé refuse un mauvais mot de passe avec `401`.
- Un lien protégé accepte le bon mot de passe et télécharge le fichier.

Interprétation :

Le e2e backend valide désormais les flux critiques d'authentification, d'upload anonyme, de consultation de lien public et de téléchargement protégé. Le dernier scénario e2e utile à ajouter concerne l'espace utilisateur connecté : upload avec JWT, historique et suppression.

## Fonctionnalités obligatoires du MVP à tester

Le MVP DataShare repose sur les fonctionnalités suivantes.

### Création de compte

Critères d'acceptation :

- Un email valide et un mot de passe valide créent un compte.
- L'email est normalisé en minuscules.
- Le mot de passe n'est jamais renvoyé dans la réponse.
- Un email déjà utilisé est refusé.
- Une entrée invalide est refusée avec une erreur claire.

Tests existants :

- Tests unitaires `AuthService`.
- Tests `AuthController`.
- Tests e2e `POST /auth/register`.
- Tests frontend de création de compte et redirection vers la connexion.

### Connexion

Critères d'acceptation :

- Un utilisateur existant peut se connecter avec le bon mot de passe.
- La réponse contient un JWT et un utilisateur public.
- Une erreur de mot de passe retourne `401`.
- Le frontend stocke la session et affiche l'espace connecté.
- La déconnexion supprime la session locale.

Tests existants :

- Tests unitaires `AuthService`.
- Tests e2e `POST /auth/login`.
- Tests frontend de connexion, erreur de connexion et déconnexion.

### Upload de fichier

Critères d'acceptation :

- Un visiteur anonyme peut téléverser un fichier et recevoir un lien de partage.
- Un utilisateur connecté peut téléverser un fichier avec des tags.
- Les tags sont refusés pour un upload anonyme.
- Un fichier manquant est refusé.
- Les extensions dangereuses sont refusées.
- La taille maximale est bornée côté backend.

Tests existants :

- Test frontend d'upload anonyme avec affichage du lien.
- Test frontend d'upload connecté avec tags et copie du lien.
- Test API frontend sur l'envoi en `FormData`.
- Test e2e backend `POST /files` en multipart anonyme.
- Tests backend service sur l'upload connecté et les tags.
- Tests backend contrôleur sur l'upload connecté et anonyme.

Tests à ajouter :

- Test de refus d'une extension interdite comme `.exe`.
- Test de refus d'un upload anonyme avec tags.

### Lien de partage public

Critères d'acceptation :

- Le lien contient un token non prédictible.
- Le lien peut être consulté sans authentification.
- Le téléchargement fonctionne via le token.
- Si un mot de passe est défini, le téléchargement exige ce mot de passe.
- Un lien expiré retourne `410 Gone`.
- Un token inconnu retourne `404 Not Found`.

Tests existants :

- Test API frontend `getShareLink`.
- Test API frontend `downloadSharedFile`.
- Tests frontend de consultation d'un lien public, téléchargement protégé et erreur de lien.
- Tests e2e backend de consultation et téléchargement via lien public.
- Test e2e backend de téléchargement protégé par mot de passe.
- Test backend service indiquant si un lien est protégé par mot de passe.
- Tests backend contrôleur sur la consultation et le téléchargement via lien public.

Tests à ajouter :

- Test e2e d'un lien expiré retournant `410 Gone`.

### Espace utilisateur

Critères d'acceptation :

- Un utilisateur connecté voit ses fichiers.
- Un utilisateur non connecté est redirigé vers la connexion.
- La liste peut filtrer les fichiers actifs ou expirés.
- La suppression ne concerne que les fichiers du propriétaire.
- La suppression retire aussi le fichier physique du stockage.

Tests existants :

- Test frontend affichant l'historique utilisateur.
- Test frontend redirigeant `/account` sans session.
- Test API frontend `listOwnFiles` et `deleteFile`.
- Test backend service filtrant les fichiers actifs.
- Tests backend contrôleur sur la liste et la suppression des fichiers utilisateur.

Tests à ajouter :

- Test d'interdiction de suppression d'un fichier d'un autre utilisateur.
- Test de l'état vide de l'espace utilisateur.

### Expiration et purge

Critères d'acceptation :

- Un lien expiré n'est plus téléchargeable.
- La purge supprime les métadonnées et le fichier physique.
- La purge peut être déclenchée automatiquement par intervalle.
- La purge peut être déclenchée manuellement via une route protégée.
- La réponse de purge indique le nombre de fichiers, liens et octets supprimés.

Tests existants :

- Tests `FilesExpirationScheduler`.
- Test `FilesService.purgeExpiredFiles`.
- Test contrôleur `POST /maintenance/expired-files/purge`.

Tests à ajouter :

- Test e2e d'un lien expiré retournant `410`.

## Scénarios end-to-end recommandés

Le minimum attendu est 2 à 3 scénarios critiques. Les scénarios suivants sont les plus utiles pour DataShare.

### Scénario e2e 1 - Authentification

Statut : automatisé côté backend.

Parcours :

1. Créer un compte avec un email et un mot de passe valides.
2. Vérifier que la réponse contient un utilisateur public sans `passwordHash`.
3. Se connecter avec le compte créé.
4. Vérifier qu'un JWT est retourné.
5. Tester un mauvais mot de passe.

Critère de réussite :

- La création retourne `201`.
- La connexion retourne `200`.
- Le mauvais mot de passe retourne `401`.
- Aucune réponse ne contient `passwordHash`.

### Scénario e2e 2 - Upload anonyme et lien public

Statut : automatisé côté backend.

Parcours :

1. Appeler `POST /files` en multipart avec un fichier de test.
2. Récupérer `shareLink.token` dans la réponse.
3. Appeler `GET /share-links/:token`.
4. Appeler `POST /share-links/:token/download`.

Critère de réussite :

- L'upload retourne `201`.
- Le lien public retourne `200`.
- Le téléchargement retourne `200` avec un flux fichier.
- Le nom, la taille et le type MIME restent cohérents.

### Scénario e2e 3 - Téléchargement protégé par mot de passe

Statut : automatisé côté backend.

Parcours :

1. Appeler `POST /files` en multipart avec un mot de passe de partage.
2. Récupérer `shareLink.token` dans la réponse.
3. Vérifier que `GET /share-links/:token` indique `passwordRequired: true`.
4. Appeler `POST /share-links/:token/download` avec un mauvais mot de passe.
5. Appeler `POST /share-links/:token/download` avec le bon mot de passe.

Critère de réussite :

- L'upload retourne `201`.
- Le lien public retourne `200` et indique qu'un mot de passe est requis.
- Le mauvais mot de passe retourne `401`.
- Le bon mot de passe retourne `200` avec le fichier.

### Scénario e2e 4 - Utilisateur connecté, historique et suppression

Statut : à automatiser en e2e API ou e2e navigateur.

Parcours :

1. Créer un compte et se connecter.
2. Upload un fichier avec un JWT.
3. Lister `GET /files?status=active`.
4. Supprimer le fichier avec `DELETE /files/:fileId`.
5. Relister les fichiers.

Critère de réussite :

- Le fichier apparaît dans la liste du propriétaire.
- La suppression retourne `204`.
- Le fichier supprimé n'apparaît plus dans la liste active.
- Un autre utilisateur ne peut pas supprimer ce fichier.

## Seuil de couverture

Objectif indicatif : 70 % de couverture globale minimum.

Etat au 2026-05-26 :

- Backend statements : 90,87 %.
- Frontend statements : 84,75 %.

Conclusion :

Le seuil de 70 % est atteint côté backend et côté frontend. Les améliorations restantes concernent surtout des scénarios complémentaires, notamment les erreurs de l'espace utilisateur, la suppression et les parcours e2e fichiers.

## Captures de couverture à produire

Les rapports HTML sont générés par les commandes de couverture.

Backend :

```bash
npm run backend:coverage
```

Rapport à ouvrir :

```text
backend/coverage/lcov-report/index.html
```

Frontend :

```bash
npm run frontend:coverage
```

Rapport à ouvrir :

```text
frontend/coverage/index.html
```

Procédure de capture :

1. Lancer la commande de couverture.
2. Ouvrir le rapport HTML correspondant.
3. Capturer le tableau récapitulatif `All files`.
4. Nommer la capture avec la date, par exemple `backend-coverage-2026-05-11.png`.
5. Ajouter la capture au dossier de preuves choisi pour la soutenance, par exemple `docs/quality-maintenance/evidence/`.

## Routine de validation avant livraison

Avant de considérer une modification comme prête, exécuter :

```bash
npm run backend:test
npm run backend:test:e2e
npm run frontend:test
npm run backend:build
npm run frontend:build
```

Avant une soutenance ou une livraison plus formelle, exécuter aussi :

```bash
npm run backend:coverage
npm run frontend:coverage
npm audit --omit=dev
```

Critère de validation :

- Tous les tests doivent passer.
- Les builds backend et frontend doivent passer.
- Les vulnérabilités de production doivent être à zéro ou justifiées.
- Les régressions de couverture doivent être expliquées.
- Toute baisse sous 70 % doit être accompagnée d'un plan d'amélioration.
