import { ArrowRight } from "lucide-react";

interface AutorItem {
  slug: string;
  nome: string;
  bio: string;
  fotoUrl?: string | null;
  real: boolean;
  totalMensagens: number;
}

interface Props {
  autores: AutorItem[];
}

const TONS_BG = [
  "from-niver-100 to-niver-50",
  "from-rose-100 to-rose-50",
  "from-violet-100 to-violet-50",
  "from-emerald-100 to-emerald-50",
  "from-sky-100 to-sky-50",
  "from-amber-100 to-amber-50",
];

/**
 * Carrossel de autores/personas — grid responsivo.
 * Cada card mostra avatar + nome + bio curta + count + link pra perfil.
 */
export function AuthorCarousel({ autores }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {autores.map((a, i) => {
        const initial = a.nome.slice(0, 1);
        const bgClass = TONS_BG[i % TONS_BG.length];
        return (
          <a
            key={a.slug}
            href={`/autor/${a.slug}/`}
            className="group bg-white rounded-2xl border border-stone-100 overflow-hidden hover:border-niver-200 transition-all hover:shadow-lg hover:-translate-y-1"
          >
            <div
              className={`bg-gradient-to-br ${bgClass} aspect-[4/3] grid place-items-center relative`}
            >
              {a.fotoUrl ? (
                <img
                  src={a.fotoUrl}
                  alt={a.nome}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white grid place-items-center font-display text-4xl text-niver-700 shadow-md">
                  {initial}
                </div>
              )}
              {a.real && (
                <span className="absolute top-3 right-3 badge-top">Editor</span>
              )}
            </div>
            <div className="p-4">
              <div className="font-display text-lg font-semibold text-stone-900 leading-tight">
                {a.nome}
              </div>
              <p className="mt-1.5 text-xs text-stone-600 line-clamp-3 leading-relaxed">{a.bio}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-stone-500 tabular-nums">
                  {a.totalMensagens} mensagens
                </span>
                <span className="text-xs text-niver-600 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  ver perfil
                  <ArrowRight size={12} />
                </span>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
