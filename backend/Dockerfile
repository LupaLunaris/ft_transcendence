# Build context: monorepo root
FROM node:20-alpine AS builder

WORKDIR /app

# Workspace manifests for layer caching
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN npm ci

# Build shared first
COPY shared/ ./shared/
RUN npm run build --workspace=shared

# Copy backend source and compile
COPY backend/ ./backend/
RUN npm run build --workspace=backend

# Generate Prisma client (needs schema, no DB needed here)
RUN npx --prefix backend prisma generate --schema=backend/prisma/schema.prisma

# ---- Runtime ----
FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Copy only what runtime needs
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/backend/prisma ./backend/prisma

WORKDIR /app/backend

EXPOSE 3001

# migrate deploy is idempotent and safe for prod — runs pending migrations then starts
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
