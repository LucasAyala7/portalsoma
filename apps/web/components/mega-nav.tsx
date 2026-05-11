"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface NavItem {
  slug: string;
  nome: string;
}

interface NavSection {
  titulo: string;
  items: NavItem[];
}

interface Props {
  sections: NavSection[];
  nichoSlug?: string;
}

/**
 * Mega nav desktop — botões com dropdown 3-col por categoria.
 * Mobile usa MobileMenu (drawer); este componente é hidden md:flex.
 */
export function MegaNav({ sections, nichoSlug = "mensagem-de-aniversario" }: Props) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <nav className="hidden md:flex items-center gap-1 text-sm relative">
      {sections.map((section) => {
        const isOpen = active === section.titulo;
        return (
          <div
            key={section.titulo}
            className="relative"
            onMouseEnter={() => setActive(section.titulo)}
            onMouseLeave={() => setActive(null)}
          >
            <button
              type="button"
              className={`px-3 py-1.5 rounded-full font-medium inline-flex items-center gap-1 transition-colors ${
                isOpen
                  ? "bg-niver-50 text-niver-700"
                  : "text-stone-700 hover:bg-niver-50 hover:text-niver-700"
              }`}
              aria-expanded={isOpen}
            >
              {section.titulo}
              <ChevronDown size={13} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} strokeWidth={2.4} />
            </button>

            {isOpen && (
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-screen max-w-2xl bg-white rounded-2xl shadow-xl border border-warm-200 p-5 z-40"
                onMouseEnter={() => setActive(section.titulo)}
              >
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-warm-100">
                  <h3 className="font-display text-base text-niver-800 font-semibold">{section.titulo}</h3>
                  <a
                    href={`/${nichoSlug}/`}
                    className="text-xs text-niver-600 hover:text-niver-800 font-medium"
                  >
                    Ver tudo →
                  </a>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {section.items.map((item) => (
                    <a
                      key={item.slug}
                      href={`/${nichoSlug}/${item.slug}/`}
                      className="px-3 py-2 rounded-lg text-sm text-stone-700 hover:bg-niver-50 hover:text-niver-700 transition-colors truncate"
                    >
                      {item.nome}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
