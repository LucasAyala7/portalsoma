# Próxima sessão — pendências (anotações Lucas 2026-06-03 noite)

## 🔴 Crítico revisar amanhã

### 1. Microdata / Schemas — auditoria
Lucas observou: "não pegaram todos ainda". Precisa revisar:

- [ ] Home: validar Organization + WebSite+SearchAction + WPHeader + WPFooter + SiteNav + CollectionPage + ItemList renderizam OK no HTML servido
- [ ] Cluster pages: validar BreadcrumbList + CollectionPage + ItemList + FAQPage
- [ ] Single mensagem: validar BreadcrumbList + CreativeWork + interactionStatistic + Article + Author Person
- [ ] Single blog post: validar BlogPosting + Author + Publisher + interactionStatistic
- [ ] Cluster blog: validar Blog + ItemList
- [ ] Autor: validar ProfilePage + Person completo
- [ ] Páginas institucionais: validar AboutPage / ContactPage / Person / PostalAddress / Review
- [ ] Validar todos via Google Rich Results Test (https://search.google.com/test/rich-results)
- [ ] Schema markup validator (https://validator.schema.org/)
- [ ] Verificar microdata HTML5 não duplica com JSON-LD em casos como ItemList

## 🟧 Pendências infra

### 2. Cron daily rebuild Coolify (atualizar counts no header/navegação)
Atualmente layout cacheia 1h. Pode programar cron daily no VPS pra:
- 06:00 BRT: chamar Coolify deploy API (force rebuild → counts atualizados)
- OU: simples `curl` pra purge CF cache (mais leve, conta atual de mensagens vem fresca da próxima request)

### 3. Footer ainda tem "Destinatários" como coluna
Para uniformizar com mega nav (que agora é "Pessoas"):
- apps/web/app/layout.tsx:261 → trocar "Destinatários" por "Pessoas" no SiteFooter
- Decisão de gosto: deixar "Destinatários" no footer faz sentido contextualmente (rodapé é mais formal)

### 4. Worker bug REVIEW → PUBLISHED (auto-approve)
Scheduler gera mensagens mas elas ficam em REVIEW eternamente. Promovi via SQL hoje (829 publicadas). Precisa de fix no código:
- Auto-promote se qualidade >= 0.75
- OU dashboard com botão "aprovar batch"

### 5. SEO retro 521 restantes (não refinadas)
Top 30% (366) já refinadas via gpt-5. As outras 521 dependentes têm metaTitle/metaDescription do gerador inicial (não-ideais). Opcional:
- Rodar `enrich-existing-content.ts --refresh-all` quando tiver budget OpenAI (~R$ 30)

### 6. 900 DRAFTs antigas do scheduler (qualidade baixa)
São mensagens que o quality gate inicial reprovou. Decidir:
- Deletar (limpar DB)
- OU regerar com novo prompt

### 7. Astro POC (Sprint 4 #12)
Adiado pra sessão dedicada — POC + comparação Lighthouse + decisão arquitetural.

## 🟦 Backlog médio

- Featured images institucionais (12 páginas) — Flux Schnell pra sobre/equipe/proposito etc
- Navegações + elementos novos pela home/categorias (#2 original): "Você também pode gostar", "Top autores", "Mais buscadas", etc
- Hero TOP 100 já feito; eventual Hero TOP 200-500 quando quiser estender qualidade premium pra mid-tier

## ⚙️ Configurações CF aplicadas hoje (não precisa revalidar)

- Cache Rule: HTML edge cache 1 dia (`s-maxage=86400 + stale-while-revalidate=604800`)
- SSL: Full Strict + TLS 1.2/1.3 + 0-RTT + HTTP/3
- HSTS: 6 meses + includeSubdomains
- Always HTTPS + Automatic HTTPS Rewrites
- Brotli + Early Hints
- Security Level: Medium (não bloqueia Googlebot)
- Browser Integrity Check ON
- Email Obfuscation + Server Side Excludes ON
- WAF: 3 rules (block bad UA / challenge /admin/* / skip verified bots)
- Rate limit /api/*: 20 req/10s/IP (free tier max)

## ✅ Estado final hoje

- Site live: https://www.portalsoma.com.br
- 3.776 mensagens PUBLISHED (incluindo 257 promovidas + 829 novas v3)
- 30 posts blog editorial long-form (~65k palavras)
- 12 páginas institucionais E-E-A-T (~9k palavras)
- 100 mensagens TOP com hero Flux Blueprint (30 Pro + 70 Schnell)
- Microdata + JSON-LD em todas as page types
- CF cache HTML 1 dia (MISS→HIT validado)
- Custo total da sessão: ~R$ 95

Lucas: re-submeter AdSense quando quiser.
