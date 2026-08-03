# PlayerHub — hub joueur en barre latérale

## Stack concernée
React 18 + TypeScript, `Layout.tsx`, `AuthContext`, i18n (react-i18next)

## Composants
- `frontend/src/components/layout/PlayerHub.tsx` — carte compacte (diamants,
  progression tour, maps créées, niveau XP, badges achievements)
- `frontend/src/components/layout/Layout.tsx` — décide où l'afficher
- `frontend/src/constants/achievements.ts` — `ACHIEVEMENT_LABEL` (code →
  clé i18n) et `ALL_ACHIEVEMENT_CODES` (ordre d'affichage stable, y
  compris les achievements non débloqués), partagés avec `ProfilePage.tsx`

## Emplacement et visibilité
`Layout` calcule `showHub = user && !pathname.startsWith('/editor')` et
rend `<PlayerHub />` dans une `<aside>` collée à gauche (`sticky top-14`,
masquée sous `lg`). Un seul point de montage : pas de duplication par
page. Conséquences :
- Absent tant que l'utilisateur n'est pas connecté (`PlayerHub` renvoie
  aussi `null` si `!user`, redondant avec `Layout` mais protège tout
  usage direct du composant hors `Layout`)
- Absent sur `/editor` et `/editor/:id` (seule exclusion demandée — les
  pages de jeu qui utilisent `Layout`, ex. `TowerGamePage`, l'affichent)
- Absent sur les pages qui n'utilisent pas `Layout` (`GamePage`,
  `DuelGamePage` — plein écran, pas de navbar/footer non plus)

## Rafraîchissement des données
`PlayerHub` lit `user` depuis `AuthContext` — pas de fetch propre. Il
reflète donc l'état déjà maintenu par les pages de jeu qui appellent
`updateUser(await api.auth.getMe())` après une récompense (cf.
`CONTEXT.md`, section gamification). Naviguer vers une autre page après
une partie affiche donc les stats à jour sans action supplémentaire.

## Achievements compacts
Icône médaille SVG unique (`MedalIcon`), répétée pour chaque code de
`ALL_ACHIEVEMENT_CODES` (ordre fixe même si non débloqué) : dorée +
pleine opacité si débloqué, grise + `opacity-40` sinon. Le nom complet
n'apparaît qu'en `title` (tooltip), pas de texte affiché — contrainte
du format carré compact. Détail complet toujours sur `ProfilePage`.
