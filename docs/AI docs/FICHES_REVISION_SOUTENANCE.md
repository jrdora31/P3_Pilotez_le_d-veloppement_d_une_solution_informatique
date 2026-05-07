# Fiches de revision - Mentor et soutenance

Objectif : avoir des mots simples pour expliquer le projet DataShare, ce qui a ete fait, comment cela a ete fait, et ce qu'il reste a consolider avant la soutenance blanche.

## 1. Pour la reunion mentor d'aujourd'hui

### Ou j'en suis

Phrase courte :

> Aujourd'hui, j'ai valide avec toi les etapes 1 a 4. Mon application DataShare est un prototype de partage de fichiers : on peut televerser un fichier, generer un lien public, proteger ce lien par mot de passe, definir une expiration, telecharger depuis ce lien, et gerer ses fichiers dans un espace personnel quand on est connecte. Il me reste maintenant a finaliser l'etape 5, puis a preparer l'etape 6 qui correspond a la soutenance blanche.

Version un peu plus detaillee :

> Cote technique, j'ai garde une architecture volontairement simple et defendable : un frontend React/TypeScript, une API NestJS/TypeScript, une base PostgreSQL pour les metadonnees, et un stockage local pour les fichiers dans le cadre du prototype. J'ai documente le contrat front/back avec OpenAPI, les schemas d'architecture et de base de donnees, et l'utilisation de l'IA sur l'expiration automatique des fichiers.

### Ce que j'ai fait

- J'ai pose le contexte fonctionnel : l'application sert a partager un fichier rapidement, avec ou sans compte.
- J'ai modelise les briques principales : frontend React, API NestJS, base PostgreSQL, stockage local.
- J'ai modelise les donnees autour de 3 entites : `users`, `files`, `share_links`.
- J'ai implemente l'authentification : inscription, connexion, JWT, hash des mots de passe avec bcrypt.
- J'ai implemente le televersement de fichier : upload anonyme ou connecte, generation d'un lien public, duree d'expiration, mot de passe optionnel.
- J'ai ajoute l'espace personnel : liste des fichiers, filtre actifs/expires/tous, copie du lien, suppression.
- J'ai ajoute la page publique de telechargement : lecture du token, affichage des informations du fichier, demande du mot de passe si besoin, puis telechargement.
- J'ai travaille l'expiration automatique des fichiers avec l'aide de l'IA : date `expiresAt`, refus des liens expires, purge des fichiers physiques et des metadonnees.
- J'ai ajoute ou mis a jour les tests front et back pour securiser les comportements principaux.
- J'ai aligne la documentation OpenAPI avec les routes disponibles.

### Comment je l'ai fait

> J'ai avance par couches. D'abord les livrables de conception : architecture, modele de donnees et contrat OpenAPI. Ensuite le backend, avec des modules separes pour l'authentification, les utilisateurs, les fichiers, les liens de partage et la maintenance. Puis le frontend, avec des pages dediees a l'upload, la connexion, l'inscription, l'espace compte et le telechargement public. Enfin, j'ai complete avec des tests et de la documentation.

Phrase pour expliquer la methode :

> Ma methode a ete de partir du besoin utilisateur, puis de traduire ce besoin en routes API, en entites de base de donnees, et en ecrans. J'ai essaye de garder chaque partie assez simple pour pouvoir l'expliquer : le controller recoit la requete, le DTO valide les donnees, le service applique les regles metier, puis TypeORM gere la persistance.

### La ou j'ai peche / la ou j'ai eu du mal

- J'ai parfois eu tendance a partir trop vite dans le code, alors qu'il fallait revenir au besoin metier et au contrat OpenAPI.
- L'authentification optionnelle a demande de la clarte : un upload peut etre anonyme, mais certains avantages comme les tags et l'espace personnel sont reserves aux utilisateurs connectes.
- L'expiration des fichiers etait plus subtile que prevu : il ne suffit pas d'afficher "lien expire", il faut aussi penser a la suppression du fichier physique et des metadonnees.
- J'ai du faire attention a garder la documentation coherente avec le code, surtout quand les routes et les regles metier evoluaient.
- Je dois encore m'entrainer a expliquer mes choix sans simplement reciter la stack technique.

### Ce que je veux demander au mentor

- Est-ce que mon niveau de detail est bon pour 15 minutes, ou est-ce que je dois couper certaines parties ?
- Est-ce que je dois insister davantage sur l'architecture, la demo, la securite ou l'utilisation de l'IA ?
- Quels points l'evaluateur risque de challenger en priorite : stockage local, expiration, securite, documentation ou tests ?
- Pour l'etape 5, quels livrables dois-je finaliser en priorite avant la soutenance blanche ?

## 2. Deroule conseille pour les 15 minutes de presentation

Timing cible :

- 0:00 - 0:45 : introduction rapide
- 0:45 - 3:00 : contexte fonctionnel
- 3:00 - 6:00 : choix technologiques
- 6:00 - 9:30 : architecture et modele de donnees
- 9:30 - 13:00 : demonstration de l'application
- 13:00 - 15:00 : documentation technique et utilisation de l'IA

### Fiche 1 - Introduction

Phrase prete :

> Je presente DataShare, un prototype d'application web de partage de fichiers. Le but est de permettre a un utilisateur de deposer un fichier, de generer un lien de partage, et de controler ce partage avec une expiration, un mot de passe optionnel, et un espace personnel pour les utilisateurs connectes.

Message a faire passer :

- Le projet est un prototype fonctionnel, pas une solution de production complete.
- Les choix sont simples, coherents et faciles a faire evoluer.
- Les livrables couvrent l'application, l'architecture, l'API et l'usage encadre de l'IA.

### Fiche 2 - Contexte fonctionnel

Phrase prete :

> Le besoin fonctionnel est de partager un fichier facilement, sans passer par une solution lourde. L'utilisateur peut arriver sur la page d'accueil, choisir un fichier et obtenir un lien public. S'il cree un compte, il peut retrouver ses fichiers dans un espace personnel, copier les liens, filtrer les fichiers actifs ou expires, ajouter des tags et supprimer ses fichiers.

Points a citer :

- Upload de fichier depuis le navigateur.
- Generation automatique d'un lien de partage.
- Telechargement public depuis `/download/:token`.
- Mot de passe optionnel sur le lien.
- Expiration configurable entre 1 et 7 jours, avec 7 jours par defaut.
- Mode anonyme possible, mais espace personnel reserve aux utilisateurs connectes.
- Gestion d'erreurs visible : fichier manquant, identifiants invalides, lien introuvable, lien expire, mauvais mot de passe.

### Fiche 3 - Choix technologiques

Phrase prete :

> J'ai choisi React avec TypeScript pour le frontend parce que c'est adapte a une interface web interactive et maintenable. J'ai choisi NestJS avec TypeScript pour le backend parce que le framework impose une structure claire avec controllers, services, modules, guards et DTO. PostgreSQL sert a stocker les metadonnees, car les relations entre utilisateurs, fichiers et liens de partage sont naturellement relationnelles.

Justifications :

- React/Vite : rapide pour developper et tester une interface moderne.
- TypeScript : typage partageable entre front et back, moins d'erreurs sur les contrats.
- NestJS : architecture modulaire, injection de dependances, guards JWT, validation DTO.
- PostgreSQL/TypeORM : donnees relationnelles, entites claires, relations `User -> FileRecord -> ShareLink`.
- Stockage local : choix volontaire pour le prototype, plus simple qu'un stockage cloud.
- JWT + bcrypt : authentification stateless et mots de passe non stockes en clair.
- OpenAPI : contrat lisible entre frontend et backend.
- Jest/Vitest : tests backend, frontend et e2e auth.

Phrase si on me challenge sur le stockage local :

> Pour le prototype, le stockage local est suffisant et plus simple a maintenir. En production, je proposerais de remplacer ce service par un stockage objet type S3, sans changer toute l'application, car la suppression physique est deja centralisee dans un service dedie.

### Fiche 4 - Architecture

Phrase prete :

> L'architecture suit un modele simple : l'utilisateur interagit avec le frontend React, le frontend appelle l'API REST NestJS, l'API gere les regles metier, stocke les metadonnees dans PostgreSQL et stocke les fichiers physiques dans un dossier local. Le backend est decoupe en modules : Auth, Users, Files, ShareLinks et Maintenance.

Modele a expliquer :

- `Controller` : recoit les requetes HTTP.
- `DTO` : valide les entrees, par exemple expiration entre 1 et 7 jours, mot de passe de lien minimum 6 caracteres, tags limites.
- `Service` : applique les regles metier, par exemple creer un lien, verifier l'expiration, supprimer un fichier.
- `Repository TypeORM` : lit et ecrit dans PostgreSQL.
- `LocalFileStorageService` : centralise la suppression des fichiers physiques.

Modele de donnees :

- `users` : email, password hash, dates.
- `files` : nom original, nom de stockage, type MIME, taille, chemin, tags, proprietaire optionnel.
- `share_links` : token public unique, hash du mot de passe optionnel, date d'expiration, lien vers le fichier.

Relation importante :

> Un utilisateur peut posseder plusieurs fichiers. Un fichier peut avoir un ou plusieurs liens de partage. Si un fichier est supprime, ses liens de partage disparaissent aussi.

### Fiche 5 - Demonstration

Scenario recommande :

1. Montrer la page d'accueil `Partager un fichier`.
2. Televerser un fichier sans compte et montrer le lien genere.
3. Ouvrir la page publique de telechargement.
4. Montrer le cas avec mot de passe si possible.
5. Se connecter ou creer un compte.
6. Televerser un fichier connecte avec tags, expiration et mot de passe.
7. Aller dans `Mon espace`, montrer la liste, les tags, le filtre et la copie du lien.
8. Supprimer un fichier pour montrer la gestion de l'espace personnel.

Phrase prete :

> Pendant la demo, je veux montrer le parcours principal plutot que tous les details techniques. Je pars de l'utilisateur : il depose un fichier, obtient un lien, partage ce lien, puis une autre personne peut telecharger le fichier. Ensuite je montre la difference quand l'utilisateur est connecte : il retrouve ses fichiers, peut les organiser avec des tags et les supprimer.

Erreurs a citer pendant la demo :

- Si aucun fichier n'est selectionne, l'interface affiche un message.
- Si les identifiants sont invalides, l'API renvoie une erreur claire.
- Si le lien est expire, l'API renvoie une erreur `410 Gone`.
- Si le mot de passe du lien est mauvais, l'API renvoie une erreur `401 Unauthorized`.
- Si un utilisateur tente de supprimer un fichier qui ne lui appartient pas, le backend ne le retrouve pas dans son espace.

### Fiche 6 - Documentation technique et IA

Phrase prete :

> J'ai documente le projet avec un contrat OpenAPI, des schemas d'architecture et de base de donnees, et une note specifique sur l'utilisation de l'IA. L'IA a ete utilisee comme copilote sur une user story precise : l'expiration automatique des fichiers. Je ne l'ai pas utilisee comme une boite noire : j'ai donne le besoin, puis j'ai relu l'alignement avec l'architecture, les regles metier, la securite et les tests.

Points IA a citer :

- User Story retenue : expiration automatique des fichiers.
- Taches demandees a l'IA : ajouter `expiresAt`, purger les fichiers expires, prevoir un declenchement periodique, documenter la route de maintenance.
- Supervision humaine : verification des regles 1 a 7 jours, expiration par defaut a 7 jours, suppression physique du fichier, acces JWT, coherence OpenAPI.
- Correctifs apportes apres relecture : service de stockage local dedie, garde JWT optionnelle, validations serveur, documentation OpenAPI.

Phrase si on me challenge sur l'IA :

> Ce que j'ai appris, c'est que l'IA aide surtout a accelerer une implementation ciblee, mais elle ne remplace pas la supervision. Il faut cadrer la demande, relire le code, verifier les effets de bord et valider avec des tests.

## 3. Discussion de 10 minutes - Reponses rapides

### Probleme metier

> Le probleme n'est pas seulement de deposer un fichier. Le vrai besoin est de partager un fichier de maniere controlee : lien facile a transmettre, expiration, protection possible, et suivi pour les utilisateurs connectes.

### Methodologie de developpement

> J'ai travaille par increment : conception, contrat API, backend, frontend, tests, documentation. Cette progression m'a evite de partir dans une interface sans base technique ou dans un backend sans parcours utilisateur.

### Gestion des erreurs

> J'ai essaye de traiter les erreurs cote backend et de les rendre comprehensibles cote frontend. Par exemple, les DTO valident les entrees, le service refuse les liens expires, les identifiants invalides renvoient une erreur explicite, et l'interface affiche les messages a l'utilisateur.

### Qualite et tests

> J'ai des tests backend sur l'authentification, les fichiers, l'expiration et la purge. J'ai aussi des tests frontend sur les parcours principaux : upload, connexion, inscription, espace personnel et erreurs. Les tests ne couvrent pas toute une production, mais ils securisent les comportements importants du prototype.

Commandes verifiees le 07/05/2026 :

- `npm run frontend:test` : 3 fichiers de test, 19 tests OK.
- `npm run backend:test` : 6 suites, 21 tests OK.
- `npm run backend:test:e2e` : 1 suite e2e auth, 5 tests OK.

### Securite

> Les mots de passe utilisateurs et les mots de passe de liens ne sont pas stockes en clair, ils sont hashes avec bcrypt. L'espace personnel est protege par JWT. Les liens publics utilisent un token aleatoire. Les fichiers expires ne sont plus accessibles et peuvent etre purges.

### Limites assumees

> La principale limite est le stockage local. C'est acceptable pour un prototype, mais en production il faudrait passer sur un stockage objet, ajouter des limites de taille plus robustes, du rate limiting, une analyse antivirus, une vraie strategie de sauvegarde et une configuration de deploiement plus stricte.

### Optimisations possibles

- Remplacer le stockage local par S3 ou equivalent.
- Ajouter Docker pour faciliter l'installation.
- Ajouter des migrations TypeORM au lieu de `synchronize`.
- Ajouter une CI pour lancer tests et builds automatiquement.
- Ajouter une limite de taille fichier et une verification antivirus.
- Ajouter une gestion plus fine des droits pour la route de maintenance.
- Ajouter un vrai job planifie avec monitoring.
- Ajouter une expiration visible et modifiable depuis l'espace personnel.

## 4. Fichiers a connaitre rapidement

- `frontend/src/pages/UploadPage.tsx` : page de televersement.
- `frontend/src/pages/AccountPage.tsx` : espace personnel et historique.
- `frontend/src/pages/DownloadPage.tsx` : page publique de telechargement.
- `frontend/src/api.ts` : appels au backend.
- `backend/src/auth/auth.service.ts` : inscription, connexion, JWT, bcrypt.
- `backend/src/files/files.controller.ts` : routes fichiers protegees ou optionnellement authentifiees.
- `backend/src/files/share-links.controller.ts` : routes publiques de lien et telechargement.
- `backend/src/files/files.service.ts` : coeur metier fichier, lien, expiration, suppression.
- `backend/src/files/files-expiration.scheduler.ts` : declenchement periodique de la purge.
- `backend/src/files/maintenance.controller.ts` : route manuelle de purge.
- `docs/OpenAPI/openapi.yaml` : contrat d'API.
- `docs/Architecture` : schemas d'architecture et de base de donnees.
- `docs/AI docs/STEP4_IA_USAGE.md` : trace de l'utilisation de l'IA.

## 5. Conclusion prete a dire

> En resume, je pense etre on track sur les etapes 1 a 4 : j'ai une application fonctionnelle, une architecture coherente, un contrat API, des tests et une trace de l'utilisation de l'IA. Mon prochain objectif est de transformer tout ca en livrables de soutenance solides : documentation finale, support oral, script de demo, et entrainement pour expliquer mes choix de maniere claire.
