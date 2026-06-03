import type { Metadata } from "next";
import { jsonLdScript, breadcrumbSchema } from "@/lib/seo";
import { Heart, Compass, Feather, Globe2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Nosso Propósito — Manifesto editorial do Portal Soma",
  description:
    "O manifesto editorial do Portal Soma. Por que existimos, no que acreditamos e como entendemos o papel de uma mensagem de aniversário na vida das pessoas.",
  alternates: { canonical: "/proposito/" },
  openGraph: {
    title: "Nosso Propósito — Portal Soma",
    description: "Manifesto editorial: por que o Portal Soma existe.",
    url: "/proposito/",
    type: "article",
  },
};

export default function PropositoPage() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "Propósito do Portal Soma",
    description:
      "Manifesto editorial do Portal Soma, o site brasileiro de mensagens de aniversário.",
    url: "https://www.portalsoma.com.br/proposito/",
    inLanguage: "pt-BR",
  };

  return (
    <article itemScope itemType="https://schema.org/AboutPage">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript([
          breadcrumbSchema([
            { name: "Início", url: "/" },
            { name: "Propósito", url: "/proposito/" },
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
              <li className="text-stone-700">Propósito</li>
            </ol>
          </nav>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-niver-700 bg-niver-100 px-3 py-1 rounded-full mb-4">
            <Compass size={12} /> Manifesto editorial
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-semibold text-niver-900 leading-tight max-w-3xl">
            Palavras importam. Mensagens de aniversário, ainda mais.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-stone-700 max-w-3xl leading-relaxed">
            Este é o manifesto do Portal Soma. Quem somos quando ninguém está olhando, como pensamos
            sobre o que publicamos e o que esperamos quando você sai do nosso site.
          </p>
        </div>
      </section>

      {/* Manifesto */}
      <section className="container-niver py-14">
        <div className="max-w-3xl mx-auto space-y-10">
          <div>
            <h2 className="heading-section-bar mb-5">A premissa</h2>
            <p className="text-stone-700 leading-relaxed text-lg mb-4">
              Acreditamos que <strong>uma mensagem de aniversário pode mudar o dia de alguém</strong>.
              Não estamos falando metaforicamente. Falamos da mãe que abre o WhatsApp esperando lembrança
              da filha que mora longe. Do pai aposentado que conta quantas mensagens chegou no celular.
              Da amiga que mora num grupo de WhatsApp inteiro mas só liga pra mensagem privada que
              alguém pensou nela.
            </p>
            <p className="text-stone-700 leading-relaxed">
              Numa cultura cada vez mais marcada por mensagens automáticas, GIFs reciclados e
              "parabéns" enviados sem pensar, dedicar tempo pra escolher uma boa mensagem virou um ato
              de afeto. O Portal Soma existe pra tornar esse ato mais fácil.
            </p>
          </div>

          <div>
            <h2 className="heading-section-bar mb-5">No que acreditamos</h2>
            <div className="grid sm:grid-cols-2 gap-6 mt-6">
              <div className="card-feature">
                <Heart size={24} className="text-niver-600 mb-2" />
                <h3 className="font-display text-lg font-semibold mb-2">Afeto não tem atalho</h3>
                <p className="text-stone-700 leading-relaxed">
                  Uma boa mensagem é fruto de tempo e atenção. Por isso curadoria humana é inegociável
                  no nosso processo, mesmo quando ferramentas modernas ajudam na produção.
                </p>
              </div>
              <div className="card-feature">
                <Feather size={24} className="text-niver-600 mb-2" />
                <h3 className="font-display text-lg font-semibold mb-2">Português digno</h3>
                <p className="text-stone-700 leading-relaxed">
                  Não publicamos nada com erro ortográfico, citação bíblica torta ou frase clichê
                  copiada de outros sites. Se chega aqui, é porque passou em revisão.
                </p>
              </div>
              <div className="card-feature">
                <Compass size={24} className="text-niver-600 mb-2" />
                <h3 className="font-display text-lg font-semibold mb-2">Diversidade de vozes</h3>
                <p className="text-stone-700 leading-relaxed">
                  Avó evangélica, pai discreto, amiga engraçada, padre acolhedor: cada destinatário
                  pede uma voz, e a gente não tenta empurrar uma única só.
                </p>
              </div>
              <div className="card-feature">
                <Globe2 size={24} className="text-niver-600 mb-2" />
                <h3 className="font-display text-lg font-semibold mb-2">Brasil que escreve</h3>
                <p className="text-stone-700 leading-relaxed">
                  Somos um produto brasileiro, escrito em português brasileiro, pensando em quem mora,
                  trabalha e ama no Brasil. Cada referência cultural respeita esse chão.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="heading-section-bar mb-5">O que rejeitamos</h2>
            <p className="text-stone-700 leading-relaxed mb-4">
              Nem tudo o que aparece como mensagem de aniversário pela internet vale a pena. A gente faz
              questão de listar o que <strong>não</strong> entra no Portal Soma:
            </p>
            <ul className="space-y-3 text-stone-700 leading-relaxed">
              <li>
                <strong>Mensagens copiadas de outros sites:</strong> além de ser ilegal, é preguiçoso.
                Quando uma frase já circula muito, repensamos ou descartamos.
              </li>
              <li>
                <strong>Religiosidade desrespeitosa:</strong> mensagens evangélicas, católicas,
                espíritas, umbandistas — todas têm espaço se forem escritas com respeito à tradição que
                representam. Apropriação superficial, não.
              </li>
              <li>
                <strong>Humor à custa de alguém:</strong> piadas etaristas ("agora você está velho!"),
                machistas, capacitistas ou racistas são rejeitadas em qualquer formato.
              </li>
              <li>
                <strong>Conteúdo gerado e publicado sem revisão:</strong> mesmo quando usamos
                ferramentas de inteligência artificial pra apoiar a produção, todo texto passa por um
                par de olhos humanos antes de entrar no ar.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="heading-section-bar mb-5">O que esperamos de você</h2>
            <p className="text-stone-700 leading-relaxed mb-4">
              Que você use o Portal Soma como ponto de partida, não como ponto final. Toda mensagem aqui
              é livre pra ser copiada, editada e adaptada pro seu jeito. Mude o nome da pessoa, adicione
              uma lembrança específica, retire o trecho que não combina. A mensagem fica sua quando você
              coloca um pedaço de você nela.
            </p>
            <p className="text-stone-700 leading-relaxed">
              E se uma mensagem do site te emocionou — se você mandou e a pessoa amou — a gente adoraria
              saber. Histórias assim alimentam o trabalho da nossa equipe. Escreva pra{" "}
              <a href="mailto:lucas@portalsoma.com.br" className="text-niver-700 underline">
                lucas@portalsoma.com.br
              </a>{" "}
              quando quiser contar.
            </p>
          </div>
        </div>
      </section>

      {/* Assinatura */}
      <section className="bg-niver-50 py-14">
        <div className="container-niver max-w-3xl text-center">
          <p className="text-stone-700 italic leading-relaxed">
            "Cada aniversário é um lembrete de que alguém escolheu existir mais um ano ao seu lado. Toda
            mensagem do Portal Soma carrega essa convicção."
          </p>
          <p className="mt-4 text-sm text-stone-500">— Equipe editorial do Portal Soma</p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <a href="/equipe/" className="btn-primary">Conheça a equipe</a>
            <a href="/politica-de-conteudo/" className="btn-secondary">Diretrizes editoriais</a>
          </div>
        </div>
      </section>
    </article>
  );
}
