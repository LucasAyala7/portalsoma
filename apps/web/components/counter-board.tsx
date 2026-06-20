import type { LucideIcon } from "lucide-react";

interface CounterItem {
  icon: LucideIcon;
  label: string;
  value: number;
  highlight?: boolean;
}

interface Props {
  items: CounterItem[];
}

/**
 * Grid de stats grandes · usado em landing/cluster header.
 * Visual: cards arredondados com número proeminente + label discreta.
 */
export function CounterBoard({ items }: Props) {
  // Grid responsivo: 2 cols mobile, 3 sm, full lg (cabe 5 items linha única)
  const cols = items.length;
  const lgCols = cols >= 5 ? "lg:grid-cols-5" : cols === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 ${lgCols} gap-3 sm:gap-4`}>
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div
            key={i}
            className={`relative rounded-2xl p-4 sm:p-5 border ${
              item.highlight
                ? "bg-niver-600 text-white border-niver-600 shadow-lg shadow-niver-600/20"
                : "bg-white border-stone-100"
            }`}
          >
            <Icon
              size={18}
              className={`mb-2 ${item.highlight ? "text-niver-100" : "text-niver-500"}`}
              strokeWidth={2.2}
            />
            <div
              className={`font-display text-2xl sm:text-3xl font-semibold tabular-nums leading-none ${
                item.highlight ? "text-white" : "text-stone-900"
              }`}
            >
              {item.value.toLocaleString("pt-BR")}
            </div>
            <div
              className={`mt-1 text-xs uppercase tracking-wider font-medium ${
                item.highlight ? "text-niver-100" : "text-stone-500"
              }`}
            >
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
