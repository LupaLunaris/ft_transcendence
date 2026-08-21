# Correction des vulnérabilités npm — 2026-05-15

## Contexte

Lors du premier `npm install` du monorepo, `npm audit` a remonté **4 vulnérabilités** :
2 de sévérité *high* et 2 de sévérité *moderate*.

---

## Vulnérabilité 1 & 2 — HIGH : `tar` via `bcrypt`

### C'est quoi `tar` ?

`tar` est une bibliothèque Node.js qui sert à créer et extraire des archives `.tar` (comme `.tar.gz`).
Elle est utilisée en interne par `@mapbox/node-pre-gyp`, un outil qui télécharge et installe des
**binaires natifs précompilés** pour des paquets comme `bcrypt`.

En clair : quand tu fais `npm install bcrypt`, Node ne compile pas C++ chez toi —
il télécharge un `.tar.gz` déjà compilé depuis internet, et `tar` l'extrait.

### Le problème

Les versions de `tar` ≤ 7.5.10 contiennent plusieurs failles de type **Path Traversal** :
un fichier malveillant dans l'archive pouvait écrire ou écraser des fichiers
**en dehors du répertoire d'extraction** (ex: `/etc/passwd`, un script de démarrage…).

Exemples de CVE concernées :
- `GHSA-34x7-hfp2-rc4v` — création arbitraire de fichiers via hardlinks
- `GHSA-8qq5-rm4j-mr97` — écrasement via symlinks
- `GHSA-qffp-2rhf-9h96` — path traversal via chemins relatifs au lecteur (Windows)

> **En résumé :** si quelqu'un publiait un paquet npm piégé avec une archive tar
> malveillante, l'installation sur ta machine pouvait écrire n'importe où sur le disque.

### Pourquoi c'était dans notre projet ?

La chaîne de dépendances était :

```
bcrypt@5.1.1
  └── @mapbox/node-pre-gyp@1.0.11   ← pas mis à jour, pin sur une vieille version
        └── tar@6.x                 ← vulnérable
```

`npm audit fix` ne pouvait pas corriger ça parce que `@mapbox/node-pre-gyp@1.0.11`
(la dernière version publiée) dépend toujours du vieux `tar`.

### La correction

On a remplacé `bcrypt` par **`bcryptjs`**.

| | `bcrypt` | `bcryptjs` |
|---|---|---|
| Implémentation | C++ natif (via bindings) | JavaScript pur |
| Dépendances natives | `@mapbox/node-pre-gyp`, `tar` | aucune |
| API | identique | identique |
| Performance | légèrement plus rapide | suffisant pour de l'auth |

L'API est **100% identique** — le seul changement dans le code sera l'import :

```typescript
// avant
import bcrypt from 'bcrypt';

// après
import bcrypt from 'bcryptjs';
```

Toutes les fonctions (`hash`, `compare`, `genSalt`…) fonctionnent exactement pareil.

---

## Vulnérabilité 3 & 4 — MODERATE : `esbuild` via `vite`

### C'est quoi `esbuild` ?

`esbuild` est le bundler ultra-rapide que **Vite utilise en interne** pour transformer
ton TypeScript/JSX en JavaScript compréhensible par le navigateur, notamment pendant
le développement (`vite dev`).

### Le problème

Les versions de `esbuild` ≤ 0.24.2 (et donc Vite ≤ 6.4.1 qui les embarque)
exposaient le **serveur de développement** à des requêtes cross-origin non filtrées.

**CVE : `GHSA-67mh-4wv8-2f99`**

Concrètement : si tu avais ton `vite dev` lancé sur `localhost:5173` et que tu visitais
un site malveillant dans le même navigateur, ce site pouvait envoyer des requêtes
vers ton serveur de dev et **lire les réponses** (fichiers sources, variables d'env
exposées via `import.meta.env`, etc.).

> C'est une attaque **CORS bypass** : normalement le navigateur bloque les requêtes
> cross-origin, mais la version vulnérable d'esbuild ne vérifiait pas correctement
> l'en-tête `Host`, ce qui permettait à la protection d'être contournée.

### Pourquoi c'est un risque réel ?

En développement on a souvent des secrets dans les variables d'environnement
(`VITE_API_KEY`, tokens de debug…). Ces valeurs peuvent être exposées dans les
réponses du serveur de dev si celui-ci accepte des connexions venant d'autres origines.

### La correction

Montée de version :

```
vite@5.2.12  →  vite@8.0.13
@vitejs/plugin-react@4  →  @vitejs/plugin-react@6
```

Vite 8 embarque `esbuild` > 0.24.2 et filtre correctement les requêtes cross-origin
sur le serveur de dev.

Notre [vite.config.ts](../frontend/vite.config.ts) n'a **pas eu besoin d'être modifié** —
l'API de configuration est rétrocompatible pour notre usage.

---

## Résumé des changements

| Fichier modifié | Changement |
|---|---|
| `backend/package.json` | `bcrypt` → `bcryptjs`, `@types/bcrypt` → `@types/bcryptjs` |
| `frontend/package.json` | `vite@^5` → `vite@^8`, `@vitejs/plugin-react@^4` → `@vitejs/plugin-react@^6` |

```
$ npm audit
found 0 vulnerabilities   ✓
```

---

## À retenir pour la suite

1. **Lancer `npm audit` après chaque `npm install`** — prendre l'habitude dès le début.
2. **Les dépendances transitives comptent** : une vulnérabilité peut venir d'un paquet
   que tu n'as pas installé toi-même mais qui est tiré par une de tes dépendances.
3. **Préférer les paquets pure-JS** quand il existe une alternative équivalente :
   moins de dépendances natives = moins de surface d'attaque et installation plus simple
   (pas besoin d'un compilateur C++ sur la machine).
4. **Les vulnérabilités `moderate` en dev ne sont pas à ignorer** : le serveur de dev
   tourne sur ta machine avec accès à tes fichiers et variables d'environnement.
