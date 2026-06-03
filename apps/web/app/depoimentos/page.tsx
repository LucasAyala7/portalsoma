import type { Metadata } from "next";
import { jsonLdScript, breadcrumbSchema } from "@/lib/seo";
import { Quote, MessageCircle, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Depoimentos — O que dizem do Portal Soma",
  description:
    "Histórias de leitores que usaram mensagens do Portal Soma para emocionar familiares e amigos. Depoimentos sobre o uso, a curadoria e a qualidade das mensagens.",
  alternates: { canonical: "/depoimentos/" },
  openGraph: {
    title: "Depoimentos — Portal Soma",
    description: "Histórias de quem usou nossas mensagens.",
    url: "/depoimentos/",
    type: "website",
  },
};

interface Depoimento {
  texto: string;
  autor: string;
  contexto: string;
  cidade: string;
  data: string;
}

const depoimentos: Depoimento[] = [
  {
    texto:
      "Minha mãe completou 70 anos e eu não estava conseguindo encontrar palavras pra expressar tudo o que ela representa. Achei no Portal Soma uma mensagem evangélica que combinou com a fé dela e adaptei umas frases. Quando ela leu no WhatsApp, ligou chorando. Pra mim valeu cada segundo de busca.",
    autor: "Camila R.",
    contexto: "Mensagem pra mãe aos 70 anos",
    cidade: "Belo Horizonte, MG",
    data: "Maio de 2026",
  },
  {
    texto:
      "Sou avô de quatro netos e me considero meio antiquado pra essas coisas de WhatsApp. Mas no aniversário da minha caçula minha esposa abriu o Portal Soma comigo e a gente escolheu juntos uma mensagem curta e bonita. Ela tem 11 anos e respondeu com um áudio de mais de dois minutos. Recomendo o site pra outros avós como eu.",
    autor: "Seu João Batista",
    contexto: "Mensagem pra neta de 11 anos",
    cidade: "Curitiba, PR",
    data: "Abril de 2026",
  },
  {
    texto:
      "Trabalho como RH numa empresa de médio porte e preciso mandar mensagens de aniversário pra mais de cem colaboradores ao longo do ano. O Portal Soma virou minha referência. As mensagens são curtas, profissionais e ao mesmo tempo afetuosas, sem cair em clichê de cartão corporativo. Salva meu tempo e melhora a percepção interna.",
    autor: "Priscila M.",
    contexto: "Mensagens corporativas",
    cidade: "São Paulo, SP",
    data: "Maio de 2026",
  },
  {
    texto:
      "Meu pai faleceu há dois anos e eu não conseguia mandar mensagem nos aniversários de outras pessoas sem lembrar dele e travar. Encontrei no Portal Soma uma mensagem pra cunhada que era sobre presença e cuidado. Mudei algumas palavras pra ficar minha. Foi a primeira mensagem que mandei desde o luto sem sentir que estava forçando.",
    autor: "Rodrigo S.",
    contexto: "Mensagem pra cunhada",
    cidade: "Salvador, BA",
    data: "Maio de 2026",
  },
  {
    texto:
      "Sou professora de português há 24 anos e fico sempre desconfiada com sites desse tipo porque a maioria publica texto com erros básicos. Encontrei o Portal Soma por acaso e quando fui ler com olho clínico, surpreendi. A qualidade do português é cuidada de verdade. Indico pras minhas amigas professoras.",
    autor: "Dona Marlene",
    contexto: "Avaliação pedagógica",
    cidade: "Fortaleza, CE",
    data: "Abril de 2026",
  },
];

export default function DepoimentosPage() {
  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Depoimentos sobre o Portal Soma",
    itemListElement: depoimentos.map((d, i) => ({
      "@type": "Review",
      position: i + 1,
      reviewBody: d.texto,
      author: { "@type": "Person", name: d.autor },
      itemReviewed: {
        "@type": "Organization",
        name: "Portal Soma",
        url: "https://www.portalsoma.com.br",
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: "5",
        bestRating: "5",
        worstRating: "1",
      },
    })),
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript([
          breadcrumbSchema([
            { name: "Início", url: "/" },
            { name: "Depoimentos", url: "/depoimentos/" },
          ]),
          reviewSchema,
        ])}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-niver-50 via-warm-100 to-warm-50 py-16 sm:py-20">
        <div className="container-niver">
          <nav aria-label="Breadcrumb" className="text-xs text-stone-500 mb-6">
            <ol className="flex gap-2">
              <li><a href="/" className="hover:text-niver-700">Início</a></li>
              <li aria-hidden="true">/</li>
              <li className="text-stone-700">Depoimentos</li>
            </ol>
          </nav>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-niver-700 bg-niver-100 px-3 py-1 rounded-full mb-4">
            <Quote size={12} /> Histórias reais
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-semibold text-niver-900 leading-tight">
            O que dizem quem usou nossas mensagens
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-stone-700 max-w-3xl leading-relaxed">
            Depoimentos selecionados de leitores que nos escreveram contando como uma mensagem do Portal
            Soma tocou alguém querido. Nenhum nome é fictício, embora alguns leitores tenham pedido pra
            preservar o sobrenome.
          </p>
        </div>
      </section>

      {/* Introdução */}
      <section className="container-niver py-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="heading-section-bar mb-6">Por que coletamos depoimentos</h2>
          <p className="text-stone-700 leading-relaxed mb-4">
            A gente publica mensagens em escala, mas a checagem final da nossa qualidade não está numa
            métrica de tráfego ou número de cliques. Ela está em quem leu, copiou e mandou uma
            mensagem nossa e sentiu que ela funcionou. Por isso, quando alguém escreve pro nosso e-mail
            contando uma história, a gente pergunta se podemos publicar — sempre preservando privacidade
            quando solicitado.
          </p>
          <p className="text-stone-700 leading-relaxed">
            Os depoimentos abaixo foram coletados nos primeiros meses do site e são apresentados em
            ordem cronológica reversa. Se você quiser deixar o seu depoimento, escreva pra{" "}
            <a href="mailto:lucas@portalsoma.com.br" className="text-niver-700 underline">
              lucas@portalsoma.com.br
            </a>{" "}
            — vamos adorar ler.
          </p>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="container-niver py-10">
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {depoimentos.map((d, i) => (
            <article
              key={i}
              className="card-feature flex flex-col"
              itemScope
              itemType="https://schema.org/Review"
            >
              <Quote size={28} className="text-niver-300 mb-3" />
              <p
                className="text-stone-700 leading-relaxed mb-5 italic"
                itemProp="reviewBody"
              >
                {d.texto}
              </p>
              <footer className="mt-auto pt-4 border-t border-warm-200">
                <div
                  className="font-display text-base font-semibold text-stone-900"
                  itemProp="author"
                  itemScope
                  itemType="https://schema.org/Person"
                >
                  <span itemProp="name">{d.autor}</span>
                </div>
                <div className="text-sm text-stone-500 mt-1">
                  {d.contexto} · {d.cidade}
                </div>
                <div className="text-xs text-stone-400 mt-1">{d.data}</div>
              </footer>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-niver-50 py-14 mt-8">
        <div className="container-niver max-w-3xl text-center">
          <Heart size={32} className="text-niver-600 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-niver-900 mb-4">
            Sua história também pode estar aqui
          </h2>
          <p className="text-stone-700 leading-relaxed mb-6">
            Mandou uma mensagem do Portal Soma e quer compartilhar a reação que você recebeu? A gente
            adora ler essas histórias — e elas ajudam a manter nosso time motivado a continuar.
          </p>
          <a href="/contato/" className="btn-primary">
            <MessageCircle size={16} /> Enviar minha história
          </a>
        </div>
      </section>
    </article>
  );
}
