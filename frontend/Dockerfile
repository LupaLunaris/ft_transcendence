# Build context: monorepo root (docker-compose sets context: .)
FROM node:20-alpine

WORKDIR /app

# Copy workspace manifests for layer caching
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN npm install

# Build @ft/shared before frontend can import it
COPY shared/ ./shared/
RUN npm run build --workspace=shared

# Copy frontend source
COPY frontend/ ./frontend/

WORKDIR /app/frontend

EXPOSE 5173

# --host exposes Vite outside the container (needed for Docker port binding)
CMD ["npm", "run", "dev", "--", "--host"]