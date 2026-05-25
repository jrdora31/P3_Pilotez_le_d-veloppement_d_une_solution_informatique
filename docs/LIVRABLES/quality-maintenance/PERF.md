# Suivi de performance

Dernière mise à jour : 2026-05-11.

## Objectif du document

Ce document définit comment suivre la performance de DataShare. Il couvre les endpoints critiques côté backend, le budget de performance frontend, les métriques à observer, les commandes de test et l'interprétation des résultats.

Le but n'est pas de faire un benchmark industriel pour le MVP. Le but est de vérifier que l'application reste réactive, que le bundle frontend reste raisonnable, et qu'une régression évidente soit détectée avant une livraison.

## Périmètre de performance

DataShare a trois zones de performance importantes :

- le frontend React, parce qu'il doit charger rapidement et rester fluide ;
- l'API NestJS, parce qu'elle crée les liens, liste les fichiers et sert les téléchargements ;
- le stockage de fichiers, parce que l'upload, le téléchargement et la purge manipulent potentiellement de gros volumes.

Les mesures doivent distinguer les petits endpoints JSON et les endpoints de transfert de fichiers. Un endpoint JSON peut viser une latence faible. Un upload de fichier dépend surtout de la taille du fichier, du disque et du réseau.

## Endpoints critiques

### `POST /files`

Rôle :

- téléverser un fichier ;
- enregistrer les métadonnées ;
- créer un lien de partage ;
- hasher éventuellement un mot de passe de partage.

Pourquoi c'est critique :

C'est le coeur métier de l'application. Si cet endpoint est lent ou instable, l'utilisateur ne peut pas partager ses fichiers.

Métriques à suivre :

- temps de réponse pour petits fichiers ;
- temps de réponse pour fichiers moyens ;
- taux d'erreur ;
- taille moyenne téléversée ;
- nombre d'uploads par minute ;
- erreurs Multer ou erreurs de stockage disque.

### `GET /share-links/:token`

Rôle :

- afficher les informations publiques d'un lien ;
- indiquer si un mot de passe est requis ;
- refuser les liens expirés ou inexistants.

Pourquoi c'est critique :

C'est le premier endpoint appelé par une personne qui reçoit un lien de partage.

Métriques à suivre :

- temps de réponse p95 ;
- taux de `404` ;
- taux de `410` ;
- taux d'erreur serveur.

### `POST /share-links/:token/download`

Rôle :

- vérifier le token ;
- vérifier éventuellement le mot de passe ;
- streamer le fichier.

Pourquoi c'est critique :

C'est le point de livraison du fichier. La performance dépend à la fois de l'API, du disque et du réseau.

Métriques à suivre :

- temps avant premier octet ;
- durée totale de téléchargement ;
- taille téléchargée ;
- taux d'erreur ;
- erreurs de lecture fichier.

### `GET /files`

Rôle :

- lister les fichiers de l'utilisateur connecté ;
- indiquer les statuts actifs ou expirés ;
- retourner les liens principaux.

Pourquoi c'est critique :

C'est la base de l'espace utilisateur. Une liste lente donne une impression d'application instable.

Métriques à suivre :

- temps de réponse p95 ;
- nombre de fichiers retournés ;
- impact du filtre `status`;
- taille de la réponse JSON.

## Budgets de performance proposés

Ces budgets sont adaptés à un MVP local ou à une petite application web. Ils peuvent être ajustés si le contexte de production change.

### Backend JSON

| Endpoint | Budget p95 local | Commentaire |
| --- | ---: | --- |
| `GET /share-links/:token` | < 200 ms | Lecture simple du lien et du fichier associé |
| `GET /files` | < 300 ms | Peut augmenter avec beaucoup de fichiers |
| `POST /auth/login` | < 500 ms | Inclut comparaison bcrypt |
| `POST /maintenance/expired-files/purge` | dépend du volume | Mesurer surtout durée et octets purgés |

### Upload et téléchargement

| Cas | Budget indicatif | Commentaire |
| --- | ---: | --- |
| Upload fichier 1 Mo en local | < 1 s | Hors réseau distant |
| Upload fichier 10 Mo en local | < 5 s | Dépend du disque |
| Téléchargement 1 Mo en local | < 1 s | Doit rester stable |
| Téléchargement 100 Mo | dépend du réseau | Suivre le débit plus que la latence |

### Frontend

| Métrique | Budget proposé | Résultat 2026-05-11 |
| --- | ---: | ---: |
| JS initial gzip | < 150 kB | 74,31 kB |
| JS initial brut | < 300 kB | 238,01 kB |
| CSS gzip | < 30 kB | 1,93 kB |
| CSS brut | < 100 kB | 6,35 kB |
| Build Vite | doit réussir | réussi en 2,14 s |

Interprétation :

Le budget frontend est respecté au 2026-05-11. Le bundle JavaScript reste raisonnable pour une application React de MVP.

## Résultat frontend vérifié le 2026-05-11

Commande exécutée :

```bash
npm run frontend:build
```

Résultat :

```text
dist/index.html                 0.41 kB  gzip: 0.28 kB
dist/assets/index-DZLRyYsI.css  6.35 kB  gzip: 1.93 kB
dist/assets/index-CxXjXljz.js   238.01 kB gzip: 74.31 kB
build terminé en 2.14 s
```

Analyse :

- Le JavaScript compressé est largement sous le budget de 150 kB.
- Le CSS compressé est très faible.
- Aucun découpage supplémentaire du bundle n'est nécessaire pour le MVP.
- Il faudra recontrôler ce budget si de grosses bibliothèques sont ajoutées.

## Test rapide backend avec k6

`k6` n'est pas installé sur la machine au moment de la vérification du 2026-05-11. La procédure suivante est donc prête à l'emploi, mais le résultat k6 reste à produire quand l'outil et l'API locale sont disponibles.

Installation possible :

```bash
winget install k6.k6
```

Exemple de test sur l'endpoint public de consultation de lien :

```javascript
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 5,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"]
  }
};

const apiUrl = __ENV.API_URL || "http://localhost:3000";
const token = __ENV.SHARE_TOKEN;

export default function () {
  const response = http.get(`${apiUrl}/share-links/${token}`);

  check(response, {
    "status is 200": (res) => res.status === 200,
    "duration under 500ms": (res) => res.timings.duration < 500
  });

  sleep(1);
}
```

Commande :

```bash
k6 run -e API_URL=http://localhost:3000 -e SHARE_TOKEN=<token-valide> perf-share-link.js
```

Résultat attendu :

- `http_req_failed` inférieur à 1 % ;
- `http_req_duration p(95)` inférieur à 500 ms ;
- aucun pic d'erreur serveur.

Interprétation :

Si le p95 dépasse 500 ms sur cet endpoint en local, il faut inspecter la requête de base de données, les relations TypeORM chargées et les logs serveur. Cet endpoint ne transfère pas de fichier, il devrait rester rapide.

## Alternative sans k6 avec PowerShell

Si `k6` n'est pas installé, on peut faire un test simple avec PowerShell. Ce test ne remplace pas un vrai outil de charge, mais il donne un signal rapide.

Pré-requis :

- API backend démarrée ;
- token de partage valide ;
- base PostgreSQL disponible.

Commande :

```powershell
$uri = "http://localhost:3000/share-links/<token-valide>"
$results = 1..20 | ForEach-Object {
  $elapsed = Measure-Command {
    Invoke-WebRequest -Uri $uri -UseBasicParsing | Out-Null
  }
  [PSCustomObject]@{
    Run = $_
    Ms = [Math]::Round($elapsed.TotalMilliseconds, 2)
  }
}

$results
$results | Measure-Object -Property Ms -Average -Minimum -Maximum
```

Critères d'acceptation :

- aucune erreur HTTP ;
- moyenne sous 300 ms en local ;
- maximum raisonnable et sans pic répété ;
- si un pic apparaît, relancer le test pour confirmer.

## Test rapide upload

L'upload doit être mesuré avec un fichier représentatif. Pour un MVP, utiliser trois tailles :

- petit : 100 kB ;
- moyen : 5 Mo ;
- plus lourd : 50 Mo.

Commande manuelle possible :

```bash
curl -w "\nTotal: %{time_total}s\n" -X POST http://localhost:3000/files \
  -F "file=@./sample-5mb.pdf" \
  -F "expirationDays=7"
```

Critères :

- réponse `201`;
- présence de `shareLink.url`;
- pas d'erreur serveur ;
- temps cohérent avec la taille du fichier.

Attention :

Ne pas comparer un upload de 100 kB et un upload de 500 Mo avec le même seuil. Pour les gros fichiers, le débit disque et réseau compte plus que la latence API pure.

## Suivi des métriques

### Métriques navigateur

Sur le frontend, suivre au minimum :

- temps de chargement initial ;
- taille JS/CSS ;
- erreurs console ;
- fluidité des interactions sur upload et pages de compte ;
- temps de réponse perçu entre clic et affichage d'un message.

Outils possibles :

- build Vite pour la taille des assets ;
- onglet Network du navigateur ;
- Lighthouse si une mesure navigateur plus complète est souhaitée.

### Métriques serveur

Sur le backend, suivre :

- temps de réponse par route ;
- nombre de requêtes par route ;
- taux de `4xx` et `5xx`;
- taille moyenne uploadée ;
- volume total stocké dans `uploads`;
- durée de la purge ;
- nombre de fichiers purgés ;
- octets purgés.

La réponse de purge contient déjà :

- `purgedFiles`
- `purgedShareLinks`
- `purgedBytes`
- `startedAt`
- `finishedAt`

Ces champs peuvent servir de base à un suivi simple.

## Captures ou preuves de performance à archiver

Pour la soutenance, archiver au minimum :

- capture du build Vite avec les tailles gzip ;
- capture d'un test `k6` ou PowerShell sur `GET /share-links/:token`;
- capture d'un upload `curl` avec `time_total`;
- si possible, capture de l'onglet Network montrant le chargement initial du frontend.

Nom recommandé :

```text
docs/quality-maintenance/evidence/perf-frontend-build-2026-05-11.png
docs/quality-maintenance/evidence/perf-share-link-2026-05-11.png
docs/quality-maintenance/evidence/perf-upload-2026-05-11.png
```

## Décision actuelle

Au 2026-05-11 :

- le budget frontend est validé ;
- le build frontend réussit ;
- le build backend réussit ;
- le test de charge backend n'a pas été rejoué avec k6 car l'outil n'est pas installé ;
- une procédure alternative PowerShell est documentée ;
- la prochaine priorité performance est de produire une mesure réelle sur `GET /share-links/:token` puis sur `POST /files`.

