import type { Metadata } from "next";
import { jsonLdScript, breadcrumbSchema } from "@/lib/seo";
import { Cookie, Settings, ShieldOff } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Cookies — Portal Soma",
  description:
    "Política de Cookies do Portal Soma. Detalha quais cookies usamos, para que servem, quanto tempo duram e como você pode desativá-los no navegador.",
  alternates: { canonical: "/politica-de-cookies/" },
  openGraph: {
    title: "Política de Cookies — Portal Soma",
    description: "Cookies utilizados no Portal Soma e como controlá-los.",
    url: "/politica-de-cookies/",
    type: "article",
  },
};

const VIGENCIA = "1 de junho de 2026";

interface CookieRow {
  nome: string;
  origem: string;
  finalidade: string;
  duracao: string;
  categoria: "Essencial" | "Analítico" | "Publicidade";
}

const cookies: CookieRow[] = [
  {
    nome: "_ga, _ga_*",
    origem: "Google Analytics 4",
    finalidade: "Identificar visitantes únicos e medir desempenho do site.",
    duracao: "Até 26 meses",
    categoria: "Analítico",
  },
  {
    nome: "_gid",
    origem: "Google Analytics",
    finalidade: "Distinguir usuários nas sessões diárias.",
    duracao: "24 horas",
    categoria: "Analítico",
  },
  {
    nome: "__gads, __gpi",
    origem: "Google AdSense",
    finalidade: "Exibir anúncios relevantes e medir frequência.",
    duracao: "13 meses",
    categoria: "Publicidade",
  },
  {
    nome: "NID, IDE",
    origem: "Google AdSense / DoubleClick",
    finalidade: "Personalização de anúncios e limite de exibição.",
    duracao: "6 a 13 meses",
    categoria: "Publicidade",
  },
  {
    nome: "consent",
    origem: "Portal Soma",
    finalidade: "Registrar suas preferências de consentimento de cookies.",
    duracao: "12 meses",
    categoria: "Essencial",
  },
];

const categoriaCor: Record<CookieRow["categoria"], string> = {
  Essencial: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Analítico: "bg-sky-50 text-sky-700 border-sky-100",
  Publicidade: "bg-amber-50 text-amber-700 border-amber-100",
};

export default function CookiesPage() {
  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript([
          breadcrumbSchema([
            { name: "Início", url: "/" },
            { name: "Política de Cookies", url: "/politica-de-cookies/" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Política de Cookies — Portal Soma",
            url: "https://www.portalsoma.com.br/politica-de-cookies/",
            inLanguage: "pt-BR",
            dateModified: "2026-06-01",
          },
        ])}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-niver-50 via-warm-100 to-warm-50 py-14">
        <div className="container-niver">
          <nav aria-label="Breadcrumb" className="text-xs text-stone-500 mb-6">
            <ol className="flex gap-2">
              <li><a href="/" className="hover:text-niver-700">Início</a></li>
              <li aria-hidden="true">/</li>
              <li className="text-stone-700">Política de Cookies</li>
            </ol>
          </nav>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-niver-700 bg-niver-100 px-3 py-1 rounded-full mb-4">
            <Cookie size={12} /> Cookies
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-semibold text-niver-900 leading-tight">
            Política de Cookies
          </h1>
          <p className="mt-4 text-stone-600">Em vigor desde {VIGENCIA}</p>
        </div>
      </section>

      <section className="container-niver py-12">
        <div className="max-w-3xl mx-auto prose prose-stone">
          <p className="text-stone-700 leading-relaxed text-lg">
            Esta página explica em detalhe quais cookies são utilizados no Portal Soma, para que cada
            um serve, por quanto tempo eles permanecem armazenados no seu dispositivo e como você pode
            desativá-los. Ela complementa nossa{" "}
            <a href="/politica-de-privacidade/" className="text-niver-700 underline">
              Política de Privacidade
            </a>{" "}
            e segue as exigências da LGPD brasileira e do GDPR europeu.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">O que é um cookie</h2>
          <p className="text-stone-700 leading-relaxed">
            Um cookie é um pequeno arquivo de texto que um site coloca no seu navegador quando você o
            visita. Ele permite que o site reconheça o seu dispositivo, lembre preferências e meça o
            comportamento de navegação ao longo do tempo. Cookies em si não identificam você
            pessoalmente — eles armazenam apenas um identificador anônimo que o navegador devolve nas
            próximas visitas.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">Categorias usadas no Portal Soma</h2>
          <p className="text-stone-700 leading-relaxed mb-3">
            Trabalhamos com três categorias de cookies, que se diferenciam pela finalidade:
          </p>
          <ul className="text-stone-700 leading-relaxed space-y-2">
            <li>
              <strong>Essenciais.</strong> São necessários pro site funcionar e pra registrar suas
              preferências de consentimento. Não podem ser desativados sem comprometer a experiência.
            </li>
            <li>
              <strong>Analíticos.</strong> Ajudam a entender como o site é usado, com dados agregados
              e anônimos. Permitem identificar páginas que precisam de melhoria.
            </li>
            <li>
              <strong>Publicidade.</strong> Servem pra exibição e medição de anúncios via Google
              AdSense. Sem eles, anúncios ainda aparecem, mas de forma menos relevante e sem limite de
              frequência.
            </li>
          </ul>

          <h2 className="heading-section-bar mt-10 mb-4">Lista completa de cookies</h2>
          <div className="not-prose overflow-x-auto rounded-2xl border border-stone-100 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-warm-100 text-stone-700">
                <tr>
                  <th className="text-left px-4 py-3 font-display font-semibold">Cookie</th>
                  <th className="text-left px-4 py-3 font-display font-semibold">Origem</th>
                  <th className="text-left px-4 py-3 font-display font-semibold">Finalidade</th>
                  <th className="text-left px-4 py-3 font-display font-semibold">Duração</th>
                  <th className="text-left px-4 py-3 font-display font-semibold">Categoria</th>
                </tr>
              </thead>
              <tbody>
                {cookies.map((c, i) => (
                  <tr key={i} className="border-t border-stone-100">
                    <td className="px-4 py-3 font-mono text-xs text-stone-700">{c.nome}</td>
                    <td className="px-4 py-3 text-stone-700">{c.origem}</td>
                    <td className="px-4 py-3 text-stone-700">{c.finalidade}</td>
                    <td className="px-4 py-3 text-stone-600">{c.duracao}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${categoriaCor[c.categoria]}`}>
                        {c.categoria}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="heading-section-bar mt-10 mb-4">Google Analytics 4</h2>
          <p className="text-stone-700 leading-relaxed">
            Usamos o Google Analytics 4 (GA4) com IP anonimizado pra entender quantas pessoas visitam
            o site, quais conteúdos são lidos com mais profundidade e como melhorar a navegação. O GA4
            não armazena nome, e-mail ou qualquer dado pessoal direto. Pra desativar o rastreamento do
            GA em todos os sites que você visita, instale o complemento oficial em{" "}
            <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-niver-700 underline">
              tools.google.com/dlpage/gaoptout
            </a>
            .
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">Google AdSense</h2>
          <p className="text-stone-700 leading-relaxed">
            Exibimos anúncios via Google AdSense pra sustentar a operação do site. O AdSense pode usar
            cookies pra mostrar anúncios mais relevantes baseados em suas visitas anteriores em outros
            sites — isso é chamado de publicidade comportamental. Você pode:
          </p>
          <ul className="text-stone-700 leading-relaxed space-y-2 mt-3">
            <li>
              Controlar personalização de anúncios em{" "}
              <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-niver-700 underline">
                adssettings.google.com
              </a>
              ;
            </li>
            <li>
              Optar por sair de anúncios de fornecedores certificados pela NAI em{" "}
              <a href="https://optout.networkadvertising.org" target="_blank" rel="noopener noreferrer" className="text-niver-700 underline">
                optout.networkadvertising.org
              </a>
              ;
            </li>
            <li>
              Aprender mais sobre privacidade no Google em{" "}
              <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-niver-700 underline">
                policies.google.com/technologies/ads
              </a>
              .
            </li>
          </ul>

          <h2 className="heading-section-bar mt-10 mb-4">Como desativar cookies no navegador</h2>
          <p className="text-stone-700 leading-relaxed mb-3">
            Você pode desativar ou apagar cookies a qualquer momento nas configurações do seu
            navegador. Os links abaixo levam direto à página oficial de cada um:
          </p>
          <ul className="text-stone-700 leading-relaxed space-y-2">
            <li>
              <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-niver-700 underline">
                Google Chrome
              </a>
            </li>
            <li>
              <a href="https://support.mozilla.org/pt-BR/kb/limpar-cookies-e-dados-de-sites-no-firefox" target="_blank" rel="noopener noreferrer" className="text-niver-700 underline">
                Mozilla Firefox
              </a>
            </li>
            <li>
              <a href="https://support.apple.com/pt-br/guide/safari/sfri11471" target="_blank" rel="noopener noreferrer" className="text-niver-700 underline">
                Apple Safari
              </a>
            </li>
            <li>
              <a href="https://support.microsoft.com/pt-br/microsoft-edge" target="_blank" rel="noopener noreferrer" className="text-niver-700 underline">
                Microsoft Edge
              </a>
            </li>
          </ul>
          <p className="text-stone-700 leading-relaxed mt-3">
            Importante: desativar todos os cookies pode prejudicar a navegação em sites em geral. No
            Portal Soma, especificamente, a desativação dos cookies de analytics e publicidade não
            impede que você acesse o conteúdo — apenas desliga a medição e a personalização.
          </p>

          <div className="not-prose mt-10 grid sm:grid-cols-2 gap-4">
            <a href="/politica-de-privacidade/" className="card-feature flex items-start gap-3 hover:shadow-md transition">
              <Settings size={20} className="text-niver-600 shrink-0 mt-1" />
              <div>
                <div className="font-display font-semibold text-stone-900">Política de Privacidade</div>
                <div className="text-xs text-stone-600">Tratamento de dados completo</div>
              </div>
            </a>
            <a href="/contato/" className="card-feature flex items-start gap-3 hover:shadow-md transition">
              <ShieldOff size={20} className="text-niver-600 shrink-0 mt-1" />
              <div>
                <div className="font-display font-semibold text-stone-900">Reclamações</div>
                <div className="text-xs text-stone-600">Fale com nosso DPO</div>
              </div>
            </a>
          </div>
        </div>
      </section>
    </article>
  );
}
