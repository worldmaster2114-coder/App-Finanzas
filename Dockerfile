# ==========================================
# 1. Stage 1: Build stage
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files for caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY artifacts/finanzas-hogar/package.json ./artifacts/finanzas-hogar/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/mockup-sandbox/package.json ./artifacts/mockup-sandbox/
COPY lib/db/package.json ./lib/db/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-zod/package.json ./lib/api-zod/

# Install workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy full source
COPY . .

# Set default envs for Vite build
ENV PORT=5000
ENV BASE_PATH=/

# Build workspace apps
RUN pnpm run build

# ==========================================
# 2. Stage 2: Production Nginx Server
# ==========================================
FROM nginx:alpine AS runner

# Copy built frontend assets from builder stage
COPY --from=builder /app/artifacts/finanzas-hogar/dist/public /usr/share/nginx/html

# Copy Nginx SPA configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
