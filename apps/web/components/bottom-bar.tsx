"use client";

import { useState, useEffect } from "react";
import { Home, Layers, Search, Heart, Share2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

/**
 * Bottom bar fixa no mobile (app-like).
 * 5 ações: Home · Categorias (abre drawer via custom event) · Buscar · Salvas · Compartilhar app
 *
 * Sinaliza ao MobileMenu via window event `portalsoma:open-menu`.
 */
export function BottomBar() {
  const [hidden, setHidden] = useState(false);
  const [lastY, setLastY] = useState(0);

  // Auto-hide on scroll down, show on scroll up
  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 6) return;
      setHidden(y > lastY && y > 100);
      setLastY(y);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastY]);

  function openMenu() {
    trackEvent("mobile_quick_action", { action: "categorias" });
    window.dispatchEvent(new CustomEvent("portalsoma:open-menu"));
  }

  async function shareApp() {
    trackEvent("mobile_quick_action", { action: "share_app" });
    const url = "https://www.portalsoma.com.br/?utm_source=share&utm_medium=app_share&utm_campaign=app_install";
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: "Portal Soma — Mensagens de Aniversário",
          text: "Mensagens originais pra emocionar quem você ama",
          url,
        });
      } catch {
        /* user cancel */
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  function openSearch() {
    trackEvent("mobile_quick_action", { action: "buscar" });
    // Foca no search-typeahead se existir na página; senão vai pra home
    const el = document.querySelector<HTMLInputElement>('input[type="search"], input[placeholder*="Buscar"]');
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus();
    } else {
      window.location.href = "/";
    }
  }

  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-warm-50/95 backdrop-blur-md border-t border-warm-200/80 transition-transform duration-200 ${
        hidden ? "translate-y-full" : "translate-y-0"
      }`}
      aria-label="Navegação rápida"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
    >
      <div className="grid grid-cols-5 h-14">
        <a
          href="/"
          onClick={() => trackEvent("mobile_quick_action", { action: "home" })}
          className="flex flex-col items-center justify-center gap-0.5 text-[10px] text-stone-600 hover:text-niver-700"
        >
          <Home size={20} strokeWidth={2.2} />
          <span>Início</span>
        </a>
        <button
          type="button"
          onClick={openMenu}
          className="flex flex-col items-center justify-center gap-0.5 text-[10px] text-stone-600 hover:text-niver-700"
        >
          <Layers size={20} strokeWidth={2.2} />
          <span>Categorias</span>
        </button>
        <button
          type="button"
          onClick={openSearch}
          className="flex flex-col items-center justify-center gap-0.5 text-[10px] text-stone-600 hover:text-niver-700"
        >
          <Search size={20} strokeWidth={2.2} />
          <span>Buscar</span>
        </button>
        <a
          href="/favoritos/"
          onClick={() => trackEvent("mobile_quick_action", { action: "salvas" })}
          className="flex flex-col items-center justify-center gap-0.5 text-[10px] text-stone-600 hover:text-niver-700"
        >
          <Heart size={20} strokeWidth={2.2} />
          <span>Salvas</span>
        </a>
        <button
          type="button"
          onClick={shareApp}
          className="flex flex-col items-center justify-center gap-0.5 text-[10px] text-stone-600 hover:text-niver-700"
        >
          <Share2 size={20} strokeWidth={2.2} />
          <span>Compartilhar</span>
        </button>
      </div>
    </nav>
  );
}
