import { mensagemUrl } from "@/lib/utils";

interface Item {
  id: string;
  slug: string;
  titulo: string;
  conteudo: string;
  cluster: { slug: string };
  autor: { nome: string };
}

interface Props {
  mensagens: Item[];
  nichoSlug: string;
  title?: string;
}

export function RelatedMessages({ mensagens, nichoSlug, title = "Mensagens relacionadas" }: Props) {
  if (mensagens.length === 0) return null;
  return (
    <section className="mt-12">
      <h2 className="text-2xl mb-5">{title}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mensagens.map((m) => (
          <a
            key={m.id}
            href={mensagemUrl({ nichoSlug, clusterSlug: m.cluster.slug, slug: m.slug })}
            className="card-message p-5 hover:border-niver-200 transition-all group"
          >
            <p className="text-stone-700 line-clamp-4 text-sm leading-relaxed group-hover:text-stone-900">
              {m.conteudo}
            </p>
            <div className="mt-3 text-xs text-stone-500">por {m.autor.nome}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
