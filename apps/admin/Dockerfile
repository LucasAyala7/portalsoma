# Portal Soma — apps/admin (Next 16 + pnpm monorepo, sem standalone)
# Build context: monorepo root (app/)

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# ===== Builder =====
FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/admin/package.json ./apps/admin/
COPY apps/web/package.json ./apps/web/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline

COPY apps/admin/ ./apps/admin/
COPY apps/web/ ./apps/web/

RUN pnpm --filter @nivertotal/db generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @nivertotal/admin build

# ===== Runner (mantém node_modules — standalone tem bug com pnpm monorepo) =====
FROM builder AS runner
WORKDIR /app/apps/admin
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
EXPOSE 3001
CMD ["pnpm", "exec", "next", "start", "-p", "3001", "-H", "0.0.0.0"]
