import type { Metadata } from "next";
import { jsonLdScript, breadcrumbSchema } from "@/lib/seo";
import { Scale, FileText, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Termos de Uso · Portal Soma",
  description:
    "Termos de Uso do Portal Soma. Regras de utilização do conteúdo, direitos autorais, limites de uso pessoal e comercial das mensagens de aniversário.",
  alternates: { canonical: "/termos-de-uso/" },
  openGraph: {
    title: "Termos de Uso · Portal Soma",
    description: "Regras para uso do conteúdo do Portal Soma.",
    url: "/termos-de-uso/",
    type: "article",
  },
};

const VIGENCIA = "1 de junho de 2026";

export default function TermosPage() {
  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript([
          breadcrumbSchema([
            { name: "Início", url: "/" },
            { name: "Termos de Uso", url: "/termos-de-uso/" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Termos de Uso · Portal Soma",
            url: "https://www.portalsoma.com.br/termos-de-uso/",
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
              <li className="text-stone-700">Termos de Uso</li>
            </ol>
          </nav>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-niver-700 bg-niver-100 px-3 py-1 rounded-full mb-4">
            <Scale size={12} /> Termos legais
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-semibold text-niver-900 leading-tight">
            Termos de Uso
          </h1>
          <p className="mt-4 text-stone-600">Em vigor desde {VIGENCIA}</p>
        </div>
      </section>

      <section className="container-niver py-12">
        <div className="max-w-3xl mx-auto prose prose-stone">
          <p className="text-stone-700 leading-relaxed text-lg">
            Estes Termos regem o uso do site <strong>www.portalsoma.com.br</strong> e de todos os
            conteúdos publicados nele. Ao acessar o Portal Soma, você concorda com os termos abaixo. Se
            não concordar, pedimos que não utilize o site.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">1. Identificação do site</h2>
          <p className="text-stone-700 leading-relaxed">
            O Portal Soma é mantido pela <strong>Agência Vencedores Digitais</strong>, pessoa jurídica
            inscrita no CNPJ sob o nº <strong>34.600.484/0001-21</strong>, com sede em Bacabal,
            Maranhão, Brasil. Contato:{" "}
            <a href="mailto:lucas@portalsoma.com.br" className="text-niver-700 underline">
              lucas@portalsoma.com.br
            </a>
            .
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">2. Conteúdo do site</h2>
          <p className="text-stone-700 leading-relaxed">
            Todo o conteúdo publicado no Portal Soma · incluindo mas não se limitando a mensagens de
            aniversário, textos editoriais, biografias de autores, fotografias, ilustrações, logotipos,
            arquitetura de informação, design e código-fonte do site · é de autoria, propriedade ou uso
            licenciado pelo Portal Soma e/ou pela Agência Vencedores Digitais. Está protegido pela Lei
            de Direitos Autorais brasileira (Lei nº 9.610/1998) e por tratados internacionais
            aplicáveis.
          </p>
          <p className="text-stone-700 leading-relaxed">
            As mensagens publicadas são fruto de trabalho editorial original. Mesmo quando se inspiram
            em temas universais (versículos bíblicos, votos populares), o texto final é elaborado pela
            nossa equipe e atribuído a um autor identificado.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">3. Uso pessoal permitido</h2>
          <p className="text-stone-700 leading-relaxed mb-3">
            Você está autorizado, gratuitamente e sem necessidade de pedir permissão prévia, a:
          </p>
          <ul className="text-stone-700 leading-relaxed space-y-2">
            <li>Ler, copiar e enviar mensagens do Portal Soma para pessoas queridas · familiares, amigos, colegas · em ocasiões pessoais como aniversários, datas comemorativas, cumprimentos religiosos;</li>
            <li>Adaptar livremente o texto pra inserir nome próprio, lembrança específica ou ajustes de tom;</li>
            <li>Compartilhar a mensagem por WhatsApp, SMS, e-mail, redes sociais privadas ou cartão físico, mantendo o caráter pessoal do envio;</li>
            <li>Salvar mensagens pra uso futuro em álbuns, agendas ou cadernos pessoais.</li>
          </ul>
          <p className="text-stone-700 leading-relaxed mt-3">
            Em nenhum desses casos é exigida atribuição visível. O uso pessoal é, na prática,
            sem restrições.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">4. Uso comercial e republicação</h2>
          <p className="text-stone-700 leading-relaxed mb-3">
            <strong>Não é permitido</strong>, sem autorização escrita prévia:
          </p>
          <ul className="text-stone-700 leading-relaxed space-y-2">
            <li>Reproduzir conteúdo do Portal Soma · total ou parcial · em outros sites, blogs, aplicativos, livros impressos, e-books ou bases de dados, mesmo com atribuição;</li>
            <li>Comercializar produtos físicos (cartões, canecas, quadros) que reproduzam mensagens do site;</li>
            <li>Treinar modelos de inteligência artificial com nosso conteúdo;</li>
            <li>Fazer scraping automatizado do site pra reuso em qualquer formato;</li>
            <li>Usar a marca "Portal Soma", logos ou identidade visual em produtos ou serviços de terceiros.</li>
          </ul>
          <p className="text-stone-700 leading-relaxed mt-3">
            Pra usos comerciais legítimos (uma agência publicitária querendo licenciar mensagens, uma
            cartelaria que queira firmar parceria, uma escola que queira reproduzir em material
            didático), escreva pra{" "}
            <a href="mailto:lucas@portalsoma.com.br" className="text-niver-700 underline">
              lucas@portalsoma.com.br
            </a>{" "}
            propondo o uso. Avaliamos caso a caso.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">5. Marca registrada e identidade</h2>
          <p className="text-stone-700 leading-relaxed">
            "Portal Soma", o logotipo da marca, a identidade visual (cores, tipografia editorial,
            tratamento gráfico) e a expressão "soma" no contexto de mensagens de aniversário são
            elementos protegidos como marca da Agência Vencedores Digitais. O uso por terceiros depende
            de autorização escrita.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">6. Comportamento esperado do usuário</h2>
          <p className="text-stone-700 leading-relaxed mb-3">
            Ao usar o Portal Soma, você concorda em <strong>não</strong>:
          </p>
          <ul className="text-stone-700 leading-relaxed space-y-2">
            <li>Tentar acessar áreas restritas, manipular o sistema ou contornar medidas de segurança;</li>
            <li>Enviar spam ou conteúdo malicioso via nossos formulários de contato;</li>
            <li>Realizar scraping automatizado ou abusivo do site;</li>
            <li>Apresentar-se falsamente como representante do Portal Soma;</li>
            <li>Usar nossos canais de contato pra ofender, ameaçar ou assediar a equipe.</li>
          </ul>

          <h2 className="heading-section-bar mt-10 mb-4">7. Limitação de responsabilidade</h2>
          <p className="text-stone-700 leading-relaxed">
            O Portal Soma é oferecido "como está". Embora a gente cuide com afinco da qualidade
            editorial, não garantimos que o site esteja sempre disponível, livre de erros ou adequado a
            todo propósito específico. O site é uma plataforma de inspiração e referência · a decisão
            final sobre qual mensagem enviar a quem é sempre sua. Não nos responsabilizamos por
            reações de terceiros a mensagens enviadas por você usando textos retirados do site.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">8. Conteúdo de terceiros</h2>
          <p className="text-stone-700 leading-relaxed">
            Ocasionalmente o site pode conter links para sites externos. Não controlamos o conteúdo
            desses sites e não nos responsabilizamos por suas práticas, conteúdo ou políticas. A
            decisão de seguir um link externo é sua.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">9. Notificações de violação (DMCA)</h2>
          <p className="text-stone-700 leading-relaxed">
            Se você identificar conteúdo no Portal Soma que infringe seus direitos autorais ou outros
            direitos legítimos, siga o procedimento descrito em nossa{" "}
            <a href="/dmca/" className="text-niver-700 underline">página de DMCA</a> ou escreva pra{" "}
            <a href="mailto:dmca@portalsoma.com.br" className="text-niver-700 underline">
              dmca@portalsoma.com.br
            </a>
            .
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">10. Mudanças e cessação</h2>
          <p className="text-stone-700 leading-relaxed">
            Reservamos o direito de alterar estes Termos a qualquer momento. Quando houver mudança
            material, vamos sinalizar no topo da página com nova data de vigência. Reservamos também o
            direito de remover conteúdo, encerrar funcionalidades ou descontinuar o site, sempre
            comunicando com razoabilidade.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">11. Foro</h2>
          <p className="text-stone-700 leading-relaxed">
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro
            da Comarca de Bacabal, Estado do Maranhão, pra dirimir quaisquer controvérsias decorrentes
            desta relação, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">12. Contato</h2>
          <p className="text-stone-700 leading-relaxed">
            Dúvidas sobre estes Termos? Escreva pra{" "}
            <a href="mailto:lucas@portalsoma.com.br" className="text-niver-700 underline">
              lucas@portalsoma.com.br
            </a>
            . Respondemos em até 5 dias úteis.
          </p>

          <div className="not-prose mt-12 grid sm:grid-cols-3 gap-4">
            <a href="/politica-de-privacidade/" className="card-feature flex items-start gap-3 hover:shadow-md transition">
              <FileText size={20} className="text-niver-600 shrink-0 mt-1" />
              <div>
                <div className="font-display font-semibold text-stone-900">Privacidade</div>
                <div className="text-xs text-stone-600">Tratamento de dados</div>
              </div>
            </a>
            <a href="/dmca/" className="card-feature flex items-start gap-3 hover:shadow-md transition">
              <AlertTriangle size={20} className="text-niver-600 shrink-0 mt-1" />
              <div>
                <div className="font-display font-semibold text-stone-900">DMCA</div>
                <div className="text-xs text-stone-600">Reportar violações</div>
              </div>
            </a>
            <a href="/contato/" className="card-feature flex items-start gap-3 hover:shadow-md transition">
              <Scale size={20} className="text-niver-600 shrink-0 mt-1" />
              <div>
                <div className="font-display font-semibold text-stone-900">Falar com a equipe</div>
                <div className="text-xs text-stone-600">Dúvidas jurídicas</div>
              </div>
            </a>
          </div>
        </div>
      </section>
    </article>
  );
}
