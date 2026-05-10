# Portal Soma

Mini-CMS autopublisher pra mensagens de aniversário PT-BR. Stack: Next 16 SSG + Postgres + BullMQ + Claude Sonnet 4.6 + Replicate Flux + R2.

## Arquitetura

```
apps/
  web/          Next 16 SSG (output: export) — site público
  admin/        Next 16 standalone — CMS autenticado
packages/
  db/           Prisma schema + client + seeds
  ai/           Claude wrapper + persona system + quality gate
  images/       Replicate Flux + @vercel/og + R2 upload
  ingest/       WP XML importer + bulk CSV/XLSX import
  ui/           shadcn compartilhado (futuro)
workers/
  generator/    consome fila AI → gera mensagem com Claude
  imagery/      consome fila IMAGE → gera Flux/OG
  publisher/    publica + IndexNow
  _shared/      utils comuns
```

## URL pattern

`/[head-nicho]/[modifier-1]/[modifier-2]/[slug]/` — máx 4 segmentos.

Empilhamento oportunista:
- Cluster (lvl 1): sempre
- Cluster head ≥ 1k vol: desbloqueia complementos (lvl 2)
- Complemento ≥ 100 vol: vira página própria

Exemplos:
- `/mensagem-de-aniversario/para-mae/` — head 60k
- `/mensagem-de-aniversario/para-mae/evangelica/` — combo 27k
- `/mensagem-de-aniversario/para-mae/feliz-aniversario-mae-querida/` — single

## Setup

```bash
cd app/

# 1. Dependências
pnpm install

# 2. Infra (postgres + redis + bull-board em :3030)
docker compose up -d

# 3. Env
cp .env.example .env
# preencher: DATABASE_URL, ANTHROPIC_API_KEY, REPLICATE_API_TOKEN, R2_*

# 4. DB
pnpm db:generate
pnpm db:migrate
pnpm db:seed                    # taxonomia (50 clusters) + 8 personas + autores reais

# 5. Criar usuário admin (ad-hoc)
node -e "import('bcrypt').then(b => b.hash('SUASENHA', 10).then(h => console.log(h)))"
# usar o hash em INSERT manual em AdminUser, ou via Prisma Studio
pnpm db:studio

# 6. Dev
pnpm dev:web                    # http://localhost:3000
pnpm dev:admin                  # http://localhost:3001
pnpm dev:workers                # generator + imagery + publisher em paralelo
# bull-board: http://localhost:3030
```

## Workflows comuns

### Importar WP atual
```bash
# 1. Exportar XML do WP (admin > Tools > Export)
# 2. Salvar em ../inputs/wp-export/dump.xml
# 3. Dry-run primeiro
pnpm --filter @nivertotal/ingest import-wp -- --file ../../inputs/wp-export/dump.xml --dry-run

# 4. Rodar de verdade
pnpm --filter @nivertotal/ingest import-wp -- --file ../../inputs/wp-export/dump.xml

# Resultado: posts entram como REVIEW + redirects 301 criados
```

### Bulk import via planilha
1. Subir CSV/XLSX em `/admin/mensagens/bulk-import`
2. Preview em dry-run
3. Confirmar → enfileira jobs (geração IA + imagem)
4. Acompanhar em /admin (dashboard) ou bull-board (:3030)

### Gerar 30 mensagens novas (manual)
```bash
# script ad-hoc enfileirando jobs no admin
# (em sprint 2 vira cron diário automático com cota dinâmica SerpAPI)
```

## Quality gate

Cada mensagem gerada passa por:
- Banned phrases (clichês do WP atual: "Hoje celebro", "Que Deus te abençoe" etc)
- Length compliance (curta 50-100w / media 80-200w / longa 150-350w)
- Similaridade Jaccard de bigrams ≥ 0.6 com mensagens recentes do mesmo cluster → rejeita
- Sem placeholders [NOME], sem hashtags, ≤2 emojis

Score < 0.4 → REJECTED.
Score 0.4-0.74 → REVIEW (revisar manual).
Score ≥ 0.75 → REVIEW também (ainda gateway humano antes do PUBLISHED).

## Tier de mídia

- **TIER_1** (~25% top serpScore): Flux Pro hero + OG + Pinterest = ~R$0,15/post
- **TIER_2** (~35%): Flux Schnell hero + OG programático = ~R$0,03/post
- **TIER_3** (~40% cauda longa): só @vercel/og programático = R$0/post

Atribuição automática baseada em `Cluster.serpScore` (ver Sprint 2 — SerpAPI ingestor).

## Build estático

```bash
pnpm --filter @nivertotal/web build
# saida: apps/web/out/ — servir com nginx
```

Webhook de PUBLISHED em uma mensagem dispara rebuild incremental
(implementação em Sprint 2 — endpoint `/api/revalidate` do worker publisher).

## Custo operacional projetado (~150 posts/dia)
- Claude Sonnet 4.6: ~R$ 14/mês
- Flux Pro+Schnell: ~R$ 50/mês
- SerpAPI: ~R$ 30/mês
- VPS Coolify + R2: ~R$ 50/mês
- **Total: ~R$ 150/mês**

Capacidade: 50k+ posts em 24 meses.
