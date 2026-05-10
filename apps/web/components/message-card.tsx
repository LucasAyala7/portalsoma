import { ArrowUpRight } from "lucide-react";
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
    autor: { nome: string; slug: string; fotoUrl: string | null; real: boolean };
    persona: { nome: string; slug: string } | null;
    cluster: { slug: string; nicho?: { slug: string } | null } | { slug: string };
    imagemHero?: { url: string; alt: string } | null;
  };
  nichoSlug: string;
  showImage?: boolean;
}

export function MessageCard({ mensagem, nichoSlug, showImage = false }: Props) {
  const url = mensagemUrl({
    nichoSlug,
    clusterSlug: mensagem.cluster.slug,
    slug: mensagem.slug,
  });

  return (
    <article className="card-message" id={`m-${mensagem.id}`}>
      {showImage && mensagem.imagemHero && (
        <a href={url} className="block">
          <img
            src={mensagem.imagemHero.url}
            alt={mensagem.imagemHero.alt}
            className="w-full aspect-[3/2] object-cover"
            loading="lazy"
          />
        </a>
      )}

      <div className="p-5 sm:p-6">
        <PersonaBadge
          nome={mensagem.autor.nome}
          slug={mensagem.autor.slug}
          fotoUrl={mensagem.autor.fotoUrl}
          isReal={mensagem.autor.real}
        />

        <p className="mt-3 text-stone-800 leading-relaxed whitespace-pre-line">
          {mensagem.conteudo}
        </p>

        <div className="mt-5 flex items-center gap-1.5 flex-wrap border-t border-stone-100 pt-4">
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
