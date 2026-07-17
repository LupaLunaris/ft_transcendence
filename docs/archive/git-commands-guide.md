# Guide Des Commandes Git

Ce guide sert à retrouver rapidement les commandes utiles pour travailler sur
**ft_transcendence**.

Il est écrit pour quelqu'un qui débute avec Git.

Note : ce guide utilise `git switch`, plus simple à lire pour changer de
branche. Si une machine ne connaît pas cette commande, utiliser `git checkout`
à la place.

---

## Sommaire

1. [Commandes à connaître par coeur](#commandes-à-connaître-par-coeur)
2. [Routine normale](#routine-normale)
3. [Démarrer le projet](#démarrer-le-projet)
4. [Savoir où on est](#savoir-où-on-est)
5. [Récupérer le travail des autres](#récupérer-le-travail-des-autres)
6. [Créer une branche](#créer-une-branche)
7. [Sauvegarder son travail](#sauvegarder-son-travail)
8. [Envoyer son travail sur GitHub](#envoyer-son-travail-sur-github)
9. [Mettre sa branche à jour](#mettre-sa-branche-à-jour)
10. [Merger une branche](#merger-une-branche)
11. [Gérer un conflit simple](#gérer-un-conflit-simple)
12. [Annuler une erreur simple](#annuler-une-erreur-simple)
13. [Nettoyer les branches terminées](#nettoyer-les-branches-terminées)
14. [Commandes dangereuses](#commandes-dangereuses)
15. [Exemples complets](#exemples-complets)

---

## Commandes À Connaître Par Coeur

| Besoin | Commande |
| --- | --- |
| Voir l'état du repo | `git status` |
| Voir la branche actuelle | `git branch` |
| Aller sur `dev` | `git switch dev` |
| Mettre `dev` à jour | `git pull origin dev` |
| Créer une branche | `git switch -c feature/ma-feature` |
| Voir les modifications | `git diff` |
| Ajouter les fichiers | `git add .` |
| Créer un commit | `git commit -m "feat: message clair"` |
| Push une nouvelle branche | `git push -u origin feature/ma-feature` |
| Push ensuite | `git push` |
| Merger `dev` dans sa branche | `git merge dev` |
| Merger une feature dans `dev` | `git merge feature/ma-feature` |

---

## Routine Normale

À faire presque à chaque nouvelle tâche.

```bash
git switch dev
git pull origin dev
git switch -c feature/ma-feature
```

Ensuite :

```bash
git status
git add .
git commit -m "feat: message clair"
git push -u origin feature/ma-feature
```

Quand la feature est prête :

```bash
git switch dev
git pull origin dev
git merge feature/ma-feature
git push origin dev
```

---

## Démarrer Le Projet

À faire une seule fois, quand on récupère le repo.

```bash
git clone <repository-url>
cd ft_transcendence
```

Ensuite, vérifier les branches disponibles :

```bash
git branch -a
```

---

## Savoir Où On Est

### Voir la branche actuelle

```bash
git branch
```

La branche actuelle est celle avec `*`.

Exemple :

```text
* feature/auth-system
  dev
  main
```

Ici, tu es sur `feature/auth-system`.

### Voir ce qui a changé

```bash
git status
```

À utiliser tout le temps.

Cette commande dit :

- sur quelle branche tu es ;
- quels fichiers ont changé ;
- quels fichiers sont prêts pour un commit ;
- quels fichiers ne sont pas encore suivis par Git.

### Voir le détail des modifications

```bash
git diff
```

Cette commande montre les lignes modifiées.

---

## Récupérer Le Travail Des Autres

Avant de commencer à coder, mettre `dev` à jour.

```bash
git switch dev
git pull origin dev
```

Utilité :

- récupérer les derniers commits ;
- éviter de travailler sur une ancienne version ;
- réduire les conflits plus tard.

Si tu veux seulement voir s'il y a du nouveau sans modifier tes fichiers :

```bash
git fetch origin
```

---

## Créer Une Branche

Toujours créer une branche depuis `dev` à jour.

```bash
git switch dev
git pull origin dev
git switch -c feature/auth-system
```

Exemples de branches :

```bash
git switch -c feature/profile-page
git switch -c feature/game-core
git switch -c feature/websocket-sync
git switch -c fix/login-validation
git switch -c docs/git-guide
```

Rappel :

- `feature/...` pour une nouvelle fonctionnalité ;
- `fix/...` pour une correction ;
- `docs/...` pour la documentation.

---

## Sauvegarder Son Travail

Git sauvegarde en trois étapes :

```text
modifier les fichiers -> git add -> git commit
```

### Voir les fichiers modifiés

```bash
git status
```

### Ajouter tous les fichiers modifiés

```bash
git add .
```

### Ajouter un seul fichier

```bash
git add docs/git-organization.md
```

### Créer un commit

```bash
git commit -m "feat: add login route"
```

Bonnes pratiques :

- un commit = une idée claire ;
- message précis ;
- pas de commit avec un nom comme `update` ou `test`.

Exemples :

```bash
git commit -m "feat: create user prisma model"
git commit -m "fix: validate avatar upload"
git commit -m "docs: explain git workflow"
git commit -m "refactor: simplify auth middleware"
```

---

## Envoyer Son Travail Sur GitHub

### Premier push d'une nouvelle branche

```bash
git push -u origin feature/auth-system
```

Le `-u` relie ta branche locale à la branche GitHub.

### Push suivants sur la même branche

```bash
git push
```

---

## Mettre Sa Branche À Jour

Si `dev` a changé pendant que tu travaillais, il faut récupérer les nouveautés.

```bash
git switch dev
git pull origin dev
git switch feature/auth-system
git merge dev
```

Après ça :

- si tout va bien, continue ;
- s'il y a des conflits, les résoudre ;
- tester le projet ;
- refaire un commit si Git le demande.

---

## Merger Une Branche

### Merger une feature dans `dev`

À faire quand la feature est terminée et vérifiée.

```bash
git switch dev
git pull origin dev
git merge feature/auth-system
git push origin dev
```

### Merger `dev` dans `main`

À faire uniquement pour une version stable.

```bash
git switch main
git pull origin main
git merge dev
git push origin main
```

Avant de merger dans `main`, prévenir l'équipe.

---

## Gérer Un Conflit Simple

Un conflit arrive quand deux personnes ont modifié la même partie d'un fichier.

Git affiche souvent un texte comme ceci dans le fichier :

```text
<<<<<<< HEAD
ton code
=======
le code de l'autre branche
>>>>>>> dev
```

Pour régler le conflit :

1. Ouvrir le fichier.
2. Choisir le bon code à garder.
3. Supprimer les lignes `<<<<<<<`, `=======`, `>>>>>>>`.
4. Sauvegarder le fichier.
5. Ajouter le fichier corrigé.
6. Continuer le merge.

Commandes :

```bash
git status
git add fichier-corrige
git commit
```

Si tu n'es pas sûr du code à garder, demander à la personne concernée.

---

## Annuler Une Erreur Simple

### J'ai modifié un fichier mais je veux annuler

Attention : cette commande supprime tes modifications locales sur ce fichier.

```bash
git restore README.md
```

Annuler toutes les modifications locales non commit :

```bash
git restore .
```

### J'ai fait `git add` trop vite

Retirer un fichier de la zone de commit sans supprimer les modifications :

```bash
git restore --staged README.md
```

Retirer tous les fichiers de la zone de commit :

```bash
git restore --staged .
```

### J'ai oublié un fichier dans le dernier commit

```bash
git add fichier-oublie
git commit --amend --no-edit
```

### Je veux changer le message du dernier commit

```bash
git commit --amend -m "feat: nouveau message clair"
```

À utiliser seulement si le commit n'a pas encore été partagé, ou si l'équipe est
d'accord.

---

## Nettoyer Les Branches Terminées

Après un merge, supprimer la branche locale :

```bash
git branch -d feature/auth-system
```

Supprimer aussi la branche sur GitHub :

```bash
git push origin --delete feature/auth-system
```

Voir toutes les branches locales :

```bash
git branch
```

Voir les branches locales et distantes :

```bash
git branch -a
```

---

## Commandes Dangereuses

Ne pas utiliser sans comprendre ou sans demander.

| Commande | Risque |
| --- | --- |
| `git reset --hard` | Supprime des modifications locales |
| `git push --force` | Peut écraser le travail des autres |
| `git rebase` | Peut rendre l'historique confus si mal utilisé |
| `git clean -fd` | Supprime des fichiers non suivis |

Règle :

```text
Si tu n'es pas sûr, ne lance pas la commande.
Demande avant.
```

---

## Exemples Complets

### Exemple 1 : Jennifer travaille sur l'authentification

Créer la branche :

```bash
git switch dev
git pull origin dev
git switch -c feature/auth-system
```

Après avoir codé :

```bash
git status
git add .
git commit -m "feat: add register route"
git push -u origin feature/auth-system
```

Avant de merger :

```bash
git switch dev
git pull origin dev
git switch feature/auth-system
git merge dev
```

Merger dans `dev` :

```bash
git switch dev
git merge feature/auth-system
git push origin dev
```

---

### Exemple 2 : Martin travaille sur le gameplay

Créer la branche :

```bash
git switch dev
git pull origin dev
git switch -c feature/game-core
```

Après avoir codé :

```bash
git status
git add .
git commit -m "feat: create base labyrinth movement"
git push -u origin feature/game-core
```

---

### Exemple 3 : corriger un bug

Créer une branche de fix :

```bash
git switch dev
git pull origin dev
git switch -c fix/avatar-upload
```

Après correction :

```bash
git add .
git commit -m "fix: validate avatar upload"
git push -u origin fix/avatar-upload
```

---

## Rappel Final

Le but n'est pas d'utiliser des commandes compliquées.

Le but est d'avoir :

- un historique clair ;
- des branches lisibles ;
- moins de conflits ;
- du code stable sur `main` ;
- une équipe qui comprend ce qui est mergé.
