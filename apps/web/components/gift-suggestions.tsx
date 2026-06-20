import { Gift, ExternalLink } from "lucide-react";

interface Props {
  destinatario: string; // ex: "Mãe", "Amiga", "Filho"
  /** Tag de afiliado Amazon Brasil; em produção vem de env. */
  amazonTag?: string;
}

const GIFTS_BY_DESTINATARIO: Record<string, Array<{ termo: string; emoji: string; descricao: string }>> = {
  default: [
    { termo: "presente aniversário", emoji: "🎁", descricao: "Ideias gerais de presente que combinam com qualquer relação" },
    { termo: "caneca personalizada", emoji: "☕", descricao: "Clássico atemporal pra acompanhar a mensagem" },
    { termo: "moldura digital", emoji: "🖼️", descricao: "Fotos da pessoa rotacionando — presente emocional" },
  ],
  mae: [
    { termo: "kit perfume feminino", emoji: "💐", descricao: "Fragrâncias premium pra acompanhar a homenagem" },
    { termo: "porta retrato familia", emoji: "🖼️", descricao: "Pra ela colocar as fotos que mais ama" },
    { termo: "kit chá importado", emoji: "🍵", descricao: "Pra um café da tarde especial" },
  ],
  pai: [
    { termo: "whisky 12 anos", emoji: "🥃", descricao: "Clássico pros amantes de destilado" },
    { termo: "kit churrasco", emoji: "🔥", descricao: "Pra quem ama um sábado de churrasco" },
    { termo: "ferramentas multiuso", emoji: "🛠️", descricao: "Pro pai que conserta tudo em casa" },
  ],
  amiga: [
    { termo: "vinho rosé", emoji: "🍷", descricao: "Pra brindar a amizade" },
    { termo: "kit skincare", emoji: "✨", descricao: "Autocuidado de presente" },
    { termo: "livro autoajuda 2025", emoji: "📖", descricao: "Leitura pra ela curtir no fim de semana" },
  ],
  amigo: [
    { termo: "fone bluetooth", emoji: "🎧", descricao: "Pra acompanhar a rotina" },
    { termo: "camiseta personalizada", emoji: "👕", descricao: "Estampa com piada interna funciona muito" },
    { termo: "kit cerveja artesanal", emoji: "🍺", descricao: "Pra brindar a amizade" },
  ],
  marido: [
    { termo: "kit barba e cuidados", emoji: "🧔", descricao: "Estilo + autocuidado" },
    { termo: "relógio masculino", emoji: "⌚", descricao: "Presente clássico que dura" },
    { termo: "smartwatch", emoji: "📱", descricao: "Pra quem ama tecnologia" },
  ],
  esposa: [
    { termo: "colar ouro 18k", emoji: "💎", descricao: "Joia atemporal pra marcar a data" },
    { termo: "spa em casa kit", emoji: "🛁", descricao: "Pra ela relaxar de verdade" },
    { termo: "perfume importado", emoji: "🌸", descricao: "Fragrância que vira a marca dela" },
  ],
  filho: [
    { termo: "videogame", emoji: "🎮", descricao: "Universal pra qualquer idade" },
    { termo: "kit lego", emoji: "🧱", descricao: "Criatividade + diversão" },
    { termo: "tênis esportivo", emoji: "👟", descricao: "Pratico e usado todo dia" },
  ],
  filha: [
    { termo: "kit maquiagem", emoji: "💄", descricao: "Pra ela explorar o estilo" },
    { termo: "livro infantil jovem adulto", emoji: "📚", descricao: "Leitura que marca a fase" },
    { termo: "câmera instantânea", emoji: "📷", descricao: "Memórias físicas no mundo digital" },
  ],
  avo: [
    { termo: "almofada massageadora", emoji: "🪑", descricao: "Conforto pro dia a dia" },
    { termo: "chá importado kit", emoji: "🍵", descricao: "Pra um café da tarde gostoso" },
    { termo: "porta retrato família", emoji: "🖼️", descricao: "Pra exibir os netos com orgulho" },
  ],
};

/**
 * Sugestões de presente afiliadas Amazon, contextualizadas pelo destinatário do cluster.
 * Monetização real além de adsense — comissão Amazon 4-10% por item.
 *
 * Quando AMAZON_AFFILIATE_TAG não está configurada, links abrem busca sem tag (modo dev).
 */
export function GiftSuggestions({ destinatario, amazonTag }: Props) {
  const key = destinatario
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^para[\s-]+/, "")
    .trim();
  const items = GIFTS_BY_DESTINATARIO[key] ?? GIFTS_BY_DESTINATARIO.default!;

  const tag = amazonTag || process.env.NEXT_PUBLIC_AMAZON_TAG || "";
  const linkAmazon = (termo: string) => {
    const base = `https://www.amazon.com.br/s?k=${encodeURIComponent(termo)}&i=birthdaygifts`;
    return tag ? `${base}&tag=${tag}` : base;
  };

  return (
    <aside
      className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 p-5 sm:p-6"
      aria-labelledby="gift-suggestions-heading"
    >
      <div className="flex items-center gap-2 mb-4">
        <Gift size={20} className="text-orange-600" strokeWidth={2.2} />
        <h3 id="gift-suggestions-heading" className="font-display text-lg text-stone-900 font-semibold">
          Presentes que combinam
        </h3>
      </div>
      <p className="text-sm text-stone-600 mb-4 leading-relaxed">
        Mensagem fica ainda melhor quando vem junto de um presente bem escolhido.
        Sugestões pra <strong>{destinatario.toLowerCase()}</strong>:
      </p>
      <ul className="space-y-2.5">
        {items.map((it) => (
          <li key={it.termo}>
            <a
              href={linkAmazon(it.termo)}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="group flex items-start gap-3 p-3 rounded-xl bg-white/70 hover:bg-white border border-transparent hover:border-orange-200 transition-all"
            >
              <span className="text-2xl flex-shrink-0" aria-hidden>{it.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium text-stone-900 group-hover:text-orange-700 transition-colors text-sm capitalize">
                    {it.termo}
                  </span>
                  <ExternalLink size={11} className="text-stone-300 group-hover:text-orange-500" strokeWidth={2.4} />
                </div>
                <span className="text-xs text-stone-500 mt-0.5 block leading-snug">{it.descricao}</span>
              </div>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[10px] text-stone-400 leading-snug">
        Como participante do programa de afiliados da Amazon, ganhamos uma pequena comissão
        em compras qualificadas — sem custo adicional para você.
      </p>
    </aside>
  );
}
