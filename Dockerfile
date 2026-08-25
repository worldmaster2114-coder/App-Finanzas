FROM node:22-alpine

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

WORKDIR /app

# Install deps first (layer caching)
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

# Copy source after deps
COPY . .

# Build everything (frontend + backend)
RUN pnpm run build

ENV NODE_ENV=production
ENV PORT=5000
ENV FRONTEND_DIST=/app/artifacts/finanzas-hogar/dist/public

EXPOSE 5000

CMD ["node", "artifacts/api-server/dist/index.mjs"]
