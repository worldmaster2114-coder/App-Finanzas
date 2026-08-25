FROM node:22-alpine

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

WORKDIR /app

# Copy repository source code
COPY . .

# Install dependencies and build monorepo packages
RUN pnpm install --frozen-lockfile
RUN pnpm run build

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "artifacts/api-server/dist/index.mjs"]
