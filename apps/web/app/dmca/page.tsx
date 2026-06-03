import type { Metadata } from "next";
import { jsonLdScript, breadcrumbSchema } from "@/lib/seo";
import { AlertTriangle, Send, FileText, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "DMCA — Notificação de violação de direitos autorais — Portal Soma",
  description:
    "Procedimento para notificação de violação de direitos autorais no Portal Soma conforme DMCA e legislação brasileira. Formulário e endereço de contato.",
  alternates: { canonical: "/dmca/" },
  openGraph: {
    title: "DMCA — Portal Soma",
    description: "Procedimento para reportar violação de direitos autorais.",
    url: "/dmca/",
    type: "article",
  },
};

const VIGENCIA = "1 de junho de 2026";

export default function DmcaPage() {
  const mailtoSubject = encodeURIComponent("[DMCA] Notificação de violação - Portal Soma");
  const mailtoBody = encodeURIComponent(
    "PRO PORTAL SOMA - NOTIFICAÇÃO DMCA\n\n" +
      "1. Dados do titular dos direitos:\n   Nome completo: \n   E-mail: \n   Telefone: \n   Endereço: \n\n" +
      "2. Obra protegida supostamente infringida (descrição/título/URL original): \n\n" +
      "3. URL específica no Portal Soma com o conteúdo a ser removido: https://www.portalsoma.com.br/\n\n" +
      "4. Como identifico que sou o titular ou represento o titular: \n\n" +
      "5. Declaração de boa-fé: Declaro, sob pena de perjúrio, que as informações acima são verdadeiras e que sou o titular dos direitos autorais ou estou autorizado a agir em seu nome.\n\n" +
      "Assinatura (nome completo digitado): \nData: \n"
  );
  const mailto = `mailto:dmca@portalsoma.com.br?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript([
          breadcrumbSchema([
            { name: "Início", url: "/" },
            { name: "DMCA", url: "/dmca/" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "DMCA — Portal Soma",
            url: "https://www.portalsoma.com.br/dmca/",
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
              <li className="text-stone-700">DMCA</li>
            </ol>
          </nav>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-niver-700 bg-niver-100 px-3 py-1 rounded-full mb-4">
            <AlertTriangle size={12} /> Notificação de violação
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-semibold text-niver-900 leading-tight">
            DMCA · Direitos autorais
          </h1>
          <p className="mt-4 text-stone-600">Em vigor desde {VIGENCIA}</p>
        </div>
      </section>

      <section className="container-niver py-12">
        <div className="max-w-3xl mx-auto prose prose-stone">
          <p className="text-stone-700 leading-relaxed text-lg">
            O Portal Soma respeita os direitos autorais de terceiros. Se você acredita que algum
            conteúdo publicado no site infringe seus direitos autorais — ou direitos pelos quais você
            está autorizado a agir — pedimos que envie uma notificação formal conforme as orientações
            abaixo.
          </p>
          <p className="text-stone-700 leading-relaxed">
            Seguimos o procedimento estabelecido pelo <strong>Digital Millennium Copyright Act (DMCA)</strong>{" "}
            dos Estados Unidos, integrado às boas práticas da legislação brasileira (Lei nº 9.610/1998 e
            Lei nº 12.965/2014 — Marco Civil da Internet).
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">1. Antes de enviar uma notificação</h2>
          <p className="text-stone-700 leading-relaxed">
            A maior parte do conteúdo do Portal Soma é original, produzido pela nossa equipe editorial.
            Em casos raros pode haver coincidência com mensagens que circulam em domínio público (votos
            tradicionais, versículos bíblicos, expressões populares). Antes de abrir um pedido formal,
            confira que o conteúdo em questão é, de fato, de sua autoria exclusiva, com data anterior à
            publicação no nosso site.
          </p>
          <p className="text-stone-700 leading-relaxed">
            Se você encontrou um trecho que parece ser cópia direta de obra sua, agradecemos a
            notificação — analisamos com prioridade.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">2. O que sua notificação precisa conter</h2>
          <p className="text-stone-700 leading-relaxed mb-3">
            Pra que possamos processar seu pedido com agilidade, sua notificação deve incluir:
          </p>
          <ol className="text-stone-700 leading-relaxed space-y-2 list-decimal pl-6">
            <li>
              <strong>Identificação completa do titular dos direitos:</strong> nome, endereço,
              telefone e e-mail.
            </li>
            <li>
              <strong>Identificação da obra protegida supostamente infringida:</strong> título,
              descrição, URL onde foi originalmente publicada (se aplicável) e data da publicação
              original.
            </li>
            <li>
              <strong>URL específica do conteúdo no Portal Soma</strong> a ser analisado/removido —
              não basta o endereço da home, precisamos do link exato.
            </li>
            <li>
              <strong>Declaração de boa-fé</strong> afirmando que você acredita que o uso do material
              não está autorizado pelo titular dos direitos, seu agente ou pela lei.
            </li>
            <li>
              <strong>Declaração, sob pena de perjúrio,</strong> de que as informações na notificação
              são verdadeiras e que você é o titular dos direitos ou está autorizado a agir em nome do
              titular.
            </li>
            <li>
              <strong>Assinatura</strong> física ou eletrônica (nome completo digitado é aceito) do
              titular ou representante autorizado.
            </li>
          </ol>
          <p className="text-stone-700 leading-relaxed mt-3">
            Notificações incompletas dificultam a análise e podem atrasar a resposta — peço que
            preencham todos os itens.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">3. Como enviar</h2>
          <p className="text-stone-700 leading-relaxed">
            Envie sua notificação pelo e-mail dedicado a esta finalidade:
          </p>
          <div className="not-prose mt-3 mb-6">
            <div className="card-feature">
              <Mail size={24} className="text-niver-600 mb-2" />
              <div className="font-display text-xl text-niver-700 break-all">
                <a href="mailto:dmca@portalsoma.com.br" className="hover:text-niver-800 underline">
                  dmca@portalsoma.com.br
                </a>
              </div>
              <p className="text-xs text-stone-500 mt-2">
                Use [DMCA] como prefixo no assunto para priorização.
              </p>
            </div>
          </div>
          <p className="text-stone-700 leading-relaxed">
            Se preferir um modelo pronto pré-preenchido, use o botão abaixo — ele abre seu programa de
            e-mail com a estrutura padrão de notificação:
          </p>
          <div className="not-prose mt-4">
            <a href={mailto} className="btn-primary">
              <Send size={16} /> Abrir modelo de notificação
            </a>
          </div>

          <h2 className="heading-section-bar mt-10 mb-4">4. Prazo de resposta</h2>
          <p className="text-stone-700 leading-relaxed">
            Em recebimento de notificação completa e válida, comprometemo-nos a:
          </p>
          <ul className="text-stone-700 leading-relaxed space-y-2 mt-2">
            <li><strong>Em até 48h:</strong> confirmar o recebimento da notificação.</li>
            <li><strong>Em até 5 dias úteis:</strong> analisar a alegação e tomar uma decisão.</li>
            <li><strong>Em até 7 dias úteis:</strong> remover ou modificar o conteúdo se a alegação for procedente, ou comunicar formalmente a razão de eventual recusa.</li>
          </ul>

          <h2 className="heading-section-bar mt-10 mb-4">5. Contra-notificação</h2>
          <p className="text-stone-700 leading-relaxed">
            Se você é autor de um conteúdo do Portal Soma que foi removido após notificação DMCA e
            acredita que a remoção foi indevida (por exemplo, sua obra cai em uso legítimo ou domínio
            público), você pode enviar uma contra-notificação pra dmca@portalsoma.com.br explicando o
            caso. Analisamos com o mesmo cuidado.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">6. Más-fé e abuso</h2>
          <p className="text-stone-700 leading-relaxed">
            Notificações DMCA falsas, abusivas ou com intuito de censura podem caracterizar má-fé sob a
            lei aplicável e gerar responsabilidade civil e criminal contra o emitente. Pedimos que
            apenas pessoas com legitimidade real envie pedidos por este canal.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">7. Outras questões legais</h2>
          <p className="text-stone-700 leading-relaxed">
            Pra outras questões legais que não envolvam direitos autorais — como notificações de
            difamação, retirada de dados pessoais conforme LGPD, ou disputas comerciais — utilize os
            canais apropriados descritos em nossos{" "}
            <a href="/termos-de-uso/" className="text-niver-700 underline">Termos de Uso</a> e{" "}
            <a href="/politica-de-privacidade/" className="text-niver-700 underline">
              Política de Privacidade
            </a>
            .
          </p>

          <div className="not-prose mt-12 grid sm:grid-cols-3 gap-4">
            <a href="/termos-de-uso/" className="card-feature flex items-start gap-3 hover:shadow-md transition">
              <FileText size={20} className="text-niver-600 shrink-0 mt-1" />
              <div>
                <div className="font-display font-semibold text-stone-900">Termos de Uso</div>
                <div className="text-xs text-stone-600">Regras gerais do site</div>
              </div>
            </a>
            <a href="/politica-de-privacidade/" className="card-feature flex items-start gap-3 hover:shadow-md transition">
              <AlertTriangle size={20} className="text-niver-600 shrink-0 mt-1" />
              <div>
                <div className="font-display font-semibold text-stone-900">Privacidade · LGPD</div>
                <div className="text-xs text-stone-600">Direitos sobre dados pessoais</div>
              </div>
            </a>
            <a href="/contato/" className="card-feature flex items-start gap-3 hover:shadow-md transition">
              <Mail size={20} className="text-niver-600 shrink-0 mt-1" />
              <div>
                <div className="font-display font-semibold text-stone-900">Outros contatos</div>
                <div className="text-xs text-stone-600">Quando o caso não é DMCA</div>
              </div>
            </a>
          </div>
        </div>
      </section>
    </article>
  );
}
