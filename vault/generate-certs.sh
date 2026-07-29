#!/bin/sh
set -e

CERT_DIR="$(dirname "$0")/certs"

if [ -f "$CERT_DIR/vault-cert.pem" ]; then
    echo "Vault certs already exist in $CERT_DIR, skipping generation."
    exit 0
fi

mkdir -p "$CERT_DIR"
cd "$CERT_DIR"

# 1. Generate the CA private key and self-signed CA certificate
openssl genrsa -out ca-key.pem 4096
openssl req -x509 -new -nodes \
  -key ca-key.pem \
  -sha256 -days 3650 \
  -out ca-cert.pem \
  -subj "/C=BE/O=ft_transcendence/CN=ft-transcendence-vault-ca"

# 2. Generate Vault server private key + CSR
openssl genrsa -out vault-key.pem 4096
openssl req -new \
  -key vault-key.pem \
  -out vault.csr \
  -subj "/C=BE/O=ft_transcendence/CN=vault"

# 3. SAN config: must include every hostname/IP the backend will use to reach vault
cat > vault-ext.cnf <<EOF
subjectAltName = DNS:vault, DNS:localhost, IP:127.0.0.1
extendedKeyUsage = serverAuth
EOF

# 4. Sign the server cert with our CA
openssl x509 -req \
  -in vault.csr \
  -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial \
  -out vault-cert.pem \
  -days 825 -sha256 \
  -extfile vault-ext.cnf

rm -f vault.csr vault-ext.cnf

# 5. nginx Https certs
openssl genrsa -out nginx-key.pem 4096
openssl req -new \
  -key nginx-key.pem \
  -out nginx.csr \
  -subj "/C=BE/O=ft_transcendence/CN=localhost"

cat > nginx-ext.cnf << EOF
subjectAltName = DNS:localhost, IP:127.0.0.1
extendedKeyUsage = serverAuth
EOF

openssl x509 -req \
  -in nginx.csr \
  -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial \
  -out nginx-cert.pem \
  -days 825 -sha256 \
  -extfile nginx-ext.cnf

rm -f vault.csr vault-ext.cnf nginx.csr nginx-ext.cnf
rm -f ca-cert.srl

# Permissions: key must be readable by the vault container's unprivileged user
chmod 644 ca-cert.pem vault-cert.pem vault-key.pem nginx-cert.pem nginx-key.pem
chmod 600 ca-key.pem

echo "Vault certs generated in $CERT_DIR."