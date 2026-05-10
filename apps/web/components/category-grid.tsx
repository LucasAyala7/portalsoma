import { ArrowRight, type LucideIcon } from "lucide-react";
import {
  type CategoryIconConfig,
  COLOR_BG,
  COLOR_BG_SOFT,
  COLOR_ICON,
  COLOR_BG_ICON_LARGE,
} from "@/lib/icons";

interface CategoryItem {
  slug: string;
  nome: string;
  totalMensagens: number;
  descricao?: string;
  iconConfig: CategoryIconConfig;
}

interface Props {
  categorias: CategoryItem[];
  nichoSlug: string;
  /**
   * default: 4 col com cards grandes (gradient + ícone watermark)
   * compact: chips inline pra refine/filtros
   * dense: 5 col com cards menores (categorias secundárias massivas)
   * pills: estilo botão arredondado destacado, 2-3 col grande
   */
  variant?: "default" | "compact" | "dense" | "pills";
}

export function CategoryGrid({ categorias, nichoSlug, variant = "default" }: Props) {
  if (variant === "compact") {
    return (
      <div className="flex flex-wrap gap-2">
        {categorias.map((c) => {
          const Icon = c.iconConfig.icon;
          return (
            <a
              key={c.slug}
              href={`/${nichoSlug}/${c.slug}/`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-stone-200 hover:border-niver-300 hover:bg-niver-50 transition-colors text-sm group"
            >
              <Icon size={14} className={COLOR_ICON[c.iconConfig.color]} strokeWidth={2.4} />
              <span className="font-medium text-stone-800">{c.nome}</span>
              {c.totalMensagens > 0 && (
                <span className="text-xs text-stone-500 tabular-nums">
                  · {c.totalMensagens}
                </span>
              )}
            </a>
          );
        })}
      </div>
    );
  }

  if (variant === "dense") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {categorias.map((c) => {
          const Icon = c.iconConfig.icon;
          return (
            <a
              key={c.slug}
              href={`/${nichoSlug}/${c.slug}/`}
              className="group relative overflow-hidden rounded-xl bg-white border border-stone-100 p-4 hover:border-niver-300 hover:shadow-md transition-all"
            >
              <div
                className={`inline-flex items-center justify-center w-9 h-9 rounded-lg mb-2.5 ${COLOR_BG[c.iconConfig.color]}`}
              >
                <Icon size={18} strokeWidth={2.2} />
              </div>
              <div className="font-medium text-sm text-stone-900 leading-tight">{c.nome}</div>
              {c.totalMensagens > 0 && (
                <div className="text-xs text-stone-500 mt-1 tabular-nums">
                  {c.totalMensagens} {c.totalMensagens === 1 ? "msg" : "msgs"}
                </div>
              )}
            </a>
          );
        })}
      </div>
    );
  }

  if (variant === "pills") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categorias.map((c) => {
          const Icon = c.iconConfig.icon;
          return (
            <a
              key={c.slug}
              href={`/${nichoSlug}/${c.slug}/`}
              className={`group flex items-center gap-3 rounded-2xl border border-stone-100 bg-gradient-to-r ${COLOR_BG_SOFT[c.iconConfig.color]} p-4 hover:shadow-md hover:border-niver-200 transition-all`}
            >
              <div
                className={`flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl ${COLOR_BG_ICON_LARGE[c.iconConfig.color]}`}
              >
                <Icon size={22} strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-base font-semibold text-stone-900 leading-tight">
                  {c.nome}
                </div>
                {c.totalMensagens > 0 && (
                  <div className="text-xs text-stone-500 mt-0.5 tabular-nums">
                    {c.totalMensagens} mensagens
                  </div>
                )}
              </div>
              <ArrowRight
                size={16}
                className="text-niver-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              />
            </a>
          );
        })}
      </div>
    );
  }

  // default
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {categorias.map((c) => {
        const Icon = c.iconConfig.icon;
        return (
          <a
            key={c.slug}
            href={`/${nichoSlug}/${c.slug}/`}
            className={`group relative overflow-hidden rounded-2xl border border-stone-100 bg-gradient-to-br ${COLOR_BG_SOFT[c.iconConfig.color]} p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-niver-200`}
          >
            {/* watermark sutil do ícone no canto */}
            <div className="absolute -bottom-3 -right-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Icon size={88} strokeWidth={1.5} />
            </div>
            <div className="relative">
              <div
                className={`inline-flex items-center justify-center w-11 h-11 rounded-xl mb-3 ${COLOR_BG_ICON_LARGE[c.iconConfig.color]}`}
              >
                <Icon size={20} strokeWidth={2.2} />
              </div>
              <div className="font-display text-lg font-semibold text-stone-900">{c.nome}</div>
              {c.totalMensagens > 0 && (
                <div className="text-xs text-stone-500 mt-1 tabular-nums">
                  {c.totalMensagens} {c.totalMensagens === 1 ? "mensagem" : "mensagens"}
                </div>
              )}
              {c.descricao && (
                <div className="text-sm text-stone-600 mt-2 line-clamp-2 leading-snug">
                  {c.descricao}
                </div>
              )}
              <div className="mt-3 inline-flex items-center gap-1 text-xs text-niver-700 font-medium group-hover:gap-2 transition-all">
                ver mensagens
                <ArrowRight size={12} />
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

// Re-export pra Home não precisar importar de lib direto
export type { LucideIcon };
