"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  text: string;
}

/**
 * Mostra ~30% do texto introdutório com blur gradient bottom + botão "Ver mais".
 * Quando expandido: full texto + columns-2 no desktop (lg+).
 */
export function ClusterHeroIntro({ text }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <div
        className={
          expanded
            ? "lg:columns-2 lg:gap-10"
            : "relative max-h-[180px] sm:max-h-[200px] lg:max-h-[220px] overflow-hidden"
        }
      >
        <p
          className={`text-stone-700 leading-[1.85] text-[16px] sm:text-[17px] whitespace-pre-line ${
            expanded ? "lg:[&>br]:hidden" : ""
          }`}
        >
          {text}
        </p>
        {!expanded && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-warm-50 via-warm-50/90 to-transparent backdrop-blur-[2px] [mask-image:linear-gradient(to_top,black,transparent)]"
            aria-hidden="true"
          />
        )}
      </div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-niver-700 hover:text-niver-800 transition-colors"
        aria-expanded={expanded}
      >
        {expanded ? (
          <>
            Ver menos <ChevronUp size={15} strokeWidth={2.4} />
          </>
        ) : (
          <>
            Ver mais <ChevronDown size={15} strokeWidth={2.4} />
          </>
        )}
      </button>
    </div>
  );
}
