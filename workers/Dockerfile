# Portal Soma — workers (scheduler + generator + imagery + publisher)
# Build context: monorepo root (app/)
# Build: docker build -f workers/Dockerfile .

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# ===== Deps =====
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/ ./packages/
COPY workers/ ./workers/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline

# Prisma client
RUN pnpm --filter @nivertotal/db generate

# ===== Runner =====
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app /app

WORKDIR /app/workers/main
CMD ["pnpm", "start"]
