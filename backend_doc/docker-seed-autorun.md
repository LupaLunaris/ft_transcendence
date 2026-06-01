# Dockerfile — seed automatique au démarrage

## Contexte

Le seed peuple la base avec les données initiales nécessaires au fonctionnement
du jeu (utilisateurs de test, 8 niveaux de la tour). Sans seed, la tour affiche
"level not found" même si le code est correct.

---

## Problème initial

Le `CMD` du Dockerfile ne lançait que la migration et le serveur :

```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
```

Le seed n'était jamais exécuté automatiquement. Après chaque `make docker-restart`
ou `make docker-up` sur une base vide, il fallait lancer manuellement :

```bash
docker compose exec backend npm run db:seed
```

---

## Fix

```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && npm run db:seed && npm run dev"]
```

Ordre de démarrage à chaque boot du container :

```
1. prisma migrate deploy   → applique les migrations en attente (no-op si à jour)
2. npm run db:seed         → upsert des données initiales (idempotent)
3. npm run dev             → lance nodemon + ts-node
```

---

## Pourquoi c'est safe de seeder à chaque démarrage

Toutes les insertions utilisent `upsert` (pas `create`). Si les données existent
déjà, Prisma les met à jour silencieusement sans erreur ni doublon.

Conséquence : si un admin modifie un niveau de la tour via l'éditeur, le seed
**le réécrase** au prochain redémarrage du container. C'est intentionnel — le
seed définit l'état canonique des niveaux par défaut.

Si on veut préserver les modifications admin à travers les redémarrages, il
faudrait changer le bloc `update: {}` dans `seedTower()` pour ne rien écraser
(laisser le update vide comme dans `seed.ts` pour le user alice/bob).

---

## Cas limites

| Situation | Comportement |
|-----------|-------------|
| Base vide (premier `docker-up`) | Seed crée les 8 niveaux |
| Base existante (restart sans `-v`) | Seed upsert → niveaux remis à l'état canonique |
| `make docker-down-v` puis `docker-up` | Volumes supprimés → seed recrée tout |
| Seed en erreur | Le container plante avant `npm run dev` — voir `docker compose logs backend` |
