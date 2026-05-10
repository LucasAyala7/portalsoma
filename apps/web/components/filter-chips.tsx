import { cn } from "@/lib/utils";

interface Chip {
  label: string;
  href: string;
  active?: boolean;
  count?: number;
}

interface Props {
  chips: Chip[];
  title?: string;
}

export function FilterChips({ chips, title }: Props) {
  if (chips.length === 0) return null;
  return (
    <div className="space-y-2">
      {title && (
        <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          {title}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <a
            key={chip.href}
            href={chip.href}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
              chip.active
                ? "bg-niver-600 text-white border-niver-600"
                : "bg-white text-stone-700 border-stone-200 hover:border-niver-300 hover:text-niver-700",
            )}
          >
            <span>{chip.label}</span>
            {chip.count !== undefined && (
              <span
                className={cn(
                  "text-xs tabular-nums",
                  chip.active ? "text-white/80" : "text-stone-400",
                )}
              >
                {chip.count}
              </span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
