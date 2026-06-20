import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import { prisma } from "@nivertotal/db";
import "./globals.css";
import { Cake, Heart, Copy, Share2, Search } from "lucide-react";
import { MobileMenu } from "@/components/mobile-menu";
import { MegaNav } from "@/components/mega-nav";
import { BottomBar } from "@/components/bottom-bar";
import { GoogleAnalytics } from "@/components/google-analytics";
import { GoogleAdsense } from "@/components/google-adsense";
import { ScrollDepthTracker } from "@/components/scroll-depth-tracker";
import { jsonLdScript, organizationSchema, webSiteWithSearchSchema, siteNavigationItemListSchema } from "@/lib/seo";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-F00GTDMNNH";
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-3880875536722698";

const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.portalsoma.com.br";
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Portal Soma";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Mensagens de Aniversário para Compartilhar`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Mensagens de aniversário emocionantes, evangélicas, engraçadas e únicas para mãe, pai, amiga, filha e mais. Copie, compartilhe e celebre.",
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  keywords: [
    "mensagem de aniversário",
    "feliz aniversário",
    "mensagem evangélica",
    "mensagem para amiga",
    "mensagem para mãe",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    url: SITE_URL,
  },
  twitter: { card: "summary_large_image", site: "@portalsoma" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: SITE_URL },
  other: {
    "google-adsense-account": ADSENSE_CLIENT,
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
};

// Render dynamic mas com cache CDN agressivo (1 dia s-maxage, 7 dias SWR) — performance estática.
export const dynamic = "force-dynamic";
export const revalidate = 3600;

async function getNavData() {
  const [topClusters, destinatarios, ocasioesAll, tonsAll, canais, agg] = await Promise.all([
    prisma.cluster.findMany({
      where: { ativo: true, tipo: "DESTINATARIO" },
      orderBy: { volumeMensal: "desc" },
      take: 4,
      select: { slug: true, nome: true },
    }),
    prisma.cluster.findMany({
      where: { ativo: true, tipo: "DESTINATARIO" },
      orderBy: { volumeMensal: "desc" },
      take: 18,
      select: { slug: true, nome: true },
    }),
    prisma.cluster.findMany({
      where: { ativo: true, tipo: "OCASIAO" },
      orderBy: { volumeMensal: "desc" },
      select: { slug: true, nome: true },
    }),
    prisma.cluster.findMany({
      where: { ativo: true, tipo: "TOM" },
      orderBy: { volumeMensal: "desc" },
      select: { slug: true, nome: true },
    }),
    prisma.cluster.findMany({
      where: { ativo: true, tipo: "CANAL" },
      orderBy: { volumeMensal: "desc" },
      select: { slug: true, nome: true },
    }),
    prisma.mensagem.aggregate({
      where: { status: "PUBLISHED" },
      _count: { id: true },
      _sum: { likes: true, copies: true, shares: true, visualizacoes: true },
    }),
  ]);
  const totals = {
    mensagens: agg._count.id,
    likes: agg._sum.likes ?? 0,
    copies: agg._sum.copies ?? 0,
    shares: agg._sum.shares ?? 0,
    views: agg._sum.visualizacoes ?? 0,
  };

  // Sub-grupos de OCASIAO
  const bodas = ocasioesAll.filter((c) => c.slug.startsWith("bodas-")).slice(0, 14);
  const idades = ocasioesAll.filter((c) => /^de-\d+-(anos|meses|mes)/.test(c.slug)).slice(0, 18);
  const relacionamentos = ocasioesAll.filter((c) => /-de-(namoro|amizade|relacionamento)$/.test(c.slug)).slice(0, 14);

  // Sub-grupos de TOM
  const religiao = tonsAll.filter((c) =>
    /^(evangelica|biblica|gospel|crista|espirita|catolica|abencoada|gratidao|milagre|perdao)$/.test(c.slug),
  );
  const estilos = tonsAll.filter((c) => !religiao.some((r) => r.slug === c.slug));

  const navSections = [
    { titulo: "Pessoas", items: destinatarios },
    { titulo: "Idades", items: idades },
    { titulo: "Bodas", items: bodas },
    { titulo: "Namoro", items: relacionamentos },
    { titulo: "Fé", items: religiao },
    { titulo: "Tons", items: [...estilos, ...canais] },
  ].filter((s) => s.items.length > 0);
  return { topClusters, totals, navSections };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const navData = await getNavData();
  return (
    <html lang="pt-BR" className={`${inter.variable} ${fraunces.variable}`}>
      <head>
        {/* Preconnect handshake antecipado com CDN de imagens — LCP -150~300ms mobile. */}
        <link rel="preconnect" href="https://media.portalsoma.com.br" crossOrigin="" />
        <link rel="dns-prefetch" href="https://media.portalsoma.com.br" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript([
            organizationSchema(),
            webSiteWithSearchSchema(),
            siteNavigationItemListSchema(navData.navSections),
          ])}
        />
        <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />
        <GoogleAdsense client={ADSENSE_CLIENT} />
        <ScrollDepthTracker />
        <div className="min-h-screen flex flex-col">
          <SiteHeader topClusters={navData.topClusters} totals={navData.totals} navSections={navData.navSections} />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <SiteFooter totalMensagens={navData.totals.mensagens} />
          <BottomBar />
        </div>
      </body>
    </html>
  );
}

interface Totals {
  mensagens: number;
  likes: number;
  copies: number;
  shares: number;
  views: number;
}

function fmtCompact(n: number): string {
  if (n < 1000) return n.toLocaleString("pt-BR");
  if (n < 1_000_000) return (n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(".", ",") + "k";
  return (n / 1_000_000).toFixed(1).replace(".", ",") + "M";
}

function SiteHeader({
  topClusters,
  totals,
  navSections,
}: {
  topClusters: { slug: string; nome: string }[];
  totals: Totals;
  navSections: { titulo: string; items: { slug: string; nome: string }[] }[];
}) {
  return (
    <header
      itemScope
      itemType="https://schema.org/WPHeader"
      className="sticky top-0 z-30 bg-warm-50/95 backdrop-blur-md border-b border-warm-200/60"
    >
      <div className="container-wide flex h-14 sm:h-16 items-center gap-3">
        <MobileMenu sections={navSections} />
        <a href="/" className="flex items-center gap-2 group">
          <span className="grid place-items-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-niver-600 text-white shadow-sm group-hover:bg-niver-700 transition-colors">
            <Cake size={16} strokeWidth={2.2} />
          </span>
          <span className="font-display text-lg sm:text-2xl font-semibold text-niver-700">
            Portal Soma
          </span>
        </a>
        <span className="flex-1" />
        <MegaNav sections={navSections} />
        {/* Search link (desktop) */}
        <a
          href="/buscar/"
          aria-label="Buscar mensagens"
          title="Buscar"
          className="hidden md:inline-flex items-center justify-center w-9 h-9 rounded-full text-stone-600 hover:bg-niver-50 hover:text-niver-700 transition-colors"
        >
          <Search size={16} strokeWidth={2.2} />
        </a>
        {/* Desktop: soma global compacta */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-stone-500 tabular-nums">
          <span className="inline-flex items-center gap-1" title={`${totals.likes.toLocaleString("pt-BR")} curtidas`}>
            <Heart size={12} className="text-rose-500" strokeWidth={2.5} fill="currentColor" />
            <span className="text-stone-700 font-semibold">{fmtCompact(totals.likes)}</span>
          </span>
          <span className="inline-flex items-center gap-1" title={`${totals.copies.toLocaleString("pt-BR")} cópias`}>
            <Copy size={12} className="text-niver-500" strokeWidth={2.5} />
            <span className="text-stone-700 font-semibold">{fmtCompact(totals.copies)}</span>
          </span>
          <span className="inline-flex items-center gap-1" title={`${totals.shares.toLocaleString("pt-BR")} compartilhamentos`}>
            <Share2 size={12} className="text-emerald-600" strokeWidth={2.5} />
            <span className="text-stone-700 font-semibold">{fmtCompact(totals.shares)}</span>
          </span>
          <span className="hidden xl:inline-flex items-center gap-1 pl-3 border-l border-warm-200">
            <strong className="text-niver-700">{totals.mensagens.toLocaleString("pt-BR")}</strong>
            mensagens
          </span>
        </div>
        {/* Mobile: contador compacto só likes (mais social) */}
        <div className="md:hidden inline-flex items-center gap-1 text-xs bg-niver-50 text-niver-700 px-2.5 py-1 rounded-full font-medium tabular-nums">
          <Heart size={11} className="text-rose-500" strokeWidth={2.5} fill="currentColor" />
          {fmtCompact(totals.likes)}
        </div>
      </div>
    </header>
  );
}

function SiteFooter({ totalMensagens }: { totalMensagens: number }) {
  return (
    <footer
      itemScope
      itemType="https://schema.org/WPFooter"
      className="bg-stone-900 text-stone-300 mt-24"
    >
      <div className="container-wide py-14 grid md:grid-cols-2 lg:grid-cols-5 gap-10 text-sm">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-niver-600 text-white">
              <Cake size={18} strokeWidth={2.2} />
            </span>
            <div className="font-display text-xl text-white">Portal Soma</div>
          </div>
          <p className="text-stone-400 leading-relaxed">
            Mensagens de aniversário pra emocionar quem você ama. Copie em 1 clique e
            compartilhe no WhatsApp.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 text-xs bg-stone-800/60 rounded-full px-3 py-1.5">
            <Heart size={12} className="text-niver-400" />
            <span className="tabular-nums">{totalMensagens.toLocaleString("pt-BR")} mensagens publicadas</span>
          </div>
          <p className="text-xs text-stone-500 mt-5 leading-relaxed">
            Mantido pela Agência Vencedores Digitais
            <br />
            CNPJ 34.600.484/0001-21 — Bacabal/MA
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3 uppercase text-xs tracking-wider">Destinatários</h4>
          <ul className="space-y-2">
            <li><a href="/mensagem-de-aniversario/para-mae/" className="hover:text-white transition-colors">Para Mãe</a></li>
            <li><a href="/mensagem-de-aniversario/para-pai/" className="hover:text-white transition-colors">Para Pai</a></li>
            <li><a href="/mensagem-de-aniversario/para-filha/" className="hover:text-white transition-colors">Para Filha</a></li>
            <li><a href="/mensagem-de-aniversario/para-filho/" className="hover:text-white transition-colors">Para Filho</a></li>
            <li><a href="/mensagem-de-aniversario/para-amiga/" className="hover:text-white transition-colors">Para Amiga</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3 uppercase text-xs tracking-wider">Tons</h4>
          <ul className="space-y-2">
            <li><a href="/mensagem-de-aniversario/evangelica/" className="hover:text-white transition-colors">Evangélicas</a></li>
            <li><a href="/mensagem-de-aniversario/biblica/" className="hover:text-white transition-colors">Bíblicas</a></li>
            <li><a href="/mensagem-de-aniversario/curta/" className="hover:text-white transition-colors">Curtas</a></li>
            <li><a href="/mensagem-de-aniversario/engracada/" className="hover:text-white transition-colors">Engraçadas</a></li>
            <li><a href="/mensagem-de-aniversario/no-whatsapp/" className="hover:text-white transition-colors">No WhatsApp</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3 uppercase text-xs tracking-wider">Institucional</h4>
          <ul className="space-y-2">
            <li><a href="/sobre/" className="hover:text-white transition-colors">Sobre</a></li>
            <li><a href="/proposito/" className="hover:text-white transition-colors">Propósito</a></li>
            <li><a href="/equipe/" className="hover:text-white transition-colors">Nossa Equipe</a></li>
            <li><a href="/depoimentos/" className="hover:text-white transition-colors">Depoimentos</a></li>
            <li><a href="/imprensa/" className="hover:text-white transition-colors">Imprensa</a></li>
            <li><a href="/contato/" className="hover:text-white transition-colors">Contato</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3 uppercase text-xs tracking-wider">Legal</h4>
          <ul className="space-y-2">
            <li><a href="/politica-de-privacidade/" className="hover:text-white transition-colors">Privacidade</a></li>
            <li><a href="/politica-de-cookies/" className="hover:text-white transition-colors">Cookies</a></li>
            <li><a href="/termos-de-uso/" className="hover:text-white transition-colors">Termos de Uso</a></li>
            <li><a href="/politica-de-transparencia/" className="hover:text-white transition-colors">Transparência</a></li>
            <li><a href="/politica-de-conteudo/" className="hover:text-white transition-colors">Diretrizes editoriais</a></li>
            <li><a href="/dmca/" className="hover:text-white transition-colors">DMCA</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-stone-800 py-5 text-center text-xs text-stone-500">
        © {new Date().getFullYear()} Portal Soma · Feito com{" "}
        <Heart size={11} className="inline text-niver-500 mx-0.5" strokeWidth={2.5} /> para emocionar
      </div>
    </footer>
  );
}
