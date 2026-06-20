import { Cake, ExternalLink } from "lucide-react";

interface FamousPerson {
  text: string;
  year: number;
  pages?: Array<{
    title: string;
    titles?: { canonical?: string; normalized?: string };
    extract?: string;
    content_urls?: { desktop?: { page?: string } };
    thumbnail?: { source?: string };
  }>;
}

const MESES_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/**
 * Aniversariantes famosos brasileiros nascidos hoje — via Wikipedia API (REST on this day).
 * Fresh content diário grátis, signal de freshness pro Google, tráfego brand novo.
 *
 * Cache server-side: ISR 24h (revalidate). API Wikipedia liberada CORS sem chave.
 */
export async function FamousBirthdaysToday() {
  const today = new Date();
  const m = today.getMonth() + 1;
  const d = today.getDate();
  const labelData = `${d} de ${MESES_PT[today.getMonth()]}`;

  let famosos: Array<{ nome: string; year: number; extract: string; url: string; image?: string }> = [];

  try {
    const res = await fetch(
      `https://pt.wikipedia.org/api/rest_v1/feed/onthisday/births/${m}/${d}`,
      {
        next: { revalidate: 86400 },
        headers: { "User-Agent": "PortalSoma/1.0 (https://www.portalsoma.com.br)" },
      },
    );
    if (res.ok) {
      const data = await res.json();
      const items: FamousPerson[] = data.births ?? [];
      // Filtra anos relevantes (1900+) e pega top 6 com extract bom
      famosos = items
        .filter((p) => p.year >= 1900 && p.pages?.[0]?.extract)
        .slice(0, 6)
        .map((p) => {
          const page = p.pages![0]!;
          return {
            nome: page.titles?.normalized ?? page.title.replace(/_/g, " "),
            year: p.year,
            extract: (page.extract ?? "").slice(0, 140) + "…",
            url: page.content_urls?.desktop?.page ?? `https://pt.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
            image: page.thumbnail?.source,
          };
        });
    }
  } catch {
    // Falha silenciosa — widget some, não quebra a página.
  }

  if (famosos.length === 0) return null;

  const ano = today.getFullYear();
  const idade = (yearBirth: number) => ano - yearBirth;

  return (
    <section className="container-niver py-10" aria-labelledby="famous-birthdays-heading">
      <div className="flex items-end justify-between mb-5 flex-wrap gap-2">
        <div>
          <h2 id="famous-birthdays-heading" className="heading-section-bar text-niver-800">
            Nasceram em {labelData}
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Pessoas famosas que fazem aniversário hoje — referência cultural pra inspirar sua mensagem.
          </p>
        </div>
        <Cake size={26} className="text-niver-500" strokeWidth={2} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {famosos.map((f) => (
          <a
            key={f.nome}
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 p-4 rounded-2xl bg-white border border-stone-100 hover:border-niver-200 hover:shadow-md transition-all"
          >
            {f.image ? (
              <img
                src={f.image}
                alt={f.nome}
                width={56}
                height={56}
                loading="lazy"
                decoding="async"
                className="w-14 h-14 rounded-full object-cover flex-shrink-0 bg-stone-100"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-niver-50 grid place-items-center flex-shrink-0">
                <Cake size={22} className="text-niver-400" strokeWidth={1.8} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-display text-base text-stone-900 group-hover:text-niver-700 transition-colors truncate">
                  {f.nome}
                </h3>
                <ExternalLink size={11} className="text-stone-300 group-hover:text-niver-500" strokeWidth={2.4} />
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {f.year} · faria {idade(f.year)} anos
              </p>
              <p className="text-xs text-stone-600 mt-1.5 line-clamp-2 leading-snug">{f.extract}</p>
            </div>
          </a>
        ))}
      </div>

      <p className="text-xs text-stone-400 mt-4 text-center">
        Dados via Wikipedia · atualizado diariamente
      </p>
    </section>
  );
}
