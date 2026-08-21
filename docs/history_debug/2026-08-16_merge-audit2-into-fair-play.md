# Debug history — 2026-08-16 : Merge de `dev` (post-PR #89) dans `fix/game-fair-play`

## Contexte
La PR #89 (`fix/jdebrull-audit2`) a été mergée (squash) dans `dev` le
2026-08-16 08:58 (commit `4902ea0`). `fix/game-fair-play` avait divergé
d'`audit2` avant ses 2 derniers commits (`d8996f0`, `53944a0`) et portait
en plus son propre fix fair-play (`c9a8ad7`). Avant de push la branche
pour la première fois, mise à jour depuis `origin/dev` et vérification
qu'aucun fix des deux côtés n'était perdu.

---

## Problème — rebase impraticable après un squash-merge

### Symptôme
`git rebase origin/dev` sur `fix/game-fair-play` produit des conflits en
cascade sur 6 fichiers dès le tout premier commit rejoué (`11230f4`,
le commit initial d'`audit2`), alors qu'une simulation de merge
(`git merge-tree`) ne montrait que 3 fichiers réellement en conflit.

### Cause
`dev` contient déjà tout le contenu d'`audit2` sous forme d'un unique
commit squash (`4902ea0`). Rejouer les commits d'`audit2` un par un
(rebase) les applique contre un arbre qui a déjà ce contenu sous une
forme différente : chaque commit individuel ne s'applique plus proprement
même quand son résultat final est identique à ce qui existe déjà côté
`dev`. Un merge classique (diff à 3 points, un seul calcul entre les deux
tips) n'a pas ce problème.

### Fix
`git rebase --abort`, puis `git merge origin/dev --no-edit` à la place.
Seuls 3 fichiers en conflit, comme prévu par `git merge-tree` en amont.

---

## Problème — `POSTGRES_PASSWORD` toujours un vrai secret dans `.env.example` sur cette branche

### Symptôme
Repéré pendant la résolution du conflit sur `.env.example` : le côté
`HEAD` (`fix/game-fair-play`) contenait encore
`POSTGRES_PASSWORD=e04b75530ced4f133daa22c2fb12e49fbcf27da480d4f2aaddb91bf1814def2a`.

### Cause
Le commit `69b18ea` ("sanitize .env.example UUIDs") n'avait assaini que
`VAULT_ROLE_ID`/`VAULT_SECRET_ID` (remplacés par des UUID placeholder),
pas `POSTGRES_PASSWORD` — cf. l'incident documenté dans
`history_debug/2026-08-14_faille-scores-forgeable.md` et `CONTEXT.md`
("Incident sécurité — secrets réels dans `.env.example`"). Le hash est
présent dans l'historique local depuis le tout premier commit d'audit
(`11230f4`, vérifié via `git log -S`). La correction complète
(`POSTGRES_PASSWORD=change_me_in_prod`) n'existait que sur `dev`, via la
PR #89 avant son merge.

### Fix
Résolution du conflit en gardant la version `dev` de `.env.example` en
intégralité (password placeholder + `VAULT_ROLE_ID`/`SECRET_ID` vides
avec commentaire + `FRONTEND_URL=http://localhost:5173` +
`NODE_ENV=development`, valeurs par défaut du repo). Sans cette
vérification, le hash aurait été poussé sur le remote au premier push de
`fix/game-fair-play` (jusque-là resté local).

### Fichiers impliqués
- `.env.example`

---

## Problème — conflits `scores.routes.ts` / `tower.routes.ts` : deux fixes de sécurité sur la même zone

### Symptôme
`git merge origin/dev` en conflit sur les deux fichiers.

### Cause
- `scores.routes.ts` : `dev` avait `d8996f0` ("small bug fixed", jdebrull)
  qui déplace `usedRunNonces.add(payload.nonce)` d'avant la validation de
  `serverElapsed` vers après la transaction réussie (évite de brûler le
  nonce sur un run invalide) ; `fix/game-fair-play` avait `c9a8ad7`
  (`MIN_SCORE_RUN_TIME_MS=3000`) sur la même zone de code.
- `tower.routes.ts` : `dev` avait `53944a0` ("allow replaying
  already-completed tower levels", déjà de Martin) qui assouplit le
  contrôle d'ordre et n'incrémente `tower_progress`/`diamonds` que sur une
  vraie nouvelle progression ; `fix/game-fair-play` n'avait pas encore
  cette évolution (branche créée avant ce commit).

### Fix
- `scores.routes.ts` : gardé `MIN_SCORE_RUN_TIME_MS` + son usage dans la
  condition, et repositionné `usedRunNonces.add(payload.nonce)` après la
  transaction (comportement `dev`).
- `tower.routes.ts` : pris entièrement le côté `dev` (déjà plus avancé —
  contient le fix "allow replay" par-dessus lequel `fix/game-fair-play`
  n'avait rien à ajouter sur ce fichier).
- Vérifié après résolution : `tsc --noEmit` propre (front + back),
  `jest` 74/74, `vitest` 59/59.

### Fichiers impliqués
- `backend/src/routes/scores.routes.ts`
- `backend/src/routes/tower.routes.ts`

---

## Notes architecture
- Après un squash-merge d'une PR de longue durée dans la branche cible,
  toute branche fille créée **avant** les derniers commits de cette PR
  doit être **mergée** (pas rebasée) avec la branche cible pour récupérer
  la suite sans rejouer un historique déjà consolidé ailleurs.
- Toujours faire un `git merge-tree <merge-base> <tip1> <tip2>` avant un
  rebase/merge réel sur une branche qui touche du code sécurité — ça
  révèle les conflits sans toucher à l'arbre de travail, et ça a permis
  ici de détecter que le rebase (mauvaise stratégie) allait être bien
  plus douloureux que prévu avant de le lancer pour de vrai.
