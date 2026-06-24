ui = true

listener "tcp" {
    address = "0.0.0.0:8200"
    tls_cert_file = "/vault/certs/vault-cert.pem"
    tls_key_file = "/vault/certs/vault-key.pem"
}

storage "raft" {
    path = "/vault/file"
    node_id = "node1"
}

api_addr = "https://127.0.0.1:8200"
cluster_addr = "https://127.0.0.1:8201"
disable_mlock = true