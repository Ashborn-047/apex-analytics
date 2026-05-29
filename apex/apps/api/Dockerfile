FROM oven/bun:1.3-slim AS base
WORKDIR /usr/src/app

# Copy monorepo configuration and workspace descriptors
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/embed/package.json ./apps/embed/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/track-utils/package.json ./packages/track-utils/

# Install monorepo dependencies
RUN bun install --frozen-lockfile

# Copy source files
COPY apps/api ./apps/api
COPY packages/db ./packages/db
COPY packages/types ./packages/types
COPY packages/track-utils ./packages/track-utils

# Production environment configurations
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "workspace", "api", "run", "start"]
