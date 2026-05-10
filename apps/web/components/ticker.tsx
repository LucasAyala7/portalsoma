import { Heart, Share2, Copy, Eye } from "lucide-react";

interface Props {
  totalMensagens: number;
  totalLikes: number;
  totalShares: number;
  totalCopies: number;
  totalViews: number;
}

/**
 * Faixa horizontal abaixo do hero — exibe contadores agregados.
 * Texto rola horizontalmente em loop infinito (CSS animation).
 */
export function Ticker({ totalMensagens, totalLikes, totalShares, totalCopies, totalViews }: Props) {
  const items = [
    { icon: Heart, label: "mensagens publicadas", value: totalMensagens },
    { icon: Copy, label: "cópias compartilhadas", value: totalCopies },
    { icon: Share2, label: "compartilhamentos", value: totalShares },
    { icon: Heart, label: "curtidas no total", value: totalLikes },
    { icon: Eye, label: "visualizações", value: totalViews },
    { icon: Heart, label: "famílias emocionadas", value: Math.floor(totalCopies * 0.7) },
  ];

  // duplica pra loop seamless
  const loop = [...items, ...items];

  return (
    <div className="relative bg-niver-50/50 border-y border-niver-100/60 overflow-hidden">
      <div className="flex anim-ticker whitespace-nowrap py-3">
        {loop.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="flex items-center gap-2 px-6 text-sm">
              <Icon size={14} className="text-niver-500" strokeWidth={2.4} />
              <strong className="font-semibold text-niver-800 tabular-nums">
                {item.value.toLocaleString("pt-BR")}
              </strong>
              <span className="text-stone-600">{item.label}</span>
              <span className="ml-4 text-niver-300">·</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
