import type { Metadata } from "next";
import { jsonLdScript, breadcrumbSchema } from "@/lib/seo";
import { Newspaper, Download, Mail, Image as ImageIcon, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Imprensa — Press kit do Portal Soma",
  description:
    "Imprensa, jornalistas e parceiros de mídia: acesso ao press kit do Portal Soma, biografia institucional, logos para download e contato direto com a editoria.",
  alternates: { canonical: "/imprensa/" },
  openGraph: {
    title: "Imprensa — Portal Soma",
    description: "Press kit, biografia e contato pra jornalistas.",
    url: "/imprensa/",
    type: "website",
  },
};

export default function ImprensaPage() {
  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript([
          breadcrumbSchema([
            { name: "Início", url: "/" },
            { name: "Imprensa", url: "/imprensa/" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Imprensa — Portal Soma",
            url: "https://www.portalsoma.com.br/imprensa/",
            inLanguage: "pt-BR",
            about: {
              "@type": "Organization",
              name: "Portal Soma",
              url: "https://www.portalsoma.com.br",
              parentOrganization: {
                "@type": "Organization",
                name: "Agência Vencedores Digitais",
                taxID: "34.600.484/0001-21",
              },
            },
          },
        ])}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-niver-50 via-warm-100 to-warm-50 py-16 sm:py-20">
        <div className="container-niver">
          <nav aria-label="Breadcrumb" className="text-xs text-stone-500 mb-6">
            <ol className="flex gap-2">
              <li><a href="/" className="hover:text-niver-700">Início</a></li>
              <li aria-hidden="true">/</li>
              <li className="text-stone-700">Imprensa</li>
            </ol>
          </nav>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-niver-700 bg-niver-100 px-3 py-1 rounded-full mb-4">
            <Newspaper size={12} /> Press kit
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-semibold text-niver-900 leading-tight">
            Imprensa e parceiros de mídia
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-stone-700 max-w-3xl leading-relaxed">
            Este espaço foi criado pra facilitar a vida de jornalistas, produtores de conteúdo e
            pesquisadores que queiram falar sobre o Portal Soma. Aqui você encontra o material oficial
            pra reportagens, citações e parcerias de mídia.
          </p>
        </div>
      </section>

      {/* Sobre */}
      <section className="container-niver py-14">
        <div className="max-w-3xl mx-auto">
          <h2 className="heading-section-bar mb-6">Em uma frase</h2>
          <p className="text-lg text-stone-700 leading-relaxed mb-8">
            O <strong>Portal Soma</strong> é o site brasileiro de mensagens de aniversário editado pela
            <strong> Agência Vencedores Digitais</strong>, fundado em abril de 2026 pelo empreendedor
            maranhense Lucas Ayala.
          </p>

          <h2 className="heading-section-bar mb-6">Em um parágrafo</h2>
          <p className="text-stone-700 leading-relaxed mb-8">
            O Portal Soma é um site brasileiro dedicado a publicar mensagens de aniversário em português
            organizadas por destinatário (mãe, pai, amiga, filho, namorado), ocasião (aniversário de 15
            anos, 60 anos, batismo) e tom (evangélica, engraçada, curta, bíblica). Toda mensagem
            publicada passa por curadoria editorial e é assinada por um autor — humano ou personagem
            virtual claramente identificado como tal. O site oferece ferramentas práticas como cópia em
            um clique e compartilhamento direto pro WhatsApp. É mantido pela Agência Vencedores
            Digitais (CNPJ 34.600.484/0001-21), com sede em Bacabal, no Maranhão, e foi fundado em
            abril de 2026 por Lucas Ayala.
          </p>

          <h2 className="heading-section-bar mb-6">Em três parágrafos</h2>
          <div className="text-stone-700 leading-relaxed space-y-4">
            <p>
              <strong>Quem somos.</strong> O Portal Soma nasceu em abril de 2026 a partir de uma
              observação simples: existe uma demanda enorme por mensagens de aniversário no Brasil, mas
              a maioria do conteúdo disponível na internet brasileira é repetitivo, mal escrito e
              impessoal. A proposta do Portal Soma é entregar o oposto: um acervo amplo, organizado e
              cuidado editorialmente, em português brasileiro, com curadoria humana.
            </p>
            <p>
              <strong>Como funcionamos.</strong> Nossa equipe combina editores reais com um pequeno
              elenco de autores virtuais — personagens autorais com vozes definidas, sempre
              identificados como tais — pra dar variedade de estilo ao acervo. Cada mensagem é vinculada
              ao seu autor, passa por revisão antes de ser publicada e fica acessível por filtros
              intuitivos. Oferecemos também recursos como cópia em um clique, compartilhamento direto no
              WhatsApp e personagens identificados pra que o leitor saiba quem escreveu o quê.
            </p>
            <p>
              <strong>Por que importa.</strong> Acreditamos que uma mensagem de aniversário bem escrita
              é um pequeno ato de afeto que pode mudar o dia de alguém. Numa cultura cada vez mais
              dominada por mensagens automáticas e GIFs reciclados, dedicar tempo pra escolher palavras
              certas virou um gesto que demonstra cuidado. Esse é o gesto que a gente ajuda a viabilizar.
            </p>
          </div>
        </div>
      </section>

      {/* Fato-cards */}
      <section className="bg-warm-100 py-14">
        <div className="container-niver">
          <h2 className="heading-section-bar mb-8">Dados rápidos</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card-feature">
              <div className="text-3xl font-display font-bold text-niver-700 mb-2">2026</div>
              <div className="text-sm text-stone-700">Ano de fundação</div>
            </div>
            <div className="card-feature">
              <div className="text-3xl font-display font-bold text-niver-700 mb-2">Bacabal</div>
              <div className="text-sm text-stone-700">Sede da empresa, no Maranhão</div>
            </div>
            <div className="card-feature">
              <div className="text-3xl font-display font-bold text-niver-700 mb-2">PT-BR</div>
              <div className="text-sm text-stone-700">Idioma editorial</div>
            </div>
            <div className="card-feature">
              <div className="text-3xl font-display font-bold text-niver-700 mb-2">100%</div>
              <div className="text-sm text-stone-700">Curadoria com revisão humana</div>
            </div>
          </div>
        </div>
      </section>

      {/* Materiais */}
      <section className="container-niver py-14">
        <h2 className="heading-section-bar mb-8">Materiais pra download</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card-feature">
            <ImageIcon size={28} className="text-niver-600 mb-3" />
            <h3 className="font-display text-lg font-semibold mb-2">Logos</h3>
            <p className="text-stone-700 leading-relaxed mb-4 text-sm">
              Conjunto de logos do Portal Soma em alta resolução, com versões clara e escura, em PNG e
              SVG. Pra usar em reportagens e materiais editoriais.
            </p>
            <a
              href="mailto:lucas@portalsoma.com.br?subject=Imprensa - Solicita%C3%A7%C3%A3o de logos"
              className="btn-secondary"
            >
              <Download size={14} /> Solicitar logos
            </a>
          </div>
          <div className="card-feature">
            <FileText size={28} className="text-niver-600 mb-3" />
            <h3 className="font-display text-lg font-semibold mb-2">Biografia institucional</h3>
            <p className="text-stone-700 leading-relaxed mb-4 text-sm">
              Bio curta e estendida da empresa, do fundador e da equipe editorial, em formato pronto
              pra publicação. Disponível sob solicitação.
            </p>
            <a
              href="mailto:lucas@portalsoma.com.br?subject=Imprensa - Biografia institucional"
              className="btn-secondary"
            >
              <Download size={14} /> Solicitar bio
            </a>
          </div>
          <div className="card-feature">
            <Mail size={28} className="text-niver-600 mb-3" />
            <h3 className="font-display text-lg font-semibold mb-2">Entrevistas e citações</h3>
            <p className="text-stone-700 leading-relaxed mb-4 text-sm">
              Pra agendar entrevista com a editoria, solicitar comentários temáticos ou citações
              específicas pra reportagem, escreva pro nosso e-mail de imprensa.
            </p>
            <a
              href="mailto:lucas@portalsoma.com.br?subject=Imprensa - Pedido de entrevista"
              className="btn-secondary"
            >
              <Mail size={14} /> Solicitar entrevista
            </a>
          </div>
        </div>
      </section>

      {/* Contato direto */}
      <section className="bg-niver-50 py-14">
        <div className="container-niver max-w-3xl">
          <h2 className="heading-section-bar mb-6">Contato direto pra imprensa</h2>
          <p className="text-stone-700 leading-relaxed mb-6">
            Pra agilizar o atendimento de pautas com prazo de fechamento, escreva diretamente pro
            e-mail abaixo identificando-se como jornalista, indicando o veículo e o prazo da matéria.
            Tentamos retornar em até 24h em dias úteis para demandas urgentes.
          </p>
          <div className="bg-white rounded-2xl border border-stone-100 p-6">
            <Mail size={22} className="text-niver-600 mb-2" />
            <p className="text-sm text-stone-600 mb-1">Contato editorial</p>
            <a
              href="mailto:lucas@portalsoma.com.br?subject=[IMPRENSA]"
              className="font-display text-xl text-niver-700 hover:text-niver-800 break-all"
            >
              lucas@portalsoma.com.br
            </a>
            <p className="text-xs text-stone-500 mt-3">
              Use o prefixo [IMPRENSA] no assunto pra priorização interna.
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}
