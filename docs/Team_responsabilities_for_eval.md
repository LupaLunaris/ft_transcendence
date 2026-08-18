# Team Responsibilities for the 42 Evaluation

> **Document de référence pour la préparation de l'évaluation**
> Projet : `LupaLunaris/ft_transcendence` - *Guilds of the Deep*
> Audit de référence : Git/PR du 17 août 2026
> Branche auditée : `dev`
> Sujet de référence : ft_transcendence v21.0
> Statut : à revalider sur le commit exact remis avant l'évaluation

---

## 1. But et règle d'utilisation

Ce document remplace l'ancienne répartition théorique des rôles pour la préparation technique à l'évaluation.

Il répond à trois questions :

1. Qui a réellement construit quoi, d'après l'historique Git et les Pull Requests ?
2. Jusqu'à quel niveau chaque membre doit-il réviser chaque zone ?
3. Quelles preuves et démonstrations faut-il préparer pour défendre les modules annoncés ?

L'ancienne organisation reste utile pour expliquer les rôles d'équipe - Product Owner, Project Manager, Technical Lead et UI/UX Lead - mais elle ne doit pas contredire l'ownership technique observé.

### Niveaux de maîtrise

- **MUST MASTER** : expliquer l'intention, le flux, les choix, les cas limites et les tests ; retrouver rapidement le code ; effectuer une petite modification en direct.
- **MUST UNDERSTAND** : expliquer le rôle de la zone et ses interfaces avec son propre travail ; suivre le flux sans connaître chaque ligne ; savoir nommer le propriétaire principal.
- **GENERAL KNOWLEDGE** : connaître l'objectif et la place dans l'architecture ; ne pas réviser l'implémentation en profondeur.

### Règle commune

Chaque membre doit connaître l'architecture globale et pouvoir expliquer ses contributions. En revanche, personne ne doit prétendre être propriétaire d'un sous-système qu'il ne peut pas modifier ou déboguer devant les évaluateurs.

---

## 2. Sources et méthode

### Sources prioritaires

1. Audit Git/PR du 17 août 2026 : source principale pour l'ownership réel.
2. Code et historique de la branche `dev` au commit remis.
3. Sujet officiel `docs/ft_transcendence.subject.pdf`, version 21.0.
4. Documents canoniques actuels : `README.md`, `README_install_and_start.md`, `docs/architecture.md` et `docs/README.md`.
5. Documents archivés : contexte historique uniquement.

### Périmètre de l'audit

- 96 Pull Requests inspectées ; 81 fusionnées, 14 fermées sans fusion et la PR #96 encore ouverte au moment de l'audit.
- 387 entrées de dépôt inventoriées sur `dev`.
- 309 fichiers trouvés et 159 fichiers de code/configuration significatifs cartographiés individuellement.
- Diffs à fort impact inspectés, notamment les PR #59, #63, #64, #68, #69, #71, #72, #77, #81, #88, #89, #93 et #96.
- Historique de `main` consulté pour retrouver des auteurs supprimés par le nettoyage mécanique de la PR #77.

### Pondération des preuves

Preuves fortes : création d'un fichier, fonctionnalité substantielle, décision d'architecture, refactor important, correction fonctionnelle ou de sécurité, tests décrivant le comportement.

Preuves faibles : formatage, suppression d'en-têtes, lockfiles, assets seuls, traduction mécanique, restauration après conflit.

La PR #77 ne transfère donc pas l'ownership malgré son grand nombre de fichiers touchés. La PR #88 prouve la responsabilité de Jennifer sur la CI et la stabilisation, mais ne la rend pas propriétaire de tous les fichiers réparés pour compiler.

### Identités Git

| Identité GitHub | Membre |
| --- | --- |
| `LupaLunaris`, `jpaulis` | Jennifer Paulis |
| `MartinLaf`, `malafont` | Martin Malafont |
| `Jeremiedebrulle`, `jdebrull` | Jérémie Debrull |
| `Elisevand`, `evan-dro` | Elise Van Droogenbroeck |

---

## 3. Conclusion d'ownership

| Membre | Ownership principal prouvé | Frontières partagées |
| --- | --- | --- |
| **Jennifer Paulis** | Architecture React, `AuthContext`, intégration API, contrats partagés, validation frontend, workflow des cartes, XP et achievements, CI/stabilisation | Refactor gameplay avec Martin ; éditeur avec Elise/Martin ; modèles Prisma de gamification avec Jérémie |
| **Martin Malafont** | Phaser, gameplay, Tower, rendu Duel, cycle de vie multijoueur, scoring et leaderboards | `duelHandler.ts` avec Jérémie/Jennifer ; éditeur avec Jennifer/Elise |
| **Jérémie Debrull** | Express, JWT, users/friends/avatar, présence, fondation Prisma, Docker, nginx, Vault, WAF et mécanismes anti-forgery | Multijoueur avec Martin ; schéma avec Jennifer/Martin |
| **Elise Van Droogenbroeck** | Primitives UI, layout, navigation, formulaires auth, i18n, pages légales, accessibilité et contrôles responsive | Éditeur avec Jennifer/Martin ; profil avec Jennifer ; design system avec Jennifer |

### Trois corrections indispensables

1. **`EditorPage.tsx` est réellement partagé.** Martin a créé le fichier historique ; Elise a ajouté le panneau de cartes sauvegardées et plusieurs protections de test/publication ; Jennifer a largement repris les valeurs par défaut, la personnalisation, l'intégration et les récompenses. Ownership actuel : Jennifer/Elise. Martin doit maîtriser la frontière grille-vers-gameplay.
2. **`duelHandler.ts` n'est pas simplement “le multijoueur de Martin”.** Martin possède la refonte autoritaire 2-4 joueurs ; Jennifer a apporté la première logique substantielle de délai de reconnexion ; Jérémie a ajouté présence, autorisation et durcissement anti-forgery. Ownership actuel : Martin principal, Jérémie co-owner, Jennifer contributrice significative.
3. **Le design system n'est pas uniquement à Elise.** Elise a créé les primitives et le layout ; la PR #33 de Jennifer a fortement défini le thème courant et les tokens Tailwind. Ownership actuel : Elise principale, Jennifer co-owner.

---

## 4. Matrice de révision rapide

| Domaine | Jennifer | Martin | Jérémie | Elise |
| --- | --- | --- | --- | --- |
| Bootstrap React, providers, routing | **MASTER** | GENERAL | UNDERSTAND | UNDERSTAND |
| État d'authentification frontend | **MASTER** | GENERAL | UNDERSTAND | UNDERSTAND |
| UI Login/Register | UNDERSTAND | GENERAL | UNDERSTAND | **MASTER** |
| JWT, bcrypt, permissions backend | UNDERSTAND | GENERAL | **MASTER** | UNDERSTAND |
| Client REST et contrats partagés | **MASTER** | UNDERSTAND | UNDERSTAND | UNDERSTAND |
| Users/friends/avatar frontend | **MASTER** | GENERAL | UNDERSTAND | UNDERSTAND |
| Users/friends/avatar backend | UNDERSTAND | GENERAL | **MASTER** | GENERAL |
| Présence online/in-game/offline | UNDERSTAND | UNDERSTAND | **MASTER** | GENERAL |
| Éditeur et workflow de carte | **MASTER** | UNDERSTAND | UNDERSTAND | **MASTER** |
| Validation/persistance des cartes | UNDERSTAND | UNDERSTAND | **MASTER** | GENERAL |
| Gameplay solo Phaser | **MASTER sur l'intégration partagée** | **MASTER** | GENERAL | UNDERSTAND |
| Tower | UNDERSTAND | **MASTER** | **MASTER côté validation serveur** | UNDERSTAND |
| Multijoueur client et rendu | UNDERSTAND | **MASTER** | UNDERSTAND | GENERAL |
| Serveur multijoueur autoritaire | **MASTER uniquement sur sa reconnexion** | **MASTER** | **MASTER sécurité/présence** | GENERAL |
| XP, niveaux, achievements | **MASTER** | UNDERSTAND | UNDERSTAND | UNDERSTAND |
| Ranking points et leaderboards | UNDERSTAND | **MASTER** | UNDERSTAND | UNDERSTAND |
| i18n, légal, accessibilité | GENERAL | GENERAL | GENERAL | **MASTER** |
| Design system | **MASTER sur thème/tokens/intégration** | GENERAL | GENERAL | **MASTER primitives/a11y** |
| Prisma global | UNDERSTAND + **MASTER modèles gamification** | UNDERSTAND + **MASTER modèles scoring** | **MASTER** | GENERAL |
| Docker, nginx, Vault, WAF | GENERAL | UNDERSTAND | **MASTER** | GENERAL |
| CI, builds et stabilisation cross-stack | **MASTER** | UNDERSTAND | UNDERSTAND | UNDERSTAND |

---

## 5. Jennifer - périmètre de révision prioritaire

### 5.1 MUST MASTER

Jennifer doit pouvoir ouvrir, expliquer et modifier :

- le démarrage React, l'ordre des providers, le routage et les routes protégées ;
- `AuthContext`, la restauration de session, la mise à jour de l'utilisateur et la propagation des changements ;
- le client API, les erreurs, les types partagés et la frontière frontend/backend ;
- la validation frontend et la manière dont les erreurs backend sont présentées ;
- les écrans profil, amis et avatar qu'elle a intégrés ;
- le workflow complet de l'éditeur : défauts, édition, sauvegarde, test, publication, suppression, personnalisation et rafraîchissement de l'état ;
- XP, niveaux, achievements, événements idempotents et affichage des récompenses ;
- ses modèles/migrations Prisma liés à `UserAchievement` et `XpEvent`, sans devoir maîtriser tout le schéma ;
- sa partie des refactors solo/game : passage React vers Phaser, paramètres de carte/personnalisation, retour de fin de partie et récompenses ;
- sa contribution de reconnexion dans `duelHandler.ts`, y compris délai de grâce, reprise et nettoyage ;
- la CI et les réparations cross-stack : ordre de build du package partagé, commandes de test, erreurs TypeScript et causes de régression.

#### Fichiers critiques de Jennifer

- `frontend/src/main.tsx`
- `frontend/src/App.tsx`
- `frontend/src/context/auth.context.tsx`
- `frontend/src/services/api.service.ts`
- `frontend/src/hooks/useApi.ts`
- `frontend/src/hooks/useMap.ts`
- `frontend/src/pages/editor/EditorPage.tsx`
- `frontend/src/pages/game/GamePage.tsx`
- `frontend/src/pages/training/TrainingPage.tsx`
- composants profil, amis et avatar qu'elle a modifiés
- `frontend/src/game/GameCanvas.tsx`
- parties partagées de `frontend/src/game/scenes/GameScene.ts`
- service backend de gamification et routes de récompense associées
- modèles/migrations Prisma de gamification
- contrats de `shared/src/`
- workflow CI et scripts de build/test concernés par les PR #87/#88

### 5.2 MUST UNDERSTAND - sans révision ligne par ligne

Jennifer doit savoir suivre et expliquer :

- Login/Register UI : Elise maîtrise les composants ; Jennifer explique leur connexion à `AuthContext`.
- JWT/bcrypt/middleware : Jérémie maîtrise l'implémentation ; Jennifer explique le contrat, le cycle de session et les erreurs reçues.
- routes users/friends/avatar : Jérémie maîtrise les requêtes, permissions et upload ; Jennifer maîtrise leur consommation frontend.
- gameplay Phaser : Martin maîtrise collisions, ennemis et boucle de jeu ; Jennifer maîtrise la frontière React/Phaser et ses propres refactors.
- Tower : Martin maîtrise le gameplay, Jérémie la validation sécurisée ; Jennifer explique la mise à jour de l'utilisateur après récompense.
- ranking/leaderboards : Martin maîtrise la formule et la persistance ; Jennifer explique leur intégration au profil/gamification.
- présence/socket : Jérémie maîtrise le provider persistant et les états ; Jennifer sait expliquer comment le frontend les consomme.
- Prisma global : Jérémie maîtrise relations, index, cascades et migrations générales ; Jennifer connaît seulement assez le schéma pour défendre ses modèles.

### 5.3 GENERAL KNOWLEDGE - ne pas sur-réviser

Jennifer n'a pas à apprendre en profondeur :

- les algorithmes de mouvement, collision, ennemis ou scoring de Martin ;
- l'intégralité du serveur autoritaire multijoueur ;
- les règles WAF/ModSecurity, l'initialisation Vault, nginx et la gestion détaillée des secrets de Jérémie ;
- les détails des composants UI, du responsive, de l'i18n et des audits d'accessibilité d'Elise ;
- les migrations Prisma sans lien avec la gamification.

### 5.4 Réponses-pivots pour éviter l'overclaim

- « Je maîtrise la frontière React/Phaser et les parties que j'ai refactorées ; Martin est propriétaire des algorithmes de gameplay. »
- « J'ai construit le cycle d'état frontend et l'intégration API ; Jérémie maîtrise JWT, les permissions et les requêtes backend. »
- « Dans `duelHandler.ts`, je maîtrise ma logique de reconnexion. Martin maîtrise l'autorité de jeu et Jérémie le durcissement sécurité/présence. »
- « Je maîtrise les modèles et règles de gamification que j'ai ajoutés ; Jérémie reste le steward du schéma Prisma global. »
- « Elise possède les primitives du design system ; je co-possède le thème, les tokens et leur intégration. »

---

## 6. Martin - périmètre de révision

### MUST MASTER

- Phaser : `GameCanvas`, `BaseScene`, `GameScene`, `DuelScene`, entités et assets.
- Règles, mouvement, collisions, ennemis, spawn, sortie, victoire/défaite.
- Tower, transitions de niveaux et progression côté gameplay.
- Lobby, cycle de partie, 2-4 joueurs, inputs, état serveur autoritaire, rendu distant, fin et nettoyage.
- `duelHandler.ts` pour la sémantique multijoueur, en distinguant les apports sécurité de Jérémie et reconnexion de Jennifer.
- Scoring, ranking points, meilleurs scores et leaderboards.
- Frontière grille d'éditeur vers carte jouable.
- Avatar-vers-sprite et personnalisation gameplay.

### MUST UNDERSTAND

- contrats socket/API partagés ; authentification de l'identité consommée par le jeu ; validation sécurisée des runs ; modèles Prisma utilisés par scores/ranking ; UI de l'éditeur partagée.

### GENERAL KNOWLEDGE

- implémentation détaillée des formulaires/auth frontend, infrastructure WAF/Vault, i18n et primitives UI.

### Fichiers critiques

- `frontend/src/game/GameCanvas.tsx`
- `frontend/src/game/scenes/BaseScene.ts`
- `frontend/src/game/scenes/GameScene.ts`
- `frontend/src/game/scenes/DuelScene.ts`
- `frontend/src/game/entities/Enemy.ts`
- `frontend/src/pages/duel/DuelPage.tsx`
- `frontend/src/pages/duel/DuelGamePage.tsx`
- `frontend/src/hooks/useDuelLobby.ts`
- `backend/src/socket/duelHandler.ts`
- service de scoring et hooks/composants leaderboard
- types de jeu/socket dans `shared/src/`

---

## 7. Jérémie - périmètre de révision

### MUST MASTER

- bootstrap Express, routes, middlewares, erreurs et validation Zod.
- JWT, bcrypt, autorisation, ownership des ressources et règles admin.
- users, friends, avatar upload, fichiers servis et états de présence.
- Prisma : schéma, relations, contraintes, index, cascades, transactions, migrations et seeds.
- validation/persistance/publication des cartes.
- sécurisation des scores et de Tower : run tokens signés, nonce anti-rejeu et validation du temps serveur.
- Socket.IO : connexion, identité, présence, autorisation, nettoyage ; co-ownership de `duelHandler.ts`.
- Docker Compose, nginx/TLS, Vault/AppRole, ModSecurity/WAF, secrets externes et démarrage.

### MUST UNDERSTAND

- contrats consommés par React ; cycle de lobby et autorité gameplay de Martin ; modèles de gamification/scoring créés par Jennifer/Martin.

### GENERAL KNOWLEDGE

- détails des scènes Phaser, composants UI, responsive et traductions.

### Fichiers critiques

- `backend/src/server.ts` et bootstrap/entrypoint
- routes auth, users, friends, maps, scores et Tower
- middlewares auth/admin/upload et schémas Zod
- `backend/src/socket/duelHandler.ts`
- état de présence
- `backend/prisma/schema.prisma`, migrations et seeds
- `docker-compose.yml`, `Makefile`
- `nginx/nginx.conf` et configuration ModSecurity
- configuration/scripts Vault

---

## 8. Elise - périmètre de révision

### MUST MASTER

- primitives `Button`, `Input`, `Modal`, `Toast`, hook toast et états associés.
- `Layout`, `Navbar`, `Footer`, navigation et cohérence visuelle.
- formulaires Login/Register, redirections, validation visible et traductions.
- i18next : configuration, namespaces, fallback et langues anglais/français/néerlandais.
- accessibilité : clavier, focus, labels, contraste, retours Lighthouse et limites.
- responsive : frame de jeu, contrôles mobiles et `TouchPad`.
- parties de l'éditeur qu'elle a construites : grille, sélection de tuiles, panneau de cartes sauvegardées et protections des changements non sauvegardés.
- pages légales et documentation du design system.

### MUST UNDERSTAND

- `AuthContext` et API de Jennifer ; routes backend consommées ; workflow global test/publication ; contraintes de Phaser pour le responsive.

### GENERAL KNOWLEDGE

- algorithmes Phaser, serveur autoritaire, Prisma global, WAF/Vault et sécurité backend détaillée.

### Fichiers critiques

- `frontend/src/components/ui/`
- `frontend/src/components/layout/`
- `frontend/src/pages/auth/LoginPage.tsx`
- `frontend/src/pages/auth/RegisterPage.tsx`
- `frontend/src/components/editor/EditorGrid.tsx`
- `frontend/src/components/editor/TileSelector.tsx`
- `frontend/src/i18n.ts`
- fichiers `frontend/src/language/{en,fr,nl}/`
- pages légales, contrôles responsive et `TouchPad`
- documentation du design system

---

## 9. Flux end-to-end à savoir raconter

Chaque flux doit être répété avec : déclencheur UI, état local, contrat réseau, validation serveur, persistance, réponse, mise à jour UI, erreurs et propriétaire de chaque étape.

### 9.1 Connexion

`LoginPage` (Elise) -> `AuthContext` (Jennifer) -> client API (Jennifer) -> `POST /auth/login` + schéma/JWT/bcrypt (Jérémie) -> Prisma `User` (Jérémie) -> session/utilisateur renvoyé -> routes protégées.

### 9.2 Inscription

`RegisterPage` (Elise) -> validation et contexte frontend (Jennifer) -> API -> Zod, unicité, hash et règle admin (Jérémie) -> création Prisma -> état authentifié.

### 9.3 Profil et gamification

`ProfilePage` (Jennifer, UI partagée avec Elise) -> `AuthContext.user` -> `/auth/me` ou `/users/:id` (Jérémie) -> serializer + service de gamification (Jérémie/Jennifer) -> `User`, `UserAchievement`, `XpEvent` -> rendu progression.

### 9.4 Amis et présence

Recherche/liste d'amis (Jennifer/Elise) -> API (Jennifer) -> routes friends/users (Jérémie) -> état de présence (Jérémie) alimenté par Socket.IO et le cycle Duel (Jérémie/Martin) -> statut online/in-game/offline.

### 9.5 Avatar

Éditeur/avatar UI (Jennifer/Elise) -> multipart `POST /users/avatar` -> upload middleware, route et volume/proxy (Jérémie) -> URL utilisateur -> mapping avatar-vers-sprite (Martin).

### 9.6 Créer, modifier et supprimer une carte

`EditorPage` (Jennifer/Elise) <-> grille, tuiles et paramètres (Elise/Jennifer) -> API (Jennifer) -> routes maps, schémas et validation de grille (Jérémie) -> Prisma `Map`.

### 9.7 Tester puis publier une carte

Protection changements non sauvegardés (Jennifer/Elise) -> sauvegarde -> `/play/:map_id` -> `GamePage`/`GameCanvas`/`GameScene` (Jennifer/Martin) -> completion sécurisée (Jérémie) -> récompense idempotente de test (Jennifer) -> publication -> récompense première publication -> refresh `AuthContext` + toast.

### 9.8 Jeu solo et score

`TrainingPage`/`GamePage` -> `POST /scores/start` -> run token signé (Jérémie) -> Phaser (Martin/Jennifer) -> `POST /scores` avec token et temps -> validation anti-rejeu/temps (Jérémie) -> meilleur score/ranking (Martin) -> XP (Jennifer) -> leaderboard.

### 9.9 Tower

`TowerPage` -> `TowerGamePage` (Martin) -> `/tower/:order_index/start` + token (Jérémie) -> niveau Phaser (Martin) -> `/complete` sécurisé (Jérémie) -> progression/diamants Prisma -> `AuthContext.updateUser` (Jennifer).

### 9.10 Multijoueur

`DuelPage` -> `useDuelLobby` (Martin) -> socket context/presence (Jérémie) -> `join_lobby` -> payload partagé -> `DuelGamePage`/`DuelScene` (Martin) <-> inputs, ennemis et état autoritaire dans `duelHandler` (Martin/Jérémie) -> reconnexion (Jennifer/Martin/Jérémie) -> classement, récompense et cleanup.

### 9.11 Leaderboard

Fin de run/duel -> route score ou `duelHandler` -> service de scoring (Martin) -> `Score`/`MapRankingPoints` Prisma (Martin/Jérémie) -> hook/composant leaderboard (Martin, présentation partagée avec Elise).

---

## 10. Modules à démontrer

Le README de `dev` revendique actuellement **7 Major + 7 Minor = 21 points**. Cette liste est plus large que l'ancien cadrage du projet. Elle ne devient valable que si chaque module est pleinement fonctionnel, testable et défendable sur le commit remis.

### 10.1 Modules Major

| Module revendiqué | Preuve à montrer | Porte-parole principal | Risque |
| --- | --- | --- | --- |
| Framework frontend + backend | React et Express réellement structurants ; routing/providers ; une requête navigateur -> API -> Prisma ; contrats partagés | Jennifer + Jérémie | Faible si build propre |
| Real-time features | Lobby live, événements, synchronisation, autorité serveur, perte/reprise de connexion, cleanup | Martin + Jérémie ; Jennifer sur reconnexion | Moyen |
| Standard user management | inscription/login, profil, avatar, amis, statuts online/in-game/offline | Jennifer + Jérémie ; Elise pour l'UI | Moyen |
| Complete web-based game | règles, contrôles, collisions, ennemis, spawn/sortie, victoire/défaite, score persistant | Martin ; Jennifer sur intégration | Faible à moyen |
| Remote players | deux clients/machines, identités distinctes, mouvement distant, latence et reconnexion | Martin | Moyen |
| Multiplayer game 3+ players | 3-4 clients, lobby/countdown, tous les joueurs distants, ennemis autoritaires, morts/fins individuelles, classement | Martin + Jérémie | Élevé tant que non stress-testé |
| WAF/ModSecurity + Vault | secrets hors dépôt, récupération Vault avant démarrage Prisma, TLS/redirection, attaque bloquée et requêtes normales PUT/DELETE acceptées | Jérémie | Élevé : démo infra sensible |

### 10.2 Modules Minor

| Module revendiqué | Preuve à montrer | Porte-parole principal | Risque |
| --- | --- | --- | --- |
| ORM - Prisma | modèles/relations, contraintes, index/cascades, transaction, vraie requête, migration vs seed | Jérémie ; Jennifer/Martin sur leurs modèles | Faible |
| Custom-made design system | primitives réutilisées, variantes/états, tokens, focus/disabled/error, documentation et accessibilité | Elise + Jennifer | Faible à moyen |
| Multiple languages | anglais, français, néerlandais ; changement à chaud ; couverture des écrans démontrés ; fallback | Elise | Faible si aucune clé visible |
| Game customization options | plusieurs options réellement choisies par l'utilisateur et visibles dans le jeu, persistées et rechargées | Jennifer + Martin | Moyen : prouver plus qu'un simple éditeur |
| Gamification system | XP, niveaux, achievements, récompenses, leaderboard ; règles et idempotence | Jennifer + Martin | Faible à moyen |
| Notification system | événements pertinents, affichage cohérent, plusieurs types/états et comportement démontrable | Elise + Jennifer selon intégration | **Élevé si ce ne sont que des toasts éphémères** |
| Additional browsers | scénario complet exécuté sur le navigateur principal et un navigateur supplémentaire, sans défaut fonctionnel majeur | Elise + tous les owners de flux | **Élevé : preuve d'audit dédiée non identifiée** |

### 10.3 Scénario de démonstration minimal

1. Démarrer le commit remis avec la commande officielle d'évaluation.
2. Créer deux à quatre comptes et montrer profil/avatar/amis/statut.
3. Créer et personnaliser une carte, provoquer une validation invalide, corriger, sauvegarder et tester.
4. Terminer la carte, publier, montrer la récompense idempotente et le rafraîchissement du profil.
5. Jouer un run solo/Tower avec score sécurisé et leaderboard.
6. Lancer une partie à trois joueurs sur des clients séparés, finir/perdre avec des résultats distincts, puis tester une déconnexion/reconnexion.
7. Changer de langue et montrer clavier/focus/responsive.
8. Montrer les composants/tokens du design system sur plusieurs pages.
9. Montrer une requête Prisma et expliquer migration/seed.
10. Montrer Vault/TLS/WAF : une attaque bloquée puis une requête métier normale non bloquée.
11. Rejouer le scénario critique dans le navigateur supplémentaire.

---

## 11. Questions probables

### Questions communes

- Quel est le chemin exact d'une action du navigateur jusqu'à PostgreSQL ?
- Pourquoi React, Express, Prisma, Socket.IO et Phaser ? Où sont leurs frontières ?
- Que garantit le serveur, et que ne fait-on jamais confiance au client ?
- Que se passe-t-il si une requête, un socket ou la base échoue ?
- Comment évitez-vous doubles récompenses, replay de score et incohérences de présence ?
- Quel est le commit remis, pourquoi cette branche, et quelles PR ne sont pas incluses ?
- Quelle contribution personnelle pouvez-vous modifier maintenant ?
- Quels modules sont réellement complets et quelles preuves correspondent exactement à chacun ?

### Jennifer

- Pourquoi un `AuthContext` et comment évitez-vous l'état utilisateur obsolète après une récompense ?
- Comment le client API transforme-t-il erreurs réseau/backend en état UI ?
- Pourquoi des contrats TypeScript partagés, et que ne garantissent-ils pas à l'exécution ?
- Comment une carte passe-t-elle de l'éditeur au jeu puis à la publication ?
- Comment rendez-vous une récompense XP/achievement idempotente ?
- Qu'avez-vous changé dans `GameScene` et qu'est-ce qui reste à Martin ?
- Comment fonctionne votre délai de reconnexion et comment le cleanup évite-t-il les états fantômes ?
- Que répare la CI et pourquoi le package partagé doit-il être construit en premier ?

### Martin

- Où vit l'autorité en multijoueur et comment un input devient-il un nouvel état ?
- Comment collisions, ennemis, morts et fins sont-ils déterminés ?
- Comment gérez-vous latence, cadence d'input et interpolation ?
- Comment le lobby passe-t-il à une partie 2-4 joueurs et comment se termine-t-elle ?
- Comment calculez-vous score/ranking et empêchez-vous les doublons ?
- Comment la grille d'éditeur devient-elle une scène jouable ?

### Jérémie

- Comment JWT, bcrypt, middleware et permissions protègent-ils une route ?
- Pourquoi valider à la fois côté frontend et côté backend ?
- Comment Prisma garantit-il relations, unicité, cascades et transactions ?
- Comment les run tokens, nonces et temps serveur limitent-ils la triche/relecture ?
- Comment présence Socket.IO et nettoyage de déconnexion fonctionnent-ils ?
- Dans quel ordre Vault, Prisma, Express, nginx et WAF démarrent-ils ?
- Comment prouvez-vous que le WAF bloque une attaque sans casser PUT/DELETE normaux ?

### Elise

- Qu'est-ce qui rend votre ensemble de composants un design system et non une collection de boutons ?
- Comment gérez-vous variantes, focus, disabled, erreurs et contraste ?
- Comment i18next organise-t-il ressources, fallback et changement de langue ?
- Qu'avez-vous corrigé après l'audit Lighthouse ?
- Comment le jeu reste-t-il utilisable sur petit écran et avec clavier ?
- Comment protégez-vous l'utilisateur contre la perte d'une carte non sauvegardée ?

---

## 12. Live edits à répéter

Objectif : réaliser chaque exercice en 5 à 10 minutes, expliquer avant de taper, lancer le test/build pertinent, puis montrer le résultat.

### Jennifer

1. Ajouter un champ typé à un contrat partagé et l'afficher via le client API.
2. Ajouter un état loading/error ou une validation sur un formulaire existant.
3. Modifier une valeur par défaut de l'éditeur et adapter le test correspondant.
4. Ajouter une condition simple d'achievement en conservant l'idempotence.
5. Corriger un refresh de `AuthContext` après mutation utilisateur.
6. Modifier le délai ou le message d'état de reconnexion dans sa zone, puis expliquer le cleanup.

### Martin

1. Ajuster une règle de mouvement/collision ou un paramètre d'ennemi et tester la scène.
2. Modifier une règle de countdown/lobby sans casser 2-4 joueurs.
3. Ajuster la cadence d'input ou une interpolation et expliquer l'effet réseau.
4. Modifier une règle de score/ranking et mettre à jour le test.
5. Ajouter ou nettoyer un listener Duel sans fuite ni double événement.

### Jérémie

1. Ajouter une contrainte Zod et montrer le statut/résultat d'erreur.
2. Protéger une route par ownership et écrire/adapter un test Supertest.
3. Écrire une requête Prisma simple avec relation ou transaction.
4. Ajouter une vérification anti-rejeu/autorisation sur une action sensible.
5. Expliquer et ajuster une règle WAF d'exception étroite sans désactiver la protection.

### Elise

1. Ajouter une variante ou un état accessible à un composant UI réutilisable.
2. Ajouter une clé traduite dans les trois langues et vérifier le fallback.
3. Corriger un label/focus/ordre clavier sur un formulaire.
4. Adapter un breakpoint ou un contrôle mobile sans casser le desktop.
5. Ajouter un toast à un événement existant en évitant les doublons.

### Règle de répétition croisée

Le propriétaire exécute. Un second membre observe et doit pouvoir raconter le flux. Cela développe la compréhension globale sans transférer artificiellement l'ownership.

---

## 13. Risques et incohérences avant évaluation

### P0 - bloquants

- **Branche remise** : `main` est la branche GitHub par défaut mais l'audit indique que le projet complet est sur `dev`. Fusionner/soumettre le bon commit et vérifier ce que voit un évaluateur depuis la page du dépôt.
- **PR #96** : ne pas revendiquer son input pacing ou sa durée minimale de score si elle reste ouverte et absente du commit remis.
- **Liste de modules contradictoire** : le README revendique 21 points, tandis que l'ancien cadrage de projet en mentionne moins. Geler une liste unique conforme au sujet et au commit.
- **Documentation d'infrastructure contradictoire** : `docs/architecture.md` décrit trois services Docker simples, alors que l'audit/README revendiquent nginx, Vault et WAF. Mettre la documentation canonique en accord avec le `docker-compose.yml` réellement évalué.
- **README incomplet** : plusieurs sections contiennent encore `TO COMPLETE`, notamment installation/équipe/sécurité/design system/notifications/navigateurs. Aucun marqueur provisoire ne doit rester dans le dossier remis.
- **Démarrage reproductible** : tester sur une machine propre la commande officielle, les migrations/seeds, les secrets et l'accès HTTPS avant le jour J.

### P1 - forts risques de perte de modules

- **Notification System** : une infrastructure de toast seule peut être jugée insuffisante. Comparer l'implémentation au texte exact du module et préparer plusieurs événements/états démontrables.
- **Additional Browsers** : préparer une matrice de tests et une preuve réelle sur deux navigateurs ; ne pas se contenter d'une affirmation README.
- **Multijoueur 3+** : tester simultanément 3 puis 4 clients, morts/fins, abandon, reconnexion, nettoyage et relance.
- **WAF/Vault** : préparer des commandes de démo déterministes et une solution de diagnostic qui ne révèle aucun secret.
- **Real-time vs Remote Players vs 3+ Players** : préparer des preuves distinctes ; la même capture de lobby ne valide pas automatiquement trois modules.
- **Game customization** : démontrer que les choix utilisateur changent réellement le jeu et persistent, pas seulement que l'on peut placer des tuiles.

### P2 - qualité et défense

- Tester les clés i18n manquantes, états loading/error, navigation clavier et petit écran sur tout le scénario de démo.
- Vérifier l'idempotence des récompenses en répétant la même completion/publication et le même token de score.
- Vérifier qu'aucun secret, `.env` réel, token ou certificat privé n'est versionné ou affiché.
- Geler les comptes, cartes et données de démonstration ; prévoir une remise à zéro non destructive et connue.
- Exécuter build, tests frontend/backend, smoke Docker et scénario manuel après le gel.
- Archiver clairement les anciens documents d'ownership/modules pour empêcher l'équipe de réviser une version contradictoire.

---

## 14. Plan de révision recommandé

### Phase 1 - indispensable

- Geler branche, commit, modules revendiqués et commande de démarrage.
- Corriger README et architecture canonique.
- Chaque membre prépare ses fichiers MUST MASTER et deux live edits.
- Répéter les 11 flux end-to-end et le scénario de démonstration.
- Tester 3-4 joueurs, WAF/Vault, notifications et second navigateur.

### Phase 2 - consolidation

- Un membre pose les questions probables à un autre sans le guider.
- Chaque owner casse volontairement un petit cas puis le diagnostique.
- Refaire la démo avec une base fraîche et des comptes neufs.
- Mesurer le temps de la présentation et préparer les transitions entre membres.

### Phase 3 - optionnelle

- Ajouter seulement les tests/documentations manquants qui sécurisent une preuve de module.
- Ne plus ajouter de fonctionnalité produit ambitieuse.
- Reporter toute évolution commerciale, refonte ou abstraction non nécessaire après l'évaluation.

---

## 15. Checklist finale

### Dépôt et remise

- [ ] La branche/commit remis contient tout le projet attendu.
- [ ] `main`, `dev` et l'interface GitHub ne créent aucune ambiguïté.
- [ ] Le statut de la PR #96 est connu et ses fonctions ne sont revendiquées que si incluses.
- [ ] Aucun secret réel ou fichier sensible n'est versionné.
- [ ] Les documents archivés sont clairement marqués non canoniques.

### Documentation

- [ ] README sans `TO COMPLETE`, placeholder ou module obsolète.
- [ ] Architecture conforme aux services réellement lancés.
- [ ] Guide de démarrage testé sur une machine propre.
- [ ] Une liste unique de modules et de responsables est utilisée partout.
- [ ] Le présent document correspond au dernier commit.

### Technique

- [ ] Build shared + backend + frontend vert.
- [ ] Tests backend et frontend verts.
- [ ] Stack Docker d'évaluation démarrée et arrêtée proprement.
- [ ] Migrations et seeds reproductibles.
- [ ] HTTPS, Vault, WAF et requêtes métier normales validés.
- [ ] Aucun log bloquant, crash ou erreur console pendant la démo.

### Fonctionnel

- [ ] Auth, profil, avatar, amis et présence démontrables.
- [ ] Création, validation, test et publication de carte démontrables.
- [ ] Solo, Tower, score sécurisé et leaderboard démontrables.
- [ ] Partie à 3-4 joueurs testée sur clients séparés.
- [ ] Déconnexion/reconnexion et cleanup testés.
- [ ] XP/achievements/récompenses vérifiés idempotents.
- [ ] Trois langues vérifiées sur le scénario de démo.
- [ ] Accessibilité/responsive vérifiés.
- [ ] Scénario complet vérifié sur le navigateur supplémentaire.

### Préparation individuelle

- [ ] Chaque membre peut présenter son ownership en 60 secondes.
- [ ] Chaque membre connaît ses fichiers MUST MASTER.
- [ ] Chaque membre sait nommer l'owner quand une question sort de son périmètre.
- [ ] Chaque membre a répété au moins deux live edits.
- [ ] Chaque membre sait raconter un flux complet traversant plusieurs couches.
- [ ] Jennifer ne passe pas son temps à mémoriser les algorithmes de Martin, l'infrastructure de Jérémie ou les détails UI d'Elise.

### Go / No-Go modules

- [ ] Chaque module possède une preuve visible, un owner et un scénario court.
- [ ] Les critères du sujet v21.0 ont été relus mot pour mot sur le commit final.
- [ ] Tout module non pleinement fonctionnel ou non démontrable est retiré de la revendication.
- [ ] L'équipe sait distinguer les preuves des trois modules temps réel/multijoueur.
- [ ] Notifications et navigateurs supplémentaires ont des preuves dédiées.

---
