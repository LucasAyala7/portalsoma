import { ArrowUpRight, Heart, Copy, Eye, Flame, Sparkles, Cross } from "lucide-react";
import { CopyButton } from "./copy-button";
import { ShareMenu } from "./share-menu";
import { LikeButton } from "./like-button";
import { PersonaBadge } from "./persona-badge";
import { WhatsAppSendButton } from "./whatsapp-send-button";
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
  /** Quando true, NÃO emite itemScope/itemType=Article — evita duplicar microdata Article
   *  em singles (onde o main já é Article principal) ou em listas que precisam só de ListItem. */
  noArticleMicrodata?: boolean;
  /** Prioridade alta na imagem hero (LCP candidate) — use só no 1º card above-the-fold. */
  priority?: boolean;
}

const BADGE_LABEL: Record<string, { text: string; Icon: typeof Flame }> = {
  trending: { text: "Em alta", Icon: Flame },
  new: { text: "Nova", Icon: Sparkles },
  top: { text: "Mais copiada", Icon: Copy },
  religious: { text: "Cristã", Icon: Cross },
};

export function MessageCardRich({ mensagem, nichoSlug, destacada, badge, noArticleMicrodata, priority }: Props) {
  const url = mensagemUrl({
    nichoSlug,
    clusterSlug: mensagem.cluster.slug,
    slug: mensagem.slug,
  });
  const badgeData = badge ? BADGE_LABEL[badge] : null;
  const hasImage = !!mensagem.imagemHero;
  const microdataProps = noArticleMicrodata
    ? {}
    : { itemScope: true, itemType: "https://schema.org/Article" };

  return (
    <article
      {...microdataProps}
      className={`card-message relative ${destacada ? "ring-2 ring-niver-200/60" : ""}`}
      id={`m-${mensagem.id}`}
    >
      {!noArticleMicrodata && <meta itemProp="headline" content={mensagem.titulo} />}
      {!noArticleMicrodata && mensagem.publicadoEm && (
        <meta
          itemProp="datePublished"
          content={new Date(mensagem.publicadoEm).toISOString()}
        />
      )}
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
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            width={1200}
            height={675}
            itemProp="image"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </a>
      )}

      <div className="p-5 sm:p-6 overflow-hidden">
        <div className="flex items-start justify-between gap-2 mb-3 min-w-0">
          <div className="min-w-0 flex-1">
            <span itemProp="author" itemScope itemType="https://schema.org/Person">
              <meta itemProp="name" content={mensagem.autor.nome} />
              <PersonaBadge
                nome={mensagem.autor.nome}
                slug={mensagem.autor.slug}
                fotoUrl={mensagem.autor.fotoUrl}
                isReal={mensagem.autor.real}
              />
            </span>
          </div>
          {/* Counts canto sup direito (mobile + desktop) */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5 text-[11px] sm:text-xs text-stone-500 tabular-nums">
            <span
              itemProp="interactionStatistic"
              itemScope
              itemType="https://schema.org/InteractionCounter"
              className="inline-flex items-center gap-1"
              title="curtidas"
            >
              <meta itemProp="interactionType" content="https://schema.org/LikeAction" />
              <Heart size={11} strokeWidth={2.4} className="text-rose-500" fill={mensagem.likes > 0 ? "currentColor" : "none"} />
              <strong itemProp="userInteractionCount" className="text-stone-700">{mensagem.likes.toLocaleString("pt-BR")}</strong>
            </span>
            <span
              itemProp="interactionStatistic"
              itemScope
              itemType="https://schema.org/InteractionCounter"
              className="inline-flex items-center gap-1"
              title="cópias"
            >
              <meta itemProp="interactionType" content="https://schema.org/WriteAction" />
              <Copy size={11} strokeWidth={2.4} className="text-niver-500" />
              <strong itemProp="userInteractionCount" className="text-stone-700">{mensagem.copies.toLocaleString("pt-BR")}</strong>
            </span>
            <span
              itemProp="interactionStatistic"
              itemScope
              itemType="https://schema.org/InteractionCounter"
              className="hidden sm:inline-flex items-center gap-1 text-stone-400"
              title="visualizações"
            >
              <meta itemProp="interactionType" content="https://schema.org/ReadAction" />
              <Eye size={11} strokeWidth={2.4} />
              <span itemProp="userInteractionCount">{mensagem.visualizacoes.toLocaleString("pt-BR")}</span>
            </span>
          </div>
        </div>

        <p itemProp="articleBody" className="text-stone-800 leading-relaxed whitespace-pre-line text-[15px] break-words">
          {mensagem.conteudo}
        </p>

        <div className="mt-5 pt-4 border-t border-stone-100 flex items-center gap-1.5 flex-wrap">
          <WhatsAppSendButton text={mensagem.conteudo} url={url} mensagemId={mensagem.id} />
          <CopyButton text={mensagem.conteudo} mensagemId={mensagem.id} />
          <ShareMenu text={mensagem.conteudo} url={url} mensagemId={mensagem.id} />
          <LikeButton mensagemId={mensagem.id} initialCount={mensagem.likes} />
          <a href={url} className="btn-ghost ml-auto">
            <span>Abrir</span>
            <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
    </article>
  );
}
