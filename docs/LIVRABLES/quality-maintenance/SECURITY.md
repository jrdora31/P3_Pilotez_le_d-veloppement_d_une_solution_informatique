# Garantie de sécurité

Dernière mise à jour : 2026-05-11.

## Objectif du document

Ce document décrit les contrôles de sécurité déjà présents dans DataShare, la procédure de scan des dépendances, l'analyse des résultats connus et les décisions de correction. Il ne remplace pas un audit de sécurité complet, mais il donne un cadre clair pour maintenir un niveau de sécurité cohérent pendant le développement du MVP.

Le contexte fonctionnel est sensible : l'application manipule des comptes utilisateurs, des fichiers téléversés, des liens publics de téléchargement et des mots de passe optionnels de partage. La sécurité doit donc être traitée comme une exigence fonctionnelle du produit, pas comme une étape finale.

## Surface de risque principale

Les risques prioritaires pour DataShare sont :

- fuite de mots de passe ou de hash de mots de passe ;
- lien public trop facile à deviner ;
- téléchargement d'un fichier expiré ;
- suppression d'un fichier appartenant à un autre utilisateur ;
- upload de fichiers dangereux ;
- mauvaise configuration CORS ;
- secret JWT faible ou exposé ;
- dépendance npm vulnérable ;
- base de données synchronisée automatiquement en production ;
- dossier d'uploads exposé directement par un serveur web.

## Mesures de sécurité déjà implémentées

### Validation globale des entrées

Emplacement : `backend/src/main.ts`, lignes 21-27.

Le backend active un `ValidationPipe` global dans `backend/src/main.ts`.

Configuration :

- `transform: true`
- `whitelist: true`
- `forbidNonWhitelisted: true`

Impact :

- les DTO transforment les valeurs attendues ;
- les propriétés non prévues sont supprimées ou refusées ;
- les payloads contenant des champs inattendus sont rejetés.

Cette mesure réduit le risque d'injection de données imprévues dans les services applicatifs.

### Validation des DTO d'authentification

Emplacement : `backend/src/auth/dto/register.dto.ts`, lignes 4-14 ; `backend/src/auth/dto/login.dto.ts`, lignes 4-8.

Les DTO `RegisterDto` et `LoginDto` valident les emails et les mots de passe.

Contrôles notables :

- email au format valide ;
- normalisation de l'email en minuscules ;
- mot de passe de création avec longueur minimale de 8 caractères ;
- confirmation de mot de passe côté service.

Limite actuelle :

La politique de mot de passe reste volontairement simple pour le MVP. Une version plus stricte pourrait exiger des catégories de caractères ou intégrer un contrôle contre les mots de passe compromis. Ce durcissement doit rester compatible avec l'ergonomie du produit.

### Hash des mots de passe

Emplacement : `backend/src/auth/auth.service.ts`, lignes 32 et 63 ; `backend/src/files/files.service.ts`, lignes 152 et 211.

Les mots de passe utilisateurs et les mots de passe optionnels de lien de partage sont hashés avec `bcryptjs`.

Paramètre observé :

- coût bcrypt : `12`.

Impact :

- le mot de passe brut n'est pas conservé ;
- le hash est coûteux à brute-forcer ;
- les liens protégés par mot de passe ne stockent pas le secret en clair.

Critère de sécurité :

Une réponse API ne doit jamais contenir `passwordHash`. Ce point est déjà couvert par les tests e2e d'authentification.

### Authentification JWT

Emplacement : `backend/src/auth/auth.module.ts`, lignes 15-21 ; `backend/src/auth/jwt.strategy.ts`, ligne 13 ; guards dans `backend/src/files/files.controller.ts`, lignes 39, 50 et 61.

L'authentification repose sur JWT via NestJS, Passport et `passport-jwt`.

Usages :

- routes protégées de l'espace utilisateur ;
- suppression de fichiers ;
- déclenchement manuel de la purge ;
- upload optionnellement authentifié.

Bonnes pratiques de configuration :

- `JWT_SECRET` doit être long, aléatoire et propre à chaque environnement ;
- le secret local de `.env.example` ne doit jamais être utilisé en production ;
- `JWT_EXPIRES_IN` doit rester raisonnable ;
- les tokens ne doivent pas être loggés.

### Contrôle d'accès propriétaire

Emplacement : `backend/src/files/files.service.ts`, ligne 108.

La suppression d'un fichier utilise à la fois l'identifiant du fichier et l'identifiant du propriétaire.

Impact :

- un utilisateur connecté ne peut supprimer que ses propres fichiers ;
- un identifiant de fichier valide ne suffit pas si le propriétaire ne correspond pas.

Point à renforcer par test :

Ajouter un test explicite qui vérifie qu'un utilisateur A ne peut pas supprimer le fichier d'un utilisateur B.

### CORS restreint

Emplacement : `backend/src/main.ts`, lignes 10-18.

Le backend lit les origines autorisées depuis `FRONTEND_ORIGIN`.

Impact :

- l'API n'autorise pas arbitrairement tous les domaines ;
- plusieurs origines locales peuvent être autorisées pendant le développement ;
- la production peut réduire la liste à l'origine réelle du frontend.

Exemple local :

```env
FRONTEND_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

Recommandation production :

```env
FRONTEND_ORIGIN=https://datashare.fr
```

### Upload de fichiers

Emplacement : `backend/src/files/files.module.ts`, ligne 19 pour les extensions interdites et lignes 26-49 pour la configuration Multer.

Le module fichiers configure Multer avec un stockage disque.

Contrôles observés :

- nom de stockage généré par UUID ;
- extension d'origine conservée mais nom d'origine non utilisé comme nom physique ;
- limite de taille à 1 GiB ;
- extensions exécutables refusées : `.bat`, `.cmd`, `.com`, `.exe`, `.msi`, `.ps1`, `.scr`, `.sh`.

Impact :

- le nom fourni par l'utilisateur ne pilote pas directement le chemin disque ;
- les extensions les plus dangereuses sont refusées ;
- un utilisateur ne peut pas envoyer un fichier sans limite de taille.

Limites à connaître :

- le type MIME fourni par le client ne suffit pas à garantir le contenu réel ;
- le MVP ne fait pas encore d'antivirus ;
- le stockage local doit rester hors dossier public.

Amélioration possible :

Ajouter une vérification de signature fichier pour certains types, ou brancher un scanner antivirus si le projet passe en production réelle.

### Tokens de lien public

Emplacement : `backend/src/files/files.service.ts`, ligne 220.

Les liens de partage utilisent un token généré par `randomBytes(18).toString("base64url")`.

Impact :

- token non séquentiel ;
- token difficile à deviner ;
- vérification d'unicité avant sauvegarde.

Bon réflexe de maintenance :

Ne pas réduire la taille du token sans raison forte. Le lien public est le principal secret d'accès pour les fichiers non protégés par mot de passe.

### Expiration et purge

Emplacement : `backend/src/files/files.service.ts`, lignes 167-182 et 326-327 ; scheduler dans `backend/src/files/files-expiration.scheduler.ts`, ligne 26 ; route manuelle dans `backend/src/files/maintenance.controller.ts`, lignes 9-13.

Les liens ont une date d'expiration. Un lien expiré retourne `410 Gone`.

La purge supprime :

- les fichiers expirés ;
- les liens associés ;
- les fichiers physiques sur disque.

Déclenchements :

- automatique via scheduler ;
- manuel via `POST /maintenance/expired-files/purge`, route protégée par JWT.

Point d'attention :

La route de maintenance est protégée mais pas encore réservée à un rôle administrateur. Pour un MVP local cela reste acceptable, mais une production réelle devrait ajouter une notion de rôle ou de compte administrateur.

## Scan des dépendances npm

### Commande de scan production

Emplacement : racine du projet, via `npm audit --omit=dev` sur `package-lock.json`.

Commande exécutée le 2026-05-26 :

```bash
npm audit --omit=dev
```

Résultat :

```text
found 0 vulnerabilities
```

Analyse :

Aucune vulnérabilité n'est remontée sur les dépendances nécessaires à l'exécution production. C'est le signal le plus important pour le risque runtime immédiat.

Décision :

- pas de correction urgente côté dépendances de production ;
- conserver ce scan dans la routine avant livraison.

### Commande de scan complet

Emplacement : racine du projet, via `npm audit` sur `package-lock.json`.

Commande exécutée le 2026-05-26 :

```bash
npm audit
```

Résultat :

```text
found 0 vulnerabilities
```

Analyse :

Les vulnérabilités observées avant correction le 2026-05-26 ont été corrigées par `npm audit fix`.

Paquets corrigés :

- `qs` : `6.15.1` vers `6.15.2`.
- `fast-uri` : `3.1.0` vers `3.1.2`.
- `brace-expansion` : `5.0.5` vers `5.0.6`.

Validation après correction :

```bash
npm audit
npm audit --omit=dev
npm run backend:test
npm run frontend:test
npm run backend:build
npm run frontend:build
```

Si `npm audit fix` propose une mise à jour majeure, ne pas l'appliquer automatiquement. Lire le changement, tester dans une branche séparée et vérifier la compatibilité NestJS.

## Procédure de contrôle sécurité avant livraison

Repères de code :

- `TYPEORM_SYNCHRONIZE` : `backend/src/app.module.ts`, ligne 30.
- dossier d'uploads : `backend/src/files/files.module.ts`, ligne 29 ; téléchargement contrôlé par `backend/src/files/share-links.controller.ts`, lignes 19-32 et `backend/src/files/files.service.ts`, ligne 160.
- absence d'exposition statique directe : aucun `express.static`, `ServeStaticModule` ou `useStaticAssets` trouvé dans le backend.
- `passwordHash` non exposé : `backend/src/users/public-user.type.ts`, lignes 3-11 ; tests e2e dans `backend/test/auth.e2e-spec.ts`, lignes 87-122.

Exécuter depuis la racine :

```bash
npm audit --omit=dev
npm run backend:test
npm run backend:test:e2e
npm run frontend:test
npm run backend:build
npm run frontend:build
```

Contrôles manuels à faire :

1. Vérifier que `backend/.env` n'est pas versionné.
2. Vérifier que `JWT_SECRET` n'est pas la valeur d'exemple.
3. Vérifier que `FRONTEND_ORIGIN` ne vaut pas `*`.
4. Vérifier que `TYPEORM_SYNCHRONIZE=false` en production.
5. Vérifier que `DATABASE_SSL=true` si la base distante l'exige.
6. Vérifier que le dossier d'uploads n'est pas servi directement par le frontend.
7. Vérifier que les extensions interdites sont toujours présentes dans le filtre Multer.
8. Vérifier que les réponses API utilisateur ne contiennent pas `passwordHash`.

## Tests de sécurité fonctionnels recommandés

### Authentification

Créer un compte valide :

```bash
curl -i -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"claire.marie@datashare.fr\",\"password\":\"StrongPassword123!\",\"passwordConfirmation\":\"StrongPassword123!\"}"
```

Résultat attendu :

- statut `201`;
- corps JSON avec `id`, `email`, `createdAt`, `updatedAt`;
- aucun `passwordHash`.

Tester un mot de passe incorrect :

```bash
curl -i -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"claire.marie@datashare.fr\",\"password\":\"WrongPassword123!\"}"
```

Résultat attendu :

- statut `401`;
- pas de token JWT.

### Upload de fichier interdit

Tester une extension bloquée :

```bash
curl -i -X POST http://localhost:3000/files \
  -F "file=@./test.exe"
```

Résultat attendu :

- statut d'erreur ;
- message indiquant que le type de fichier n'est pas autorisé.

### Route protégée sans token

Tester l'accès à la liste des fichiers sans JWT :

```bash
curl -i http://localhost:3000/files
```

Résultat attendu :

- statut `401`.

### Lien expiré

Tester un lien expiré :

```bash
curl -i http://localhost:3000/share-links/<token-expire>
```

Résultat attendu :

- statut `410`.

## Gestion des secrets

Règles :

- ne jamais committer `backend/.env` ;
- ne jamais utiliser le secret d'exemple en production ;
- stocker les secrets dans les variables d'environnement de l'hébergeur ;
- renouveler `JWT_SECRET` si une fuite est suspectée ;
- ne pas inclure de token JWT ou mot de passe dans les captures de soutenance.

Variables sensibles :

- `JWT_SECRET`
- `DATABASE_PASSWORD`
- toute future clé de stockage cloud
- tout futur secret SMTP ou provider externe

## Décisions de sécurité documentées

| Sujet | Décision MVP | Risque résiduel | Evolution recommandée |
| --- | --- | --- | --- |
| Stockage fichiers | Stockage local disque | Dépend du disque serveur | Stockage objet type S3 si production |
| Rôles utilisateurs | Pas de rôle administrateur | Route de purge accessible à tout utilisateur authentifié | Ajouter rôles et guard admin |
| Scan antivirus | Non présent | Fichiers malveillants possibles | Scanner antivirus avant partage |
| Migrations DB | `synchronize` configurable | Risque si activé en production | Mettre `TYPEORM_SYNCHRONIZE=false` et ajouter migrations |
| Politique mot de passe | Longueur minimale | Mot de passe faible encore possible | Ajouter politique renforcée ou contrôle compromis |

## Critère de validation sécurité

Une version peut être considérée acceptable pour le MVP si :

- le scan `npm audit --omit=dev` ne remonte aucune vulnérabilité critique ou élevée non justifiée ;
- les tests d'authentification passent ;
- les routes privées refusent l'accès sans JWT ;
- les mots de passe ne sont jamais renvoyés ;
- les liens expirés ne permettent pas le téléchargement ;
- les secrets ne sont pas versionnés ;
- les décisions de risque restantes sont connues et documentées.
