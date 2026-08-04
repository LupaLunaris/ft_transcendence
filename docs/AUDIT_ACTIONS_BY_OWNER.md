# Audit - Actions à réaliser avant l'évaluation

Ce document regroupe les problèmes détectés lors des audits (Codex + GitHub) et les répartit par responsable.

---

# 🔴 Jérémie

## Docker / Infrastructure

### Démarrage du projet

❌ Problème

Le projet ne démarre pas correctement après un clone. Il faut créer/configurer certaines choses manuellement alors que le projet devrait être simple à lancer.

À faire :

- [ ] Corriger le démarrage en une commande
- [ ] Vérifier le fonctionnement de `make dev`
- [ ] Ajouter les commandes Make manquantes (`make down`, `make logs`)
- [ ] Ajouter un `.dockerignore`
- [ ] Retirer les `container_name`
- [ ] Ajouter les healthchecks

---

### Vault / Secrets

❌ Problème

Des secrets ont été retrouvés dans l'historique Git et la gestion actuelle des secrets doit être sécurisée.

À faire :

- [ ] Rotation des secrets
- [ ] Vérifier qu'aucun secret ne reste accessible

---

### WAF

❌ Problème

La configuration contient des erreurs (directives mal orthographiées) et doit être vérifiée.

À faire :

- [ ] Corriger la configuration
- [ ] Vérifier que le WAF bloque bien les attaques sans faux positifs

---

### Backend

❌ Problèmes

- Upload d'avatar non sécurisé
- Les avatars disparaissent après recréation des conteneurs
- Les avatars ne sont pas accessibles correctement via HTTPS
- Le frontend n'utilise plus les bonnes routes depuis les modifications backend

À faire :

- [ ] Corriger les routes API
- [ ] Sécuriser l'upload
- [ ] Rendre les avatars persistants
- [ ] Vérifier l'intégration frontend

---

### Friends

❌ Problèmes

- Suppression d'amis incomplète
- Statut `online / offline / in_game` incorrect dans certains cas (plusieurs onglets, partie en cours...)

À faire :

- [ ] Corriger la suppression
- [ ] Corriger les statuts utilisateurs
- [ ] Ajouter les tests

---

### Socket.IO

❌ Problèmes

- Des utilisateurs non autorisés peuvent rejoindre certaines rooms
- Les protections côté serveur sont insuffisantes

À faire :

- [ ] Sécuriser les rooms
- [ ] Vérifier les permissions
- [ ] Tester le multijoueur

---

### Progression / Sécurité

❌ Problèmes

Il est actuellement possible de tricher en appelant directement certaines routes (XP, Tower, scores, publication...).

À faire :

- [ ] Sécuriser les scores
- [ ] Sécuriser la progression Tower
- [ ] Sécuriser les XP
- [ ] Sécuriser la publication des maps

---

### Qualité

À faire :

- [ ] Corriger les tests backend
- [ ] Ajouter/configurer ESLint
- [ ] Corriger les vulnérabilités (`npm audit`)
- [ ] Corriger les logs inutiles

---

# 🔴 Martin

### Gameplay

❌ À vérifier

- Le multijoueur
- La reconnexion
- Les parties à plusieurs joueurs
- Le classement
- Les fins de partie
- Les collisions

À faire :

- [ ] Tester à 2 joueurs
- [ ] Tester à 4 joueurs
- [ ] Tester les reconnexions
- [ ] Corriger les problèmes trouvés

---

### Tower / Gameplay

À faire :

- [ ] Vérifier Tower
- [ ] Vérifier la gamification
- [ ] Vérifier les personnalisations réellement utilisées
- [ ] Retirer ce qui n'est pas terminé

---

### Qualité

- [ ] Corriger les tests gameplay
- [ ] Retirer les `console.log`
- [ ] Corriger les `any` inutiles

---

# 🔴 Élise

### Traductions

❌ Problème

Certaines chaînes sont encore en dur ou incomplètes.

À faire :

- [ ] Finir les traductions
- [ ] Vérifier FR / EN / NL
- [ ] Vérifier les dates
- [ ] Vérifier les messages d'erreur

---

### Mobile

❌ Problème

Le jeu n'est pas encore correctement utilisable sur mobile dans la branche auditée.

À faire :

- [ ] Finaliser le responsive
- [ ] Vérifier les contrôles tactiles
- [ ] Tester sur plusieurs tailles d'écran

---

### Accessibilité

À faire :

- [ ] Navigation clavier
- [ ] Focus
- [ ] Contrastes
- [ ] Labels
- [ ] Vérification Firefox / Edge

---

### Notifications

❌ Décision à prendre

Le système actuel ressemble davantage à des toasts qu'à un vrai module de notifications.

À faire :

- [ ] Décider si on garde ce module et le refaire
- [ ] Ou retirer le module revendiqué

---

### Pages légales

❌ Problème

La Privacy Policy et les Terms contiennent des informations qui ne correspondent pas entièrement au fonctionnement réel.

À faire :

- [ ] Corriger la Privacy Policy
- [ ] Corriger les Terms of Service

---

# 🔴 Jennifer

⚠️ À faire après les corrections des autres.

### Vérifications frontend

- [ ] Vérifier l'intégration frontend/backend
- [ ] Vérifier les routes API
- [ ] Vérifier AuthContext
- [ ] Vérifier SocketProvider
- [ ] Vérifier les avatars
- [ ] Vérifier les amis
- [ ] Vérifier les statuts utilisateurs

---

### Vérifications finales

- [ ] Vérifier Chrome
- [ ] Vérifier qu'il n'y a plus d'erreurs console
- [ ] Vérifier les modules réellement terminés
- [ ] Vérifier le calcul des points
- [ ] Vérifier le README
- [ ] Vérifier la cohérence globale du projet

---

# ✅ Avant le rendu

- [ ] Le projet démarre sur une machine propre
- [ ] Plus d'erreurs console
- [ ] Tous les tests passent
- [ ] README terminé
- [ ] Tous les modules revendiqués fonctionnent réellement
- [ ] Chaque membre sait expliquer sa partie

# 🔴 Tout le monde

### README