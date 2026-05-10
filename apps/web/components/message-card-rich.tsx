import { ArrowUpRight, Heart, Copy, Eye, Flame, Sparkles, Cross } from "lucide-react";
import { CopyButton } from "./copy-button";
import { ShareMenu } from "./share-menu";
import { LikeButton } from "./like-button";
import { PersonaBadge } from "./persona-badge";
import { mensagemUrl } from "@/lib/utils";

interface Props {
  mensagem: {
    id: string;
    slug: string;
    titulo: string;
    conteudo: string;
    likes: number;
    copies: number;
    shares: number;
    visualizacoes: number;
    autor: { nome: string; slug: string; fotoUrl: string | null; real: boolean };
    persona: { nome: string; slug: string } | null;
    cluster: { slug: string; nicho?: { slug: string } | null } | { slug: string };
    publicadoEm: Date | null;
    imagemHero?: { url: string; alt: string } | null;
  };
  nichoSlug: string;
  destacada?: boolean;
  badge?: "trending" | "new" | "top" | "religious";
}

const BADGE_LABEL: Record<string, { text: string; Icon: typeof Flame }> = {
  trending: { text: "Em alta", Icon: Flame },
  new: { text: "Nova", Icon: Sparkles },
  top: { text: "Mais copiada", Icon: Copy },
  religious: { text: "Cristã", Icon: Cross },
};

export function MessageCardRich({ mensagem, nichoSlug, destacada, badge }: Props) {
  const url = mensagemUrl({
    nichoSlug,
    clusterSlug: mensagem.cluster.slug,
    slug: mensagem.slug,
  });
  const badgeData = badge ? BADGE_LABEL[badge] : null;
  const hasImage = !!mensagem.imagemHero;

  return (
    <article
      className={`card-message relative ${destacada ? "ring-2 ring-niver-200/60" : ""}`}
      id={`m-${mensagem.id}`}
    >
      {badgeData && (
        <div className={`absolute z-10 ${hasImage ? "top-3 left-3" : "-top-2 left-5"}`}>
          <span className={`badge-${badge} shadow-sm backdrop-blur`}>
            <badgeData.Icon size={11} strokeWidth={2.4} />
            <span>{badgeData.text}</span>
          </span>
        </div>
      )}

      {hasImage && mensagem.imagemHero && (
        <a href={url} className="block relative aspect-[16/9] overflow-hidden bg-warm-200">
          <img
            src={mensagem.imagemHero.url}
            alt={mensagem.imagemHero.alt}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </a>
      )}

      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <PersonaBadge
            nome={mensagem.autor.nome}
            slug={mensagem.autor.slug}
            fotoUrl={mensagem.autor.fotoUrl}
            isReal={mensagem.autor.real}
          />
          <div className="hidden sm:flex items-center gap-3 text-xs text-stone-400">
            <span className="stat" title="visualizações">
              <Eye size={11} strokeWidth={2.4} />
              {mensagem.visualizacoes.toLocaleString("pt-BR")}
            </span>
          </div>
        </div>

        <p className="text-stone-800 leading-relaxed whitespace-pre-line text-[15px]">
          {mensagem.conteudo}
        </p>

        <div className="mt-5 pt-4 border-t border-stone-100">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-3 text-xs text-stone-500">
              <span className="stat" title="curtidas">
                <Heart size={12} strokeWidth={2.4} className="text-rose-500" />
                <strong className="text-stone-700">
                  {mensagem.likes.toLocaleString("pt-BR")}
                </strong>
              </span>
              <span className="stat" title="cópias">
                <Copy size={12} strokeWidth={2.4} className="text-niver-500" />
                <strong className="text-stone-700">
                  {mensagem.copies.toLocaleString("pt-BR")}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <CopyButton text={mensagem.conteudo} mensagemId={mensagem.id} />
            <ShareMenu text={mensagem.conteudo} url={url} mensagemId={mensagem.id} />
            <LikeButton mensagemId={mensagem.id} initialCount={mensagem.likes} />
            <a href={url} className="btn-ghost ml-auto">
              <span>Abrir</span>
              <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
