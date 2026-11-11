# Dockerfile para despliegue en Google Cloud Run
# Juan Carlos | Mines AI 💎

FROM node:22-slim AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias completas para compilación
RUN npm ci

# Copiar código fuente
COPY . .

# Compilar Frontend (Vite) y empaquetar Backend (esbuild)
RUN npm run build

# Imagen de producción liviana
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Instalar únicamente dependencias de ejecución
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar artefactos compilados y estáticos
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json

# Puerto expuesto (Cloud Run asigna $PORT automáticamente)
EXPOSE 8080

# Iniciar servidor compilado
CMD ["node", "dist/server.js"]
