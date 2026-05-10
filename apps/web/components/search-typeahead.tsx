"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

interface SearchableMessage {
  id: string;
  conteudo: string;
  preview?: string;
}

interface Props {
  messages: SearchableMessage[];
  placeholder?: string;
  onFilter?: (visibleIds: Set<string>) => void;
}

/**
 * Search local na collection page (filtra cards visíveis).
 * Não bate em servidor — instantâneo.
 */
export function SearchTypeahead({ messages, placeholder = "Buscar mensagens...", onFilter }: Props) {
  const [query, setQuery] = useState("");

  const matchedIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return new Set(messages.map((m) => m.id));
    return new Set(
      messages
        .filter((m) => m.conteudo.toLowerCase().includes(q))
        .map((m) => m.id),
    );
  }, [query, messages]);

  useEffect(() => {
    onFilter?.(matchedIds);
    if (typeof document === "undefined") return;
    document.querySelectorAll<HTMLElement>("article[id^='m-']").forEach((el) => {
      const id = el.id.slice(2);
      el.style.display = matchedIds.has(id) ? "" : "none";
    });
  }, [matchedIds, onFilter]);

  return (
    <div className="relative">
      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 pl-10 pr-10 rounded-full bg-white border border-stone-200 focus:border-niver-400 focus:outline-none focus:ring-2 focus:ring-niver-100 text-sm"
      />
      {query.length > 0 && (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
          aria-label="Limpar busca"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
