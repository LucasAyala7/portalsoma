import { FaqAccordion } from "./faq-accordion";

interface Props {
  items?: { pergunta: string; resposta: string }[];
}

const DEFAULT_FAQ = [
  {
    pergunta: "Como copio uma mensagem do Portal Soma?",
    resposta:
      "Cada mensagem tem o botão Copiar. Um clique e ela já vai pra área de transferência, pronta pra você colar no WhatsApp, Instagram ou onde quiser.",
  },
  {
    pergunta: "As mensagens são originais?",
    resposta:
      "Sim. Toda mensagem aqui passa por revisão editorial antes de ser publicada. Nossos autores escrevem com voz própria, sem fórmulas prontas, pra que cada texto soe verdadeiro.",
  },
  {
    pergunta: "Posso usar as mensagens em cartões e convites?",
    resposta:
      "Pode sim, são gratuitas pra uso pessoal. Pra uso comercial (revenda, papelaria, e-commerce de cartões) é necessário entrar em contato.",
  },
  {
    pergunta: "Como funciona a curtida?",
    resposta:
      "Curtir uma mensagem ajuda outras pessoas a encontrarem ela. As mais curtidas viram destaques nas listagens e podem aparecer no nosso feed Trending.",
  },
];

export function FaqBlock({ items = DEFAULT_FAQ }: Props) {
  return (
    <section className="container-niver py-16">
      <div className="max-w-3xl mx-auto">
        <h2 className="heading-section-bar mb-8">Perguntas frequentes</h2>
        <FaqAccordion items={items} />
      </div>
    </section>
  );
}
