
/* Authenticates to Vault using AppRole, fetches secrets, and populates process.env BEFORE server.ts (and therefore Prisma) is ever imported. 
Called exclusively from index.ts as the very first async operation. */

const VAULT_ADDR        = process.env.VAULT_ADDR   ?? 'http://vault:8200';
const VAULT_ROLE_ID     = process.env.VAULT_ROLE_ID;
const VAULT_SECRET_ID   = process.env.VAULT_SECRET_ID;
const SECRET_PATH       = 'secret/data/ft_transcendence/backend';

if (!VAULT_ROLE_ID || !VAULT_SECRET_ID) {
    throw new Error(
        '[bootstrap] VAULT_ROLE_ID and VAULT_SECRET_ID must be set in environment. ' + 
        'Check your .env file and docker-compose.yml.',
    );
}

async function getVaultToken(): Promise<string> {
    const res = await fetch(`${VAULT_ADDR}/v1/auth/approle/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json' },
        body: JSON.stringify({
            role_id:    VAULT_ROLE_ID,
            secret_id:  VAULT_SECRET_ID,
        }),
    });
    
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`[bootstrap] AppRole login failed (${res.status}): ${body}`);
    }
    
    const data = await res.json() as { auth: { client_token: string } };
    return data.auth.client_token;
}

async function readSecret(token: string, path: string): Promise<Record<string, string>> {
    const res = await fetch(`${VAULT_ADDR}/v1/${path}`, {
        headers: { 'X-Vault-Token': token },
    });
    
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`[bootstrap] Failed to read secret at ${path} (${res.status}): ${body}`);
    }
    
    const data = await res.json() as { data: { data: Record<string, string> } };
    return data.data.data;
}

// Main export: fetch secrets from Vault and inject them into process.env. Must be awaited before any other module that reads process.env is imported.

export async function loadVaultSecrets(): Promise<void> {
    console.log('[bootstrap] Authenticating to Vault via AppRole...');
    const token = await getVaultToken();
    
    console.log(`[bootstrap] Fetching secrets from ${SECRET_PATH}...`);
    const secrets = await readSecret(token, SECRET_PATH);
    
    process.env.DATABASE_URL = secrets.DATABASE_URL;
    process.env.JWT_SECRET = secrets.JWT_SECRET;
    
    // Sanity check — fail fast rather than letting Prisma produce a confusing error
    if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
        throw new Error(
            '[bootstrap] Vault returned secrets but DATABASE_URL or JWT_SECRET is missing. ' +
             `Got keys: ${Object.keys(secrets).join(', ')}`,
        );
    }
    
    console.log('[bootstrap] Secrets loaded succesfully.');
}