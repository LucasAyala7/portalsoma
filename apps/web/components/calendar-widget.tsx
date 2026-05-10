import { Calendar } from "lucide-react";
import { getDataIcon, COLOR_BG } from "@/lib/icons";

interface DataItem {
  data: string;
  nome: string;
  diasFalta: number;
  href: string;
}

function calcularProximasDatas(now: Date = new Date()): DataItem[] {
  const ano = now.getFullYear();
  const datasFixas = [
    { mes: 0, dia: 1, nome: "Ano Novo", href: "/mensagem-de-aniversario/" },
    { mes: 1, dia: 14, nome: "Dia dos Namorados (USA)", href: "/mensagem-de-aniversario/para-namorado/" },
    { mes: 2, dia: 8, nome: "Dia da Mulher", href: "/mensagem-de-aniversario/para-amiga/" },
    { mes: 4, dia: 12, nome: "Dia das Mães", href: "/mensagem-de-aniversario/para-mae/" },
    { mes: 5, dia: 12, nome: "Dia dos Namorados", href: "/mensagem-de-aniversario/para-namorado/" },
    { mes: 7, dia: 11, nome: "Dia dos Pais", href: "/mensagem-de-aniversario/para-pai/" },
    { mes: 9, dia: 12, nome: "Dia das Crianças", href: "/mensagem-de-aniversario/para-filho/" },
    { mes: 9, dia: 15, nome: "Dia dos Professores", href: "/mensagem-de-aniversario/para-colega/" },
    { mes: 11, dia: 25, nome: "Natal", href: "/mensagem-de-aniversario/" },
  ];
  const items: DataItem[] = [];
  for (const d of datasFixas) {
    let dt = new Date(ano, d.mes, d.dia);
    if (dt < now) dt = new Date(ano + 1, d.mes, d.dia);
    const diff = Math.ceil((dt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    items.push({
      data: dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      nome: d.nome,
      diasFalta: diff,
      href: d.href,
    });
  }
  return items.sort((a, b) => a.diasFalta - b.diasFalta).slice(0, 4);
}

export function CalendarWidget() {
  const datas = calcularProximasDatas();

  return (
    <div className="card-feature">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={18} className="text-niver-600" strokeWidth={2.4} />
        <h3 className="font-display text-lg font-semibold text-stone-900">
          Datas que se aproximam
        </h3>
      </div>
      <div className="space-y-2">
        {datas.map((d) => {
          const cfg = getDataIcon(d.nome);
          const Icon = cfg.icon;
          return (
            <a
              key={d.nome}
              href={d.href}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white transition-colors group"
            >
              <div
                className={`flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl ${COLOR_BG[cfg.color]}`}
              >
                <Icon size={18} strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-stone-900 group-hover:text-niver-700 transition-colors">
                  {d.nome}
                </div>
                <div className="text-xs text-stone-500 tabular-nums">
                  {d.data} ·{" "}
                  <span className="text-niver-700 font-medium">
                    {d.diasFalta === 0
                      ? "hoje"
                      : d.diasFalta === 1
                        ? "amanhã"
                        : `em ${d.diasFalta} dias`}
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
