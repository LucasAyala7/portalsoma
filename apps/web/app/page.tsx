import type { Metadata } from "next";
import { prisma } from "@nivertotal/db";
import { jsonLdScript, organizationSchema } from "@/lib/seo";
import { Ticker } from "@/components/ticker";
import { CounterBoard } from "@/components/counter-board";
import { AuthorCarousel } from "@/components/author-carousel";
import { CalendarWidget } from "@/components/calendar-widget";
import { CategoryGrid } from "@/components/category-grid";
import { MessageCardRich } from "@/components/message-card-rich";
import { MessageCardCompact } from "@/components/message-card-compact";
import { FaqBlock } from "@/components/faq-block";
import {
  HowItWorks,
  AboutBlock,
  TestimonialsBlock,
  NewsletterBlock,
} from "@/components/institutional-sections";
import { TopAuthorsWidget, QuickLinksWidget, NewsletterMini } from "@/components/side-widgets";
import { getCategoryIcon, COLOR_BG } from "@/lib/icons";
import {
  ArrowRight,
  Heart,
  Copy,
  Share2,
  Sparkles,
  Flame,
  Users,
  Clock,
  BookOpen,
  Scissors,
  MessageCircle,
  Cross,
  Smile,
  Crown,
  Gem,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Mensagens de Aniversário Para Compartilhar — Portal Soma",
  description:
    "Mensagens de aniversário emocionantes, evangélicas, engraçadas e únicas para mãe, pai, amiga, filha e mais. Copie em 1 clique e compartilhe no WhatsApp.",
  alternates: { canonical: "/" },
};

// Revalida a cada 30s — counts (likes/copies/shares) ficam fresh sem perder performance.
// Páginas individuais ainda são pré-renderizadas, mas refazem ao expirar o cache.
export const dynamic = "force-dynamic";
export const revalidate = 30;

// Mantido pra MessageCardCompact recentes (avatar fallback) — será removido em futuro refactor
const EMOJI_DESTINATARIO: Record<string, string> = {
  "para-amiga": "💝",
  "para-amigo": "🤝",
  "para-mae": "🌷",
  "para-pai": "👔",
  "para-filha": "🎀",
  "para-filho": "⚽",
  "para-irma": "💐",
  "para-irmao": "🎁",
  "para-sobrinha": "🌸",
  "para-sobrinho": "🎈",
  "para-marido": "💍",
  "para-esposa": "💖",
  "para-namorado": "💞",
  "para-namorada": "💞",
  "para-prima": "🌺",
  "para-tia": "🌹",
  "para-tio": "🎩",
  "para-avo": "👵",
  "para-neto": "🧒",
  "para-neta": "👧",
  "para-pastor": "🙏",
  "para-padre": "⛪",
  "para-padrinho": "🤵",
  "para-madrinha": "👰",
  "para-sogra": "🌻",
  "para-sogro": "🎓",
  "para-nora": "💐",
  "para-genro": "🎁",
  "para-cunhada": "🌷",
  "para-cunhado": "🎉",
  "para-comadre": "🌼",
  "para-afilhada": "✨",
  "para-afilhado": "⭐",
  "para-chefe": "💼",
  "para-cliente": "🤝",
  "para-colega": "☕",
};

const EMOJI_TOM: Record<string, string> = {
  evangelica: "✝️",
  biblica: "📖",
  catolica: "⛪",
  gospel: "🎵",
  espirita: "🌟",
  crista: "💗",
  engracada: "😄",
  curta: "✂️",
  simples: "🎂",
  bonita: "🌷",
  reflexiva: "💭",
};

const EMOJI_OCASIAO: Record<string, string> = {
  "de-15-anos": "👑",
  "de-18-anos": "🎓",
  "de-30-anos": "🥂",
  "de-50-anos": "🥇",
  "de-80-anos": "🌟",
  "bodas-de-prata-25-anos": "💎",
  "bodas-de-ouro-50-anos": "🏆",
  "bodas-de-cristal-15-anos": "💠",
  "bodas-de-estanho-10-anos": "🍷",
  "no-whatsapp": "💬",
  "para-status": "📱",
  "de-1-ano-de-namoro": "❤️",
  "de-2-anos-de-namoro": "💕",
  "de-4-anos-de-namoro": "💞",
};

async function getHomeData() {
  const [
    nicho,
    destinatariosTop,
    destinatariosTodos,
    tonsTop,
    ocasioesTop,
    mensagensDestaque,
    mensagensRecentes,
    mensagensMaisCopiadas,
    autores,
    aggregates,
  ] = await Promise.all([
    prisma.nicho.findFirst(),
    prisma.cluster.findMany({
      where: { ativo: true, tipo: "DESTINATARIO" },
      orderBy: { volumeMensal: "desc" },
      take: 8,
      include: { _count: { select: { mensagens: { where: { status: "PUBLISHED" } } } } },
    }),
    prisma.cluster.findMany({
      where: { ativo: true, tipo: "DESTINATARIO" },
      orderBy: { volumeMensal: "desc" },
      take: 30,
      include: { _count: { select: { mensagens: { where: { status: "PUBLISHED" } } } } },
    }),
    prisma.cluster.findMany({
      where: { ativo: true, tipo: "TOM" },
      orderBy: { volumeMensal: "desc" },
      take: 10,
      include: { _count: { select: { mensagens: { where: { status: "PUBLISHED" } } } } },
    }),
    prisma.cluster.findMany({
      where: { ativo: true, tipo: { in: ["OCASIAO", "CANAL"] } },
      orderBy: { volumeMensal: "desc" },
      take: 9,
      include: { _count: { select: { mensagens: { where: { status: "PUBLISHED" } } } } },
    }),
    prisma.mensagem.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { likes: "desc" },
      take: 4,
      include: {
        autor: true,
        persona: true,
        cluster: { include: { nicho: true } },
        imagemHero: true,
      },
    }),
    prisma.mensagem.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publicadoEm: "desc" },
      take: 6,
      include: {
        autor: true,
        persona: true,
        cluster: { include: { nicho: true } },
      },
    }),
    prisma.mensagem.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { copies: "desc" },
      take: 5,
      include: {
        autor: true,
        persona: true,
        cluster: { include: { nicho: true } },
      },
    }),
    prisma.author.findMany({
      where: { ativo: true, real: false },
      include: {
        _count: { select: { mensagens: { where: { status: "PUBLISHED" } } } },
        mensagens: { where: { status: "PUBLISHED" }, select: { likes: true } },
      },
    }),
    prisma.mensagem.aggregate({
      where: { status: "PUBLISHED" },
      _sum: { likes: true, copies: true, shares: true, visualizacoes: true },
      _count: { id: true },
    }),
  ]);
  return {
    nicho,
    destinatariosTop,
    destinatariosTodos,
    tonsTop,
    ocasioesTop,
    mensagensDestaque,
    mensagensRecentes,
    mensagensMaisCopiadas,
    autores,
    aggregates,
  };
}

export default async function Home() {
  const data = await getHomeData();
  const nichoSlug = data.nicho?.slug ?? "mensagem-de-aniversario";
  const totals = {
    mensagens: data.aggregates._count.id,
    likes: data.aggregates._sum.likes ?? 0,
    copies: data.aggregates._sum.copies ?? 0,
    shares: data.aggregates._sum.shares ?? 0,
    views: data.aggregates._sum.visualizacoes ?? 0,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(organizationSchema())}
      />

      {/* 1. HERO */}
      <section className="relative bg-gradient-to-b from-niver-50 via-warm-100 to-warm-50 py-16 sm:py-24 deco-confetti overflow-hidden">
        <div className="container-wide relative">
          <div className="max-w-3xl mx-auto text-center">
            <span className="badge-trending mb-5 inline-flex">
              <Sparkles size={12} />
              <span>Mensagens com cuidado, pra emocionar de verdade</span>
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-niver-800 leading-[1.05] tracking-tight mb-6">
              Mensagens de aniversário pra emocionar quem você ama
            </h1>
            <p className="text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed">
              Mais de {totals.mensagens.toLocaleString("pt-BR")} mensagens originais, escritas
              com carinho. Copie em 1 clique e compartilhe no WhatsApp.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href="/mensagem-de-aniversario/para-amiga/" className="btn-primary">
                <Heart size={16} strokeWidth={2.4} />
                Mensagens pra amiga
              </a>
              <a href="/mensagem-de-aniversario/para-mae/" className="btn-secondary">
                Mensagens pra mãe
              </a>
              <a href="/mensagem-de-aniversario/evangelica/" className="btn-secondary">
                Evangélicas
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TICKER */}
      <Ticker
        totalMensagens={totals.mensagens}
        totalLikes={totals.likes}
        totalShares={totals.shares}
        totalCopies={totals.copies}
        totalViews={totals.views}
      />

      {/* 3. COUNTER BOARD */}
      <section className="container-niver py-12">
        <CounterBoard
          items={[
            { icon: Heart, label: "mensagens", value: totals.mensagens, highlight: true },
            { icon: Copy, label: "cópias", value: totals.copies },
            { icon: Share2, label: "compartilhamentos", value: totals.shares },
            { icon: Heart, label: "curtidas", value: totals.likes },
          ]}
        />
      </section>

      {/* 4. TRENDING — grid 2 col com cards rich */}
      {data.mensagensDestaque.length > 0 && (
        <section className="container-niver py-12">
          <div className="flex items-end justify-between mb-6 gap-4">
            <h2 className="heading-section-bar">
              <Flame size={22} className="text-rose-500" strokeWidth={2.4} />
              <span>Em alta agora</span>
            </h2>
            <a
              href="/mensagem-de-aniversario/para-amiga/"
              className="hidden sm:inline-flex items-center gap-1 text-sm text-niver-700 hover:text-niver-800 font-medium"
            >
              ver mais <ArrowRight size={14} />
            </a>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {data.mensagensDestaque.map((m, i) => (
              <MessageCardRich
                key={m.id}
                mensagem={m}
                nichoSlug={nichoSlug}
                badge={i === 0 ? "trending" : i === 1 ? "top" : undefined}
                destacada={i === 0}
              />
            ))}
          </div>
        </section>
      )}

      {/* 5. POR DESTINATÁRIO — grid 4 col grande (default) */}
      <section className="container-niver py-12">
        <div className="flex items-end justify-between mb-6 gap-4">
          <div>
            <h2 className="heading-section-bar">
              <Users size={22} className="text-niver-600" strokeWidth={2.4} />
              <span>Mais procurados</span>
            </h2>
            <p className="text-stone-600 text-sm mt-2 ml-5">Pra quem você quer emocionar</p>
          </div>
        </div>
        <CategoryGrid
          nichoSlug={nichoSlug}
          categorias={data.destinatariosTop.map((c) => ({
            slug: c.slug,
            nome: c.nome,
            descricao: c.descricao ?? undefined,
            totalMensagens: c._count.mensagens,
            iconConfig: getCategoryIcon(c.slug),
          }))}
        />
      </section>

      {/* 6. MAIS COPIADAS — lista compacta + aside (autores + newsletter) */}
      {data.mensagensMaisCopiadas.length > 0 && (
        <section className="bg-warm-100/60 py-12">
          <div className="container-niver">
            <h2 className="heading-section-bar mb-6">
              <Copy size={22} className="text-niver-600" strokeWidth={2.4} />
              <span>As mais copiadas da semana</span>
            </h2>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                {data.mensagensMaisCopiadas.map((m, i) => (
                  <MessageCardCompact
                    key={m.id}
                    mensagem={{
                      ...m,
                      cluster: {
                        slug: m.cluster.slug,
                        nome: m.cluster.nome,
                        nicho: { slug: m.cluster.nicho.slug },
                      },
                    }}
                    nichoSlug={nichoSlug}
                    index={i}
                  />
                ))}
              </div>
              <aside className="space-y-4">
                <TopAuthorsWidget
                  autores={data.autores
                    .map((a) => ({
                      slug: a.slug,
                      nome: a.nome,
                      fotoUrl: a.fotoUrl,
                      totalMensagens: a._count.mensagens,
                      totalLikes: a.mensagens.reduce((s, m) => s + m.likes, 0),
                    }))
                    .sort((a, b) => b.totalLikes - a.totalLikes)}
                />
                <NewsletterMini />
              </aside>
            </div>
          </div>
        </section>
      )}

      {/* 7. POR TOM — grid 5 col denso */}
      <section className="container-niver py-12">
        <h2 className="heading-section-bar mb-6">Por tom e religião</h2>
        <CategoryGrid
          variant="dense"
          nichoSlug={nichoSlug}
          categorias={data.tonsTop.map((c) => ({
            slug: c.slug,
            nome: c.nome,
            totalMensagens: c._count.mensagens,
            iconConfig: getCategoryIcon(c.slug),
          }))}
        />
      </section>

      {/* 8. RECENTES + 2 ASIDES (calendário + atalhos rápidos) */}
      <section className="container-niver py-12">
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2 lg:order-2">
            <h2 className="heading-section-bar mb-6">
              <Clock size={20} className="text-amber-500" strokeWidth={2.4} />
              <span>Recém-publicadas</span>
            </h2>
            <div className="space-y-3">
              {data.mensagensRecentes.slice(0, 4).map((m, i) => (
                <MessageCardCompact
                  key={m.id}
                  mensagem={{
                    ...m,
                    cluster: {
                      slug: m.cluster.slug,
                      nome: m.cluster.nome,
                      nicho: { slug: m.cluster.nicho.slug },
                    },
                  }}
                  nichoSlug={nichoSlug}
                  index={i}
                />
              ))}
            </div>
          </div>
          <aside className="lg:order-1">
            <CalendarWidget />
          </aside>
          <aside className="lg:order-3">
            <QuickLinksWidget
              title="Atalhos rápidos"
              icon={BookOpen}
              links={[
                { href: "/mensagem-de-aniversario/curta/", label: "Mensagens curtas", icon: Scissors },
                { href: "/mensagem-de-aniversario/no-whatsapp/", label: "Direto pro WhatsApp", icon: MessageCircle },
                { href: "/mensagem-de-aniversario/evangelica/", label: "Evangélicas", icon: Cross },
                { href: "/mensagem-de-aniversario/engracada/", label: "Engraçadas", icon: Smile },
                { href: "/mensagem-de-aniversario/de-15-anos/", label: "Para 15 anos", icon: Crown },
                { href: "/mensagem-de-aniversario/bodas-de-prata-25-anos/", label: "Bodas de prata", icon: Gem },
                { href: "/sobre/", label: "Sobre o Portal Soma" },
                { href: "/contato/", label: "Fale com a gente" },
              ]}
            />
          </aside>
        </div>
      </section>

      {/* 9. POR OCASIÃO — pills 3 col */}
      <section className="container-niver py-12">
        <h2 className="heading-section-bar mb-6">Ocasiões e momentos</h2>
        <CategoryGrid
          variant="pills"
          nichoSlug={nichoSlug}
          categorias={data.ocasioesTop.map((c) => ({
            slug: c.slug,
            nome: c.nome,
            descricao: c.descricao ?? undefined,
            totalMensagens: c._count.mensagens,
            iconConfig: getCategoryIcon(c.slug),
          }))}
        />
      </section>

      {/* 10. AUTORES */}
      {data.autores.length > 0 && (
        <section className="container-niver py-16">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl text-stone-900 mb-3">
              Conheça quem escreve aqui
            </h2>
            <p className="text-stone-600 max-w-xl mx-auto">
              Cada autor traz sua voz, sua história, seu jeito de tocar o coração.
            </p>
          </div>
          <AuthorCarousel
            autores={data.autores.map((a) => ({
              slug: a.slug,
              nome: a.nome,
              bio: a.bio,
              fotoUrl: a.fotoUrl,
              real: a.real,
              totalMensagens: a._count.mensagens,
            }))}
          />
        </section>
      )}

      {/* 11. TODOS DESTINATÁRIOS — grid 5 col denso */}
      <section className="container-niver py-12">
        <h2 className="heading-section-bar mb-2">Explore todos os destinatários</h2>
        <p className="text-sm text-stone-600 mb-6 ml-5">
          De familiar a amigo, de chefe a padrinho — temos a categoria certa.
        </p>
        <CategoryGrid
          variant="dense"
          nichoSlug={nichoSlug}
          categorias={data.destinatariosTodos.map((c) => ({
            slug: c.slug,
            nome: c.nome,
            totalMensagens: c._count.mensagens,
            iconConfig: getCategoryIcon(c.slug),
          }))}
        />
      </section>

      {/* 12. COMO FUNCIONA (institucional) */}
      <HowItWorks />

      {/* 13. SOBRE (institucional, 2 col texto + stats) */}
      <AboutBlock totalMensagens={totals.mensagens} />

      {/* 14. DEPOIMENTOS (institucional, fundo warm) */}
      <TestimonialsBlock />

      {/* 15. NEWSLETTER (institucional, gradient niver) */}
      <NewsletterBlock />

      {/* 16. FAQ */}
      <FaqBlock />
    </>
  );
}
