# Etape 4 - Utilisation de l'IA dans le developpement

## User Story retenue pour l'IA

US10 - Expiration automatique des fichiers.

## Taches confiees a l'IA

- Proposer une implementation simple de l'expiration avec une date `expiresAt`.
- Ajouter une purge des fichiers expires et des metadonnees associees.
- Prevoir un declenchement periodique cote backend, equivalent a une tache cron.
- Exposer la route de maintenance deja prevue dans le contrat OpenAPI.

## Role de supervision

- Verification de l'alignement avec l'architecture du projet : React, NestJS, PostgreSQL, stockage local.
- Controle des regles metier : expiration par defaut a 7 jours, duree limitee entre 1 et 7 jours, suppression physique du fichier.
- Relecture des acces : un utilisateur ne peut supprimer que ses propres fichiers et le telechargement public reste limite au token valide.
- Execution des builds et tests automatises pour valider l'integration.

## Correctifs et ajustements realises

- Ajout d'un service de stockage local dedie pour centraliser la suppression physique.
- Ajout d'une garde JWT optionnelle pour differencier upload anonyme et upload connecte.
- Ajout de validations serveur pour les mots de passe, tags et durees d'expiration.
- Mise a jour du contrat OpenAPI pour documenter les tags, l'authentification optionnelle et l'expiration par defaut.

## Tracabilite conseillee dans Git

Commit propose pour la partie IA :

```text
feat: ajouter la purge automatique des fichiers expires
```
