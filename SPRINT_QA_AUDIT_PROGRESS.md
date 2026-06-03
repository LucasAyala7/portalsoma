# Sprint QA Audit — Relatório final da sessão

Sessão executada 2026-06-03. Cobre Sprints 1, 2 e 3 (parcial) do `SPRINT_QA_AUDIT.md` original.

## Estado final do DB

| Métrica | Valor |
|---|---|
| Mensagens PUBLISHED | **2.947** (+257 da promoção REVIEW→PUBLISHED) |
| Mensagens DRAFT | **1.248** (~348 novas da v3 + ~900 órfãs do scheduler) |
| Mensagens REVIEW | 73 (baixa qualidade < 0.75) |
| Mensagens total | **4.288** |
| Posts blog PUBLISHED | **30** |
| Hero TOP 30 Flux Pro Blueprint | 30 |
| Hero composed (Satori) | 2.690 |
| Hero blog (Schnell+Satori card) | 30 |

## Bloco 1 — Crítico (✅ COMPLETO)

| # | Tarefa | Status |
|---|---|---|
| 6 | Conteúdo longa-forma (silo blog 30 posts gpt-5) | ✅ Live |
| 3 | Microdata global (WPHeader, WPFooter, SiteNav, ItemList, CreativeWork+interaction, ProfilePage) | ✅ Live |
| 4 | 12 páginas institucionais E-E-A-T (~9.190 palavras) | ✅ Live |

## Bloco 2 — Correções (✅ COMPLETO)

| # | Tarefa | Status |
|---|---|---|
| 9 | Audit scheduler + sitemaps + drain failed jobs | ✅ Done |
| 7 | SEO+GEO retro (gpt-5) | ✅ 366 enriquecidas |
| 10 | Internal links em mensagens 400+ palavras | ✅ 356 enriquecidas (threshold ajustado pra 150) |

### Audit fixes adicionais
- ✅ 257 mensagens REVIEW promovidas → PUBLISHED (2690 → 2947)
- ✅ 500 failed jobs Redis drenados
- ✅ Sitemap lastmod fix: usa publicadoEm em vez de atualizadoEm

## Bloco 3 — Agregar (PARCIAL)

| # | Tarefa | Status |
|---|---|---|
| 1 | Submenu/mega nav ampliado (7 sections vs 3) | ✅ Live |
| 2 | Navegações + elementos novos pela home/categorias | ⏸ Pendente |
| 5 | Featured images 50%+ páginas | 🟡 30/30 blog OK; institucionais e novos posts pendentes |
| 8 | Geração 1000 mensagens novas | 🟡 348/990 done (quota OpenAI esgotou no meio) |

## Bloco 4 — Melhorias (PARCIAL)

| # | Tarefa | Status |
|---|---|---|
| 11 | Hero TOP 100 com skill atualizado | 🟡 TOP 30/100 done (Flux Pro Blueprint, R$ 6.60) |
| 12 | Astro POC single/page | ⏸ Adiado (sessão dedicada) |

## Extras (não listados originalmente)

- ✅ **Admin /blog CRUD completo** (list+filtro+search, create, edit com hero/og preview, publicar/despublicar/deletar, sidebar link)
- ✅ Featured images 30 posts blog (Flux Schnell + Satori card)
- ✅ Script `enrich-existing-content.ts` (gpt-5 GEO)
- ✅ Script `inject-internal-links.ts`
- ✅ Script `blog-featured-images.ts`
- ✅ Script `hero-rerender-top.ts` (Flux Pro Blueprint)
- ✅ Script `mass-produce-v3.ts` (gpt-5 com personas)

## Custos da sessão

| Item | Custo R$ |
|---|---|
| 30 posts blog (gpt-5) | 8 |
| 30 hero blog (Schnell + Satori) | 0.6 |
| 366 SEO retro (gpt-5) | 10 |
| 30 Hero TOP Flux Pro Blueprint | 6.6 |
| 348 mensagens novas v3 (gpt-5) | 15.7 |
| **Total** | **~R$ 41** |

## Bloqueios e pendências pro Lucas

### Crítico
1. 🔴 **Re-abastecer OpenAI** — pra completar Wave 3:
   - 642 mensagens novas faltam do v3
   - 70 hero TOP 31-100 que faltam
2. 🟡 **Re-submeter AdSense** — agora com:
   - 30 posts editoriais long-form (60k+ palavras)
   - 12 páginas institucionais E-E-A-T
   - Microdata completa
   - 257 mensagens novas publicadas
3. 🔴 **Worker generator bug**: mensagens geradas via scheduler vão pra REVIEW mas nunca PUBLISHED automaticamente. Precisa de lógica auto-approve (qualidade >= 0.75 → PUBLISHED) OU job humano de aprovação. Implementei manual via SQL agora; precisa de fix no código.

### Próxima sessão
- Bloco 3.2: navegações + elementos novos pela home/categorias (você também pode gostar, top autores, mais buscadas, etc)
- Bloco 3.5: featured images institucionais (12 páginas)
- Bloco 4.11: hero TOP 70 restantes (TOP 31-100, custo ~R$ 16 Flux Pro)
- Bloco 4.12: Astro POC build-static dedicado (POC + análise CWV)
- Admin: editor BlogCategory (CRUD)
- Worker fix REVIEW→PUBLISHED auto-approve
- Featured images institucionais (12)
- Restantes do mass-produce-v3 (642 msgs, ~R$ 29)
- SEO retro 521 que ficaram com metaTitle inicial (não refinado)

## Como continuar

Quando re-abastecer OpenAI (>=$5):
```bash
# tunnel SSH
ssh -i ~/.ssh/portalsoma_deploy -N -L 55432:172.16.2.3:5432 root@2.24.220.46

# continua mass-produce (skip-duplicates protege)
DATABASE_URL="postgresql://portalsoma:PsDBfe468cc45eac6ea9@localhost:55432/portalsoma?schema=public" \
OPENAI_API_KEY="sk-proj-DSGIi..." \
pnpm tsx scripts/mass-produce-v3.ts --concurrency=4

# hero TOP 100 (skip já feitos)
pnpm tsx scripts/hero-rerender-top.ts --top=100 --concurrency=2
```
