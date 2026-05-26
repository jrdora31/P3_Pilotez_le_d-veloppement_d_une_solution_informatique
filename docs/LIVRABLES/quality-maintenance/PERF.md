# Suivi de performance

Dernière mise à jour : 2026-05-26.

## Test de performance rapide sur un endpoint critique

Endpoint testé :

```text
GET /share-links/:token
```

Cet endpoint est critique parce qu'il est appelé lorsqu'un utilisateur ouvre un lien de partage. Il vérifie que l'API et la base de données répondent rapidement avant le téléchargement du fichier.

Outil utilisé :

```text
k6
```

Script utilisé :

```text
scripts/perf-share-link.k6.js
```

Ce script lance 5 utilisateurs virtuels pendant 30 secondes sur `GET /share-links/:token`. Il vérifie que les réponses sont en `200` et que le temps de réponse reste sous le budget défini.

Commande exécutée :

```powershell
k6 run `
  --summary-export "docs/LIVRABLES/quality-maintenance/evidence/perf-k6-share-link-2026-05-26.json" `
  -e API_URL=http://localhost:3000 `
  -e SHARE_TOKEN=d9WUedXeKyxji9RWfDcY5Ym8 `
  "scripts/perf-share-link.k6.js"
```

Résultats :

| Métrique | Résultat | Budget | Statut |
| --- | ---: | ---: | --- |
| Requêtes exécutées | 150 | indicatif | OK |
| Erreurs HTTP | 0,00 % | < 1 % | OK |
| Temps de réponse moyen | 2,72 ms | indicatif | OK |
| Temps de réponse p95 | 3,21 ms | < 500 ms | OK |
| Temps de réponse maximum | 18,31 ms | indicatif | OK |
| Checks k6 réussis | 300 / 300 | 100 % | OK |

Interprétation :

Le test est validé. L'endpoint public de consultation d'un lien de partage répond rapidement en local et ne génère aucune erreur sur 150 requêtes. Le budget backend est donc respecté pour ce parcours critique.

Preuve générée :

```text
docs/LIVRABLES/quality-maintenance/evidence/perf-k6-share-link-2026-05-26.json
```

## Budget de performance côté front

Le budget frontend est vérifié avec le build Vite. Côté backend, le test k6 précédent valide déjà le temps de réponse de l'endpoint critique.

Commande exécutée :

```powershell
npm run frontend:build
```

Résultat du build :

```text
dist/index.html                   0.41 kB | gzip:  0.28 kB
dist/assets/index-DZLRyYsI.css    6.35 kB | gzip:  1.93 kB
dist/assets/index-CxXjXljz.js   238.01 kB | gzip: 74.31 kB
build terminé en 2.04 s
```

Budget :

| Métrique | Budget | Résultat | Statut |
| --- | ---: | ---: | --- |
| JavaScript initial gzip | < 150 kB | 74,31 kB | OK |
| JavaScript initial brut | < 300 kB | 238,01 kB | OK |
| CSS gzip | < 30 kB | 1,93 kB | OK |
| CSS brut | < 100 kB | 6,35 kB | OK |
| Build frontend | doit réussir | 2,04 s | OK |

Interprétation :

Le budget frontend est respecté. Le bundle JavaScript compressé reste largement sous la limite fixée pour le MVP.

## Suivi des métriques

Les métriques suivies portent sur les deux points demandés : le temps de réponse et la taille des fichiers.

### Temps de réponse

| Source | Métrique | Résultat |
| --- | --- | ---: |
| k6 `GET /share-links/:token` | Temps moyen | 2,72 ms |
| k6 `GET /share-links/:token` | Temps p95 | 3,21 ms |
| k6 `GET /share-links/:token` | Temps maximum | 18,31 ms |
| k6 `GET /share-links/:token` | Taux d'erreur | 0,00 % |

### Taille des fichiers

Script utilisé :

```text
scripts/perf-upload.ps1
```

Ce script génère trois fichiers de test, puis les envoie sur :

```text
POST /files
```

Commande exécutée :

```powershell
./scripts/perf-upload.ps1
```

Résultats :

| Taille testée | Statut HTTP | Temps mesuré |
| --- | ---: | ---: |
| 100 Ko | 201 | 99,67 ms |
| 5 Mo | 201 | 48,21 ms |
| 50 Mo | 201 | 135,35 ms |

Interprétation :

Les trois uploads sont acceptés par l'API avec un statut `201`. Les temps restent faibles en local. Les mesures servent surtout à vérifier que l'application accepte plusieurs tailles représentatives sans erreur.

Preuve générée :

```text
docs/LIVRABLES/quality-maintenance/evidence/perf-upload-2026-05-26.json
```

## Captures de logs ou métriques de performance

Métriques serveur :

```text
docs/LIVRABLES/quality-maintenance/evidence/perf-k6-share-link-2026-05-26.json
docs/LIVRABLES/quality-maintenance/evidence/perf-upload-2026-05-26.json
```

Métriques navigateur :

```text
npm run frontend:build
```

Le build frontend fournit les tailles des fichiers générés et compressés (`gzip`). Ces valeurs servent de preuve pour le budget de performance côté navigateur.

## Conclusion

Au 2026-05-26 :

- le test k6 sur l'endpoint critique est validé ;
- le budget frontend est respecté ;
- les uploads de `100 Ko`, `5 Mo` et `50 Mo` sont validés ;
- aucune régression de performance évidente n'est observée en local.
