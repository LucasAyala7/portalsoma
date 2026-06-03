import type { Metadata } from "next";
import { jsonLdScript, breadcrumbSchema } from "@/lib/seo";
import { ClipboardCheck, BookOpenCheck, Bot, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Conteúdo — Diretrizes editoriais do Portal Soma",
  description:
    "Diretrizes editoriais do Portal Soma: processo de revisão, critérios de qualidade, fontes consultadas, uso de inteligência artificial e padrões de atribuição.",
  alternates: { canonical: "/politica-de-conteudo/" },
  openGraph: {
    title: "Política de Conteúdo — Portal Soma",
    description: "Diretrizes editoriais e processo de revisão.",
    url: "/politica-de-conteudo/",
    type: "article",
  },
};

const VIGENCIA = "1 de junho de 2026";

export default function ConteudoPage() {
  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript([
          breadcrumbSchema([
            { name: "Início", url: "/" },
            { name: "Política de Conteúdo", url: "/politica-de-conteudo/" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Política de Conteúdo — Portal Soma",
            url: "https://www.portalsoma.com.br/politica-de-conteudo/",
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
              <li className="text-stone-700">Política de Conteúdo</li>
            </ol>
          </nav>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-niver-700 bg-niver-100 px-3 py-1 rounded-full mb-4">
            <ClipboardCheck size={12} /> Diretrizes editoriais
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-semibold text-niver-900 leading-tight">
            Política de Conteúdo
          </h1>
          <p className="mt-4 text-stone-600">Em vigor desde {VIGENCIA}</p>
        </div>
      </section>

      <section className="container-niver py-12">
        <div className="max-w-3xl mx-auto prose prose-stone">
          <p className="text-stone-700 leading-relaxed text-lg">
            Esta página descreve com detalhe como produzimos as mensagens publicadas no Portal Soma —
            do critério de tema à revisão final. O objetivo é ser específico o suficiente pra que
            qualquer leitor, jornalista ou pesquisador entenda o que esperar do nosso conteúdo.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">1. Critérios de qualidade</h2>
          <p className="text-stone-700 leading-relaxed mb-3">
            Toda mensagem publicada no Portal Soma precisa passar por cinco filtros antes de entrar no ar:
          </p>
          <ol className="text-stone-700 leading-relaxed space-y-2 list-decimal pl-6">
            <li>
              <strong>Originalidade.</strong> Não é cópia literal de outro site ou de uma frase já
              circulando em massa. Inspirações universais (versículos, votos populares) podem ser
              referência, mas o texto final é elaborado pela equipe.
            </li>
            <li>
              <strong>Português correto.</strong> Sem erro ortográfico, gramatical ou de pontuação.
              Sintaxe natural, vocabulário acessível.
            </li>
            <li>
              <strong>Verdade emocional.</strong> O texto entrega o que promete: se é "evangélica",
              tem fundo bíblico real; se é "engraçada", tem humor; se é pra mãe, soa como algo que se
              diria pra uma mãe.
            </li>
            <li>
              <strong>Respeito.</strong> Não há piada à custa de grupos, religiões, idades ou
              identidades. Não há tom condescendente.
            </li>
            <li>
              <strong>Encaixe contextual.</strong> Combina com o destinatário, ocasião e canal pra
              onde foi pensada (uma mensagem de WhatsApp curta funciona diferente de uma carta
              impressa de 70 anos).
            </li>
          </ol>

          <h2 className="heading-section-bar mt-10 mb-4">2. Processo de produção</h2>
          <p className="text-stone-700 leading-relaxed mb-3">
            O ciclo padrão de produção de uma mensagem segue estas etapas:
          </p>
          <ul className="text-stone-700 leading-relaxed space-y-2">
            <li>
              <strong>Briefing.</strong> Decidimos o cluster (destinatário, ocasião, tom) e o número
              de mensagens a produzir.
            </li>
            <li>
              <strong>Escolha do autor.</strong> Cada cluster tem afinidade com determinados autores
              (a Vó Lurdes escreve evangélicas; o Pastor Antônio, bíblicas; a Tia Fátima, descontraídas).
            </li>
            <li>
              <strong>Rascunho.</strong> O rascunho pode partir de uma redação humana ou de um
              draft assistido por IA, sempre alinhado à voz do autor.
            </li>
            <li>
              <strong>Revisão editorial.</strong> Um editor humano lê a mensagem com checklist:
              ortografia, fato (se há citação bíblica, conferimos a referência), encaixe ao destinatário, tom.
            </li>
            <li>
              <strong>Atribuição.</strong> A mensagem é vinculada ao autor identificado (real ou
              personagem) e à categoria correta.
            </li>
            <li>
              <strong>Publicação.</strong> Vai ao ar com a data de publicação registrada e fica
              acessível pelos filtros do site.
            </li>
            <li>
              <strong>Monitoramento.</strong> Recebemos comentários e correções de leitores. Quando
              fazem sentido, atualizamos.
            </li>
          </ul>

          <h2 className="heading-section-bar mt-10 mb-4">3. Uso de inteligência artificial</h2>
          <p className="text-stone-700 leading-relaxed mb-3">
            Somos transparentes: usamos ferramentas de IA pra apoiar a produção. O uso é estruturado
            assim:
          </p>
          <ul className="text-stone-700 leading-relaxed space-y-2">
            <li>
              <strong>Drafts iniciais.</strong> Em parte dos casos, o primeiro rascunho de uma
              mensagem é gerado por IA com um prompt detalhado que reflete a voz do autor virtual
              correspondente.
            </li>
            <li>
              <strong>Pesquisa.</strong> A IA também ajuda a localizar referências bíblicas adequadas
              a um tema, sugestões de versículos, sinônimos.
            </li>
            <li>
              <strong>Imagens.</strong> Algumas ilustrações do site (cards, capas, fotos de autores
              virtuais) são geradas por modelos de imagem, sempre identificadas como tais quando
              relevante.
            </li>
          </ul>
          <p className="text-stone-700 leading-relaxed mt-3">
            Em todos os casos, nada vai ao ar sem revisão humana — texto, citação ou imagem. A
            inteligência artificial é ferramenta de produção, não autor. A responsabilidade editorial é
            sempre da nossa equipe humana.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">4. Autores virtuais</h2>
          <p className="text-stone-700 leading-relaxed">
            Trabalhamos com um pequeno elenco de personagens autorais — Vó Lurdes, Pastor Antônio,
            Padre Henrique, Júlia Marques, Marcos Almeida, Tia Fátima, Profa. Beatriz Coelho, Rafael
            Andrade. Cada um tem uma voz definida (faixa etária aproximada, contexto, religião quando
            aplicável, estilo de escrita) e produz mensagens dentro do seu repertório. A página de cada
            um esclarece quem é. Não escondemos do leitor que são personagens, e não pretendemos passá-los
            por pessoas reais.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">5. Fontes consultadas</h2>
          <p className="text-stone-700 leading-relaxed mb-3">
            Para mensagens com base religiosa, consultamos as seguintes referências:
          </p>
          <ul className="text-stone-700 leading-relaxed space-y-2">
            <li><strong>Bíblia Almeida Revista e Atualizada (ARA)</strong> e <strong>Nova Versão Internacional (NVI)</strong> pra citações em mensagens evangélicas e bíblicas;</li>
            <li><strong>Bíblia de Jerusalém</strong> e a tradução oficial da CNBB pra mensagens católicas;</li>
            <li>Hinários populares evangélicos e católicos pra inspiração de versos hino-poéticos.</li>
          </ul>
          <p className="text-stone-700 leading-relaxed mt-3">
            Pra mensagens de tom psicológico ou autoral, consultamos referências em literatura
            brasileira contemporânea e fundamentos de psicologia popular (sem pretensão clínica).
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">6. O que não publicamos</h2>
          <ul className="text-stone-700 leading-relaxed space-y-2">
            <li>Mensagens copiadas de outros sites ou bases de citações reconhecidas;</li>
            <li>Humor à custa de grupos vulneráveis;</li>
            <li>Mensagens com viés político-partidário;</li>
            <li>Conteúdo que reproduza estereótipos sobre idade, gênero, religião, etnia ou orientação sexual;</li>
            <li>Mensagens que façam afirmações terapêuticas, médicas ou financeiras (não somos uma fonte profissional desses temas).</li>
          </ul>

          <h2 className="heading-section-bar mt-10 mb-4">7. Atualização e arquivamento</h2>
          <p className="text-stone-700 leading-relaxed">
            Mensagens publicadas no Portal Soma são, em regra, atemporais — uma mensagem de feliz
            aniversário pra mãe escrita em 2026 segue válida em 2030. Por isso, raramente removemos
            conteúdo. Quando atualizamos, registramos a data de revisão. Quando despublicamos (por erro
            grave, denúncia procedente ou solicitação válida), a URL fica com uma nota explicativa em
            vez de retornar 404 silencioso.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">8. Como sugerir conteúdo</h2>
          <p className="text-stone-700 leading-relaxed">
            Sentiu falta de uma categoria? Quer ver mensagens pra um destinatário específico que ainda
            não cobrimos? Escreva pra{" "}
            <a href="mailto:lucas@portalsoma.com.br" className="text-niver-700 underline">
              lucas@portalsoma.com.br
            </a>{" "}
            com sua sugestão. Levamos demandas dos leitores a sério na hora de priorizar próximas
            produções.
          </p>

          <div className="not-prose mt-12 grid sm:grid-cols-3 gap-4">
            <a href="/equipe/" className="card-feature flex items-start gap-3 hover:shadow-md transition">
              <Users size={20} className="text-niver-600 shrink-0 mt-1" />
              <div>
                <div className="font-display font-semibold text-stone-900">Nossa equipe</div>
                <div className="text-xs text-stone-600">Autores reais e virtuais</div>
              </div>
            </a>
            <a href="/politica-de-transparencia/" className="card-feature flex items-start gap-3 hover:shadow-md transition">
              <BookOpenCheck size={20} className="text-niver-600 shrink-0 mt-1" />
              <div>
                <div className="font-display font-semibold text-stone-900">Transparência</div>
                <div className="text-xs text-stone-600">Receita e correções</div>
              </div>
            </a>
            <a href="/proposito/" className="card-feature flex items-start gap-3 hover:shadow-md transition">
              <Bot size={20} className="text-niver-600 shrink-0 mt-1" />
              <div>
                <div className="font-display font-semibold text-stone-900">Manifesto</div>
                <div className="text-xs text-stone-600">No que acreditamos</div>
              </div>
            </a>
          </div>
        </div>
      </section>
    </article>
  );
}
