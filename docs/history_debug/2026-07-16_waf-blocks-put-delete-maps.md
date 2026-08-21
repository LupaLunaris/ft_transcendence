# Debug history — 2026-07-16 : WAF bloque la sauvegarde/suppression des maps

## Contexte
Sur la branche `fix/probleme-acces-db`, impossible de sauvegarder (PUT) ou
supprimer (DELETE) une map depuis l'éditeur — les autres routes (GET, POST)
fonctionnaient normalement.

---

## Problème 1 — PUT/DELETE /api/v1/maps/:id retournent 403

### Symptôme
Dans l'éditeur, cliquer sur "Sauvegarder" ou "Supprimer" échoue silencieusement
côté UI (requête réseau en erreur). Le reste de l'application (login, liste des
maps, jeu, tour) fonctionne normalement.

### Cause
Le service `waf` (`owasp/modsecurity-crs:nginx-alpine`, voir `docker-compose.yml`)
proxy toutes les requêtes vers le backend (`frontend` → `waf:8080` → `backend:3001`)
et applique les règles OWASP Core Rule Set. La règle **911100**
(`REQUEST-911-METHOD-ENFORCEMENT.conf`) n'autorise par défaut que
`GET HEAD POST OPTIONS` (`tx.allowed_methods`) — `PUT` et `DELETE` ne sont pas
dans la liste. Chaque requête PUT/DELETE ajoute donc un score d'anomalie qui
atteint immédiatement le seuil de blocage (`ANOMALY_INBOUND=5`), déclenchant la
règle **949110** et un 403.

Confirmé dans le log d'audit ModSecurity (`docker exec waf cat /tmp/modsec_audit.log`) :
```
"message":"Method is not allowed by policy"
"match":"Matched \"Operator `Within' with parameter `GET HEAD POST OPTIONS' against variable `REQUEST_METHOD' (Value: `PUT' )"
"ruleId":"911100"
```

### Fix
Ajouter la variable d'environnement `ALLOWED_METHODS` au service `waf` dans
`docker-compose.yml` (le même mécanisme que `PARANOIA`/`ANOMALY_INBOUND`/
`ANOMALY_OUTBOUND`, déjà utilisés — mapping documenté dans
`/docker-entrypoint.d/configure-rules.v3.conf` de l'image, ligne
`false|ALLOWED_METHODS|900200|allowed_methods|GET OPTIONS`) :

```yaml
  waf:
    environment:
      - ANOMALY_INBOUND=5
      - ANOMALY_OUTBOUND=4
      - ALLOWED_METHODS=GET HEAD POST PUT DELETE OPTIONS
```

Après `docker-compose up -d --force-recreate waf`, les logs confirment
`Configuring 900200 for ALLOWED_METHODS with allowed_methods=GET HEAD POST PUT DELETE OPTIONS`
et les requêtes PUT/DELETE atteignent désormais le backend (testé via
`curl -X PUT/DELETE http://localhost:8080/api/v1/maps/...` → 401 côté backend
au lieu de 403 côté WAF).

### Fichiers impliqués
- `docker-compose.yml` (service `waf`)

---

## Notes architecture
- `nginx/modsec/main.conf`, `crs-setup.conf`, `override.conf` existent dans le
  repo mais **ne sont pas montés** dans le conteneur `waf` (seul
  `modsecurity.conf` l'est, via le volume `./nginx/modsec/modsecurity.conf:/etc/nginx/modsec/modsecurity.conf:ro`).
  Ces trois fichiers sont donc actuellement orphelins — toute modification y
  est sans effet. Le réglage de CRS passe uniquement par les variables
  d'environnement du service `waf` (mécanisme `configure-rules.v3.conf` intégré
  à l'image `owasp/modsecurity-crs`).
- `crs-setup.conf` (non monté) contient de plus une erreur de chemin
  (`Include /etx/modsecurity.d/...` — typo `/etx/` au lieu de `/etc/`) qui le
  rendrait de toute façon inopérant s'il était un jour monté tel quel.
- Si de nouvelles méthodes HTTP sont utilisées côté API à l'avenir (ex. PATCH),
  il faudra les ajouter à `ALLOWED_METHODS`.
