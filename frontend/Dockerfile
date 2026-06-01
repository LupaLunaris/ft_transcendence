# Build context: monorepo root
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN npm ci

COPY shared/ ./shared/
RUN npm run build --workspace=shared

COPY frontend/ ./frontend/

# VITE_ vars are baked into the JS bundle at build time — must be ARGs
ARG VITE_API_URL=/api/v1
ARG VITE_BACKEND_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

RUN npm run build --workspace=frontend

# ---- Runtime: nginx serves the static bundle ----
FROM nginx:alpine

# Generate self-signed cert
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/certs && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/nginx/certs/key.pem \
      -out /etc/nginx/certs/cert.pem \
      -subj "/C=BE/ST=Brussels/L=Brussels/O=42/CN=localhost"

COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443