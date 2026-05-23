"use client";

import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface NavItem {
  slug: string;
  nome: string;
}

interface NavSection {
  titulo: string;
  items: NavItem[];
}

interface Props {
  nichoSlug?: string;
  sections: NavSection[];
}

const HREF_PREFIX = "/mensagem-de-aniversario";

export function MobileMenu({ nichoSlug = "mensagem-de-aniversario", sections }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Bottom bar pode pedir pra abrir o menu via custom event
  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("portalsoma:open-menu", onOpen);
    return () => window.removeEventListener("portalsoma:open-menu", onOpen);
  }, []);

  function hrefFor(slug: string) {
    return `/${nichoSlug}/${slug}/`;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          trackEvent("mobile_menu_open", { source: "hamburger" });
        }}
        aria-label="Abrir menu"
        className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-xl border border-warm-200 bg-white/70 text-stone-700 hover:bg-warm-100 transition-colors"
      >
        <Menu size={18} strokeWidth={2.2} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        >
          <aside
            className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-warm-50 shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Menu de navegação"
          >
            <div className="sticky top-0 bg-warm-50 border-b border-warm-200 px-4 py-3 flex items-center justify-between z-10">
              <span className="font-display text-lg text-niver-800 font-semibold">Categorias</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-stone-600 hover:bg-warm-100"
              >
                <X size={18} strokeWidth={2.2} />
              </button>
            </div>

            <div className="px-2 py-2">
              {sections.map((section) => {
                const isOpen = active === section.titulo;
                return (
                  <div key={section.titulo} className="border-b border-warm-200/70 last:border-0">
                    <button
                      type="button"
                      onClick={() => {
                        setActive(isOpen ? null : section.titulo);
                        if (!isOpen) trackEvent("mobile_menu_section", { section: section.titulo });
                      }}
                      className="w-full flex items-center justify-between px-3 py-3.5 text-left text-stone-800 font-medium"
                      aria-expanded={isOpen}
                    >
                      <span>{section.titulo}</span>
                      <ChevronDown
                        size={18}
                        className={`text-stone-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isOpen && (
                      <ul className="pb-3 pl-3">
                        {section.items.map((item) => (
                          <li key={item.slug}>
                            <a
                              href={hrefFor(item.slug)}
                              className="flex items-center justify-between px-3 py-2 text-sm text-stone-700 rounded-lg hover:bg-niver-50 hover:text-niver-700"
                              onClick={() => setOpen(false)}
                            >
                              <span>{item.nome}</span>
                              <ChevronRight size={14} className="text-stone-300" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="px-4 py-5 border-t border-warm-200 mt-2 bg-white">
              <a
                href={`${HREF_PREFIX}/`}
                onClick={() => setOpen(false)}
                className="block w-full text-center bg-niver-600 hover:bg-niver-700 text-white font-medium py-3 rounded-xl transition-colors"
              >
                Ver todas as categorias
              </a>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
