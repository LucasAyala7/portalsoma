import type { Metadata } from "next";
import { jsonLdScript, breadcrumbSchema } from "@/lib/seo";
import { Eye, Coins, RefreshCcw, Edit3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Transparência — Portal Soma",
  description:
    "Como o Portal Soma se sustenta financeiramente, fontes de receita, parcerias afiliadas, processo de correções editoriais e princípios de independência.",
  alternates: { canonical: "/politica-de-transparencia/" },
  openGraph: {
    title: "Política de Transparência — Portal Soma",
    description: "Receita, correções, independência editorial.",
    url: "/politica-de-transparencia/",
    type: "article",
  },
};

const VIGENCIA = "1 de junho de 2026";

export default function TransparenciaPage() {
  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript([
          breadcrumbSchema([
            { name: "Início", url: "/" },
            { name: "Política de Transparência", url: "/politica-de-transparencia/" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Política de Transparência — Portal Soma",
            url: "https://www.portalsoma.com.br/politica-de-transparencia/",
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
              <li className="text-stone-700">Política de Transparência</li>
            </ol>
          </nav>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-niver-700 bg-niver-100 px-3 py-1 rounded-full mb-4">
            <Eye size={12} /> Sem segredos
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-semibold text-niver-900 leading-tight">
            Política de Transparência
          </h1>
          <p className="mt-4 text-stone-600">Em vigor desde {VIGENCIA}</p>
        </div>
      </section>

      <section className="container-niver py-12">
        <div className="max-w-3xl mx-auto prose prose-stone">
          <p className="text-stone-700 leading-relaxed text-lg">
            Acreditamos que um site editorial deve ser claro sobre como se sustenta, como toma decisões
            e como reage quando comete erros. Esta página reúne todas essas informações em um só
            lugar. Foi escrita pra ser lida — e atualizada quando algo mudar.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">1. Como nos sustentamos</h2>
          <p className="text-stone-700 leading-relaxed mb-3">
            O Portal Soma é gratuito pra quem lê. Sustenta-se hoje por uma única fonte de receita:
          </p>
          <ul className="text-stone-700 leading-relaxed space-y-2">
            <li>
              <strong>Publicidade programática via Google AdSense.</strong> Anúncios contextuais são
              exibidos em algumas páginas e geram receita pra equipe e pra manutenção da infraestrutura
              (servidor, domínio, ferramentas editoriais). Não temos nenhum controle sobre quais
              anúncios específicos aparecem — isso é decidido pelo algoritmo do Google e pelas
              preferências do leitor (veja{" "}
              <a href="/politica-de-cookies/" className="text-niver-700 underline">
                Política de Cookies
              </a>
              ).
            </li>
          </ul>
          <p className="text-stone-700 leading-relaxed mt-3">
            Não recebemos verba de partidos políticos, governos, denominações religiosas ou marcas
            patrocinadoras. Não publicamos publieditorial. Não vendemos nem vamos vender produtos
            próprios neste site.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">2. Fontes futuras de receita</h2>
          <p className="text-stone-700 leading-relaxed mb-3">
            À medida que o Portal Soma cresce, novas formas de monetização podem ser experimentadas.
            Esta seção será atualizada com antecedência sempre que qualquer uma delas for ativada:
          </p>
          <ul className="text-stone-700 leading-relaxed space-y-2">
            <li>
              <strong>Parcerias afiliadas.</strong> Podemos passar a recomendar produtos relacionados
              ao universo de aniversários (cartões físicos, produtos personalizados, presentes). Quando
              acontecer, cada link será marcado como "link afiliado" e o leitor verá um aviso claro.
            </li>
            <li>
              <strong>Conteúdo patrocinado declarado.</strong> Em casos raros, pode haver editorial em
              parceria com marcas. Será identificado de forma destacada no topo do conteúdo, com a
              tag "patrocinado" e o nome da marca.
            </li>
            <li>
              <strong>Produtos próprios.</strong> Eventuais e-books, álbuns ou ferramentas pagas serão
              ofertados de forma claramente separada do conteúdo editorial gratuito.
            </li>
          </ul>
          <p className="text-stone-700 leading-relaxed mt-3">
            Em nenhum caso publicaremos algo pago sem identificação visível. A separação entre
            conteúdo editorial e conteúdo comercial é um princípio inegociável.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">3. Independência editorial</h2>
          <p className="text-stone-700 leading-relaxed">
            Anunciantes do Google AdSense não têm influência sobre o que publicamos. A escolha de
            temas, autores, abordagens e tom é exclusivamente da nossa equipe editorial. Anúncios
            podem aparecer em qualquer página, mas nunca como retribuição por menção positiva ou
            tratamento favorável a qualquer marca ou produto.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">4. Inteligência artificial e processo editorial</h2>
          <p className="text-stone-700 leading-relaxed mb-3">
            Usamos ferramentas de inteligência artificial pra apoiar a produção editorial — sobretudo na
            geração de rascunhos, na pesquisa de referências bíblicas e na geração de imagens
            ilustrativas. Em todos os casos:
          </p>
          <ul className="text-stone-700 leading-relaxed space-y-2">
            <li>O texto final passa por revisão humana antes de ser publicado;</li>
            <li>Toda mensagem é atribuída a um autor identificado (real ou personagem virtual, sempre marcado como tal);</li>
            <li>Não publicamos conteúdo gerado por IA sem revisão.</li>
          </ul>
          <p className="text-stone-700 leading-relaxed mt-3">
            Pra detalhes sobre o nosso processo editorial completo, veja a{" "}
            <a href="/politica-de-conteudo/" className="text-niver-700 underline">
              Política de Conteúdo
            </a>
            .
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">5. Correções editoriais</h2>
          <p className="text-stone-700 leading-relaxed mb-3">
            Erros acontecem. Quando publicamos algo incorreto — erro ortográfico, citação bíblica
            errada, data inconsistente, atribuição equivocada — agimos da seguinte forma:
          </p>
          <ul className="text-stone-700 leading-relaxed space-y-2">
            <li>
              <strong>Erros menores</strong> (digitação, pontuação): corrigidos silenciosamente, sem
              nota adicional.
            </li>
            <li>
              <strong>Erros materiais</strong> (informação factual incorreta, citação errada, autoria
              equivocada): corrigidos com nota ao final da página informando "Corrigido em [data]" e
              explicando o que mudou.
            </li>
            <li>
              <strong>Erros graves</strong> (publicação que ofenda algum grupo, viés religioso ou
              cultural prejudicial): a mensagem é despublicada, e a página resta com uma nota
              explicando a remoção.
            </li>
          </ul>
          <p className="text-stone-700 leading-relaxed mt-3">
            Pra reportar um erro, escreva pra{" "}
            <a href="mailto:lucas@portalsoma.com.br" className="text-niver-700 underline">
              lucas@portalsoma.com.br
            </a>{" "}
            com o link da página e o problema identificado. Agradecemos demais — leitores atentos são
            nossos melhores aliados.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">6. Dados, métricas e privacidade</h2>
          <p className="text-stone-700 leading-relaxed">
            Coletamos métricas de visitação e engajamento de forma anônima e agregada pra entender o
            que funciona e o que precisa melhorar. Não compartilhamos dados individuais com terceiros
            fora dos serviços padrão de analytics e publicidade. Pra detalhes, veja a{" "}
            <a href="/politica-de-privacidade/" className="text-niver-700 underline">
              Política de Privacidade
            </a>
            .
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">7. Estrutura societária</h2>
          <p className="text-stone-700 leading-relaxed">
            O Portal Soma é mantido pela <strong>Agência Vencedores Digitais</strong>, pessoa jurídica
            brasileira inscrita no CNPJ <strong>34.600.484/0001-21</strong>, sediada em Bacabal,
            Maranhão. A empresa é de capital fechado, sem participação de fundos, investidores
            externos ou conglomerados de mídia. O sócio fundador é Lucas Ayala. Não há qualquer
            relação societária com partidos políticos ou denominações religiosas.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">8. Reclamações</h2>
          <p className="text-stone-700 leading-relaxed">
            Não concorda com algo do que descrevemos aqui? Acredita que falhamos em algum princípio?
            Escreva pra{" "}
            <a href="mailto:lucas@portalsoma.com.br" className="text-niver-700 underline">
              lucas@portalsoma.com.br
            </a>{" "}
            com o assunto "Transparência". Toda reclamação é respondida.
          </p>

          <div className="not-prose mt-12 grid sm:grid-cols-3 gap-4">
            <a href="/politica-de-conteudo/" className="card-feature flex items-start gap-3 hover:shadow-md transition">
              <Edit3 size={20} className="text-niver-600 shrink-0 mt-1" />
              <div>
                <div className="font-display font-semibold text-stone-900">Processo editorial</div>
                <div className="text-xs text-stone-600">Como escolhemos publicar</div>
              </div>
            </a>
            <a href="/imprensa/" className="card-feature flex items-start gap-3 hover:shadow-md transition">
              <RefreshCcw size={20} className="text-niver-600 shrink-0 mt-1" />
              <div>
                <div className="font-display font-semibold text-stone-900">Press kit</div>
                <div className="text-xs text-stone-600">Material pra jornalistas</div>
              </div>
            </a>
            <a href="/contato/" className="card-feature flex items-start gap-3 hover:shadow-md transition">
              <Coins size={20} className="text-niver-600 shrink-0 mt-1" />
              <div>
                <div className="font-display font-semibold text-stone-900">Parcerias</div>
                <div className="text-xs text-stone-600">Propostas comerciais</div>
              </div>
            </a>
          </div>
        </div>
      </section>
    </article>
  );
}
