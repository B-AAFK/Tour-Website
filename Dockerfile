# =============================================================================
# Stage 1: Builder — Install dependencies & build Vite multi-page bundle
# =============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy lockfiles first so npm ci layer stays cached when only source changes
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source and build dist/
COPY index.html booking.html vite.config.js ./
COPY src ./src
COPY public ./public
RUN npm run build

# =============================================================================
# Stage 2: Runtime — Unprivileged Nginx serving dist/ + 450 WebP sequence frames
# =============================================================================
FROM nginxinc/nginx-unprivileged:alpine AS runtime

# Copy 450 WebP frames (~102 MB) in a dedicated layer before dist/ for layer caching
COPY --chown=nginx:nginx frames /usr/share/nginx/html/frames
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
