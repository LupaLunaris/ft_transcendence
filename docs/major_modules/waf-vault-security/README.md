# Module: WAF / ModSecurity + HashiCorp Vault

For the Major Module: harden the infrastructure with a Web Application Firewall and a secrets-management / PKI solution, instead of storing credentials in plaintext configuration.

**Points:** 2 · **Owner:** Jerem

## Overview

Two infrastructure concerns are addressed independently: incoming traffic is filtered by a WAF before it ever reaches application code, and every secret the backend needs (`DATABASE_URL`, `JWT_SECRET`) is fetched at boot from HashiCorp Vault over a locally-issued TLS connection, authenticated with AppRole credentials — never stored in `.env` in plaintext, and never baked into the Docker image. The whole stack (frontend, API, WebSocket) sits behind a single TLS-terminating reverse proxy, and HTTP is unconditionally redirected to HTTPS.

## Stack

| Concern | Technology |
|---|---|
| Reverse proxy / TLS termination | [nginx](https://nginx.org) (`nginx/nginx.conf`) |
| WAF | [OWASP ModSecurity Core Rule Set](https://coreruleset.org), via the `owasp/modsecurity-crs:nginx-alpine` image (`nginx/modsec/`) |
| Secrets / PKI | [HashiCorp Vault](https://www.vaultproject.io) 1.17, KV v2 engine + AppRole auth (`vault/`) |
| Orchestration | Docker Compose (`docker-compose.yml`) |

## How it works

### Request path: nginx → WAF → backend

`nginx` is the only service with published ports (`8080`, `8443`). It terminates TLS with a certificate issued through the same internal PKI as Vault, redirects all plain HTTP to HTTPS, and routes `/api/` and `/socket.io/` to the `waf` service rather than directly to `backend`:

```nginx
server { listen 80; return 301 https://$host$request_uri; }

server {
  listen 443 ssl;
  ssl_certificate     /etc/nginx/certs/nginx-cert.pem;
  ssl_certificate_key /etc/nginx/certs/nginx-key.pem;

  location /api/       { proxy_pass http://waf:8080; ... }
  location /socket.io/ { proxy_pass http://waf:8080; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade"; ... }
  location /            { proxy_pass http://frontend:5173; ... }
}
```

The `waf` service (`owasp/modsecurity-crs:nginx-alpine`) sits between nginx and `backend`, applying the OWASP CRS ruleset to every API and WebSocket request before it can reach Express:

```yaml
waf:
  image: owasp/modsecurity-crs:nginx-alpine
  environment:
    - BACKEND=http://backend:3001
    - PARANOIA=1
    - ANOMALY_INBOUND=5
    - ANOMALY_OUTBOUND=4
    - ALLOWED_METHODS=GET HEAD POST PUT DELETE OPTIONS
    - MODSEC_AUDIT_LOG_FORMAT=JSON
```

Audit logging is tuned in `nginx/modsec/override.conf` to keep only relevant events, as structured JSON — so a rejected request can actually be traced back to which CRS rule fired, not just that "something" was blocked.

### Secrets: AppRole login, not a static token in `.env`

`backend/src/bootstrap.ts` runs before anything else in the backend process — before `server.ts`, and therefore before Prisma or `jsonwebtoken` ever read `process.env`:

```ts
export async function loadVaultSecrets(): Promise<void> {
  if (!VAULT_ROLE_ID || !VAULT_SECRET_ID) {
    if (process.env.NODE_ENV === 'production') throw new Error('VAULT_ROLE_ID and VAULT_SECRET_ID must be set...');
    // local dev only: no Vault container running, fall back to backend/.env
    require('dotenv').config();
    return;
  }
  const token = await getVaultToken();               // POST /v1/auth/approle/login {role_id, secret_id}
  const secrets = await readSecret(token, SECRET_PATH); // GET  /v1/secret/data/ft_transcendence/backend
  process.env.DATABASE_URL = secrets.DATABASE_URL;
  process.env.JWT_SECRET   = secrets.JWT_SECRET;
}
```

In Docker, the backend only ever holds `VAULT_ROLE_ID`/`VAULT_SECRET_ID` — narrow, revocable AppRole credentials, not the actual database password or JWT signing key. Those real secrets exist only inside Vault's KV store and in the backend process's memory after a successful login; they are never written to disk in the image or the compose file. In local (non-Docker) development, where there is no Vault container to talk to, the same code path degrades to reading `backend/.env` directly — one code path, two environments, no separate "dev secrets" mechanism to keep in sync.

### Bootstrapping Vault itself

`vault/vault-init.sh` is the one-time setup that turns a fresh Vault container into something the backend can actually authenticate against: initialize + unseal (Shamir 5-share/3-threshold), enable the KV v2 engine, write a policy scoped to exactly one path, enable AppRole auth, create the backend's role, and mint its `role_id`/`secret_id` — written into the root `.env` for `docker-compose` to hand to the `backend` service:

```bash
docker exec vault vault operator init -key-shares=5 -key-threshold=3 > "$INIT_FILE"
vault_cmd secrets enable -path=secret kv-v2
docker exec -i vault vault policy write backend-policy - <<'EOF'
path "secret/data/ft_transcendence/backend" { capabilities = ["read"] }
EOF
vault_cmd auth enable approle
vault_cmd write auth/approle/role/backend-role token_policies="backend-policy" token_ttl=1h token_max_ttl=4h secret_id_num_uses=0
ROLE_ID=$(vault_cmd read -field=role_id auth/approle/role/backend-role/role-id)
SECRET_ID=$(vault_cmd write -field=secret_id -f auth/approle/role/backend-role/secret-id)
```

The `backend-policy` grants read on exactly one KV path (`secret/data/ft_transcendence/backend`) — the backend's AppRole cannot read any other secret Vault might ever hold, and its issued token expires after at most 4 hours (`token_max_ttl`).

### Vault's own listener is TLS too

`vault/config/vault.hcl` runs Vault's API on `0.0.0.0:8200` with its own certificate (`vault-cert.pem`/`vault-key.pem`) — the backend's `bootstrap.ts` calls `https://vault:8200`, trusting a locally-generated CA (`vault/generate-certs.sh` issues one CA and per-service leaf certs for Vault and nginx, and the backend container is pointed at that CA via `NODE_EXTRA_CA_CERTS`). Storage is `raft`, so Vault's own state survives container restarts without an external dependency.

## Diagram

```text
Internet / Browser
   │  :80 → 301 redirect                         :443 (TLS, ssl_certificate = nginx-cert.pem)
   ▼
 nginx  (TLS termination, only service with published ports)
   │
   ├── /             → frontend:5173
   └── /api/, /socket.io/
          ▼
        waf  (ModSecurity + OWASP CRS, PARANOIA=1)
          │  malicious request → blocked + JSON audit log
          ▼
       backend:3001  (Express + Socket.IO)
          │
          │ at process boot, before Prisma/JWT are used:
          │ POST https://vault:8200/v1/auth/approle/login {VAULT_ROLE_ID, VAULT_SECRET_ID}
          ▼
        vault:8200  (TLS, raft storage)
          │  read-only policy on secret/data/ft_transcendence/backend
          ▼
   DATABASE_URL, JWT_SECRET  →  injected into process.env, never written to disk
```

## Why this satisfies the module

- A real WAF (ModSecurity + OWASP CRS) sits in front of the application on every API and WebSocket request, not just a note in the README — configurable paranoia level, method allowlist, and structured audit logging.
- Secrets are never stored in plaintext configuration: the backend authenticates to Vault with narrowly-scoped, short-lived AppRole credentials and receives `DATABASE_URL`/`JWT_SECRET` only in memory, at boot.
- The Vault policy is least-privilege (read-only, one path) and its own listener — like nginx's — is TLS, issued from a project-local PKI rather than self-signed ad hoc certificates per service.
- HTTPS is enforced end to end: HTTP is redirected, not merely accepted alongside HTTPS.
