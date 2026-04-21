# Etape 1 - Guide simple

## Ce que tu dois produire

L'etape 1 demande 3 livrables principaux :

1. Un schema d'architecture de la solution
2. Un schema du modele de donnees
3. Un contrat d'interface entre le front et le back

Le modele de documentation technique fourni ajoute aussi la logique de redaction autour de ces livrables :

- architecture de l'application
- choix technologiques justifies
- modele de donnees
- documentation d'API
- securite et gestion des acces
- qualite, tests et maintenance
- processus d'installation et d'execution
- utilisation de l'IA dans le developpement

## Solution la plus simple

Si tu veux aller vite sans te perdre :

- Diagramme d'architecture : `draw.io` / `diagrams.net`
- Modele de donnees : `draw.io` ou `dbdiagram.io`
- Contrat d'API : fichier `OpenAPI` en YAML dans VS Code
- Justification technique : Markdown ou document bureautique

## Recommandation concrete

La combinaison la plus simple pour ce projet est :

- VS Code pour ecrire
- `draw.io` pour les schemas
- `OpenAPI` dans VS Code pour les endpoints

Option 100% IDE possible :

- Markdown + Mermaid pour l'architecture
- Mermaid `erDiagram` pour la base
- `openapi.yaml` pour le contrat

Cette option marche, mais `draw.io` reste plus simple quand on debute.

## Stack retenue

Le choix `React + NestJS + PostgreSQL` est coherent pour un prototype de transfert de fichiers :

- React pour un front moderne et rapide a mettre en place
- NestJS pour une API TypeScript structuree, avec auth et validation faciles a organiser
- PostgreSQL pour une base relationnelle fiable, adaptee aux utilisateurs, fichiers et liens de partage

## Architecture conseillee

Ne pars pas sur une architecture compliquee. Pour ce projet, vise :

- un monolithe modulaire
- une architecture en couches
- `Controller -> Service -> Repository`

Exemple de briques :

- Front React
- API NestJS
- PostgreSQL
- stockage local de fichiers pour le prototype
- authentification JWT

## Patterns a garder en tete

Tu n'as pas besoin d'empiler les design patterns. Les plus utiles ici sont :

- `Repository` pour separer l'acces a la base
- `DTO` pour cadrer les entrees/sorties API
- `Dependency Injection` via NestJS
- `Strategy` seulement si tu veux plus tard changer le mode de stockage
- `Adapter` seulement si tu encapsules un stockage local puis un stockage cloud

Evite pour l'instant :

- microservices
- CQRS
- event sourcing
- patterns "academiques" sans besoin concret

## Ce que tu peux dessiner des maintenant

### Architecture

Flux simple :

1. l'utilisateur utilise le front React
2. le front appelle l'API NestJS en HTTPS
3. l'API authentifie l'utilisateur
4. l'API stocke les metadonnees en PostgreSQL
5. l'API stocke les fichiers dans un espace local
6. l'API genere un lien de partage

### Modele de donnees

Commence avec 3 entites simples :

- `users`
- `files`
- `share_links`

Relations conseillees :

- un `user` possede plusieurs `files`
- un `file` peut avoir zero ou plusieurs `share_links`

## Ce qu'il faut ecrire dans la justification technique

Tu peux structurer la section "choix technologiques" comme ceci :

- Frontend : React + TypeScript
- Backend : NestJS + TypeScript
- Base de donnees : PostgreSQL
- Auth : JWT + hash des mots de passe
- Stockage : local pour le prototype
- Documentation API : OpenAPI
- Qualite : ESLint + Prettier + tests automatises
- Versioning : Git + commits clairs

## Outils a installer plus tard pour la suite du projet

- Node.js LTS
- Git
- Docker Desktop
- PostgreSQL local ou conteneur Docker
- DBeaver ou pgAdmin pour visualiser la base

## Regle simple pour la suite

Si tu hesites entre une solution "propre mais complexe" et une solution "simple, claire, defendable a l'oral", choisis la seconde.
