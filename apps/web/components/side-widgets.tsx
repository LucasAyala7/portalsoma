import { Award, BookOpen, Sparkles, Users, type LucideIcon } from "lucide-react";

interface AutorTopItem {
  slug: string;
  nome: string;
  fotoUrl?: string | null;
  totalMensagens: number;
  totalLikes: number;
}

interface Props {
  autores: AutorTopItem[];
}

/**
 * Sidebar widget — autores com mais engajamento.
 * Pra usar em layouts 2-col (conteúdo principal + aside).
 */
export function TopAuthorsWidget({ autores }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Award size={18} className="text-amber-500" strokeWidth={2.4} />
        <h3 className="font-display text-lg font-semibold text-stone-900">Autores em destaque</h3>
      </div>
      <div className="space-y-2">
        {autores.slice(0, 5).map((a, i) => (
          <a
            key={a.slug}
            href={`/autor/${a.slug}/`}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-warm-100 transition-colors group"
          >
            <div className="relative">
              {a.fotoUrl ? (
                <img
                  src={a.fotoUrl}
                  alt={a.nome}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-niver-200 to-rose-200 grid place-items-center text-niver-700 font-display font-semibold">
                  {a.nome.slice(0, 1)}
                </div>
              )}
              {i < 3 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 grid place-items-center text-[10px] font-bold text-stone-900">
                  {i + 1}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-stone-900 group-hover:text-niver-700 transition-colors truncate">
                {a.nome}
              </div>
              <div className="text-xs text-stone-500 tabular-nums">
                {a.totalMensagens} msgs · {a.totalLikes.toLocaleString("pt-BR")} ❤
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

interface QuickLink {
  href: string;
  label: string;
  count?: number;
  icon?: LucideIcon;
}

interface QuickLinksProps {
  title: string;
  icon?: LucideIcon;
  links: QuickLink[];
}

/**
 * Widget de "links rápidos" — pra glossário, FAQ, popular tags etc.
 */
export function QuickLinksWidget({ title, icon: Icon = BookOpen, links }: QuickLinksProps) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={18} className="text-niver-600" strokeWidth={2.4} />
        <h3 className="font-display text-lg font-semibold text-stone-900">{title}</h3>
      </div>
      <div className="space-y-1">
        {links.map((l) => {
          const LinkIcon = l.icon;
          return (
            <a
              key={l.href}
              href={l.href}
              className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-warm-100 transition-colors text-sm group"
            >
              <span className="flex items-center gap-2.5 min-w-0">
                {LinkIcon && (
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-niver-50 text-niver-700 group-hover:bg-niver-100 transition-colors flex-shrink-0">
                    <LinkIcon size={14} strokeWidth={2.4} />
                  </span>
                )}
                <span className="text-stone-800 group-hover:text-niver-700 truncate">{l.label}</span>
              </span>
              {typeof l.count === "number" && l.count > 0 && (
                <span className="text-xs text-stone-500 tabular-nums flex-shrink-0">{l.count}</span>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Widget de chamada/CTA pra newsletter. Compacto pra usar em aside.
 */
export function NewsletterMini() {
  return (
    <div className="bg-gradient-to-br from-niver-600 to-niver-700 rounded-2xl p-5 text-white relative overflow-hidden">
      <div className="absolute -top-4 -right-4 text-7xl opacity-15">🎂</div>
      <div className="relative">
        <Sparkles size={20} className="text-niver-100 mb-2" strokeWidth={2.4} />
        <div className="font-display text-lg font-semibold mb-1.5 leading-tight">
          Receba novas mensagens
        </div>
        <p className="text-xs text-niver-100 leading-relaxed mb-3">
          Toda semana, uma seleção pra você ter sempre uma pronta.
        </p>
        <form className="flex flex-col gap-2">
          <input
            type="email"
            required
            placeholder="seu@email.com"
            className="w-full px-3 py-2 rounded-lg bg-white/95 text-stone-900 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-white/40"
          />
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 active:scale-95 transition-all"
          >
            Quero receber
          </button>
        </form>
      </div>
    </div>
  );
}

interface PersonaSpotlightProps {
  persona: {
    slug: string;
    nome: string;
    bio: string;
    fotoUrl?: string | null;
    totalMensagens: number;
  };
}

/**
 * Spotlight de uma persona — destaque visual em aside.
 */
export function PersonaSpotlight({ persona }: PersonaSpotlightProps) {
  return (
    <div className="bg-gradient-to-br from-violet-50 to-rose-50 rounded-2xl p-5 border border-stone-100">
      <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-wider text-stone-500 font-medium">
        <Users size={14} className="text-niver-600" strokeWidth={2.4} />
        Autor em foco
      </div>
      <div className="flex items-center gap-4 mb-3">
        {persona.fotoUrl ? (
          <img
            src={persona.fotoUrl}
            alt={persona.nome}
            className="w-16 h-16 rounded-full object-cover border-4 border-white shadow"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-white grid place-items-center font-display text-3xl text-niver-700 shadow border-4 border-white">
            {persona.nome.slice(0, 1)}
          </div>
        )}
        <div>
          <div className="font-display text-lg font-semibold text-stone-900 leading-tight">
            {persona.nome}
          </div>
          <div className="text-xs text-stone-500 tabular-nums">
            {persona.totalMensagens} mensagens
          </div>
        </div>
      </div>
      <p className="text-sm text-stone-700 leading-relaxed line-clamp-3 mb-3">{persona.bio}</p>
      <a
        href={`/autor/${persona.slug}/`}
        className="text-sm text-niver-700 font-medium hover:text-niver-800 inline-flex items-center gap-1"
      >
        Ver perfil completo →
      </a>
    </div>
  );
}
