# Portal Soma — apps/web (Next 16 standalone)
# Build context: monorepo root (app/)
# Build: docker build -f apps/web/Dockerfile .

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# ===== Deps + Build =====
FROM base AS builder
WORKDIR /app

# Copia manifests primeiro pra cachear deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/

# Cache de deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline

# Copia código completo
COPY apps/web/ ./apps/web/
COPY apps/admin/ ./apps/admin/

# Prisma client
RUN pnpm --filter @nivertotal/db generate

# Build Next 16 (output: standalone)
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @nivertotal/web build

# ===== Runner =====
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Standalone bundle (já tem node_modules essenciais inline)
COPY --from=builder /app/apps/web/.next/standalone/ ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# Prisma engine binaries (necessário em runtime)
COPY --from=builder /app/node_modules/.pnpm/@prisma+client*/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/.pnpm/@prisma+client*/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
