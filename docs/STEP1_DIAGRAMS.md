# Etape 1 - Schemas a reproduire

Ce document te donne une version tres concrete de ce que tu peux dessiner dans `draw.io`.

Tu peux t'en servir de 2 manieres :

- soit tu recopies le schema manuellement dans `draw.io`
- soit tu t'en sers comme base de texte explicatif dans ta documentation

## 1. Schema d'architecture

### Objectif

Montrer simplement comment les briques communiquent entre elles.

### Ce qu'il faut dessiner

Fais un schema horizontal de gauche a droite.

#### Bloc 1

`Utilisateur`

Type de forme conseille :

- acteur UML ou simple rectangle

Texte dans le bloc :

- Utilisateur

#### Bloc 2

`Frontend - React`

Type de forme conseille :

- grand rectangle

Texte dans le bloc :

- Frontend Web
- React + TypeScript
- Pages :
- Connexion / Inscription
- Dashboard
- Upload de fichier
- Liste des fichiers
- Partage / Telechargement

#### Bloc 3

`Backend - NestJS`

Type de forme conseille :

- grand rectangle

Texte dans le bloc :

- API REST
- NestJS + TypeScript
- Modules :
- Auth
- Users
- Files
- Share Links
- Validation DTO
- JWT

#### Bloc 4

`Base de donnees - PostgreSQL`

Type de forme conseille :

- cylindre

Texte dans le bloc :

- PostgreSQL
- Tables :
- users
- files
- share_links

#### Bloc 5

`Stockage de fichiers`

Type de forme conseille :

- rectangle ou dossier

Texte dans le bloc :

- Stockage local
- Dossier `/uploads`
- Fichiers physiques

#### Bloc 6

`Documentation API`

Type de forme conseille :

- petit rectangle

Texte dans le bloc :

- OpenAPI
- Contrat front / back

### Placement conseille

Place les blocs comme ceci :

```text
[Utilisateur] --> [Frontend React] --> [Backend NestJS]
                                        |            \
                                        |             \
                                        v              v
                                  [PostgreSQL]   [Stockage local]
                                        ^
                                        |
                                  [OpenAPI]
```

### Fleches a mettre

1. `Utilisateur -> Frontend React`
   Libelle : `Interaction navigateur`

2. `Frontend React -> Backend NestJS`
   Libelle : `HTTPS / JSON`

3. `Backend NestJS -> PostgreSQL`
   Libelle : `Lecture / ecriture des metadonnees`

4. `Backend NestJS -> Stockage local`
   Libelle : `Lecture / ecriture des fichiers`

5. `Frontend React -> Backend NestJS`
   Libelle secondaire possible : `Authentification JWT`

6. `OpenAPI -> Backend NestJS`
   Libelle : `Documentation des endpoints`

### Phrase d'explication que tu peux mettre sous le schema

L'utilisateur interagit avec une application web React. Le frontend communique avec une API REST developpee avec NestJS via HTTPS et echange des donnees au format JSON. Le backend gere l'authentification, la logique metier, l'acces a la base PostgreSQL pour les metadonnees et le stockage local pour les fichiers. Le contrat d'interface entre le frontend et le backend est documente avec OpenAPI.

## 2. Version encore plus simple si ton mentor veut un schema tres lisible

Si tu veux un schema ultra simple, dessine seulement 5 blocs :

```text
[Utilisateur]
      |
      v
[React Frontend]
      |
      v
[NestJS API] -----> [PostgreSQL]
      |
      v
[Stockage local]
```

Avec ces labels :

- `Utilisateur -> React` : `utilise l'application`
- `React -> API` : `requetes HTTPS`
- `API -> PostgreSQL` : `metadonnees`
- `API -> Stockage local` : `fichiers`

## 3. Modele de donnees

Pour ton projet, ne complique pas le MCD.

Pars sur 3 entites :

- `users`
- `files`
- `share_links`

## 4. Tables a dessiner

### Table `users`

Champs :

- `id` : UUID, PK
- `email` : VARCHAR, unique
- `password_hash` : VARCHAR
- `created_at` : TIMESTAMP
- `updated_at` : TIMESTAMP

### Table `files`

Champs :

- `id` : UUID, PK
- `owner_id` : UUID, FK -> users.id
- `original_name` : VARCHAR
- `storage_name` : VARCHAR
- `mime_type` : VARCHAR
- `size` : INTEGER ou BIGINT
- `storage_path` : VARCHAR
- `created_at` : TIMESTAMP

### Table `share_links`

Champs :

- `id` : UUID, PK
- `file_id` : UUID, FK -> files.id
- `token` : VARCHAR, unique
- `expires_at` : TIMESTAMP, nullable
- `created_at` : TIMESTAMP

## 5. Relations a dessiner

Dessine ces relations :

1. `users 1 ---- n files`
   Explication : un utilisateur peut posseder plusieurs fichiers

2. `files 1 ---- n share_links`
   Explication : un fichier peut avoir plusieurs liens de partage

### Vue texte du MCD

```text
users
- id (PK)
- email
- password_hash
- created_at
- updated_at

files
- id (PK)
- owner_id (FK -> users.id)
- original_name
- storage_name
- mime_type
- size
- storage_path
- created_at

share_links
- id (PK)
- file_id (FK -> files.id)
- token
- expires_at
- created_at

users 1 ----- n files
files 1 ----- n share_links
```

### Phrase d'explication que tu peux mettre sous le MCD

Le modele de donnees repose sur une structure relationnelle simple. Un utilisateur peut deposer plusieurs fichiers. Chaque fichier appartient a un seul utilisateur et peut etre associe a zero, un ou plusieurs liens de partage. Ce choix permet de separer clairement la gestion des comptes, les metadonnees des fichiers et le mecanisme de partage.

## 6. Contrat d'interface a prevoir

Pour l'etape 1, tu peux deja lister ces endpoints principaux :

- `POST /auth/register`
- `POST /auth/login`
- `GET /files`
- `POST /files/upload`
- `DELETE /files/:id`
- `POST /files/:id/share`
- `GET /shares/:token`

## 7. Ordre de travail conseille

Si tu veux aller vite dans `draw.io`, fais dans cet ordre :

1. dessine le schema d'architecture simple
2. dessine le MCD avec 3 tables
3. redige 5 a 10 lignes d'explication sous chaque schema
4. prepare ensuite le contrat d'interface

## 8. Conseils de presentation

Pour que ton schema fasse "propre" rapidement :

- utilise une couleur pour le front
- une autre pour le back
- une autre pour la base
- garde peu de texte dans chaque bloc
- n'utilise pas plus de 5 ou 6 fleches
- privilegie la lisibilite plutot que la complexite

## 9. Ce que tu peux dire si on te demande pourquoi c'est simple

Tu peux expliquer :

Ce projet est un prototype. J'ai volontairement choisi une architecture simple, modulaire et maintenable, avec un frontend React, une API NestJS, une base PostgreSQL pour les metadonnees et un stockage local pour les fichiers. Cette solution est suffisante pour couvrir les besoins fonctionnels du prototype tout en restant facile a expliquer, a tester et a faire evoluer.
