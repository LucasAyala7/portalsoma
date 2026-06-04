import { ArrowRight, Heart, Copy } from "lucide-react";
import { CopyButton } from "./copy-button";
import { ShareMenu } from "./share-menu";
import { LikeButton } from "./like-button";
import { mensagemUrl } from "@/lib/utils";
import { getCategoryIcon, COLOR_BG } from "@/lib/icons";

interface Props {
  mensagem: {
    id: string;
    slug: string;
    titulo: string;
    conteudo: string;
    likes: number;
    copies: number;
    autor: { nome: string; slug: string };
    cluster: { slug: string; nome?: string; nicho?: { slug: string } | null } | { slug: string };
  };
  nichoSlug: string;
  /** índice pra alternar gradient sutil dos cards */
  index?: number;
  /** se false, esconde ações (usado em listas decorativas) */
  showActions?: boolean;
}

const GRADIENTS = [
  "from-rose-50/40",
  "from-niver-50/40",
  "from-violet-50/40",
  "from-emerald-50/40",
  "from-sky-50/40",
  "from-amber-50/40",
];

/**
 * Card horizontal compacto com ações inline.
 * Usado em listas verticais (feed style) na home, archive secundário, etc.
 */
export function MessageCardCompact({ mensagem, nichoSlug, index = 0, showActions = true }: Props) {
  const url = mensagemUrl({
    nichoSlug,
    clusterSlug: mensagem.cluster.slug,
    slug: mensagem.slug,
  });
  const grad = GRADIENTS[index % GRADIENTS.length];

  return (
    <article
      itemScope
      itemType="https://schema.org/Article"
      id={`m-${mensagem.id}`}
      className={`group bg-gradient-to-r ${grad} via-white to-white border border-stone-100 rounded-2xl hover:border-niver-200 hover:shadow-md transition-all overflow-hidden`}
    >
      <meta itemProp="headline" content={mensagem.titulo} />
      <a href={url} className="block p-5 pb-3 overflow-hidden">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5 min-w-0">
              <div className="text-xs text-stone-500 flex items-center gap-2 flex-wrap min-w-0">
                <span itemProp="author" itemScope itemType="https://schema.org/Person" className="font-medium text-niver-700 truncate">
                  <span itemProp="name">{mensagem.autor.nome}</span>
                </span>
                {"nome" in mensagem.cluster && mensagem.cluster.nome && (
                  <>
                    <span>·</span>
                    <span className="truncate">{mensagem.cluster.nome}</span>
                  </>
                )}
              </div>
              {/* Counts canto sup direito */}
              <div className="flex shrink-0 items-center gap-2 text-[11px] text-stone-500 tabular-nums">
                <span
                  itemProp="interactionStatistic"
                  itemScope
                  itemType="https://schema.org/InteractionCounter"
                  className="inline-flex items-center gap-0.5"
                >
                  <meta itemProp="interactionType" content="https://schema.org/LikeAction" />
                  <Heart size={10} className="text-rose-500" strokeWidth={2.4} fill={mensagem.likes > 0 ? "currentColor" : "none"} />
                  <strong itemProp="userInteractionCount" className="text-stone-700">{mensagem.likes.toLocaleString("pt-BR")}</strong>
                </span>
                <span
                  itemProp="interactionStatistic"
                  itemScope
                  itemType="https://schema.org/InteractionCounter"
                  className="inline-flex items-center gap-0.5"
                >
                  <meta itemProp="interactionType" content="https://schema.org/WriteAction" />
                  <Copy size={10} className="text-niver-500" strokeWidth={2.4} />
                  <strong itemProp="userInteractionCount" className="text-stone-700">{mensagem.copies.toLocaleString("pt-BR")}</strong>
                </span>
              </div>
            </div>
            <p itemProp="articleBody" className="text-stone-800 leading-relaxed line-clamp-3 text-[15px] break-words">
              {mensagem.conteudo}
            </p>
          </div>
          <div className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-niver-600 text-white">
              <ArrowRight size={16} />
            </span>
          </div>
        </div>
      </a>

      {showActions && (
        <div className="px-5 pb-4 flex items-center justify-end gap-1 border-t border-stone-100/80 pt-3 mt-1">
          <CopyButton
            text={mensagem.conteudo}
            mensagemId={mensagem.id}
            className="btn-ghost"
            label="Copiar"
          />
          <ShareMenu text={mensagem.conteudo} url={url} mensagemId={mensagem.id} />
          <LikeButton mensagemId={mensagem.id} initialCount={mensagem.likes} />
        </div>
      )}
    </article>
  );
}
