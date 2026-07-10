#!/bin/bash

set -e
 
SECRETS_DIR="vault/secrets"
INIT_FILE="$SECRETS_DIR/init-output.txt"
ENV_FILE=".env"
 
# ── Helpers ───────────────────────────────────────────────────────────────────
 
strip_ansi() {
  sed -E 's/\x1B\[[0-9;]*[mK]//g'
}
 
vault_cmd() {
  docker exec vault vault "$@"
}
 
vault_login() {
  ROOT_TOKEN=$(strip_ansi < "$INIT_FILE" | grep 'Initial Root Token:' | awk '{print $NF}' | tr -d '\r')
  docker exec -i vault vault login - <<< "$ROOT_TOKEN" > /dev/null
}
 
set_env() {
  KEY="$1"
  VALUE="$2"
  if grep -q "^${KEY}=" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^${KEY}=.*|${KEY}=${VALUE}|" "$ENV_FILE"
  else
    echo "${KEY}=${VALUE}" >> "$ENV_FILE"
  fi
}
 
# ── Step 1: Initialize ────────────────────────────────────────────────────────
printf "\033[36m[vault-init] Initializing Vault...\033[0m\n"
mkdir -p "$SECRETS_DIR"
docker exec vault vault operator init -key-shares=5 -key-threshold=3 > "$INIT_FILE"
printf "\033[32m[vault-init] Keys saved to %s (gitignored)\033[0m\n" "$INIT_FILE"
 
# ── Step 2: Unseal ────────────────────────────────────────────────────────────
printf "\033[36m[vault-init] Unsealing Vault...\033[0m\n"
for i in 1 2 3; do
  KEY=$(strip_ansi < "$INIT_FILE" | grep "Unseal Key ${i}:" | awk '{print $NF}' | tr -d '\r')
  docker exec vault vault operator unseal "$KEY" > /dev/null
done
printf "\033[32m[vault-init] Vault unsealed.\033[0m\n"
 
# ── Step 3: Login ─────────────────────────────────────────────────────────────
printf "\033[36m[vault-init] Logging in with root token...\033[0m\n"
vault_login
 
# ── Step 4: Enable KV v2 ─────────────────────────────────────────────────────
printf "\033[36m[vault-init] Enabling KV v2 secrets engine...\033[0m\n"
vault_cmd secrets enable -path=secret kv-v2 > /dev/null
printf "\033[32m[vault-init] KV v2 enabled at secret/\033[0m\n"
 
# ── Step 5: Write backend policy ──────────────────────────────────────────────
printf "\033[36m[vault-init] Writing backend policy...\033[0m\n"
docker exec -i vault vault policy write backend-policy - << 'EOF'
path "secret/data/ft_transcendence/backend" {
  capabilities = ["read"]
}
EOF
printf "\033[32m[vault-init] Policy written.\033[0m\n"
 
# ── Step 6: Enable AppRole + create role ──────────────────────────────────────
printf "\033[36m[vault-init] Enabling AppRole auth...\033[0m\n"
vault_cmd auth enable approle > /dev/null
vault_cmd write auth/approle/role/backend-role \
  token_policies="backend-policy" \
  token_ttl=1h \
  token_max_ttl=4h \
  secret_id_num_uses=0 > /dev/null
printf "\033[32m[vault-init] AppRole configured.\033[0m\n"
 
# ── Step 7: Get role-id + secret-id → write to .env ──────────────────────────
printf "\033[36m[vault-init] Generating AppRole credentials...\033[0m\n"
ROLE_ID=$(vault_cmd read -field=role_id auth/approle/role/backend-role/role-id | tr -d '\r')
SECRET_ID=$(vault_cmd write -field=secret_id -f auth/approle/role/backend-role/secret-id | tr -d '\r')
 
set_env "VAULT_ROLE_ID"   "$ROLE_ID"
set_env "VAULT_SECRET_ID" "$SECRET_ID"
printf "\033[32m[vault-init] VAULT_ROLE_ID and VAULT_SECRET_ID written to .env\033[0m\n"
 
# ── Step 8: Generate secrets + write to Vault ─────────────────────────────────
printf "\033[36m[vault-init] Generating and storing secrets in Vault...\033[0m\n"
 
POSTGRES_USER=$(grep "^POSTGRES_USER=" "$ENV_FILE" | cut -d= -f2 | tr -d '\r')
POSTGRES_PASSWORD=$(grep "^POSTGRES_PASSWORD=" "$ENV_FILE" | cut -d= -f2 | tr -d '\r')
POSTGRES_DB=$(grep "^POSTGRES_DB=" "$ENV_FILE" | cut -d= -f2 | tr -d '\r')
JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n\r')
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}"
 
vault_cmd kv put secret/ft_transcendence/backend \
  DATABASE_URL="$DATABASE_URL" \
  JWT_SECRET="$JWT_SECRET" > /dev/null
 
printf "\033[32m[vault-init] Secrets stored in Vault.\033[0m\n"
printf "\033[32m[vault-init] First-time setup complete.\033[0m\n"