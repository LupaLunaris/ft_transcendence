# Organisation Git

Ce document explique comment l'équipe utilise Git sur **ft_transcendence**.

Objectif : éviter les pertes de code, les conflits inutiles et les branches
impossibles à comprendre.

---

## Sommaire

1. [Résumé rapide](#résumé-rapide)
2. [Branches principales](#branches-principales)
3. [Branches de travail](#branches-de-travail)
4. [Cycle de travail standard](#cycle-de-travail-standard)
5. [Messages de commit](#messages-de-commit)
6. [Règles de merge](#règles-de-merge)
7. [Répartition temporaire](#répartition-temporaire)
8. [Règles d'équipe](#règles-déquipe)
9. [Ce qu'il ne faut pas faire](#ce-quil-ne-faut-pas-faire)

---

## Résumé Rapide

| Question | Réponse courte |
| --- | --- |
| Où est le code stable ? | Sur `main` |
| Où travaille l'équipe ? | Sur `dev` |
| Où je code ma feature ? | Sur une branche `feature/...` |
| Où je corrige un bug ? | Sur une branche `fix/...` |
| Est-ce que je push directement sur `main` ? | Non |
| Est-ce que je commit tout dans `dev` ? | Non, sauf petite doc validée |

Règle simple :

```text
main = version stable
dev = version de développement commune
feature/... = travail d'une personne sur une tâche
fix/... = correction ciblée
```

---

## Branches Principales

### `main`

`main` contient uniquement une version stable du projet.

On ne travaille jamais directement dessus.

Utilisation :

- version validée ;
- code qui compile ;
- fonctionnalités testées ;
- base propre pour une démo ou une évaluation.

Règles :

- pas de push direct ;
- pas de code expérimental ;
- pas de feature à moitié finie.

---

### `dev`

`dev` est la branche commune de développement.

C'est la base de départ pour toutes les nouvelles tâches.

Utilisation :

- récupérer le travail validé des autres ;
- intégrer les features terminées ;
- préparer la prochaine version stable.

Règles :

- toujours partir de `dev` pour créer une branche ;
- mettre `dev` à jour avant de commencer ;
- ne pas casser `dev` volontairement ;
- ne pas merger une feature non testée.

---

## Branches De Travail

Chaque tâche importante doit avoir sa propre branche.

Cela permet de travailler sans bloquer les autres.

### Branches de feature

Format :

```text
feature/nom-de-la-feature
```

Exemples :

```text
feature/auth-system
feature/profile-page
feature/game-core
feature/websocket-sync
feature/design-system
```

Utilisation :

- nouvelle page ;
- nouveau système ;
- nouvelle fonctionnalité ;
- travail qui prend plusieurs commits.

---

### Branches de correction

Format :

```text
fix/nom-du-probleme
```

Exemples :

```text
fix/login-validation
fix/avatar-upload
fix/socket-reconnect
fix/profile-form-error
```

Utilisation :

- bug précis ;
- correction courte ;
- comportement cassé à réparer.

---

### Branches de documentation

Format :

```text
docs/sujet
```

Exemples :

```text
docs/git-guide
docs/api-routes
docs/team-roles
```

Utilisation :

- guide ;
- README ;
- notes d'architecture ;
- documentation d'équipe.

---

## Cycle De Travail Standard

Voici le chemin normal d'une feature.

```text
dev
 |
 | créer une branche
 v
feature/ma-feature
 |
 | coder + commit + push
 v
feature/ma-feature prête
 |
 | merge dans dev après vérification
 v
dev
 |
 | quand tout est stable
 v
main
```

### Étapes

1. Se placer sur `dev`.
2. Mettre `dev` à jour.
3. Créer une branche de travail.
4. Coder localement.
5. Faire des commits clairs.
6. Push la branche.
7. Vérifier avec l'équipe.
8. Merger dans `dev`.
9. Supprimer la branche si elle est terminée.
10. Merger `dev` dans `main` uniquement pour une version stable.

---

## Messages De Commit

Un commit doit expliquer ce qui a changé.

Format conseillé :

```text
type: message clair
```

### Types utiles

| Type | Quand l'utiliser | Exemple |
| --- | --- | --- |
| `feat` | Nouvelle fonctionnalité | `feat: add login route` |
| `fix` | Correction de bug | `fix: validate avatar file type` |
| `docs` | Documentation | `docs: update git workflow` |
| `refactor` | Code réorganisé sans changer le comportement | `refactor: simplify auth middleware` |
| `style` | Formatage, CSS, lint | `style: format profile page` |
| `test` | Tests | `test: add auth route tests` |
| `chore` | Configuration, dépendances, maintenance | `chore: update prisma config` |

### Bons exemples

```text
feat: add register route
feat: create user prisma model
fix: correct websocket reconnect logic
docs: update project structure
refactor: simplify auth middleware
```

### Mauvais exemples

```text
update
test
final
ok
small fix
changes
```

Pourquoi ils sont mauvais : dans deux semaines, personne ne saura ce que le
commit contient.

---

## Règles De Merge

Avant de merger une branche dans `dev`, vérifier :

- le projet démarre ;
- la feature fonctionne ;
- les fichiers inutiles ne sont pas commit ;
- le code ne dépend pas d'un fichier local non partagé ;
- les conflits sont résolus proprement ;
- le nom de la branche est compréhensible ;
- le dernier commit est push.

### Qui merge ?

Pour éviter les surprises :

- la personne qui a fait la branche peut proposer le merge ;
- au moins une autre personne doit comprendre ce qui entre dans `dev` ;
- si la feature touche plusieurs parties du projet, prévenir l'équipe avant.

### Merge vers `main`

`main` reçoit du code seulement quand `dev` est stable.

Avant de merger `dev` dans `main` :

- lancer le projet ;
- vérifier les fonctionnalités importantes ;
- vérifier qu'aucun travail à moitié fini n'est inclus ;
- prévenir l'équipe.

---

## Répartition Temporaire

Cette répartition sert de guide tant que l'équipe complète n'est pas encore
confirmée.

| Personne | Branches probables | Sujet principal |
| --- | --- | --- |
| Jennifer | `feature/auth-system`, `feature/user-models`, `feature/profile-management` | Backend, utilisateurs, sécurité |
| Martin | `feature/game-core`, `feature/card-system`, `feature/labyrinth-logic` | Gameplay, règles, interactions |
| Membre 3 | `feature/websocket-sync`, `feature/remote-session` | Temps réel, sessions distantes |
| Membre 4 | `feature/design-system`, `feature/i18n-ui` | UI, composants, langues |

Cette liste n'est pas une prison. Si les forces de l'équipe changent, les
branches peuvent changer aussi.

---

## Règles D'Équipe

### Avant de commencer à coder

- Partir de `dev`.
- Vérifier que `dev` est à jour.
- Créer une branche avec un nom clair.

### Pendant le travail

- Faire des commits réguliers.
- Ne pas garder une branche isolée trop longtemps.
- Push souvent pour ne pas perdre le travail.
- Prévenir si une modification touche le travail d'un autre.

### Avant de demander un merge

- Relire `git status`.
- Tester ce qui a été modifié.
- Vérifier que les commits sont compréhensibles.
- Mettre sa branche à jour avec `dev`.

### Après le merge

- Supprimer la branche terminée.
- Repartir de `dev` pour la tâche suivante.
- Mettre la documentation à jour si le comportement a changé.

---

## Ce Qu'il Ne Faut Pas Faire

| Action | Pourquoi c'est dangereux |
| --- | --- |
| Push directement sur `main` | On peut casser la version stable |
| Travailler directement sur `dev` pendant plusieurs jours | Les autres récupèrent du code pas fini |
| Faire un commit nommé `update` | Personne ne comprend l'historique |
| Commit des fichiers inutiles | Le repo devient sale et confus |
| Garder une branche trop longtemps | Les conflits deviennent plus difficiles |
| Utiliser `git reset --hard` sans comprendre | Cela peut supprimer du travail |
| Utiliser `git push --force` sans accord | Cela peut casser l'historique des autres |

Règle finale :

```text
Si une commande Git semble dangereuse, demander avant de la lancer.
```

