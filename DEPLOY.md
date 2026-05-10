# Deploy — Portal Soma em Coolify

Guia passo-a-passo pra subir os 3 apps (web + admin + workers) na sua VPS Coolify, com Postgres + Redis dedicados pro projeto.

## Pré-requisitos
- VPS com Coolify rodando
- Domínio `portalsoma.com.br` apontando pra IP do VPS via Cloudflare
- Conta Cloudflare nova com R2 bucket criado (`portalsoma-media`)
- API tokens prontos: Anthropic, Replicate, Cloudflare R2

## 1. Push do repo pro GitHub

```bash
cd /c/Users/lucas\ 1/Desktop/LUCAS/nivertotal/app
git init
git add .
git commit -m "Initial commit — Portal Soma"

# cria repo privado em github.com/LucasAyala7/portalsoma
gh repo create LucasAyala7/portalsoma --private --source=. --push
```

## 2. Criar projeto no Coolify

No painel Coolify:
1. **New Resource → Docker Compose** (recomendado, sobe tudo de uma)
2. Source: `LucasAyala7/portalsoma` (autorizar GitHub se primeira vez)
3. Branch: `main`
4. Build pack: `Docker Compose`
5. Compose file: `docker-compose.production.yml`
6. Base directory: `/`

## 3. Variáveis de ambiente

Cole no Coolify env panel (Application → Environment Variables) — **uma por linha** copiando do `.env.production.example`. Preencher os `CHANGEME`:

```
POSTGRES_PASSWORD=<senha forte>
REDIS_PASSWORD=<senha forte>
DATABASE_URL=postgresql://nivertotal:<POSTGRES_PASSWORD>@postgres:5432/nivertotal?schema=public
REDIS_URL=redis://default:<REDIS_PASSWORD>@redis:6379

ANTHROPIC_API_KEY=sk-ant-...
REPLICATE_API_TOKEN=r8_...

R2_ACCOUNT_ID=<da CF dashboard>
R2_ACCESS_KEY_ID=<gerar em R2 → Manage R2 API Tokens>
R2_SECRET_ACCESS_KEY=<idem>
R2_BUCKET=portalsoma-media
R2_PUBLIC_URL=https://media.portalsoma.com.br

NEXTAUTH_SECRET=<openssl rand -base64 32>
ADMIN_URL=https://admin.portalsoma.com.br
NEXT_PUBLIC_SITE_URL=https://www.portalsoma.com.br
NEXT_PUBLIC_SITE_NAME=Portal Soma

LIMITE_GLOBAL_DIA=50
```

## 4. Domínios e roteamento (Coolify)

Coolify usa Traefik como reverse proxy. Mapear:
- **Service `web`** → `portalsoma.com.br` + `www.portalsoma.com.br` (www → redirect 301)
- **Service `admin`** → `admin.portalsoma.com.br`
- **Bucket R2 público** → `media.portalsoma.com.br` (via CF Custom Domain → R2)

Coolify gera SSL Let's Encrypt automaticamente (se DNS já apontou).

## 5. Migration inicial do schema

Após primeiro deploy, abrir terminal no container `web` (ou `admin`) e rodar:

```bash
pnpm --filter @nivertotal/db prisma db push --accept-data-loss
```

Não precisa de `migrate dev` — `db push` cria tudo.

## 6. Seed inicial (clusters + personas + autores)

```bash
pnpm --filter @nivertotal/db prisma db seed
```

OU rodar o script localmente ANTES do deploy apontando pra `DATABASE_URL` de produção (mais confortável).

## 7. Importar dados existentes (mensagens, imagens, redirects)

Local → produção:

```bash
# 1) Dump local
pg_dump -h localhost -U nivertotal nivertotal > niver_dump.sql

# 2) Restore na VPS (via SSH no container postgres do Coolify)
psql -U nivertotal nivertotal < niver_dump.sql
```

OU mais limpo: rodar `mass-produce.ts` direto contra `DATABASE_URL` de produção, do seu PC. Como mensagens já estão geradas, o dump faz mais sentido.

## 8. Sync de imagens

Imagens hoje estão em `apps/web/public/img/` (filesystem local). Pra produção:

**Opção A — Subir tudo pro R2** (recomendado, CDN global):
```bash
# Script que faz upload em batch dos PNG/JPG locais → R2
NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/upload-images-r2.ts
```
*(esse script ainda precisa ser criado — me avisa quando R2 tiver creds)*

**Opção B — Servir do filesystem do container** (mais simples, sem CDN):
- O `apps/web/public/img/` está commitado no repo
- Após deploy, imagens são servidas direto pelo Next via `/img/...`
- **Problema**: cada redeploy refaz, e tamanho do repo vai inchar. Pra inicial OK, pra escala vai pra R2.

## 9. Pós-deploy — checklist

- [ ] Acessar `https://www.portalsoma.com.br/` → home com clusters principais
- [ ] Acessar `https://www.portalsoma.com.br/mensagem-de-aniversario/para-amiga/` → category page
- [ ] Acessar uma mensagem aleatória, ver hero+OG
- [ ] Acessar `https://admin.portalsoma.com.br/login` → autenticar com user `lucas`
- [ ] Verificar `/sitemap.xml` retornar XML válido
- [ ] Testar redirect 301: `https://www.portalsoma.com.br/mensagem-de-aniversario/pai/celebre-seu-pai-neste-aniversario-especial/` → deve redirecionar pra cluster novo

## 10. Search Console + IndexNow

Após DNS apontar e site no ar:
1. **Search Console**: adicionar `portalsoma.com.br`, verificar via DNS TXT. Submeter sitemap `https://www.portalsoma.com.br/sitemap.xml`.
2. **IndexNow**: gerar chave 32 chars hex, salvar em `apps/web/public/<chave>.txt` com conteúdo da chave. Worker ping IndexNow toda PUBLISHED nova.
3. **Bing Webmaster**: mesmo procedimento, importa do GSC.

## 11. Cron pro scheduler

O worker `scheduler` já tem setInterval de 6h interno. Roda automaticamente.

Pra forçar tick manual: `docker exec -it niver-workers pnpm --filter @nivertotal/worker-scheduler tick` (se o script tiver um modo CLI; senão restart container).

## 12. Backup automático (recomendado)

Coolify tem feature de backup Postgres. Habilitar diário às 4h.

---

## Comandos úteis pós-deploy

```bash
# Logs em tempo real (de qualquer serviço)
docker logs -f niver-web
docker logs -f niver-admin
docker logs -f niver-workers

# Acessar shell no container web
docker exec -it niver-web sh

# Forçar regenerate Prisma (se schema mudar)
docker exec niver-web pnpm --filter @nivertotal/db db:generate

# Status filas BullMQ (do admin)
curl https://admin.portalsoma.com.br/api/queues/stats
```

## Dependências pendentes (Lucas)

- [ ] CF account ID + R2 token (pra trocar fallback local por R2 real)
- [ ] Domínio portalsoma.com.br DNS apontando pro VPS Coolify
- [ ] GitHub PAT (se for usar Actions; deploy via push direto não precisa)
- [ ] SerpAPI key (Sprint 2 — opcional inicial)
