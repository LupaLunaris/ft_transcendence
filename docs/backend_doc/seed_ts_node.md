# Seed et ts-node — contourner le conflit rootDir

## Comment fonctionne la stack

**TypeScript** a besoin d'un fichier `tsconfig.json` pour savoir quels fichiers compiler et où les mettre. Deux options clés :

- `rootDir` : le dossier racine des sources. Tous les fichiers `.ts` compilés doivent être à l'intérieur.
- `include` : la liste des patterns de fichiers que TypeScript surveille.

**ts-node** est un outil qui exécute du TypeScript directement, sans passer par une compilation en `.js` préalable. Il a deux modes :
- Mode normal : lit le `tsconfig.json`, vérifie les types, exécute.
- Mode `--transpile-only` : transforme TypeScript → JavaScript sans vérifier les types. Plus rapide, moins strict.

**Prisma seed** : le système de seed de Prisma permet d'insérer des données initiales en base. On le déclenche avec `prisma db seed`. Prisma cherche la commande à exécuter dans `package.json`, dans la clé `"prisma"."seed"`.

---

## Les enjeux pour le projet

Le `tsconfig.json` du backend définit :

```json
{
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

Traduction : "tout le code source est dans `src/`, la sortie compilée va dans `dist/`".

Le fichier de seed est ici : `prisma/seed.ts` — il est **en dehors de `src/`**.

Si on essayait de l'exécuter normalement avec `ts-node prisma/seed.ts`, TypeScript se plaindrait :

```
error TS6059: File 'prisma/seed.ts' is not under 'rootDir' 'src'.
```

C'est une règle de cohérence de TypeScript : si `rootDir` est `src`, aucun fichier compilé ne peut venir d'ailleurs, sinon la structure de `dist/` serait cassée.

**Pourquoi ne pas mettre seed.ts dans `src/` ?**  
Le seed n'est pas du code de production. Il insère des données de test. Le mélanger dans `src/` polluerait le build final (le `dist/` déployé en prod contiendrait des mots de passe de test). C'est une séparation des responsabilités intentionnelle.

**La solution :** `--transpile-only` court-circuite la vérification de `rootDir`. On dit à ts-node : "ne vérifie pas les types ni la configuration tsconfig, contente-toi de transpiler ce fichier".

---

## L'exemple du projet : le `package.json`

La commande est enregistrée ici :

```json
// backend/package.json
"prisma": {
  "seed": "ts-node --transpile-only prisma/seed.ts"
}
```

Quand on fait `npm run db:seed` (qui appelle `prisma db seed`), Prisma lit cette clé et exécute exactement cette commande.

**Déroulé complet de l'incident et de la résolution :**

```
# Tentative naïve
$ ts-node prisma/seed.ts
error TS6059: File 'prisma/seed.ts' is not under 'rootDir' 'src'
❌ Plantage

# Solution adoptée
$ ts-node --transpile-only prisma/seed.ts
Seeded users: alice bob
Seeded admin map: The Depths — Level 1
✅ Succès
```

**Ce qu'on accepte en échange :** si `seed.ts` contient une erreur de type (ex. passer un `string` là où Prisma attend un `number`), ts-node ne le détectera pas. L'erreur surgira à l'exécution. C'est acceptable pour un script de seed — ce serait inacceptable pour `src/server.ts`.

**Commandes à retenir :**

| Commande | Quand |
|----------|-------|
| `npm run db:migrate` | Après toute modification de `schema.prisma` |
| `npm run db:seed` | Après le premier migrate, ou pour réinitialiser les données |
| `npm run db:studio` | Pour inspecter la base visuellement (Prisma Studio) |
