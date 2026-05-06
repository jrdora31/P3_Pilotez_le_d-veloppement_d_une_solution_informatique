# Étape 4 - Utilisation de l'IA dans le développement

## User Story retenue pour l'IA

US10 - Expiration automatique des fichiers.

## Tâches confiées à l'IA

- Proposer une implementation simple de l'expiration avec une date `expiresAt`.
- Ajouter une purge des fichiers expires et des metadonnees associees.
- Prévoir un déclenchement périodique côté backend, équivalent à une tâche cron.
- Exposer la route de maintenance déjà prévue dans le contrat OpenAPI.

## Rôle de supervision

- Vérification de l'alignement avec l'architecture du projet : React, NestJS, PostgreSQL, stockage local.
- Contrôle des règles métier : expiration par défaut à 7 jours, durée limitée entre 1 et 7 jours, suppression physique du fichier.
- Relecture des accès : un utilisateur ne peut supprimer que ses propres fichiers et le téléchargement public reste limité au token valide.
- Execution des builds et tests automatises pour valider l'integration.

## Correctifs et ajustements réalisés

- Ajout d'un service de stockage local dédié pour centraliser la suppression physique.
- Ajout d'une garde JWT optionnelle pour différencier upload anonyme et upload connecté.
- Ajout de validations serveur pour les mots de passe, tags et durees d'expiration.
- Mise à jour du contrat OpenAPI pour documenter les tags, l'authentification optionnelle et l'expiration par défaut.