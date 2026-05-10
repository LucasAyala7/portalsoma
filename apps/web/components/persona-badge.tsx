interface Props {
  nome: string;
  slug: string;
  fotoUrl?: string | null;
  isReal?: boolean;
}

export function PersonaBadge({ nome, slug, fotoUrl, isReal }: Props) {
  return (
    <a
      href={`/autor/${slug}/`}
      className="inline-flex items-center gap-2 text-xs text-stone-500 hover:text-niver-700 transition-colors"
    >
      {fotoUrl ? (
        <img
          src={fotoUrl}
          alt={nome}
          width={24}
          height={24}
          className="w-6 h-6 rounded-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-6 h-6 rounded-full bg-niver-100 text-niver-700 grid place-items-center text-[10px] font-semibold">
          {nome.slice(0, 1)}
        </div>
      )}
      <span className="font-medium">{nome}</span>
      {isReal && <span className="text-stone-400">·  editor</span>}
    </a>
  );
}
