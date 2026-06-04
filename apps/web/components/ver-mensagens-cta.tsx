"use client";

import { ArrowDown } from "lucide-react";

interface Props {
  targetId?: string;
  label?: string;
}

/** Botão inline laranja com scroll smooth pra section alvo. */
export function VerMensagensCTA({
  targetId = "cluster-collection",
  label = "Ver mensagens",
}: Props) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - 16;
    window.scrollTo({ top, behavior: "smooth" });
  }

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="mt-6 mx-auto flex w-fit items-center gap-2 px-6 py-3 bg-niver-600 hover:bg-niver-700 text-white font-semibold rounded-full shadow-md transition-colors"
    >
      {label}
      <ArrowDown size={16} strokeWidth={2.4} />
    </a>
  );
}
