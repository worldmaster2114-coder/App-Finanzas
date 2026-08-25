# Multi-stage Dockerfile optimized for Dokploy & Docker deployments
FROM node:22-alpine AS builder

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

WORKDIR /app

# Copy root workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/finanzas-hogar/package.json ./artifacts/finanzas-hogar/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY lib/db/package.json ./lib/db/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY artifacts/mockup-sandbox/package.json ./artifacts/mockup-sandbox/
COPY scripts/package.json ./scripts/

# Install workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build frontend and backend bundles
RUN pnpm run build

# Production Runner Stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Copy node_modules and built dist artifacts
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/artifacts/api-server ./artifacts/api-server
COPY --from=builder /app/artifacts/finanzas-hogar ./artifacts/finanzas-hogar
COPY --from=builder /app/lib ./lib

EXPOSE 5000

CMD ["node", "artifacts/api-server/dist/index.mjs"]
