"use client";

import { useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";

interface Props {
  targetId?: string;
  label?: string;
}

/**
 * 2 botões pareados:
 *  - Inline (sempre visível) no hero/header da categoria — bg laranja niver-600
 *  - Floating mobile (md:hidden, z-30) ABOVE BottomBar (z-40) que esconde quando
 *    o target entra no viewport (IntersectionObserver). Bottom-20 = safe distance.
 */
export function VerMensagensCTA({
  targetId = "cluster-collection",
  label = "Ver mensagens",
}: Props) {
  const [showFloating, setShowFloating] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const obs = new IntersectionObserver(
      ([entry]) => setShowFloating(!entry.isIntersecting),
      { rootMargin: "0px 0px -50% 0px" },
    );
    obs.observe(target);
    return () => obs.disconnect();
  }, [targetId]);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - 16;
    window.scrollTo({ top, behavior: "smooth" });
  }

  return (
    <>
      <a
        href={`#${targetId}`}
        onClick={handleClick}
        className="mt-6 mx-auto flex w-fit items-center gap-2 px-6 py-3 bg-niver-600 hover:bg-niver-700 text-white font-semibold rounded-full shadow-md transition-colors"
      >
        {label}
        <ArrowDown size={16} strokeWidth={2.4} />
      </a>

      {showFloating && (
        <button
          type="button"
          onClick={handleClick}
          className="md:hidden fixed left-1/2 -translate-x-1/2 z-30 bottom-20 px-5 py-3 bg-niver-600 hover:bg-niver-700 text-white font-semibold rounded-full shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300"
          style={{ marginBottom: "env(safe-area-inset-bottom, 0)" }}
          aria-label={label}
        >
          {label}
          <ArrowDown size={16} strokeWidth={2.4} />
        </button>
      )}
    </>
  );
}
