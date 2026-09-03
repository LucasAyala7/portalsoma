import { ArrowRight, BookOpen } from "lucide-react";
import { getCategoryIcon, COLOR_BG } from "@/lib/icons";

interface ClusterLite {
  slug: string;
  nome: string;
  totalMensagens: number;
  nichoSlug: string;
}

interface Props {
  clusters: ClusterLite[];
  titulo?: string;
  subtitulo?: string;
}

/**
 * Ponte editorial: leva o leitor de um artigo do blog para as paginas de
 * mensagens (money pages). Ate a criacao desse bloco o blog era uma ilha,
 * sem nenhum link interno para os clusters.
 */
export function RelatedClusters({ clusters, titulo, subtitulo }: Props) {
  if (clusters.length === 0) return null;

  return (
    <section className="container-niver max-w-3xl pb-12" aria-labelledby="related-clusters-heading">
      <div className="rounded-3xl border border-niver-100 bg-gradient-to-br from-niver-50/60 to-warm-50 p-6 sm:p-8">
        <div className="flex items-start gap-3 mb-5">
          <BookOpen size={22} className="text-niver-600 flex-shrink-0 mt-0.5" strokeWidth={2.2} />
          <div>
            <h2
              id="related-clusters-heading"
              className="font-display text-xl sm:text-2xl text-niver-900 leading-tight"
            >
              {titulo ?? "Mensagens prontas para essa data"}
            </h2>
            {subtitulo && <p className="text-sm text-stone-600 mt-1.5 leading-relaxed">{subtitulo}</p>}
          </div>
        </div>

        <ul className="grid sm:grid-cols-2 gap-2.5">
          {clusters.map((c) => {
            const icon = getCategoryIcon(c.slug);
            const Icon = icon.icon;
            return (
              <li key={c.slug}>
                <a
                  href={`/${c.nichoSlug}/${c.slug}/`}
                  className="group flex items-center gap-3 rounded-2xl bg-white/80 hover:bg-white border border-transparent hover:border-niver-200 p-3.5 transition-all"
                >
                  <span
                    className={`flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl ${COLOR_BG[icon.color]}`}
                  >
                    <Icon size={17} strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-stone-900 group-hover:text-niver-700 transition-colors text-sm truncate">
                      {c.nome}
                    </span>
                    <span className="block text-xs text-stone-500 tabular-nums">
                      {c.totalMensagens.toLocaleString("pt-BR")} mensagens
                    </span>
                  </span>
                  <ArrowRight
                    size={15}
                    className="text-stone-300 group-hover:text-niver-500 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                    strokeWidth={2.4}
                  />
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
