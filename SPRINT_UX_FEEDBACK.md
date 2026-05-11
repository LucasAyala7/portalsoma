# Sprint UX — feedback Lucas pós-deploy (2026-05-10)

Lucas navegou no site ao vivo e mandou 12 pontos. Brainstorming, decisões, e checklist abaixo. Sprint estimada em ~10-12h de execução.

## Filosofia do sprint

- **Hero com texto overlay** é o maior single-impact (todas 2690 mensagens viram "compartilháveis de cara"). Custo R$ 0 (Satori puro).
- Mobile UX é o segundo bloco — Lucas testou no celular, viu overflow e falta de menu.
- Search + mega nav virá em terceiro (descoberta de conteúdo).
- Refactors menores (link no share, layout lista) fica por último.

---

## 🔴 Bloco 1 — Crítico

### 12. Hero com texto overlay em TODAS mensagens (R$ 0)

**Problema:** hoje hero = Flux atmosférico sem texto. Lucas esperava ter mensagem em cima da imagem (validado em smoke tests anteriores).

**Decisão:** Re-renderizar TODOS os hero usando Satori (`compose-message.tsx` que já existe) com Flux existente como `bgUrl`.

- **707 TIER_1+TIER_2** (com Flux): bgUrl = Flux existente + texto Satori por cima (template centro/card/full random)
- **1986 TIER_3** (sem Flux): template MINIMAL (gradient da paleta + texto + watermark)

Script: adaptar `scripts/generate-images.ts` com flag `--hero-composed`. Lê `imagemHeroId` se existir (download da R2 como bgUrl) + roda compose + sobe novo PNG + atualiza `imagemHeroId` na Mensagem.

**Custo:** R$ 0 (Satori) + R2 storage (já bancado).
**Tempo execução:** ~10 min batch.
**Tempo dev:** 1h.

### 10. Compartilhar SÓ imagem (botão sobre hero)

**Problema:** muita gente compartilha imagem direto no WhatsApp/Insta sem clicar em link.

**Solução:** botão "📷 Compartilhar imagem" sobre a hero image. Usa Web Share API Level 2 com `files: [Blob]`:

```ts
const blob = await fetch(imageUrl).then(r => r.blob());
const file = new File([blob], `portalsoma-${slug}.png`, { type: blob.type });
if (navigator.canShare?.({ files: [file] })) {
  await navigator.share({ files: [file], title: titulo });
}
```

Fallback (browsers sem support): download direto + toast "imagem baixada, cole no app".

**Tempo:** 1h. Componente novo em `apps/web/components/share-image-button.tsx`.

### 4. Auditar 404 em mensagens agendadas

**Hipótese Lucas:** archive mostrando mensagens não-publicadas (status SCHEDULED/DRAFT) que dão 404 ao clicar.

**Onde investigar:**
1. `apps/web/lib/data.ts` — queries pra archive (cluster page)
2. `apps/web/app/[...path]/page.tsx` — resolveRoute pra single
3. `apps/web/app/sitemap-mensagens/[n]/route.ts` — sitemap

Pode estar faltando `where: { status: 'PUBLISHED' }` em algum lugar.

**Tempo:** 30min (audit + 1 commit).

---

## 🟧 Bloco 2 — Correções

### 5. Soma global de interações (header/home/archive)

**Hoje:** cada mensagem mostra likes/copies próprios. Falta o "total da plataforma".

**Decisão:** adicionar widget `CounterBoard` (já existe!) com aggregate:

```ts
const totals = await prisma.mensagem.aggregate({
  _sum: { likes: true, copies: true, shares: true, visualizacoes: true },
  _count: { id: true },
});
```

Mostrar em:
- Header (compacto: "❤️ 12.3k") — sticky
- Home hero (grande: cards animados)
- Archive top (linha: "X mensagens · Y cópias · Z compartilhamentos")

Cache 30s via `revalidate`.

**Tempo:** 30min.

### 6. View count audit

**Possíveis problemas:**
- `apps/web/api/evento/route.ts` — recebe POST mas talvez não incrementa
- Client-side fetch não está rolando onMount
- Display lendo de cache stale

**Tempo:** 30min debug.

### 7. Mobile overflow + counts no topo direito

**Sugestão Lucas (excelente):** mover counts (curtidas/cópias) pro canto superior direito do card, depois do nome do autor + categoria. Economiza linha e elimina overflow horizontal.

**Layout atual:**
```
[Avatar] Autor · Categoria
"Mensagem..."
[icones counts no fim]
```

**Novo:**
```
[Avatar] Autor · Categoria               ❤️ 23 📋 12
"Mensagem..."
```

Combinado com `overflow-x-hidden` no parent + `min-width: 0` nos filhos.

**Tempo:** 1h (UX refactor across components).

---

## 🟦 Bloco 3 — Agregar

### 1. Header pro de SEO

**Estrutura proposta:**

```
┌──────────────────────────────────────────────────────────┐
│ Logo  | Destinatários ▾ Ocasiões ▾ Tons ▾ Bodas ▾ | 🔍 Search │
│       |               ▼ mega menu cada um                    │
└──────────────────────────────────────────────────────────┘
```

**Mega nav** por categoria expande em 3-4 colunas com top clusters + ver todos.

**Search instant:** Fuse.js client-side (~50kb) carrega index dos 118 clusters + 2690 títulos no localStorage. Resultado em tempo real conforme digita.

**Breadcrumbs persistentes** abaixo do header.

**Tempo:** 2h.

### 2. Mobile drawer menu

Hamburguer → drawer right-to-left com mesmas seções do mega nav, agrupadas em accordion.

**Tempo:** 1h. Componente `apps/web/components/mobile-menu.tsx`.

### 3. Bottom bar mobile (app-like)

5 ícones fixos no rodapé mobile:
- 🏠 Home
- 📑 Categorias (abre drawer)
- 🔍 Buscar (overlay)
- ❤️ Salvas (localStorage)
- ➕ (placeholder pra "compartilhar app")

Padding-bottom no `<body>` mobile pra evitar overlap.

**Tempo:** 1h.

---

## 🟩 Bloco 4 — Melhorias

### 8. Layout lista vs grid em archives

Hoje archive cluster é grid 2/3 col. Adicionar variante "lista vertical" pras primeiras 5-10 mensagens (modo feed) + grid abaixo (modo discover).

**Tempo:** 1h.

### 9. Lista com thumb (intermediário)

```
[80x80 thumb] Título grande
              snippet 2 linhas
              [counts inline]
```

Variante visual entre grid grande e lista pura. Boa pra display em mobile.

**Tempo:** 1h.

### 11. `promoteOnShare` toggle + link no share

**Schema:**
```prisma
model Mensagem {
  promoteOnShare Boolean @default(false)
  // ...
}
```

**Admin:** checkbox no editor.
**Share:** quando true, append `\n\nvia portalsoma.com.br/{slug}` no texto.

Default off (não incomoda usuários puristas). Lucas ativa em mensagens TOP estratégicas.

**Tempo:** 30min.

---

## 📊 Estimativa total

| Bloco | Pontos | Tempo |
|---|---|---|
| 🔴 Crítico | 12, 10, 4 | ~2.5h |
| 🟧 Correções | 5, 6, 7 | ~2h |
| 🟦 Agregar | 1, 2, 3 | ~4h |
| 🟩 Melhorias | 8, 9, 11 | ~2.5h |
| **Total** | **12 pontos** | **~11h** |

Pode quebrar em 2 sessões de ~5h cada se for o caso.

## 🎯 Ordem de execução sugerida

**Sessão 1 (5-6h):** crítico + correções
1. Audit 404 (atalho — rápido e dá ROI)
2. Hero com texto overlay (re-render batch + ver visual)
3. Soma global (rápido)
4. Mobile overflow + counts (impacto visual imediato)
5. Compartilhar imagem (Web Share API)
6. View count audit

**Sessão 2 (5-6h):** agregar + melhorias
7. Header mega nav + search Fuse.js
8. Mobile drawer
9. Bottom bar
10. Lista vs grid archive
11. Lista com thumb
12. `promoteOnShare` toggle

## 💰 Custos novos

- R$ 0 (tudo client/server-side, sem API paga)
- Storage R2: +500MB se duplicar hero (mas vamos substituir, então mesmo)
- Bandwidth CDN: irrelevante no free tier CF
