# ═══════════════════════════════════════════════════════════
#  Stage 1 — Build
# ═══════════════════════════════════════════════════════════
FROM node:22-alpine AS build

WORKDIR /app

# Instalar dependencias (cacheadas mientras no cambie package*.json)
COPY package.json package-lock.json ./
RUN npm ci

# Copiar el código fuente y compilar
COPY . .
RUN npx ng build --configuration=production

# ═══════════════════════════════════════════════════════════
#  Stage 2 — Serve con Nginx
# ═══════════════════════════════════════════════════════════
FROM nginx:stable-alpine AS production

# Configuración de Nginx para SPA (reescribe todo a index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los artefactos del build
COPY --from=build /app/dist/app-sistemapos/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
