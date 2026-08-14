# ---- Stage 1: build do frontend (React + Vite) ----
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Vazio = same-origin: o frontend chama a API no mesmo host/porta do backend,
# já que ambos são servidos pelo mesmo container.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- Stage 2: backend (Express) servindo API + arquivos estáticos do frontend ----
FROM node:20-alpine AS backend
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY backend/ ./
# .env real fica de fora (ver .dockerignore); configure via variáveis de ambiente no run.
# example.env documenta as variáveis esperadas direto na imagem (não é lido em runtime).
COPY .env.example ./example.env
RUN mkdir -p ./public/covers
COPY --from=frontend-build /app/frontend/dist ./public

EXPOSE 3000
CMD ["node", "bin/www"]
