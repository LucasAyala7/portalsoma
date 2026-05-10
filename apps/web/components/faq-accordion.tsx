"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem {
  pergunta: string;
  resposta: string;
}

interface Props {
  items: FaqItem[];
  title?: string;
}

export function FaqAccordion({ items, title = "Perguntas frequentes" }: Props) {
  const [open, setOpen] = useState<number | null>(0);

  if (items.length === 0) return null;

  return (
    <section className="mt-12 border-t border-stone-200 pt-10">
      <h2 className="text-2xl mb-6">{title}</h2>
      <div className="space-y-2">
        {items.map((item, idx) => {
          const isOpen = open === idx;
          return (
            <div key={idx} className="border border-stone-200 rounded-xl overflow-hidden bg-white">
              <button
                type="button"
                className="w-full flex justify-between items-center text-left p-4 sm:p-5 hover:bg-stone-50"
                onClick={() => setOpen(isOpen ? null : idx)}
                aria-expanded={isOpen}
              >
                <span className="font-medium pr-4">{item.pergunta}</span>
                <ChevronDown
                  size={20}
                  className={cn("flex-shrink-0 transition-transform", isOpen && "rotate-180")}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-5 sm:px-5 text-stone-700 leading-relaxed">
                  {item.resposta}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
