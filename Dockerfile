FROM node:22-alpine

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

WORKDIR /app

# ── 1. Install dependencies (cached layer) ─────────────────────────────────
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/finanzas-hogar/package.json ./artifacts/finanzas-hogar/
COPY artifacts/mockup-sandbox/package.json ./artifacts/mockup-sandbox/
COPY lib/db/package.json ./lib/db/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY scripts/package.json ./scripts/

RUN pnpm install --frozen-lockfile

# ── 2. Copy source ─────────────────────────────────────────────────────────
COPY . .

# ── 3. Build frontend (Vite → dist/public) ─────────────────────────────────
RUN pnpm --filter @workspace/finanzas-hogar run build

# ── 4. Build backend (esbuild → dist/index.mjs, no pino workers) ───────────
RUN pnpm --filter @workspace/api-server run build

# ── 5. Runtime config ──────────────────────────────────────────────────────
ENV NODE_ENV=production
ENV PORT=5000
ENV FRONTEND_DIST=/app/artifacts/finanzas-hogar/dist/public

EXPOSE 5000

# Use node_modules pino directly since it's externalized from the bundle
CMD ["node", "artifacts/api-server/dist/index.mjs"]
