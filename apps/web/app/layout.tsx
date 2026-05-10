import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import { prisma } from "@nivertotal/db";
import "./globals.css";
import { Cake, Heart } from "lucide-react";

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
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
};

// Layout também revalida — total de mensagens no header/footer fica fresh
export const dynamic = "force-dynamic";
export const revalidate = 30;

async function getNavData() {
  const [topClusters, totalMensagens] = await Promise.all([
    prisma.cluster.findMany({
      where: { ativo: true, tipo: "DESTINATARIO" },
      orderBy: { volumeMensal: "desc" },
      take: 4,
      select: { slug: true, nome: true },
    }),
    prisma.mensagem.count({ where: { status: "PUBLISHED" } }),
  ]);
  return { topClusters, totalMensagens };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const navData = await getNavData();
  return (
    <html lang="pt-BR" className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        <div className="min-h-screen flex flex-col">
          <SiteHeader topClusters={navData.topClusters} totalMensagens={navData.totalMensagens} />
          <main className="flex-1">{children}</main>
          <SiteFooter totalMensagens={navData.totalMensagens} />
        </div>
      </body>
    </html>
  );
}

function SiteHeader({
  topClusters,
  totalMensagens,
}: {
  topClusters: { slug: string; nome: string }[];
  totalMensagens: number;
}) {
  return (
    <header className="sticky top-0 z-30 bg-warm-50/95 backdrop-blur-md border-b border-warm-200/60">
      <div className="container-wide flex h-14 sm:h-16 items-center justify-between gap-3">
        <a href="/" className="flex items-center gap-2 group">
          <span className="grid place-items-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-niver-600 text-white shadow-sm group-hover:bg-niver-700 transition-colors">
            <Cake size={16} strokeWidth={2.2} />
          </span>
          <span className="font-display text-lg sm:text-2xl font-semibold text-niver-700">
            Portal Soma
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {topClusters.map((c) => (
            <a
              key={c.slug}
              href={`/mensagem-de-aniversario/${c.slug}/`}
              className="px-3 py-1.5 rounded-full text-stone-700 hover:bg-niver-50 hover:text-niver-700 transition-colors font-medium"
            >
              {c.nome}
            </a>
          ))}
          <a
            href="/mensagem-de-aniversario/evangelica/"
            className="px-3 py-1.5 rounded-full text-stone-700 hover:bg-niver-50 hover:text-niver-700 transition-colors font-medium"
          >
            Evangélicas
          </a>
        </nav>
        <div className="hidden lg:flex items-center text-xs text-stone-500 tabular-nums">
          <Heart size={12} className="text-niver-500 mr-1" strokeWidth={2.5} />
          <strong className="text-niver-700 mr-1">
            {totalMensagens.toLocaleString("pt-BR")}
          </strong>
          mensagens
        </div>
        {/* Mobile: contador compacto */}
        <div className="md:hidden inline-flex items-center gap-1 text-xs bg-niver-50 text-niver-700 px-2.5 py-1 rounded-full font-medium tabular-nums">
          <Heart size={11} className="text-niver-500" strokeWidth={2.5} />
          {totalMensagens.toLocaleString("pt-BR")}
        </div>
      </div>
    </header>
  );
}

function SiteFooter({ totalMensagens }: { totalMensagens: number }) {
  return (
    <footer className="bg-stone-900 text-stone-300 mt-24">
      <div className="container-wide py-14 grid md:grid-cols-4 gap-10 text-sm">
        <div>
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
          <h4 className="font-semibold text-white mb-3 uppercase text-xs tracking-wider">Portal Soma</h4>
          <ul className="space-y-2">
            <li><a href="/sobre/" className="hover:text-white transition-colors">Sobre</a></li>
            <li><a href="/contato/" className="hover:text-white transition-colors">Contato</a></li>
            <li><a href="/politica-de-privacidade/" className="hover:text-white transition-colors">Privacidade</a></li>
            <li><a href="/termos/" className="hover:text-white transition-colors">Termos</a></li>
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
