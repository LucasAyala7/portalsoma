# Portal Soma — apps/admin (Next 16 standalone, login bcryptjs)
# Build context: monorepo root (app/)
# Build: docker build -f apps/admin/Dockerfile .

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# ===== Deps + Build =====
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

RUN pnpm --filter @nivertotal/db db:generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @nivertotal/admin build

# ===== Runner =====
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/apps/admin/.next/standalone/ ./
COPY --from=builder /app/apps/admin/.next/static ./apps/admin/.next/static
# Admin não tem public/, mas garante diretório se algum dia tiver
RUN mkdir -p ./apps/admin/public

# Prisma client + engines
COPY --from=builder /app/node_modules/.pnpm/@prisma+client*/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/.pnpm/@prisma+client*/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3001
CMD ["node", "apps/admin/server.js"]
