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

RUN npm install

# Build @ft/shared before backend can import it
COPY shared/ ./shared/
RUN npm run build --workspace=shared

# Copy backend source
COPY backend/ ./backend/

WORKDIR /app/backend

RUN npx prisma generate

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && npm run db:seed && npm run dev"]
