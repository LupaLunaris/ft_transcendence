# Debug history — 2026-08-14 : Score de map et progression tour forgeables via console navigateur

## Contexte
En vérifiant si le jeu était exploitable en tapant des requêtes dans la
console du navigateur, un audit du code (pas de bug rapporté par un
joueur) a mis en évidence deux endpoints REST qui font confiance au
client sans aucune preuve qu'une partie ait réellement été jouée :
`POST /api/v1/scores` et `POST /api/v1/tower/:order_index/complete`.
PoC exécutés en lecture/écriture sur une instance de dev locale, aucune
donnée de prod affectée.

---

## Problème — `POST /api/v1/scores` accepte n'importe quel temps du client

### Symptôme
Aucun symptôme observé en usage normal — c'est une faille de sécurité, pas
un bug fonctionnel. Détectée par relecture de code suite à la question
« est-il possible de tricher en tapant des requêtes dans la console ? ».

### Cause
`backend/src/routes/scores.routes.ts:15-58` accepte `{ map_id,
completion_time_ms }` et l'enregistre tel quel via `upsertBestScore`, sans
lien avec une session de jeu côté serveur (pas de `start_time` serveur, pas
de token de partie, pas de vérification de plausibilité). La validation
Zod (`scoreSchema`, `backend/src/schemas/map.schemas.ts:26-29`) ne
contraint que le *type* (`map_id` uuid, `completion_time_ms` entier > 0),
jamais la *cohérence métier*.

Contrairement au mode Duel (`backend/src/socket/duelHandler.ts`, où
`finish_time`/`start_time` sont dérivés côté serveur et non falsifiables
directement), le mode solo/entraînement (`frontend/src/pages/game/GamePage.tsx:106`)
envoie le résultat de la partie a posteriori, en pure confiance client.

### PoC (reproduit en dev, compte perso)
```js
// 1. Récupérer un map_id publié (route publique, pas d'auth requise)
fetch('/api/v1/maps?limit=1').then(r => r.json()).then(d => console.log(d.data[0].id));

// 2. Forger un score
const token = localStorage.getItem('ft_token');
fetch('/api/v1/scores', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ map_id: '<uuid>', completion_time_ms: 1 })
}).then(r => r.json()).then(console.log);
// -> 201, aucune erreur, aucune vérification métier

// 3. Vérification : le score apparaît en tête de classement public
fetch('/api/v1/scores/leaderboard/<uuid>').then(r => r.json()).then(console.log);
```
Résultat : `201`, record personnel écrasé à `1 ms`, apparition immédiate en
tête de `GET /api/v1/scores/leaderboard/:map_id`. Déclenche aussi
`rewardPublicMapCompletion` (XP + succès `FIRST_ESCAPE`), donc la faille
impacte la progression du compte, pas seulement l'affichage du
classement.

### Fix
Non appliqué à ce stade (l'utilisateur a demandé uniquement la
documentation de la faille dans cette session). Piste retenue pour une
prochaine session : dériver `/scores` du système serveur-autoritaire déjà
existant côté Duel (`finishRace` dans `duelHandler.ts`), ou introduire une
session de jeu solo trackée côté serveur (`start_time` signé à l'entrée en
jeu + tolérance de temps) plutôt que d'accepter `completion_time_ms` tel
quel.

### Fichiers impliqués
- `backend/src/routes/scores.routes.ts`
- `backend/src/schemas/map.schemas.ts`
- `frontend/src/pages/game/GamePage.tsx`

---

## Problème — `POST /api/v1/tower/:order_index/complete` accepte une "complétion" sans jeu réel

### Symptôme
Idem faille précédente : aucun symptôme en usage normal, détectée par
relecture de code.

### Cause
`backend/src/routes/tower.routes.ts:52-86` vérifie que les niveaux sont
complétés dans l'ordre (`orderIndex === user.tower_progress + 1`, lignes
72-75), mais ne vérifie jamais qu'une partie a réellement été jouée pour
ce niveau — aucun lien avec une session de jeu serveur, contrairement au
Duel. Chaque appel valide incrémente `tower_progress` et `diamonds` de 1
(lignes 77-83).

### PoC (reproduit en dev, compte perso)
```js
// 1. État avant (tower_progress, diamonds)
const token = localStorage.getItem('ft_token');
fetch('/api/v1/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
  .then(r => r.json())
  .then(d => console.log('AVANT :', d.data.tower_progress, d.data.diamonds));

// 2. Farmer les 8 niveaux sans jamais charger le jeu (ordre séquentiel obligatoire,
//    mais aucune preuve de complétion réelle exigée entre deux appels)
async function farmTower() {
  for (let level = 1; level <= 8; level++) {
    const res = await fetch(`/api/v1/tower/${level}/complete`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`Niveau ${level} :`, await res.json());
  }
}
farmTower();

// 3. État après
fetch('/api/v1/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
  .then(r => r.json())
  .then(d => console.log('APRÈS :', d.data.tower_progress, d.data.diamonds));
```
Résultat : `tower_progress` passe à `8` et `diamonds` augmente de `8` en
quelques secondes, tour de 8 niveaux entièrement "complétée" sans avoir
chargé `EditorPage`/le mode tour côté frontend une seule fois. Chaque
réponse (`{ tower_progress, diamonds }`, ligne 85) confirme directement
l'effet, sans requête supplémentaire.

Seule protection existante : l'ordre séquentiel (rejeu du même niveau ou
saut de niveau → `403 "You must complete levels in order"`, lignes
72-75). Aucune protection contre l'absence de partie réelle entre deux
appels valides, ni contre des appels concurrents (pas de
transaction/lock sur la lecture-puis-écriture de `tower_progress`).

### Fix
Non appliqué à ce stade. Même piste que pour `/scores` : exiger une
preuve de session de jeu côté serveur (ex. un niveau "démarré" tracké en
base avec timestamp, complété seulement si un délai minimum plausible
s'est écoulé) plutôt que d'accepter la complétion sur simple déclaration
du client.

### Fichiers impliqués
- `backend/src/routes/tower.routes.ts`

---

## Notes architecture
- Le mode Duel (Socket.IO) est server-authoritative : mouvement,
  collisions et victoire sont calculés côté serveur
  (`backend/src/socket/duelHandler.ts`), le client n'étant que prédictif
  (cf. `frontend/src/game/scenes/DuelScene.ts:310-314`). Les modes
  solo/entraînement et tour, eux, ne le sont pas : le résultat de la
  partie est un simple `POST` a posteriori, en confiance totale envers le
  client.
- `player_input` (Duel) n'a pas de limite de fréquence côté serveur : rien
  n'empêche un client de spammer l'event plus vite que le rythme normal du
  tween côté frontend, ce qui peut accélérer artificiellement un duel et
  fausser `upsertBestScore` par ce biais indirect. Sévérité moindre que la
  faille `/scores` (nécessite un duel réel, pas juste un `fetch`), non
  creusé plus en détail cette session.
