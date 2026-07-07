# 🗺️ Roadmap de fin de projet

## 📑 Table des matières

- [🎯 Objectif](#objectif)
- [📅 Planning](#planning)
- [📋 Charge de travail estimée](#charge-de-travail-estimée)
- [🎯 Priorités](#priorités)
- [✅ Requirements obligatoires](#requirements-obligatoires)
  - [Git & Organisation](#git--organisation)
  - [README](#readme)
- [🧪 Modules sélectionnés](#modules-sélectionnés)
  - [Total des points](#total-des-points)
- [📚 Résumé des modules et critères de validation](#-résumé-des-modules-et-critères-de-validation)
- [✅ Checklist avant de demander une correction](#-checklist-avant-de-demander-une-correction)

---

## 🎯 Objectif

L'objectif est de terminer un projet stable, propre et que toute l'équipe est capable d'expliquer avant de demander une correction.

---

## 📅 Planning

| Période | Objectif |
|----------|----------|
| 07/07 → 17/07 | Développement des fonctionnalités et modules |
| 18/07 → 30/07 | Finalisation des modules restants, README et requirements |
| 31/07 | Feature Freeze (plus aucune nouvelle fonctionnalité) - Réunion ?|
| 01/08 → 07/08 | Refactoring, nettoyage du code et de la documentation |
| 03/08 → 10/08 | Campagne complète de tests |
| 03/08 → 14/08 | Apprentissage du code |
| 07/08 → 14/08 | Simulations de correction |
| À partir du 15/08 | Demandes de correction |

---

## 📋 Charge de travail estimée

> **Remarque :** Estimation du travail restant à partir du 07/07/2026.  
> Les heures incluent le développement, les revues de code, le refactoring, les tests, la documentation et la préparation de la correction.

| Personne | Développement | Revues / Intégration | Refactoring | Tests | Documentation | Apprentissage du projet | Préparation correction | Total estimé |
|-----------|--------------:|---------------------:|------------:|------:|--------------:|------------------------:|----------------------:|-------------:|
| Jennifer | 30 h | 20 h | 15 h | 15 h | 15 h | 60 h | 25 h | **180 h** |
| Jerem | 40 h | 10 h | 10 h | 10 h | 10 h | 35 h | 15 h | **130 h** |
| Martin | 40 h | 10 h | 10 h | 10 h | 10 h | 35 h | 15 h | **130 h** |
| Élise | 40 h | 10 h | 10 h | 10 h | 10 h | 35 h | 15 h | **130 h** |

### Remarques

- Le rôle de **Tech Lead** implique une charge de travail supplémentaire liée à la compréhension de l'ensemble du projet et du code, à la validation technique, aux revues de code, à l'intégration des différentes parties et à la préparation de l'équipe à la correction.
- L'objectif est que **chaque membre soit capable d'expliquer le fonctionnement global du projet**, tout en maîtrisant en détail les parties qu'il a développées et qui lui sont attribuées.

---

## 🎯 Priorités

1. Finir les requirements obligatoires.
2. Finir tous les modules.
3. Plus aucune nouvelle fonctionnalité.
4. Nettoyer le projet.
5. Tester tout le projet.
6. Apprendre le code de toute l'équipe.
7. Demander une correction.

---

## ✅ Requirements obligatoires

⬜ Non commencé
🟡 En cours
✅ Terminé

| Requirement | Responsable | Support | Vérification | Deadline | État | Commentaires |
|-------------|-------------|---------|--------------|----------|:---:|--------------|
| Frontend React fonctionnel | Jennifer | Élise | Martin | 20/07 | ✅ | Architecture claire, routing, composants. |
| Frontend responsive | Élise | Jennifer | Martin | 25/07 | 🟡 | Desktop, tablette et mobile. |
| Frontend accessible | Élise | Jennifer | Martin | 25/07 | ⬜ | Navigation clavier, labels, contraste... |
| Backend Express fonctionnel | Jerem | Jennifer | Martin | 20/07 | ✅ | |
| Base de données avec schéma cohérent | Martin + Jennifer | Jerem | Élise | 20/07 | 🟡 | A revoir pendant leaderboard |
| ORM (Prisma) correctement configuré | Jennifer + Martin | Jerem | Élise | 20/07 | 🟡 | |
| Authentification sécurisée (JWT + bcrypt) | Jerem | Élise | Jennifer | 20/07 | ✅ | |
| Validation des formulaires (Frontend) | Jennifer | Élise | Martin | 20/07 | 🟡 | |
| Validation des formulaires (Backend) | Martin | Jerem | Élise | 20/07 | 🟡 | |
| HTTPS fonctionnel | Jerem | Jennifer | Martin | 20/07 | ✅ | |
| Docker : lancement avec une seule commande | Jerem | Martin | Jennifer | 20/07 | 🟡 | |
| Compatible Google Chrome | Élise | Jennifer | Martin | 25/07 | 🟡 | |
| Console navigateur sans erreur | Jennifer | Martin | Élise | 30/07 | ⬜ | |
| Plusieurs utilisateurs connectés simultanément | Martin | Jerem | Jennifer | 25/07 | 🟡 | |
| Gestion correcte des actions simultanées | Martin | Jerem | Jennifer | 25/07 | 🟡 | |
| Synchronisation temps réel correcte | Martin | Jerem | Jennifer | 25/07 | 🟡 | |
| Aucune corruption de données | Jerem | Jennifer | Élise | 25/07 | 🟡 | Fini, a vérifier |
| Fichier `.env` ignoré par Git | Jerem | Jennifer | Martin | 20/07 | ✅ | |
| Fichier `.env.example` complet | Jerem | Jennifer | Martin | 20/07 | ✅ | |
| Privacy Policy accessible et complète | Élise | Martin | Jennifer | 20/07 | ✅ | IA |
| Terms of Service accessibles et complètes | Élise | Martin | Jennifer | 20/07 | ✅ | IA |

### Git & Organisation

| Requirement | Responsable | Support | Vérification | Deadline | État | Commentaires |
|-------------|-------------|---------|--------------|----------|:---:|--------------|
| Historique Git propre | Jennifer | Jerem | Martin | 30/07 | ⬜ | Pas de commits inutiles. |
| Commits clairs et explicites | Toute l'équipe | — | Jennifer | 30/07 | ⬜ | |
| Répartition du travail visible dans Git | Jennifer | Jerem | Toute l'équipe | 30/07 | ⬜ | Vérifier les contributions de chacun. |
| Toutes les grosses modifications passent par PR | Jennifer | Toute l'équipe | Toute l'équipe | 30/07 | ⬜ | |
| Relecture des PR importantes | Jennifer | Toute l'équipe | Toute l'équipe | 30/07 | ⬜ | |

### README

| Requirement | Responsable | Support | Vérification | Deadline | État | Commentaires |
|-------------|-------------|---------|--------------|----------|:---:|--------------|
| README entièrement en anglais | Jennifer | Toute l'équipe | Toute l'équipe | 07/08 | ⬜ | |
| Description du projet | Martin | Jennifer | Toute l'équipe | 07/08 | ⬜ | |
| Instructions d'installation | Jerem | Jennifer | Martin | 07/08 | ⬜ | |
| Ressources utilisées | Jennifer | Toute l'équipe | Toute l'équipe | 07/08 | ⬜ | |
| Utilisation de l'IA documentée | Jennifer | Toute l'équipe | Toute l'équipe | 07/08 | ⬜ | |
| Présentation de l'équipe | Jennifer | Toute l'équipe | Toute l'équipe | 07/08 | ⬜ | |
| Répartition des rôles | Jennifer | Jerem | Toute l'équipe | 07/08 | ⬜ | |
| Responsabilités de chaque rôle | Jennifer | Jerem | Toute l'équipe | 07/08 | ⬜ | |
| Organisation du projet | Jerem | Jennifer | Toute l'équipe | 07/08 | ⬜ | |
| Outils de gestion utilisés | Jerem | Jennifer | Toute l'équipe | 07/08 | ⬜ | |
| Moyens de communication utilisés | Jerem | Jennifer | Toute l'équipe | 07/08 | ⬜ | |
| Stack technique complète | Jennifer | Jerem | Toute l'équipe | 07/08 | ⬜ | |
| Justification des choix techniques | Jennifer | Jerem | Toute l'équipe | 07/08 | ⬜ | |
| Schéma de la base de données | Jerem | Jennifer | Martin | 07/08 | ⬜ | |
| Liste complète des fonctionnalités | Martin | Jennifer | Toute l'équipe | 07/08 | ⬜ | |
| Fonctionnalités attribuées à chaque membre | Jennifer | Toute l'équipe | Toute l'équipe | 07/08 | ⬜ | |
| Liste des modules réalisés | Jennifer | Toute l'équipe | Toute l'équipe | 07/08 | ⬜ | |
| Calcul des points des modules | Jennifer | Jerem | Toute l'équipe | 07/08 | ⬜ | |
| Justification des modules choisis | Jennifer | Martin | Toute l'équipe | 07/08 | ⬜ | |
| Description de l'implémentation des modules | Jennifer | Toute l'équipe | Toute l'équipe | 07/08 | ⬜ | |
| Répartition des modules par membre | Jennifer | Toute l'équipe | Toute l'équipe | 07/08 | ⬜ | |
| Contributions individuelles détaillées | Toute l'équipe | Jennifer | Toute l'équipe | 07/08 | ⬜ | |
| Difficultés rencontrées et solutions | Toute l'équipe | Jennifer | Toute l'équipe | 07/08 | ⬜ | |
| Limitations connues du projet | Jennifer | Toute l'équipe | Toute l'équipe | 07/08 | ⬜ | |

---

## 🧪 Modules sélectionnés

> Objectif minimum : **14 points**.
> Tous les modules revendiqués devront être entièrement fonctionnels, démontrables et documentés.


⬜ Non commencé
🟡 En cours
✅ Terminé


## Modules principaux (Major)

| Module | Type | Points | Responsable | Support | Vérification | Deadline | État | Commentaires |
|--------|------|-------:|-------------|---------|--------------|----------|:---:|--------------|
| Framework Frontend + Backend | Major | 2 | Jennifer + Jerem | Jennifer + Jerem | Martin | 20/07 | ✅ | React + Express. |
| Real-time Features (WebSockets) | Major | 2 | Martin | Jerem | Jennifer | 25/07 | 🟡 | Synchronisation temps réel. |
| Standard User Management | Major | 2 | Jennifer + Jerem | Jennifer + Jerem | Élise | 25/07 | 🟡 | Upload avatar et mettre un par défault, statut en ligne doit être visible pour les amis, vérifier suppression amis |
| Complete Web-based Game | Major | 2 | Martin | Jennifer | Jerem | 25/07 | ✅ | Gameplay complet. |
| Remote Players | Major | 2 | Martin | Jerem | Élise | 25/07 | 🟡 | Deux joueurs sur deux machines. |
| Multiplayer Game (3+ joueurs) | Major | 2 | Martin | Jerem | Jennifer | 30/07 | 🟡 | Plus de deux joueurs simultanément. |
| Cybersecurity (WAF + ModSecurity + HashiCorp Vault) | Major | 2 | Jerem | Jennifer | Élise | 30/07 | 🟡 | WAF + gestion sécurisée des secrets. |

---

## Modules mineurs (Minor)

| Module | Type | Points | Responsable | Support | Vérification | Deadline | État | Commentaires |
|--------|------|-------:|-------------|---------|--------------|----------|:---:|--------------|
| ORM (Prisma) | Minor | 1 | Jennifer + Martin | Jennifer + Martin | Jerem | 20/07 | 🟡 | |
| Custom-made Design System | Minor | 1 | Élise | Jennifer | Martin | 25/07 | 🟡 | Palette, composants réutilisables... |
| Multiple Languages | Minor | 1 | Élise | Jerem | Jennifer | 25/07 | ✅ | Français, Anglais, Néerlandais. |
| Game Customization Options | Minor | 1 | Jennifer | Jennifer | Élise | 25/07 | 🟡 | Personnalisation des parties/maps. |
| Gamification System | Minor | 1 | Jennifer | Martin | Jerem | 30/07 | 🟡 | Leaderboards, XP, badges... |
| Complete Notification System | Minor | 1 | Élise | Jennifer | Jerem | 30/07 | ✅ | Notifications de création, modification et suppression. |
| Support Additional Browsers | Minor | 1 | Élise | Jennifer | Martin | 30/07 | 🟡 | Firefox + Edge (ou Safari). |

---

## Modules bonus potentiels

> Ces modules ne seront développés que si tous les requirements obligatoires, les modules sélectionnés et la phase de stabilisation sont terminés.

| Module | Type | Points | Responsable | Difficulté | Intérêt | Décision |
|--------|------|-------:|-------------|------------|----------|----------|
| Game Statistics / Match History | Minor | 1 | Jennifer | ⭐⭐⭐☆☆ | ⭐⭐⭐⭐☆ | À développer si les données de parties sont déjà correctement persistées. |
| Health Check / Status Page | Minor | 1 | Jerem | ⭐⭐☆☆☆ | ⭐⭐⭐☆☆ | À développer si le backend et Docker sont déjà stables. |
| Module personnalisé (Labyrinth Builder / Éditeur de maps) | Major | 2 | Jennifer + Martin | ⭐⭐⭐⭐☆ | ⭐⭐☆☆☆ | À ne revendiquer que si tout le reste est terminé et que la justification dans le README est suffisamment solide. |

---

## Total des points

| Catégorie | Points |
|-----------|-------:|
| Modules Major | **14** |
| Modules Minor | **7** |
| **Total actuel** | **21 points** |
| Bonus potentiels | **+3** |

> L'objectif reste de sécuriser les **21 points** avant d'envisager un module supplémentaire.

> **Rappel :** Le total minimum demandé est de **14 points**.  
> **Attention :** seuls les modules complets, démontrables et correctement documentés seront comptés.


---

# 📚 Résumé des modules et critères de validation

Ce document résume les attentes de chaque module afin que toute l'équipe sache précisément :

- ce que demande le sujet ;
- ce que les évaluateurs vérifieront ;
- ce que cela implique dans notre projet ;
- les points auxquels il faudra être capable de répondre pendant la correction.

---

# 🎨 Framework Frontend + Backend (Major - 2 pts)

## Ce que demande le sujet

Le projet doit utiliser un framework pour le frontend et un framework pour le backend.

Dans notre cas :

- React
- Express

## Ce que les évaluateurs vérifieront

- Architecture claire.
- Séparation frontend/backend.
- Routing.
- Communication API.
- Code organisé et maintenable.

## Ce que cela implique dans notre projet

- React doit gérer toute l'interface.
- Express doit gérer toute la logique serveur.
- Aucun mélange entre frontend et backend.
- Les appels API doivent être cohérents.

## Points d'attention

Toute l'équipe doit être capable d'expliquer :

- comment React communique avec Express ;
- comment une requête traverse toute l'application.

---

# ⚡ Real-time Features (WebSockets) (Major - 2 pts)

## Ce que demande le sujet

Le projet doit utiliser une technologie temps réel.

Dans notre cas :

- WebSockets.

## Ce que les évaluateurs vérifieront

- Synchronisation immédiate.
- Gestion des connexions.
- Gestion des déconnexions.
- Pas de désynchronisation.
- Pas de fuite mémoire.

## Ce que cela implique dans notre projet

Les WebSockets doivent être utilisés pour :

- les parties multijoueurs ;
- les mises à jour en temps réel ;
- les changements d'état de partie.

Les joueurs ne doivent jamais devoir rafraîchir la page.

## Points d'attention

Être capable d'expliquer :

- les rooms ;
- le cycle de vie d'une connexion ;
- le nettoyage lors d'une déconnexion.

---

# 👤 Standard User Management (Major - 2 pts)

## Ce que demande le sujet

Gestion complète des utilisateurs.

## Les évaluateurs vérifieront

- inscription ;
- connexion ;
- déconnexion ;
- modification du profil ;
- avatar ;
- gestion des amis ;
- statut de connexion.

## Ce que cela implique dans notre projet

Le joueur doit pouvoir :

- créer un compte ;
- modifier son profil ;
- changer son avatar ;
- ajouter ou supprimer des amis ;
- voir leur statut.

## Points d'attention

Toutes les données doivent être persistées en base de données.

---

# 🎮 Complete Web-based Game (Major - 2 pts)

## Ce que demande le sujet

Un véritable jeu jouable dans le navigateur.

## Les évaluateurs vérifieront

- règles du jeu ;
- conditions de victoire ;
- conditions de défaite ;
- fluidité du gameplay.

## Ce que cela implique dans notre projet

Notre jeu doit permettre :

- de charger une map ;
- de déplacer son personnage ;
- d'atteindre la sortie ;
- de perdre si les règles ne sont pas respectées.

Le jeu doit être entièrement jouable.

---

# 🌍 Remote Players (Major - 2 pts)

## Ce que demande le sujet

Deux joueurs doivent pouvoir jouer ensemble à distance.

## Les évaluateurs vérifieront

- synchronisation ;
- communication ;
- état identique sur les deux clients.

## Ce que cela implique dans notre projet

Deux joueurs doivent :

- rejoindre une partie ;
- voir les mêmes informations ;
- terminer une partie ensemble.

---

# 👥 Multiplayer Game (3+ joueurs) (Major - 2 pts)

## Ce que demande le sujet

Support de plus de deux joueurs simultanément.

## Les évaluateurs vérifieront

- minimum trois joueurs ;
- gameplay équitable ;
- synchronisation correcte.

## Ce que cela implique dans notre projet

Le serveur doit pouvoir gérer plusieurs joueurs simultanément.

Les informations doivent rester cohérentes pour tous.

---

# 🔒 Cybersecurity : WAF + ModSecurity + HashiCorp Vault (Major - 2 pts)

## Ce que demande le sujet

Mettre en place :

- ModSecurity ;
- un WAF configuré correctement ;
- HashiCorp Vault pour gérer les secrets.

## Les évaluateurs vérifieront

- protection des requêtes ;
- règles WAF ;
- secrets non présents dans le code ;
- utilisation de Vault.

## Ce que cela implique dans notre projet

Les secrets doivent être stockés de manière sécurisée.

Le backend doit être protégé contre certaines attaques courantes.

---

# 🗄 ORM (Minor - 1 pt)

## Ce que demande le sujet

Utiliser un ORM.

## Les évaluateurs vérifieront

- Prisma ;
- schéma cohérent ;
- relations propres.

## Ce que cela implique

Toutes les données doivent passer par Prisma.

Aucune requête SQL "bricolée".

---

# 🎨 Custom-made Design System (Minor - 1 pt)

## Ce que demande le sujet

Créer un véritable Design System.

## Les évaluateurs vérifieront

- palette de couleurs ;
- typographie ;
- composants réutilisables ;
- cohérence graphique.

## Ce que cela implique

Les composants (Button, Input, Modal, Card...) doivent être réutilisés partout dans le projet.

---

# 🌐 Multiple Languages (Minor - 1 pt)

## Ce que demande le sujet

Support de plusieurs langues.

## Les évaluateurs vérifieront

- changement de langue ;
- traductions complètes.

## Ce que cela implique

Toutes les pages principales doivent être traduites.

Aucune clé i18n ne doit apparaître.

---

# 🛠 Game Customization Options (Minor - 1 pt)

## Ce que demande le sujet

Permettre au joueur de personnaliser son expérience.

## Les évaluateurs vérifieront

Que cette personnalisation modifie réellement le jeu.

## Ce que cela implique

Dans notre projet :

- création de maps ;
- personnalisation des maps ;
- choix des éléments de jeu.

---

# 🏆 Gamification System (Minor - 1 pt)

## Ce que demande le sujet

Implémenter au minimum trois mécaniques de gamification.

Exemples :

- Leaderboards
- Badges
- Achievements
- XP
- Rewards

## Les évaluateurs vérifieront

- persistance ;
- progression ;
- retour visuel.

## Ce que cela implique

Toutes les récompenses doivent être enregistrées en base de données.

Le joueur doit voir sa progression.

---

# 🔔 Complete Notification System (Minor - 1 pt)

## Ce que demande le sujet

Toutes les créations, modifications et suppressions importantes doivent générer une notification.

## Les évaluateurs vérifieront

- création ;
- modification ;
- suppression ;
- persistance ;
- affichage.

## Ce que cela implique

Les utilisateurs doivent être informés des événements importants de l'application.

---

# 🌍 Support Additional Browsers (Minor - 1 pt)

## Ce que demande le sujet

Support complet d'au moins deux navigateurs supplémentaires.

## Les évaluateurs vérifieront

- fonctionnement identique ;
- interface cohérente ;
- bugs corrigés.

## Ce que cela implique

Le projet devra être testé et fonctionnel sur :

- Chrome ;
- Firefox ;
- Edge (ou Safari).

Les éventuelles limitations devront être documentées.

---

## ✅ Checklist avant de demander une correction

| Vérification | Responsable | Deadline | État | Commentaires |
|---------------|-------------|----------|:---:|--------------|
| Tous les requirements obligatoires sont terminés | Jennifer | 12/08 | ⬜ | |
| Tous les modules revendiqués sont terminés et démontrables | Jennifer | 12/08 | ⬜ | |
| Tous les bonus revendiqués sont terminés et démontrables | Jennifer | 12/08 | ⬜ | |
| Toutes les Pull Requests sont mergées | Jennifer | 12/08 | ⬜ | |
| Toutes les branches inutiles sont supprimées | Jennifer | 12/08 | ⬜ | |
| Aucun conflit Git restant | Jennifer | 12/08 | ⬜ | |
| Le projet compile sans erreur | Toute l'équipe | 12/08 | ⬜ | |
| Docker fonctionne sur une machine propre | Jerem | 12/08 | ⬜ | |
| La base de données démarre correctement | Jerem | 12/08 | ⬜ | |
| Aucun warning ou erreur dans la console navigateur | Jennifer | 12/08 | ⬜ | |
| Aucun bug bloquant connu | Toute l'équipe | 12/08 | ⬜ | |
| README terminé et relu | Jennifer | 12/08 | ⬜ | |
| Documentation technique terminée | Jennifer | 12/08 | ⬜ | |
| Démonstration complète testée du début à la fin | Martin | 12/08 | ⬜ | |
| Tous les modules ont été présentés à l'équipe | Toute l'équipe | 12/08 | ⬜ | |
| Chacun maîtrise parfaitement ses propres parties | Toute l'équipe | 12/08 | ⬜ | |
| Chacun comprend l'architecture globale du projet | Toute l'équipe | 12/08 | ⬜ | |
| Chacun connaît les modules réalisés par les autres | Toute l'équipe | 12/08 | ⬜ | |
| Chacun est capable d'expliquer le fonctionnement de la base de données | Toute l'équipe | 12/08 | ⬜ | |
| Chacun est capable d'expliquer les WebSockets | Toute l'équipe | 12/08 | ⬜ | |
| Chacun est capable d'expliquer l'authentification | Toute l'équipe | 12/08 | ⬜ | |
| Chacun est capable d'expliquer les modules revendiqués | Toute l'équipe | 12/08 | ⬜ | |
| Une première simulation de correction a été réalisée | Jennifer | 09/08 | ⬜ | |
| Une seconde simulation de correction a été réalisée | Jennifer | 11/08 | ⬜ | |
| Les questions soulevées lors des simulations ont été corrigées | Toute l'équipe | 12/08 | ⬜ | |
| Chaque membre est capable de modifier rapidement une partie de son code | Toute l'équipe | 12/08 | ⬜ | |
| Chaque membre est capable de modifier une petite partie du code d'un autre membre après explication | Toute l'équipe | 12/08 | ⬜ | |
| Le projet est jugé prêt par toute l'équipe | Toute l'équipe | 12/08 | ⬜ | |
| Demande de correction envoyée | Martin | À partir du 15/08 | ⬜ | |