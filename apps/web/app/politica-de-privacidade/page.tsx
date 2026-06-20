import type { Metadata } from "next";
import { jsonLdScript, breadcrumbSchema } from "@/lib/seo";
import { Shield, Lock, Eye, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Privacidade · Portal Soma",
  description:
    "Política de Privacidade do Portal Soma. Como coletamos, usamos e protegemos seus dados pessoais conforme a LGPD brasileira e o GDPR europeu.",
  alternates: { canonical: "/politica-de-privacidade/" },
  openGraph: {
    title: "Política de Privacidade · Portal Soma",
    description: "Tratamento de dados conforme LGPD e GDPR.",
    url: "/politica-de-privacidade/",
    type: "article",
  },
};

const VERSAO = "1.0";
const VIGENCIA = "1 de junho de 2026";

export default function PrivacidadePage() {
  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript([
          breadcrumbSchema([
            { name: "Início", url: "/" },
            { name: "Política de Privacidade", url: "/politica-de-privacidade/" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Política de Privacidade · Portal Soma",
            url: "https://www.portalsoma.com.br/politica-de-privacidade/",
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
              <li className="text-stone-700">Política de Privacidade</li>
            </ol>
          </nav>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-niver-700 bg-niver-100 px-3 py-1 rounded-full mb-4">
            <Shield size={12} /> LGPD · GDPR
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-semibold text-niver-900 leading-tight">
            Política de Privacidade
          </h1>
          <p className="mt-4 text-stone-600">
            Versão {VERSAO} · em vigor desde {VIGENCIA}
          </p>
        </div>
      </section>

      <section className="container-niver py-12">
        <div className="max-w-3xl mx-auto prose prose-stone">
          <p className="text-stone-700 leading-relaxed text-lg">
            O Portal Soma respeita sua privacidade. Esta Política descreve como coletamos, usamos,
            compartilhamos e protegemos os seus dados pessoais quando você visita{" "}
            <strong>www.portalsoma.com.br</strong>. Ela se aplica a todos os visitantes do site e foi
            elaborada com base na Lei Geral de Proteção de Dados (LGPD · Lei nº 13.709/2018) e no
            Regulamento Geral de Proteção de Dados europeu (GDPR · Regulamento UE 2016/679).
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">1. Quem somos</h2>
          <p className="text-stone-700 leading-relaxed">
            O Portal Soma é mantido pela <strong>Agência Vencedores Digitais</strong>, pessoa jurídica
            de direito privado inscrita no CNPJ sob o nº <strong>34.600.484/0001-21</strong>, com sede
            em Bacabal, Maranhão, Brasil. Para efeitos da LGPD, somos o controlador dos dados pessoais
            tratados em nome do site.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">2. Dados que coletamos</h2>
          <p className="text-stone-700 leading-relaxed mb-3">
            A maior parte da navegação no Portal Soma é totalmente anônima · você não precisa criar
            conta nem fornecer dados pessoais pra ler e copiar mensagens. Quando você simplesmente
            acessa nosso site, coletamos automaticamente os seguintes dados:
          </p>
          <ul className="text-stone-700 leading-relaxed space-y-2">
            <li>Endereço IP (anonimizado quando processado pelo Google Analytics);</li>
            <li>Tipo e versão do navegador, sistema operacional, dispositivo;</li>
            <li>Páginas visitadas, tempo de permanência, origem do acesso (referrer);</li>
            <li>Identificadores de cookies · veja nossa <a href="/politica-de-cookies/" className="text-niver-700 underline">Política de Cookies</a>.</li>
          </ul>
          <p className="text-stone-700 leading-relaxed mt-3">
            Já quando você nos envia um e-mail, formulário de contato, denúncia DMCA ou pedido relativo
            aos seus direitos como titular, coletamos os dados que você optou por informar
            voluntariamente: nome, e-mail e o conteúdo da mensagem.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">3. Como usamos seus dados</h2>
          <p className="text-stone-700 leading-relaxed mb-3">
            Usamos os dados coletados para as seguintes finalidades:
          </p>
          <ul className="text-stone-700 leading-relaxed space-y-2">
            <li><strong>Operação do site:</strong> entregar conteúdo, identificar erros, prevenir abuso.</li>
            <li><strong>Análise estatística:</strong> entender quais páginas são acessadas e como melhorar o conteúdo (Google Analytics 4 com IP anonimizado).</li>
            <li><strong>Publicidade:</strong> exibir anúncios contextuais via Google AdSense.</li>
            <li><strong>Comunicação:</strong> responder a mensagens que você nos envia ativamente.</li>
            <li><strong>Cumprimento legal:</strong> atender ordens judiciais e obrigações regulatórias.</li>
          </ul>

          <h2 className="heading-section-bar mt-10 mb-4">4. Base legal do tratamento</h2>
          <p className="text-stone-700 leading-relaxed mb-3">
            Sob a LGPD e o GDPR, todo tratamento de dados precisa de uma base legal. As bases legais que
            usamos são:
          </p>
          <ul className="text-stone-700 leading-relaxed space-y-2">
            <li><strong>Legítimo interesse</strong> (art. 7º, IX LGPD / art. 6(1)(f) GDPR): pra operar e melhorar o site, prevenir fraudes e exibir publicidade contextual não-intrusiva.</li>
            <li><strong>Consentimento</strong> (art. 7º, I LGPD / art. 6(1)(a) GDPR): pra cookies não-essenciais (analytics, publicidade personalizada), coletado via banner.</li>
            <li><strong>Execução de contrato/atendimento</strong> (art. 7º, V LGPD / art. 6(1)(b) GDPR): pra responder seu contato ou pedido.</li>
            <li><strong>Obrigação legal</strong> (art. 7º, II LGPD / art. 6(1)(c) GDPR): pra cumprir ordens judiciais e regulações aplicáveis.</li>
          </ul>

          <h2 className="heading-section-bar mt-10 mb-4">5. Com quem compartilhamos</h2>
          <p className="text-stone-700 leading-relaxed mb-3">
            Não vendemos seus dados. Compartilhamos apenas com operadores que prestam serviços ao site,
            sempre limitado ao necessário:
          </p>
          <ul className="text-stone-700 leading-relaxed space-y-2">
            <li><strong>Google Analytics (Google LLC):</strong> análise de tráfego e comportamento agregado, com IP anonimizado.</li>
            <li><strong>Google AdSense (Google LLC):</strong> exibição de anúncios e geração de receita. O Google pode usar cookies pra personalizar anúncios · você pode controlar isso em <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-niver-700 underline">adssettings.google.com</a>.</li>
            <li><strong>Provedor de hospedagem:</strong> infraestrutura de servidores, sem acesso aos dados de visitantes em nível pessoal.</li>
            <li><strong>Autoridades públicas:</strong> apenas mediante ordem judicial ou requisição legal válida.</li>
          </ul>
          <p className="text-stone-700 leading-relaxed mt-3">
            Alguns desses operadores (especialmente Google) podem transferir dados para os Estados
            Unidos e outros países. Essas transferências são realizadas com salvaguardas adequadas, como
            cláusulas-padrão contratuais reconhecidas pela ANPD e Comissão Europeia.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">6. Tempo de retenção</h2>
          <p className="text-stone-700 leading-relaxed">
            Dados de navegação anônimos são mantidos por até 26 meses (padrão Google Analytics 4).
            E-mails e formulários de contato são guardados por até 2 anos, salvo necessidade legal de
            retenção mais longa. Após esse prazo, os registros são eliminados ou anonimizados.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">7. Seus direitos como titular</h2>
          <p className="text-stone-700 leading-relaxed mb-3">
            A LGPD e o GDPR garantem a você os seguintes direitos sobre seus dados pessoais:
          </p>
          <ul className="text-stone-700 leading-relaxed space-y-2">
            <li>Confirmar a existência de tratamento de seus dados;</li>
            <li>Acessar os dados que temos sobre você;</li>
            <li>Corrigir dados incompletos, incorretos ou desatualizados;</li>
            <li>Solicitar anonimização, bloqueio ou eliminação;</li>
            <li>Solicitar portabilidade dos dados a outro fornecedor;</li>
            <li>Revogar o consentimento (quando o tratamento se basear nele);</li>
            <li>Apresentar reclamação à ANPD (Autoridade Nacional de Proteção de Dados) no Brasil.</li>
          </ul>
          <p className="text-stone-700 leading-relaxed mt-3">
            Pra exercer qualquer um desses direitos, escreva pra{" "}
            <a href="mailto:lucas@portalsoma.com.br" className="text-niver-700 underline">
              lucas@portalsoma.com.br
            </a>{" "}
            com o assunto "LGPD" e descreva o pedido. Respondemos em até 15 dias úteis.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">8. Segurança</h2>
          <p className="text-stone-700 leading-relaxed">
            Adotamos medidas técnicas e organizacionais razoáveis pra proteger seus dados contra acesso
            não autorizado, perda, alteração ou divulgação indevida: conexões HTTPS em todo o site,
            controle de acesso, backups regulares e revisão periódica das integrações com terceiros.
            Nenhum sistema, contudo, é absolutamente impenetrável, e por isso encorajamos boas
            práticas (não enviar dados sensíveis por e-mail sem necessidade).
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">9. Crianças e adolescentes</h2>
          <p className="text-stone-700 leading-relaxed">
            O Portal Soma não é direcionado a menores de 13 anos e não coleta deliberadamente dados de
            crianças. Se você é responsável por uma criança e identifica algum dado que tenha sido
            enviado por ela, escreva pra gente que removemos imediatamente.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">10. Mudanças nesta Política</h2>
          <p className="text-stone-700 leading-relaxed">
            Esta Política pode ser atualizada periodicamente. Quando houver mudança material, vamos
            destacar no topo da página com a nova data de vigência. Sua continuidade de uso após a
            mudança significa aceite da nova versão.
          </p>

          <h2 className="heading-section-bar mt-10 mb-4">11. Encarregado e contato</h2>
          <p className="text-stone-700 leading-relaxed">
            O encarregado pelo tratamento de dados pessoais (DPO) é <strong>Lucas Ayala</strong>, em
            nome da Agência Vencedores Digitais. Pra qualquer dúvida, denúncia ou exercício de
            direitos, o canal é{" "}
            <a href="mailto:lucas@portalsoma.com.br" className="text-niver-700 underline">
              lucas@portalsoma.com.br
            </a>
            .
          </p>

          <div className="mt-12 grid sm:grid-cols-3 gap-4 not-prose">
            <a href="/politica-de-cookies/" className="card-feature flex items-start gap-3 hover:shadow-md transition">
              <Eye size={20} className="text-niver-600 shrink-0 mt-1" />
              <div>
                <div className="font-display font-semibold text-stone-900">Política de Cookies</div>
                <div className="text-xs text-stone-600">Quais cookies usamos e como desativar</div>
              </div>
            </a>
            <a href="/termos-de-uso/" className="card-feature flex items-start gap-3 hover:shadow-md transition">
              <Lock size={20} className="text-niver-600 shrink-0 mt-1" />
              <div>
                <div className="font-display font-semibold text-stone-900">Termos de Uso</div>
                <div className="text-xs text-stone-600">Regras de uso do conteúdo</div>
              </div>
            </a>
            <a href="/contato/" className="card-feature flex items-start gap-3 hover:shadow-md transition">
              <Mail size={20} className="text-niver-600 shrink-0 mt-1" />
              <div>
                <div className="font-display font-semibold text-stone-900">Falar com DPO</div>
                <div className="text-xs text-stone-600">Exercer direitos LGPD/GDPR</div>
              </div>
            </a>
          </div>
        </div>
      </section>
    </article>
  );
}
