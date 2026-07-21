# Build context: monorepo root (docker-compose sets context: .)
FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Copy workspace manifests for layer caching
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
# frontend manifest needed for npm install (workspaces resolution)
COPY frontend/package.json ./frontend/

RUN npm ci --include=optional

# Build @ft/shared before backend can import it
COPY shared/ ./shared/
RUN npm run build --workspace=shared

# Copy backend source
COPY backend/ ./backend/

WORKDIR /app/backend

ARG DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
RUN DATABASE_URL=${DATABASE_URL} npx prisma generate

EXPOSE 3001

CMD ["node", "-r", "ts-node/register", "src/index.ts"]
