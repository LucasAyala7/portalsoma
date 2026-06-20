import type { Metadata } from "next";
import { jsonLdScript, breadcrumbSchema } from "@/lib/seo";
import { Heart, Sparkles, Users, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Sobre o Portal Soma · Nossa história, propósito e equipe",
  description:
    "Conheça a história do Portal Soma, o site brasileiro dedicado a mensagens de aniversário emocionantes em português. Fundado em 2026, mantido pela Vencedores Digitais.",
  alternates: { canonical: "/sobre/" },
  openGraph: {
    title: "Sobre o Portal Soma",
    description:
      "A história, a equipe e o propósito por trás do Portal Soma · mensagens de aniversário pra emocionar quem você ama.",
    url: "/sobre/",
    type: "article",
  },
};

export default function SobrePage() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "Sobre o Portal Soma",
    description:
      "História, equipe e propósito do Portal Soma, o site brasileiro de mensagens de aniversário.",
    url: "https://www.portalsoma.com.br/sobre/",
    inLanguage: "pt-BR",
    about: {
      "@type": "Organization",
      name: "Portal Soma",
      url: "https://www.portalsoma.com.br",
      founder: { "@type": "Person", name: "Lucas Ayala" },
      foundingDate: "2026-04-01",
      foundingLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Bacabal",
          addressRegion: "MA",
          addressCountry: "BR",
        },
      },
      parentOrganization: {
        "@type": "Organization",
        name: "Agência Vencedores Digitais",
        taxID: "34.600.484/0001-21",
      },
    },
  };

  return (
    <article itemScope itemType="https://schema.org/AboutPage">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript([
          breadcrumbSchema([
            { name: "Início", url: "/" },
            { name: "Sobre", url: "/sobre/" },
          ]),
          aboutSchema,
        ])}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-niver-50 via-warm-100 to-warm-50 py-16 sm:py-24">
        <div className="container-niver">
          <nav aria-label="Breadcrumb" className="text-xs text-stone-500 mb-6">
            <ol className="flex gap-2">
              <li><a href="/" className="hover:text-niver-700">Início</a></li>
              <li aria-hidden="true">/</li>
              <li className="text-stone-700">Sobre</li>
            </ol>
          </nav>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-niver-700 bg-niver-100 px-3 py-1 rounded-full mb-4">
            <Sparkles size={12} /> Nossa história
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-semibold text-niver-900 leading-tight">
            Mensagens que emocionam. Pessoas que importam.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-stone-700 max-w-3xl leading-relaxed">
            O Portal Soma é um espaço dedicado a quem quer dizer parabéns de um jeito que toque o coração.
            Aqui, cada mensagem é pensada com cuidado pra que palavras virem abraços.
          </p>
        </div>
      </section>

      {/* Manifesto */}
      <section className="container-niver py-14">
        <div className="max-w-3xl mx-auto prose prose-stone">
          <h2 className="heading-section-bar">Por que o Portal Soma existe</h2>
          <p className="mt-6 text-stone-700 leading-relaxed text-lg">
            Em algum momento, todo mundo precisou parabenizar alguém e travou na hora de escolher as
            palavras. Aquele momento curto entre abrir o aplicativo de mensagens, lembrar do aniversário e
            sentir que o texto que vai sair precisa ser à altura do amor que se sente. Foi pra esse momento
            que o Portal Soma nasceu · pra que ninguém mais perca a oportunidade de emocionar quem ama
            por não encontrar a frase certa.
          </p>
          <p className="mt-4 text-stone-700 leading-relaxed">
            Nossa biblioteca reúne mensagens de aniversário pra mãe, pai, filhos, irmãos, amigos,
            avós, namorados, colegas de trabalho, líderes religiosos e várias outras pessoas queridas. Não
            são textos genéricos repetidos. Cada mensagem passa por revisão editorial, foi escrita ou
            adaptada por alguém da nossa equipe e foi testada num critério simples: emociona ou não?
          </p>
        </div>
      </section>

      {/* Quem somos / valores */}
      <section className="bg-warm-100 py-14">
        <div className="container-niver">
          <h2 className="heading-section-bar mb-10">Como a gente trabalha</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card-feature">
              <Heart size={28} className="text-niver-600 mb-3" />
              <h3 className="text-xl font-display font-semibold text-stone-900 mb-2">Curadoria com afeto</h3>
              <p className="text-stone-700 leading-relaxed">
                Toda mensagem que entra no Portal Soma passa por leitura humana. Nossa
                equipe pergunta sempre: essa mensagem pode mudar o dia de alguém? Se a resposta for não,
                ela não é publicada.
              </p>
            </div>
            <div className="card-feature">
              <Users size={28} className="text-niver-600 mb-3" />
              <h3 className="text-xl font-display font-semibold text-stone-900 mb-2">Vozes diversas</h3>
              <p className="text-stone-700 leading-relaxed">
                Não acreditamos num único jeito de parabenizar. Por isso convidamos vozes diferentes —
                avós, pastores, professoras, irmãos mais novos · pra escrever conosco. Cada autor traz seu
                estilo, sua fé, sua memória.
              </p>
            </div>
            <div className="card-feature">
              <BookOpen size={28} className="text-niver-600 mb-3" />
              <h3 className="text-xl font-display font-semibold text-stone-900 mb-2">Português que respeita</h3>
              <p className="text-stone-700 leading-relaxed">
                Cuidamos da língua portuguesa. Nada de copiar e colar erros gramaticais que circulam por
                aí. Cada texto passa por revisão ortográfica antes de aparecer pra você.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* História */}
      <section className="container-niver py-14">
        <div className="max-w-3xl mx-auto">
          <h2 className="heading-section-bar mb-8">A nossa fundação</h2>
          <p className="text-stone-700 leading-relaxed mb-4">
            O Portal Soma foi fundado em abril de 2026 pelo empreendedor maranhense Lucas Ayala, com
            sede em Bacabal, no Maranhão. A ideia partiu de uma observação simples: existem milhões de
            mensagens de aniversário circulando na internet brasileira, mas a maioria é repetitiva, mal
            escrita ou impessoal. Lucas acreditava que dava pra fazer diferente · combinando editoria
            séria, vozes humanas e ferramentas modernas pra entregar conteúdo de qualidade em escala.
          </p>
          <p className="text-stone-700 leading-relaxed mb-4">
            O projeto começou como uma pequena coleção de mensagens organizada por destinatário e cresceu
            rapidamente. Hoje, o site está dentro da estrutura da{" "}
            <strong>Agência Vencedores Digitais</strong> (CNPJ 34.600.484/0001-21), e conta com uma
            equipe editorial mista: redatores humanos que assinam edição e curadoria, e autores
            virtuais · personagens com vozes próprias, claramente identificados como tais · que dão
            cor e variedade ao acervo. Toda mensagem publicada está vinculada a um autor, e a página do
            autor explica quem ele é.
          </p>
          <p className="text-stone-700 leading-relaxed">
            Nosso compromisso é simples: ajudar você a encontrar, em poucos segundos, a mensagem certa
            pra cada pessoa querida. E manter esse acervo crescendo sempre, com cuidado, sem perder a
            mão na escala.
          </p>
        </div>
      </section>

      {/* Missão */}
      <section className="bg-niver-50 py-14">
        <div className="container-niver max-w-3xl text-center">
          <h2 className="text-3xl font-display font-semibold text-niver-900 mb-4">Nossa missão</h2>
          <p className="text-xl text-stone-700 leading-relaxed">
            Fazer com que cada aniversário no Brasil seja celebrado com palavras à altura do amor que se
            sente. Uma mensagem de cada vez.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <a href="/equipe/" className="btn-primary">Conheça nossa equipe</a>
            <a href="/contato/" className="btn-secondary">Fale com a gente</a>
          </div>
        </div>
      </section>
    </article>
  );
}
