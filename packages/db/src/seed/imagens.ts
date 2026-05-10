/**
 * Imagens hero (placeholder Unsplash) pra ~10 mensagens.
 * Em prod entram via Flux Pro/Schnell. Aqui, IDs determinísticos do Unsplash
 * pra demonstrar diagramação no front (ratio 3:2, 1200x800).
 *
 * Cada entry mapeia slug da mensagem → URL otimizada.
 */

export interface ImagemSeed {
  mensagemSlug: string;
  url: string;
  width: number;
  height: number;
  alt: string;
  formato?: string;
}

const W = 1200;
const H = 800;

/** Helper: builda URL Unsplash com tamanho + qualidade fixos */
function unsplash(id: string): string {
  return `https://images.unsplash.com/photo-${id}?w=${W}&h=${H}&fit=crop&q=80&auto=format`;
}

export const IMAGENS_SEED: ImagemSeed[] = [
  // Para amiga — destaque trending
  {
    mensagemSlug: "amiga-do-meu-melhor-pedaco-feliz-aniversario",
    url: unsplash("1559054652-d24a3b8f3d54"), // amigas rindo, café da manhã
    width: W,
    height: H,
    alt: "Duas amigas sorrindo enquanto tomam café — celebração íntima",
    formato: "hero",
  },
  // Para amiga especial
  {
    mensagemSlug: "amiga-especial-aquela-que-eu-escolheria-mil-vezes",
    url: unsplash("1518621736915-f3b1c41bfd00"), // flores delicadas em mesa
    width: W,
    height: H,
    alt: "Buquê de peônias rosa em mesa de madeira clara",
    formato: "hero",
  },
  // Para mãe — destaque
  {
    mensagemSlug: "mae-suas-maos-ensinaram-quase-tudo",
    url: unsplash("1518621736915-f3b1c41bfd00"), // mão segurando carta
    width: W,
    height: H,
    alt: "Mãos costurando — gesto de cuidado materno",
    formato: "hero",
  },
  // Mãe evangélica — destaque
  {
    mensagemSlug: "mae-evangelica-mulher-virtuosa-provérbios",
    url: unsplash("1499209974431-9dddcece7f88"), // bíblia aberta luz manhã
    width: W,
    height: H,
    alt: "Bíblia aberta sobre mesa com luz da manhã entrando pela janela",
    formato: "hero",
  },
  // 15 anos — destaque
  {
    mensagemSlug: "15-anos-momento-onde-tudo-comeca",
    url: unsplash("1530103862676-de8c9debad1d"), // bolo aniversário elegante
    width: W,
    height: H,
    alt: "Bolo de aniversário elegante com vela de centelha",
    formato: "hero",
  },
  // Mãe romântica
  {
    mensagemSlug: "mae-mais-um-ano-da-mulher-mais-incrivel",
    url: unsplash("1454944338482-a69bb95894af"), // mãe e filha abraço
    width: W,
    height: H,
    alt: "Mãe e filha em abraço caloroso — momento de afeto",
    formato: "hero",
  },
  // Whatsapp curta
  {
    mensagemSlug: "whatsapp-curta-feliz-niver-pessoa-incrivel",
    url: unsplash("1513151233558-d860c5398176"), // confetes coloridos
    width: W,
    height: H,
    alt: "Confetes coloridos celebrativos espalhados sobre fundo branco",
    formato: "hero",
  },
  // Amiga axé
  {
    mensagemSlug: "amiga-do-axe-da-festa-da-vida",
    url: unsplash("1530103862676-de8c9debad1d"), // festa colorida
    width: W,
    height: H,
    alt: "Mesa festiva colorida com taças de champanhe e flores",
    formato: "hero",
  },
  // 15 anos princesa
  {
    mensagemSlug: "15-anos-princesinha-festa-tia-fatima",
    url: unsplash("1469371670807-013ccf25f16a"), // vela soprada elegante
    width: W,
    height: H,
    alt: "Vela elegante sobre bolo branco com glacê delicado",
    formato: "hero",
  },
  // Pastor evangélica
  {
    mensagemSlug: "mae-evangelica-oraçoes-foram-meu-alicerce",
    url: unsplash("1490127252417-7c393f993ee4"), // mãos em prece
    width: W,
    height: H,
    alt: "Mãos em prece sobre mesa — gesto de oração e gratidão",
    formato: "hero",
  },
];
