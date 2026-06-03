# Sprint QA + Audit + Melhorias — Portal Soma

12 tarefas do brainstorming Lucas pós-deploy MVP + AdSense reprovado (low content).
Reorganizado em 4 blocos por prioridade + dependências mapeadas. Sem estimativa de tempo.

## Filosofia da sprint

- **Bloco 1 (Crítico)** desbloqueia AdSense + foundation SEO. Faz primeiro.
- **Bloco 2 (Correções)** garante estado limpo do que já existe antes de expandir.
- **Bloco 3 (Agregar)** cresce surface area (header, internal links, conteúdo novo, featured images).
- **Bloco 4 (Melhorias)** polishing — só depois de 1-3 prontos.

Dependências fortes:
- `#8 (1000 novos conteúdos)` depende de `#6 (definir tipos de conteúdo grande)` e `#7 (templates SEO+GEO consolidados)`
- `#10 (internal links)` depende de `#7 (passar SEO em 30% existente)` parcialmente
- `#3 (microdata)` precisa de `#3.a (review do plano)` antes de execução

---

## Bloco 1 — Crítico

### #6 — Conteúdo de longa-forma (motivo da reprovação AdSense)

AdSense reprovou por **low content**. Crítico desbloquear antes de re-submeter.

- [ ] **#6.a Poemas longos** — adicionar tipo `POEMA_LONGO` no schema (ou usar `LONGA` + tag), com versos 200-400 palavras, formatação visual (versos quebrados, estrofes, autor com citação completa)
- [ ] **#6.b Silo de blog** — criar `/blog/` com:
  - Categorias (significado das datas, etiqueta de aniversário, mitologia/astrologia, presentes)
  - Posts de 1500-2500 palavras
  - Internal link bidirecional com mensagens relevantes
  - Sitemap próprio (`sitemap-blog.xml`)
- [ ] **#6.c Re-submeter no painel AdSense** após volume publicado (mín ~30 posts blog + 50 poemas longos sugerido)

### #3 — Dados estruturados (microdata) FIX

Estado atual: só Breadcrumb + Article + FAQ aplicados. Falta tudo o resto que planejamos no SEO playbook.

#### #3.a — Review do plano (FAZER ANTES DE EXECUTAR)

Esse é o sub-item que tu pediu pra eu listar primeiro, segue:

**Home** (`/`) — atualmente: 0 schemas (Organization injetado mas só)
- [ ] `WebSite` com `SearchAction` (search box no SERP)
- [ ] `Organization` completo (logo, sameAs redes, contactPoint)
- [ ] `WPHeader` microdata no `<header>`
- [ ] `WPFooter` microdata no `<footer>`
- [ ] `SiteNavigation` microdata no `<nav>` (Mega Nav + Bottom Bar)
- [ ] `CollectionPage` com `ItemList` referenciando mensagens em destaque (Article items, sem duplicar JSON-LD)

**Categorias / Clusters** (`/mensagem-de-aniversario/para-mae/`) — atualmente: Breadcrumb + FAQ
- [ ] `CollectionPage` (não tem)
- [ ] `ItemList` com posições 1..N das mensagens listadas
- [ ] `WPHeader` / `WPFooter` / `SiteNavigation` (já no layout, herda)
- [ ] Manter Breadcrumb + FAQ existentes

**Single mensagem** (`/.../para-amiga/amiga-uma-bencao-na-minha-vida/`) — atualmente: Breadcrumb
- [ ] `Article` + `Author: Person` (não tem completo)
- [ ] `CreativeWork` com `interactionStatistic` (UserLikes/UserCopies/ShareAction/UserPageVisits) — **engajamento crítico**
- [ ] `WPHeader` / `WPFooter` / `SiteNavigation` (herda layout)
- [ ] Manter Breadcrumb existente
- [ ] `Speakable` opcional (Google Assistant + acessibilidade)

**Autor** (`/autor/lucas/`) — atualmente: nada documentado
- [ ] `ProfilePage` + `Person` (bio, sameAs, knowsAbout, jobTitle)
- [ ] Lista de mensagens do autor como `CreativeWork` items

**Páginas institucionais novas** (depende do #4)
- [ ] `ContactPage` (contato)
- [ ] `AboutPage` (sobre)
- [ ] `Person` items pra equipe/redação
- [ ] `Organization` com endereço (`PostalAddress` com microdata `address`)

**Regra que vamos seguir:**
- Microdata HTML5 sempre que possível (semântico, herdável)
- JSON-LD pra schemas que microdata não cobre (FAQ, BreadcrumbList completo, Article com publishDate, etc)
- NUNCA duplicar (se já tem JSON-LD Article, não bota Article microdata no mesmo bloco — exceção `SiteNavigation` que é só HTML attributes)

#### #3.b — Executar após aprovação do plano acima

- [ ] Implementar microdata Home
- [ ] Implementar microdata Cluster pages
- [ ] Implementar microdata Single pages (com InteractionCounter)
- [ ] Implementar microdata Autor pages
- [ ] Validar no Rich Results Test (Google) cada tipo de página

### #4 — Silo institucional E-E-A-T

Pra AdSense aprovar + autoridade SEO. Stack completo.

- [ ] `/sobre/` — propósito, missão, visão, valores, história, hero da equipe
- [ ] `/contato/` — form (Resend já configurado), email visível com microdata `email`, endereço com `<address>` + `PostalAddress`, CNPJ, horários
- [ ] `/equipe/` ou `/nossa-redacao/` — lista autores reais + virtuais com bio expandida, `ProfilePage` + `Person` schemas
- [ ] `/proposito/` — manifesto editorial (por que existimos, pra quem escrevemos)
- [ ] `/depoimentos/` — depoimentos com Schema `Review` (só se reais)
- [ ] `/imprensa/` — press kit, links de menções, logos
- [ ] `/politica-de-privacidade/` — LGPD + GDPR compliance
- [ ] `/politica-de-cookies/` — separada (importante!) — explicar tipos de cookies, analytics, AdSense, opt-out
- [ ] `/termos-de-uso/` — disclaimer copyright, uso pessoal vs comercial
- [ ] `/politica-de-transparencia/` — fontes de receita (AdSense, afiliados futuro), correções editoriais
- [ ] `/politica-de-conteudo/` — diretrizes editoriais, processo de revisão, fontes
- [ ] `/dmca/` — notificação com form (Resend) + DMARC validado no domínio
- [ ] Marcar endereço com microdata `<address>` no footer
- [ ] Marcar email com microdata `<a class="email" itemprop="email">` no footer
- [ ] Adicionar `CreativeWork` microdata no rodapé (institucional == criação editorial)
- [ ] Validar DMARC do `portalsoma.com.br` (record DNS) pra DMCA ser válido

---

## Bloco 2 — Correções (estado atual)

### #9 — Revisar agendamentos + sitemaps

Confirmar que scheduler tá rodando + sitemaps atualizam sozinhos.

- [ ] Inspecionar `workers/main` no Coolify (logs últimas 24h)
- [ ] Validar BullMQ queue counts (schedule, generate, publish, image)
- [ ] Verificar `/api/admin/fila` no admin
- [ ] Confirmar que mensagens novas viram PUBLISHED automaticamente conforme cota
- [ ] Verificar sitemap `lastmod` atualizando (não pode ficar travado em data antiga)
- [ ] Confirmar `/sitemap-mensagens-1.xml` count subindo com novas publicações
- [ ] Validar Anthropic credit (workers param sem isso)
- [ ] Verificar Replicate credit (Flux gen)
- [ ] Documentar processo de "ligar/desligar scheduler" no admin

### #7 — SEO + GEO em 30% do conteúdo existente

Aplicar nossos skills consolidados em batch retroativo (mensagens já PUBLISHED).

- [ ] Listar 30% top mensagens (por likes/copies/visualizações)
- [ ] Script `enrich-existing-content.ts`:
  - Re-gerar `metaTitle` (54-60 chars, GEO: localização BR, sazonalidade)
  - Re-gerar `metaDescription` (124-140 chars, CTR otimizado)
  - Aplicar HTML5 semântico (`<article>`, `<section>`, `<aside>`)
  - Adicionar `alt` SEO-rich em imagens (já tem mas revisar)
  - Inserir `<time datetime="...">` em datas
  - Aplicar microdata onde aplicável (depois do #3)
- [ ] Update DB em batch + revalidate ISR

### #10 — Revisão de internal links

Internal links em conteúdos a partir de 400 palavras, em forma de frase (não só "veja aqui"). Estratégico pra topical authority.

- [ ] Identificar mensagens com `wordCount >= 400`
- [ ] Mapear oportunidades de link interno (mesma persona, mesmo cluster, complementos relacionados)
- [ ] Script `inject-internal-links.ts`:
  - 2-3 links por mensagem long-form (não polui)
  - Âncora textual em **frase contextual** ("mensagens evangélicas para mães que amam tanto quanto a sua")
  - Não repetir anchor exata (1x por mensagem)
  - Link sempre pra cluster ou outra single relevante
- [ ] Validar no admin antes de aplicar em batch
- [ ] Aplicar em batch
- [ ] Revalidate ISR

---

## Bloco 3 — Agregar (crescimento)

### #1 — Submenu header (mais amplo, carrossel, navegação lateral)

- [ ] **Desktop:** ampliar Mega Nav atual com mais seções:
  - Destinatários (já tem)
  - Ocasiões (já tem)
  - Tons (já tem)
  - **Idades** (15 anos, 18, 30, 40, 50, 60, 80...) — nova seção
  - **Datas especiais** (bodas, mesversários, formaturas)
  - **Por canal** (WhatsApp, Instagram, status)
  - **Por religião** (Evangélica, Católica, Bíblica)
- [ ] **Mobile:** carrossel horizontal scroll com loop, snap-to-item, indicador de scroll
- [ ] Fixar carrossel sticky abaixo do header (desktop optional)
- [ ] Cada item com ícone (lucide) + nome + count opcional
- [ ] Botão "Ver tudo" no fim do carrossel

### #2 — Navegações + elementos pela home/categorias (internal links)

- [ ] **Home:** adicionar blocos novos:
  - "Mais buscadas" (top searches do Search Console quando tiver)
  - "Para todas as ocasiões" — grid por ocasião
  - "Top autores" — grid de personas
  - "Mensagens da semana" — top likes 7 dias
  - "Em alta agora" (já tem mas expandir)
- [ ] **Cluster pages:** adicionar:
  - "Você também pode gostar" (outros clusters do mesmo nicho)
  - "Mensagens populares em [Categoria pai]"
  - "Por sub-categoria" (complementos com count)
- [ ] **Single pages:** adicionar:
  - "Mensagens parecidas" (já tem `relacionadas`, melhorar UI)
  - "Mais do autor X"
  - "Por que você gostaria de" (cluster sibling pages)

### #5 — Featured image em 50%+ das páginas

Ampliar cobertura visual estratégica (não só random).

- [ ] Auditar quais páginas já têm hero composed (todas 2690 mensagens têm)
- [ ] Cluster pages: gerar hero específico por categoria (não só Flux genérico) — Flux Pro composto com texto categoria
- [ ] Páginas institucionais: hero próprio pra cada (sobre, equipe, contato)
- [ ] Blog posts: hero único por post
- [ ] Padronizar dimensões + ratio (1200x630 OG, 1200x800 hero)
- [ ] Alt text rico SEO em todas
- [ ] Marcar como `image` na microdata correspondente

---

### #7.b + #8 — Novos conteúdos (1000 mensagens)

Continuação do #7 mas pra novos drops. Inclui geração em batch local.

- [ ] Templates consolidados SEO+GEO em `packages/ai/prompts/`:
  - Prompt sistema com instrução GEO (PT-BR, sazonalidade BR, dialetos regionais)
  - Few-shot examples atualizados
  - Quality gate atualizado
- [ ] Script `mass-produce-v3.ts`:
  - 1000 novas mensagens com mix CURTA/MEDIA/LONGA/POEMA/POEMA_LONGO
  - Cota balanceada por cluster (priorizar clusters com gap)
  - Status: `DRAFT` (não PUBLISHED) — pra Lucas revisar/agendar
- [ ] Rodar local (DB de prod via tunnel)
- [ ] Validar no admin batch (revisar amostra)
- [ ] **Agendar** publicação distribuída (não publica tudo de uma vez — drip ~10-30/dia via scheduler)

---

## Bloco 4 — Melhorias (polishing)

### #11 — Imagens com skills mais recentes

Aplicar prompt blueprint técnico atualizado (do feedback_image_prompt_engineering.md).

- [ ] Re-renderizar hero das mensagens TOP 100 (por engajamento) com Flux Pro + prompt blueprint técnico (lente/lighting/materiais)
- [ ] Padronizar OG cards visuais (cores paleta + tipografia consistente)
- [ ] Avaliar usar ComfyUI local pra Flux Pro custom-trained (quando hardware permitir)
- [ ] Custo R$ ~150-300 estimado (depende quantas re-renderizar)

### #12 — Build .html (Astro ou Next static export)

Investigar viabilidade de servir single/page como `.html` puro pra performance máxima + SEO.

- [ ] **Análise técnica:**
  - Next.js 16 com `output: "export"` → gera `.html` estático. Mas perde ISR + middleware redirects (atual usa middleware pra raiz→www e WP redirects)
  - Solução: middleware fica no edge (Cloudflare Workers), HTML static no R2 ou Coolify nginx
  - OU rebuild só single/page (tipo /[...path]/page.tsx) como Astro app separado consumindo mesma API
- [ ] **POC:**
  - Astro app `apps/static/` que importa schema Prisma direto (read-only)
  - Build incremental (só páginas que mudaram via watch DB)
  - Deploy no R2 ou Coolify static
  - A/B test: 100 páginas Astro vs Next, comparar LCP/INP
- [ ] **Decisão:**
  - Se Astro reduz LCP >30% → migrar singles pra Astro
  - Se diferença marginal → manter Next ISR (operação simples)

---

## 📊 Resumo execução sugerida

**Sprint 1 (Crítico — desbloquear AdSense):**
1. `#6` Conteúdo longo (silo blog + poemas longos)
2. `#3.a` Review plano microdata + aprovar
3. `#3.b` Implementar microdata em todas as page types
4. `#4` Silo institucional E-E-A-T (todas as páginas institucionais novas)
5. Re-submeter AdSense

**Sprint 2 (Correções — estado limpo):**
6. `#9` Revisar agendamentos + sitemaps
7. `#7` SEO+GEO em 30% existente
8. `#10` Internal links em long-form existente

**Sprint 3 (Agregar — crescimento):**
9. `#1` Submenu/carrossel header ampliado
10. `#2` Navegações + elementos home/categorias
11. `#5` Featured images 50%+
12. `#8` Geração 1000 conteúdos novos (agendados)

**Sprint 4 (Melhorias):**
13. `#11` Imagens com skills atualizados
14. `#12` Build .html (Astro POC)

---

## 🎯 Próximo passo concreto

Antes de qualquer execução: **review do `#3.a` (plano microdata)** comigo. Tu lê a seção, aprova/ajusta/expande, e aí começamos a execução do Sprint 1 com confiança que a foundation SEO tá fechada.
