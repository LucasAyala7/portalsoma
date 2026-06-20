import type { Metadata } from "next";
import { jsonLdScript, breadcrumbSchema } from "@/lib/seo";
import { Mail, MapPin, Building2, Clock, MessageSquare, Send } from "lucide-react";

export const metadata: Metadata = {
  title: "Contato · Fale com o Portal Soma",
  description:
    "Entre em contato com o Portal Soma. Envie sugestões, parcerias, correções editoriais ou solicitações de imprensa. Resposta em até 5 dias úteis.",
  alternates: { canonical: "/contato/" },
  openGraph: {
    title: "Contato · Portal Soma",
    description: "Envie sua mensagem para o Portal Soma.",
    url: "/contato/",
    type: "website",
  },
};

export default function ContatoPage() {
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contato · Portal Soma",
    url: "https://www.portalsoma.com.br/contato/",
    inLanguage: "pt-BR",
    mainEntity: {
      "@type": "Organization",
      name: "Portal Soma",
      url: "https://www.portalsoma.com.br",
      email: "lucas@portalsoma.com.br",
      parentOrganization: {
        "@type": "Organization",
        name: "Agência Vencedores Digitais",
        taxID: "34.600.484/0001-21",
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Bacabal",
        addressRegion: "MA",
        addressCountry: "BR",
        postalCode: "65700-000",
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "lucas@portalsoma.com.br",
          areaServed: "BR",
          availableLanguage: ["Portuguese"],
        },
      ],
    },
  };

  const mailtoSubject = encodeURIComponent("Contato pelo site - Portal Soma");
  const mailtoBody = encodeURIComponent(
    "Olá, equipe do Portal Soma,\n\nMeu nome é: \nMotivo do contato: \nMensagem:\n\n"
  );
  const mailto = `mailto:lucas@portalsoma.com.br?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript([
          breadcrumbSchema([
            { name: "Início", url: "/" },
            { name: "Contato", url: "/contato/" },
          ]),
          contactSchema,
        ])}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-niver-50 via-warm-100 to-warm-50 py-16 sm:py-20">
        <div className="container-niver">
          <nav aria-label="Breadcrumb" className="text-xs text-stone-500 mb-6">
            <ol className="flex gap-2">
              <li><a href="/" className="hover:text-niver-700">Início</a></li>
              <li aria-hidden="true">/</li>
              <li className="text-stone-700">Contato</li>
            </ol>
          </nav>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-niver-700 bg-niver-100 px-3 py-1 rounded-full mb-4">
            <MessageSquare size={12} /> Estamos aqui
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-semibold text-niver-900 leading-tight">
            Fale com a equipe do Portal Soma
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-stone-700 max-w-3xl leading-relaxed">
            Sugestões, parcerias, correções editoriais, dúvidas sobre uma mensagem ou pedidos de imprensa —
            o nosso e-mail está sempre aberto. A gente responde toda mensagem em até 5 dias úteis.
          </p>
        </div>
      </section>

      <section className="container-niver py-14">
        <div className="grid md:grid-cols-5 gap-10">
          {/* Form */}
          <div className="md:col-span-3">
            <h2 className="heading-section-bar mb-6">Envie sua mensagem</h2>
            <p className="text-stone-700 leading-relaxed mb-6">
              Por enquanto, nosso canal principal é o e-mail. Você pode usar o formulário abaixo (que vai
              abrir seu programa de e-mail com o conteúdo pré-preenchido) ou escrever diretamente pra{" "}
              <a
                href="mailto:lucas@portalsoma.com.br"
                className="text-niver-700 underline hover:text-niver-800"
                itemProp="email"
              >
                lucas@portalsoma.com.br
              </a>
              .
            </p>

            <form action={mailto} method="get" className="space-y-4 bg-white rounded-2xl border border-stone-100 p-6 shadow-sm">
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-stone-700 mb-1">
                  Seu nome
                </label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  placeholder="Como prefere ser chamado"
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-niver-300 focus:border-niver-400 outline-none transition"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
                  Seu e-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="seu-email@exemplo.com"
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-niver-300 focus:border-niver-400 outline-none transition"
                />
              </div>
              <div>
                <label htmlFor="assunto" className="block text-sm font-medium text-stone-700 mb-1">
                  Assunto
                </label>
                <select
                  id="assunto"
                  name="assunto"
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-niver-300 focus:border-niver-400 outline-none transition bg-white"
                >
                  <option>Sugestão de conteúdo</option>
                  <option>Correção editorial</option>
                  <option>Parceria comercial</option>
                  <option>Solicitação de imprensa</option>
                  <option>Dúvida geral</option>
                  <option>Outro</option>
                </select>
              </div>
              <div>
                <label htmlFor="mensagem" className="block text-sm font-medium text-stone-700 mb-1">
                  Sua mensagem
                </label>
                <textarea
                  id="mensagem"
                  name="mensagem"
                  rows={5}
                  required
                  placeholder="Conte pra gente como podemos ajudar"
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-niver-300 focus:border-niver-400 outline-none transition resize-y"
                />
              </div>
              <button type="submit" className="btn-primary">
                <Send size={16} /> Enviar pelo meu e-mail
              </button>
              <p className="text-xs text-stone-500">
                Ao enviar, seu programa de e-mail vai abrir com a mensagem já preenchida pra
                lucas@portalsoma.com.br. Nada é gravado no nosso servidor neste passo.
              </p>
            </form>
          </div>

          {/* Info */}
          <aside className="md:col-span-2 space-y-6">
            <div className="card-feature">
              <Mail size={24} className="text-niver-600 mb-2" />
              <h3 className="font-display text-lg font-semibold mb-2">E-mail</h3>
              <a
                href="mailto:lucas@portalsoma.com.br"
                className="text-niver-700 underline hover:text-niver-800 break-all"
                itemProp="email"
              >
                lucas@portalsoma.com.br
              </a>
              <p className="text-sm text-stone-600 mt-2">
                Canal preferencial pra qualquer assunto. Respondemos em até 5 dias úteis.
              </p>
            </div>

            <div
              className="card-feature"
              itemScope
              itemType="https://schema.org/PostalAddress"
            >
              <MapPin size={24} className="text-niver-600 mb-2" />
              <h3 className="font-display text-lg font-semibold mb-2">Endereço</h3>
              <address className="not-italic text-stone-700 leading-relaxed">
                <span itemProp="streetAddress">Bacabal · Maranhão</span>
                <br />
                <span itemProp="addressLocality">Bacabal</span>,{" "}
                <span itemProp="addressRegion">MA</span>
                <br />
                <span itemProp="addressCountry">Brasil</span>
              </address>
              <p className="text-sm text-stone-600 mt-2">
                Atendimento 100% remoto. Não recebemos correspondência física sem agendamento prévio.
              </p>
            </div>

            <div className="card-feature">
              <Building2 size={24} className="text-niver-600 mb-2" />
              <h3 className="font-display text-lg font-semibold mb-2">Razão Social</h3>
              <p className="text-stone-700 leading-relaxed">
                <strong>Agência Vencedores Digitais</strong>
                <br />
                CNPJ: 34.600.484/0001-21
                <br />
                Bacabal/MA · Brasil
              </p>
            </div>

            <div className="card-feature">
              <Clock size={24} className="text-niver-600 mb-2" />
              <h3 className="font-display text-lg font-semibold mb-2">Horário</h3>
              <p className="text-stone-700 leading-relaxed">
                Segunda a sexta, das 9h às 18h (horário de Brasília). Mensagens fora do horário comercial
                são respondidas no próximo dia útil.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* Outros canais */}
      <section className="bg-warm-100 py-14">
        <div className="container-niver max-w-3xl">
          <h2 className="heading-section-bar mb-6">Outros canais específicos</h2>
          <p className="text-stone-700 leading-relaxed mb-6">
            Pra agilizar o atendimento, separamos os principais motivos de contato. Use o canal mais
            adequado ao seu caso · assim sua mensagem chega na pessoa certa mais rápido.
          </p>
          <ul className="space-y-3 text-stone-700">
            <li>
              <strong>Imprensa e parcerias de mídia:</strong>{" "}
              <a href="/imprensa/" className="text-niver-700 underline">veja nosso press kit</a>{" "}
              ou escreva pra lucas@portalsoma.com.br com o assunto "Imprensa".
            </li>
            <li>
              <strong>Notificações de violação de direitos autorais (DMCA):</strong>{" "}
              <a href="/dmca/" className="text-niver-700 underline">use nossa página de DMCA</a>{" "}
              ou envie pra dmca@portalsoma.com.br.
            </li>
            <li>
              <strong>Privacidade e dados pessoais (LGPD):</strong> escreva pra
              lucas@portalsoma.com.br com o assunto "LGPD" · explicamos o procedimento na nossa{" "}
              <a href="/politica-de-privacidade/" className="text-niver-700 underline">Política de Privacidade</a>.
            </li>
            <li>
              <strong>Correções editoriais:</strong> achou um erro de português, citação bíblica errada ou
              data inconsistente? Mande pra lucas@portalsoma.com.br com o link da página e a correção
              sugerida. Agradecemos demais.
            </li>
          </ul>
        </div>
      </section>
    </article>
  );
}
