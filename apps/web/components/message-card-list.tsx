import { Heart, Copy, ArrowRight } from "lucide-react";
import { mensagemUrl } from "@/lib/utils";

interface Props {
  mensagem: {
    id: string;
    slug: string;
    titulo: string;
    conteudo: string;
    resumo?: string | null;
    likes: number;
    copies: number;
    autor: { nome: string };
    cluster: { slug: string; nome?: string };
    imagemHero?: { url: string; alt: string } | null;
  };
  nichoSlug: string;
}

/**
 * Lista horizontal com thumb 80x80, título grande, snippet 2 linhas, counts inline.
 * Variante intermediária entre grid (rico) e lista pura compacta.
 * Otimizado pra mobile (display em coluna) e pra densidade de scan em archive.
 */
export function MessageCardListItem({ mensagem, nichoSlug }: Props) {
  const url = mensagemUrl({
    nichoSlug,
    clusterSlug: mensagem.cluster.slug,
    slug: mensagem.slug,
  });
  const snippet = mensagem.resumo ?? mensagem.conteudo.slice(0, 200);

  return (
    <a
      href={url}
      id={`m-${mensagem.id}`}
      itemScope
      itemType="https://schema.org/Article"
      className="group flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border border-warm-200/70 bg-white hover:border-niver-300 hover:shadow-md transition-all overflow-hidden"
    >
      {mensagem.imagemHero ? (
        <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-warm-200">
          <img
            src={mensagem.imagemHero.url}
            alt={mensagem.imagemHero.alt}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            itemProp="image"
          />
        </div>
      ) : (
        <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl grid place-items-center bg-niver-50 text-niver-300">
          <Heart size={28} strokeWidth={1.5} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <h3 itemProp="headline" className="font-display text-base sm:text-lg text-niver-800 leading-tight line-clamp-2 group-hover:text-niver-900 transition-colors min-w-0">
            {mensagem.titulo}
          </h3>
          <div className="shrink-0 flex items-center gap-1.5 text-[11px] text-stone-500 tabular-nums">
            <span
              itemProp="interactionStatistic"
              itemScope
              itemType="https://schema.org/InteractionCounter"
              className="inline-flex items-center gap-0.5"
              title="curtidas"
            >
              <meta itemProp="interactionType" content="https://schema.org/LikeAction" />
              <Heart size={10} strokeWidth={2.4} className="text-rose-500" fill={mensagem.likes > 0 ? "currentColor" : "none"} />
              <strong itemProp="userInteractionCount" className="text-stone-700">{mensagem.likes.toLocaleString("pt-BR")}</strong>
            </span>
            <span
              itemProp="interactionStatistic"
              itemScope
              itemType="https://schema.org/InteractionCounter"
              className="inline-flex items-center gap-0.5"
              title="cópias"
            >
              <meta itemProp="interactionType" content="https://schema.org/WriteAction" />
              <Copy size={10} strokeWidth={2.4} className="text-niver-500" />
              <strong itemProp="userInteractionCount" className="text-stone-700">{mensagem.copies.toLocaleString("pt-BR")}</strong>
            </span>
          </div>
        </div>
        <p itemProp="description" className="mt-1 text-sm text-stone-600 line-clamp-2 leading-snug break-words">
          {snippet}
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-stone-500">
          <span itemProp="author" itemScope itemType="https://schema.org/Person" className="font-medium text-niver-700 truncate">
            <span itemProp="name">{mensagem.autor.nome}</span>
          </span>
          <ArrowRight size={12} className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-niver-600" />
        </div>
      </div>
    </a>
  );
}
