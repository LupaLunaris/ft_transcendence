# Audit final — Actions à réaliser avant l'évaluation

> Priorités établies à partir du sujet officiel `ft_transcendence v21.0`.

## Légende

- 🔴 **MANDATORY** : exigence obligatoire du sujet ou point critique pour pouvoir présenter le projet.
- 🟠 **MODULE** : nécessaire pour valider un module revendiqué.
- 🟡 **QUALITÉ** : nettoyage ou amélioration importante, mais à faire après les exigences critiques.

---

# Jérémie

## 🔴 Démarrage Docker / infrastructure

Le projet doit pouvoir être lancé avec une seule commande après la préparation normale de l'environnement.

### À faire

- [ ] Corriger le démarrage actuel pour qu'une seule commande lance réellement tout le projet
- [ ] La commande doit démarrer :
  - frontend
  - backend
  - PostgreSQL
  - HTTPS / proxy
  - WAF / Vault si nécessaires au fonctionnement revendiqué
- [ ] Supprimer les étapes manuelles actuellement nécessaires
- [ ] Tester le démarrage depuis un clone propre
- [ ] Vérifier que les migrations / initialisations nécessaires sont automatisées ou intégrées au démarrage
- [ ] Vérifier que les instructions de lancement du README correspondent exactement au fonctionnement réel

---

## 🔴 Secrets / `.env` / `.env.example`

### À faire

- [ ] Vérifier que `.env` est ignoré par Git
- [ ] Vérifier que `.env.example` ne contient aucun vrai secret
- [ ] Remplacer les vraies valeurs par des placeholders
- [ ] Changer tous les secrets qui ont déjà été exposés dans GitHub / l'historique Git
- [ ] Vérifier qu'aucun ancien secret exposé n'est encore utilisé
- [ ] Vérifier qu'aucun secret actif n'est présent dans le repository

---

## 🟠 Vault

Si le module WAF + Vault est revendiqué :

- [ ] Vérifier que Vault fonctionne réellement
- [ ] Vérifier que les secrets sont réellement stockés/gérés via Vault
- [ ] Vérifier que l'application récupère correctement les secrets nécessaires
- [ ] Vérifier qu'ils ne sont pas simplement recopiés en clair ailleurs
- [ ] Vérifier que Vault redémarre correctement avec le projet

Si Vault n'est pas réellement fonctionnel, ne pas revendiquer ce Major.

---

## 🟠 WAF / ModSecurity

### À faire

- [ ] Corriger les erreurs de configuration
- [ ] Vérifier que ModSecurity démarre correctement
- [ ] Vérifier que les requêtes normales ne sont pas bloquées
- [ ] Tester :
  - register
  - login
  - users
  - maps
  - avatars
  - gameplay/API
- [ ] Vérifier qu'une requête clairement malveillante est bloquée
- [ ] Corriger les faux positifs qui cassent l'application

---

## 🔴 Routes API backend

### À faire

Vérifier que les routes réellement exposées par le backend correspondent aux appels frontend actuels :

- [ ] Auth
- [ ] Users
- [ ] Profiles
- [ ] Friends
- [ ] Avatars
- [ ] Maps
- [ ] Scores
- [ ] Tower / progression
- [ ] Admin
- [ ] Autres routes utilisées par le frontend

Vérifier également :

- [ ] Toutes les routes fonctionnent en HTTPS
- [ ] Aucun ancien endpoint cassé n'est encore utilisé
- [ ] Les codes HTTP retournés restent cohérents

Si tout fonctionne après test, il n'y a rien à modifier juste parce que les routes ont changé.

---

## 🔴 Base de données / Prisma

### À faire

- [ ] Vérifier que les migrations fonctionnent depuis une base vide
- [ ] Vérifier qu'un clone propre peut créer correctement la DB
- [ ] Vérifier que le schema Prisma correspond à la DB utilisée réellement
- [ ] Vérifier les relations importantes :
  - User ↔ Maps
  - User ↔ Friends
  - User ↔ Scores
  - User ↔ Progression
  - User ↔ Achievements
  - User ↔ Notifications si le module est conservé
- [ ] Vérifier les suppressions liées
- [ ] Vérifier qu'il n'y a pas d'enregistrements orphelins évidents
- [ ] Vérifier le comportement lors d'actions simultanées

ORM Prisma : déjà validé, pas de développement supplémentaire nécessaire.

---

## 🔴 Sécurité backend / triche

Le projet fonctionne, mais certaines actions semblent encore pouvoir être manipulées directement via les routes.

### À faire

- [ ] Impossible de s'ajouter arbitrairement de l'XP
- [ ] Impossible de falsifier arbitrairement un score
- [ ] Impossible de débloquer arbitrairement des niveaux Tower
- [ ] Impossible de publier la map d'un autre utilisateur
- [ ] Impossible de modifier la map d'un autre utilisateur
- [ ] Impossible de supprimer la map d'un autre utilisateur
- [ ] Les routes admin vérifient réellement le rôle admin
- [ ] Les routes privées utilisent l'identité authentifiée côté serveur
- [ ] Ne pas faire confiance à un simple `userId` envoyé par le frontend
- [ ] Les rooms WebSocket vérifient les permissions nécessaires

Ce point n'est pas forcément un rejet automatique du projet, mais il est risqué et montre une logique serveur insuffisamment protégée.

---

## 🟠 User Management — partie backend

### À vérifier côté backend

- [ ] Modification du profil persistante après docker-down
- [ ] Upload avatar fonctionnel
- [ ] Avatar par défaut
- [ ] Avatar persistant après recréation des conteneurs
- [ ] Avatars accessibles correctement en HTTPS
- [ ] Suppression d'ami complète
- [ ] Plusieurs onglets d'un même utilisateur ne provoquent pas de faux statut offline

---

## 🔴 README — partie Jérémie

- [ ] Terminer ses sections
- [ ] Vérifier les instructions d'installation
- [ ] Vérifier les instructions `.env`
- [ ] Documenter correctement backend / DB / infrastructure

---

# Martin

## 🔴 Support multi-utilisateur / concurrence

Le projet doit supporter plusieurs utilisateurs simultanément sans conflit ni corruption de données.

### Tests à faire 

#### Maps

- [ ] Joueur A joue actuellement sur une map
- [ ] Le créateur B essaie de supprimer cette map
- [ ] Vérifier le comportement obtenu
- [ ] Décider du comportement attendu :
  - suppression refusée pendant une partie
  - suppression différée
  - ou partie conservant une version stable de la map
- [ ] Vérifier qu'une suppression ne casse pas la partie en cours

- [ ] Joueur A joue sur une map
- [ ] Le créateur B modifie la map
- [ ] Vérifier que la partie de A ne devient pas incohérente

#### Rooms

- [ ] Deux joueurs rejoignent la même room presque simultanément
- [ ] Deux parties différentes sont lancées en même temps
- [ ] Les événements de la partie A n'arrivent jamais dans la partie B
- [ ] Une room terminée est correctement nettoyée
- [ ] Un utilisateur non autorisé ne peut pas rejoindre une room

#### Connexions

- [ ] Un joueur ferme brutalement l'onglet
- [ ] Un joueur perd sa connexion
- [ ] Un joueur se reconnecte
- [ ] Un joueur ouvre plusieurs onglets
- [ ] Le statut joueur reste cohérent

#### Données

- [ ] Deux utilisateurs créent/modifient des données simultanément
- [ ] Aucun score n'est attribué au mauvais utilisateur
- [ ] Aucun état de partie n'est mélangé entre utilisateurs
- [ ] Pas de corruption évidente de données

---

## 🟠 Remote Players

Normalement fonctionnel.

### Validation finale

- [ ] Tester sur deux ordinateurs réellement séparés

---

## 🟠 Game Customization — PAS TERMINÉ

Responsables : Martin + Jennifer.

### À terminer

- [ ] Plusieurs maps réellement utilisables dans la customisation
- [ ] Ajouter le thème différent prévu
- [ ] Vérifier que le thème est réellement visible pendant le jeu
- [ ] Garder une configuration par défaut
- [ ] Vérifier que la customisation sélectionnée est réellement utilisée pendant la partie

Pas besoin d'ajouter énormément d'options : différentes maps + thème + option par défaut suffisent pour une version simple et défendable.

---

# Élise

## 🔴 Privacy Policy / Terms of Service

Responsable : Élise.

Ces pages sont Mandatory et peuvent entraîner le rejet si elles sont inadéquates.

### À faire

- [ ] Corriger la Privacy Policy
- [ ] Corriger les Terms of Service
- [ ] Vérifier qu'elles sont facilement accessibles depuis l'application
- [ ] Retirer les informations qui ne correspondent pas au projet réel
- [ ] Ne pas parler d'une suppression du projet à la fin du cursus
- [ ] Retirer les affirmations inadaptées à un projet exécuté localement
- [ ] Vérifier qu'elles ne contiennent pas de placeholder
- [ ] Vérifier que leur contenu correspond aux fonctionnalités actuelles

---

## 🟠 Notifications — A ESSAYER DE FAIRE PASSER

Responsable : Élise.

Le système actuel contient seulement des toasts mais selon le dictionnaire Larousse : Action de notifier, de faire connaître expressément quelque chose à quelqu'un ; 
Donc techniquement des toasts ca se défend de mon point de vue.

---

## 🟠 Multiple Languages

Presque terminé.

À faire uniquement après que les autres aient fini de modifier les interfaces.

### Vérification finale

- [ ] Rechercher les textes encore écrits en dur
- [ ] Traduire les nouveaux textes ajoutés
- [ ] Vérifier les messages d'erreur
- [ ] Vérifier les placeholders
- [ ] Vérifier les textes du gameplay
- [ ] Vérifier les dates / formats locaux
- [ ] Tester le changement de langue

---

## 🟠 Additional Browsers

Normalement bon.

### Après les merges finaux

- [ ] Smoke test Firefox
- [ ] Smoke test du deuxième navigateur revendiqué
- [ ] Vérifier les principales fonctionnalités
- [ ] Documenter une éventuelle limitation restante

---

## 🔴 README — partie Élise

- [ ] Terminer ses sections
- [ ] Vérifier ses contributions
- [ ] Vérifier les fonctionnalités dont elle est responsable
- [ ] Vérifier les modules revendiqués dont elle est responsable
- [ ] Adapter la partie Notifications selon la décision finale

---

# Jennifer

## 🟠 Game Customization

Responsables : Jennifer + Martin.

### À terminer / valider

- [ ] Intégration frontend des différentes maps
- [ ] Intégration du thème ajouté par Martin
- [ ] Vérifier le thème par défaut
- [ ] Vérifier le choix utilisateur
- [ ] Vérifier que la customisation sélectionnée est réellement appliquée dans le jeu

---

## 🔴 Vérification finale Chrome / console

Cette validation ne peut pas être finalisée tant que les autres membres continuent à modifier le projet.

### Important

**Jennifer ne peut commencer la validation finale complète qu'après la fin des développements et le merge des branches destinées à l'évaluation.**

Prévoir **minimum 2 jours complets après le feature freeze**.

### Pendant ces 2 jours

- [ ] Clone propre
- [ ] Démarrage complet du projet
- [ ] Vérification Chrome
- [ ] Vérifier la console navigateur
- [ ] Aucun warning React
- [ ] Aucune erreur JavaScript
- [ ] Aucune erreur réseau inattendue
- [ ] Aucune erreur WebSocket non gérée
- [ ] Vérifier le Network tab
- [ ] Register
- [ ] Login
- [ ] Logout
- [ ] Profile
- [ ] Avatars
- [ ] Friends
- [ ] Online status
- [ ] Maps
- [ ] Editor
- [ ] Tower
- [ ] Solo
- [ ] Multiplayer
- [ ] Remote players
- [ ] Multiplayer 3+
- [ ] Game customization
- [ ] Gamification
- [ ] Languages
- [ ] Notifications si le module est conservé
- [ ] Admin
- [ ] WAF / Vault sans casser les fonctionnalités normales
- [ ] Parcours utilisateur complet

### Blocage actuel

- [ ] Impossible de terminer cette validation tant que les modifications des autres ne sont pas terminées
- [ ] Les 2 jours de validation doivent être comptés APRÈS la fin de développement

---

## 🔴 README — intégration finale

Les parties Jennifer et Martin sont déjà terminées.

### À faire après réception des autres parties

- [ ] Ajouter / relire les sections de Jérémie
- [ ] Ajouter / relire les sections d'Élise
- [ ] Retirer les modules finalement abandonnés
- [ ] Recalculer les points
- [ ] Vérifier que la liste des fonctionnalités correspond exactement au projet final
- [ ] Vérifier que les responsabilités correspondent réellement aux contributions
- [ ] Vérifier que les limitations sont honnêtes
- [ ] Dernière relecture anglaise

---

# Tout le monde

## 🟡 Clean du code

À faire après les corrections fonctionnelles et avant l'évaluation finale.

Chaque membre nettoie principalement les fichiers dont il est responsable.

### À faire

- [ ] Supprimer le code mort réellement inutilisé
- [ ] Supprimer les imports inutilisés
- [ ] Supprimer les variables inutilisées
- [ ] Supprimer les fichiers inutiles confirmés
- [ ] Retirer les commentaires temporaires
- [ ] Retirer les commentaires inutiles
- [ ] Retirer les commentaires en français
- [ ] Retirer les commentaires de debug
- [ ] Retirer les `console.log` de debug
- [ ] Retirer les headers 42
- [ ] Vérifier l'indentation tab et pas d'espaces
- [ ] Vérifier la cohérence générale du code

### Attention

- [ ] Ne pas supprimer du code sans vérifier son utilisation
- [ ] Ne pas faire de gros refactor architectural juste avant l'évaluation
- [ ] Ne pas casser une fonctionnalité fonctionnelle uniquement pour rendre le code "plus propre"

---

# Préparation de l'évaluation

À faire seulement lorsque le projet est gelé et que les vérifications finales sont terminées.

## Toute l'équipe

- [ ] Chacun sait lancer le projet
- [ ] Chacun comprend l'architecture globale
- [ ] Chacun connaît les modules revendiqués
- [ ] Chacun connaît ses fichiers principaux
- [ ] Chacun sait expliquer ses contributions
- [ ] Chacun sait expliquer frontend → backend → DB
- [ ] Chacun sait expliquer HTTP / API / WebSockets
- [ ] Chacun sait expliquer l'authentification
- [ ] Chacun sait expliquer les principaux modèles Prisma
- [ ] Chacun sait expliquer les modules dont il est responsable
- [ ] Chacun peut modifier quelques lignes dans sa partie sans aide
- [ ] Pouvoir expliquer n'importe quelle ligne de code au hasard
- [ ] Connaitre un minimum les autres parties et comment les parties communiquent entre elles.

---

# Ordre réel avant de demander une correction

## 1. Jérémie termine

- Démarrage une commande
- Secrets / `.env`
- Rotation des secrets exposés
- Vault / WAF si revendiqués
- Routes backend
- Base de données
- Sécurité backend
- User Management backend
- README

## 2. Martin termine

- Tests multi-utilisateurs
- Broadcasting / rooms
- Remote / reconnexion
- Multiplayer 3+
- Game customization
- Validation gameplay

## 3. Élise termine

- Privacy Policy
- Terms of Service
- Responsive formulaires
- Décision Notifications
- Traductions finales
- README

## 4. Feature freeze

Plus aucune nouvelle fonctionnalité.

Uniquement correction de bugs bloquants.

## 5. Jennifer — minimum 2 jours

- Tests finaux
- Chrome
- Console
- Régressions
- Intégration
- README
- Validation modules
- Clean final

## 6. Évaluation blanche

Seulement après tout cela.

---

# Condition minimale avant correction

Le projet ne devrait pas partir en correction sans que :

- [ ] Le projet se lance correctement
- [ ] Les secrets exposés ont été changés
- [ ] Privacy Policy / Terms sont conformes
- [ ] Le multi-utilisateur a été réellement testé
- [ ] Les modules revendiqués ont été démontrés
- [ ] Les modules non terminés ont été retirés
- [ ] Les routes backend sont stables
- [ ] Le README est terminé
- [ ] La console Chrome est propre
- [ ] Les tests finaux ont été faits
- [ ] Chaque membre se sente prêt pour les questions et petites modifications de code