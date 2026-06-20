/**
 * Mapping de cluster/categoria → LucideIcon + cor de tema.
 * Substitui emojis por ícones SVG profissionais.
 *
 * Cada categoria tem 1 ícone canônico + 1 cor da paleta (rose/violet/sky/emerald/amber/niver).
 * Cor é usada pra background sutil no card e pra acentuar o ícone.
 */

import {
  Heart,
  Users,
  HeartHandshake,
  Briefcase,
  Cross,
  Crown,
  Star,
  Sparkles,
  Flower2,
  Cake,
  Coffee,
  Gift,
  Smile,
  Music,
  Baby,
  Sun,
  Gem,
  Award,
  TreePine,
  Church,
  BookOpen,
  Calendar,
  MessageCircle,
  Smartphone,
  Mail,
  Flame,
  type LucideIcon,
} from "lucide-react";

export type CategoryColor = "niver" | "rose" | "violet" | "sky" | "emerald" | "amber" | "stone";

export interface CategoryIconConfig {
  icon: LucideIcon;
  color: CategoryColor;
}

const FALLBACK: CategoryIconConfig = { icon: Cake, color: "niver" };

const DESTINATARIO: Record<string, CategoryIconConfig> = {
  // família · rose (carinho)
  "para-mae": { icon: Flower2, color: "rose" },
  "para-pai": { icon: Briefcase, color: "stone" },
  "para-filha": { icon: Sparkles, color: "rose" },
  "para-filho": { icon: Star, color: "sky" },
  "para-irma": { icon: HeartHandshake, color: "rose" },
  "para-irmao": { icon: HeartHandshake, color: "sky" },
  "para-sobrinha": { icon: Smile, color: "violet" },
  "para-sobrinho": { icon: Smile, color: "sky" },
  "para-prima": { icon: Heart, color: "rose" },
  "para-tia": { icon: Coffee, color: "rose" },
  "para-tio": { icon: Coffee, color: "amber" },
  "para-avo": { icon: Crown, color: "amber" },
  "para-neto": { icon: Baby, color: "sky" },
  "para-neta": { icon: Baby, color: "rose" },
  "para-padrinho": { icon: Crown, color: "violet" },
  "para-madrinha": { icon: Crown, color: "rose" },
  "para-afilhada": { icon: Gift, color: "rose" },
  "para-afilhado": { icon: Gift, color: "sky" },
  "para-cunhada": { icon: Heart, color: "rose" },
  "para-cunhado": { icon: Users, color: "sky" },
  "para-comadre": { icon: HeartHandshake, color: "amber" },
  "para-genro": { icon: Users, color: "sky" },
  "para-nora": { icon: Heart, color: "rose" },
  "para-sogro": { icon: Briefcase, color: "stone" },
  "para-sogra": { icon: Sun, color: "amber" },

  // amor
  "para-marido": { icon: Gem, color: "rose" },
  "para-esposa": { icon: Gem, color: "rose" },
  "para-namorado": { icon: Heart, color: "rose" },
  "para-namorada": { icon: Heart, color: "rose" },

  // amizade · niver (amizade quente)
  "para-amiga": { icon: Heart, color: "niver" },
  "para-amigo": { icon: Users, color: "niver" },

  // trabalho · stone
  "para-chefe": { icon: Briefcase, color: "stone" },
  "para-cliente": { icon: HeartHandshake, color: "stone" },
  "para-colega": { icon: Coffee, color: "stone" },

  // religiosos · violet
  "para-pastor": { icon: Cross, color: "violet" },
  "para-pastora": { icon: Cross, color: "violet" },
  "para-padre": { icon: Church, color: "violet" },

  // falecidos · sky (calmo)
  "para-mae-falecida": { icon: Heart, color: "sky" },
  "para-pai-falecido": { icon: Heart, color: "sky" },
  "para-amigo-falecido": { icon: Heart, color: "sky" },
  "para-quem-ja-faleceu": { icon: Heart, color: "sky" },
  "para-quem-ja-morreu": { icon: Heart, color: "sky" },
};

const TOM: Record<string, CategoryIconConfig> = {
  evangelica: { icon: Cross, color: "violet" },
  biblica: { icon: BookOpen, color: "violet" },
  catolica: { icon: Church, color: "violet" },
  gospel: { icon: Music, color: "violet" },
  espirita: { icon: Sparkles, color: "violet" },
  crista: { icon: Heart, color: "violet" },
  engracada: { icon: Smile, color: "amber" },
  curta: { icon: MessageCircle, color: "niver" },
  simples: { icon: Cake, color: "niver" },
  bonita: { icon: Flower2, color: "rose" },
  reflexiva: { icon: Star, color: "sky" },
};

const OCASIAO: Record<string, CategoryIconConfig> = {
  "de-15-anos": { icon: Crown, color: "rose" },
  "de-18-anos": { icon: Star, color: "amber" },
  "de-30-anos": { icon: Gem, color: "violet" },
  "de-50-anos": { icon: Award, color: "amber" },
  "de-80-anos": { icon: Crown, color: "amber" },
  "bodas-de-prata-25-anos": { icon: Gem, color: "stone" },
  "bodas-de-ouro-50-anos": { icon: Award, color: "amber" },
  "bodas-de-cristal-15-anos": { icon: Sparkles, color: "sky" },
  "bodas-de-estanho-10-anos": { icon: Heart, color: "rose" },
  "de-1-ano-de-namoro": { icon: Heart, color: "rose" },
  "de-2-anos-de-namoro": { icon: Heart, color: "rose" },
  "de-4-anos-de-namoro": { icon: Heart, color: "rose" },
};

const CANAL: Record<string, CategoryIconConfig> = {
  "no-whatsapp": { icon: MessageCircle, color: "emerald" },
  "para-status": { icon: Smartphone, color: "sky" },
};

const DATA_COMEMORATIVA: Record<string, CategoryIconConfig> = {
  "Ano Novo": { icon: Sparkles, color: "amber" },
  "Dia da Mulher": { icon: Flower2, color: "rose" },
  "Dia das Mães": { icon: Heart, color: "rose" },
  "Dia dos Namorados": { icon: Heart, color: "rose" },
  "Dia dos Namorados (USA)": { icon: Heart, color: "rose" },
  "Dia dos Pais": { icon: Briefcase, color: "stone" },
  "Dia das Crianças": { icon: Smile, color: "sky" },
  "Dia dos Professores": { icon: BookOpen, color: "violet" },
  Natal: { icon: TreePine, color: "emerald" },
};

export function getCategoryIcon(slug: string): CategoryIconConfig {
  return DESTINATARIO[slug] ?? TOM[slug] ?? OCASIAO[slug] ?? CANAL[slug] ?? FALLBACK;
}

export function getDataIcon(nome: string): CategoryIconConfig {
  return DATA_COMEMORATIVA[nome] ?? { icon: Calendar, color: "niver" };
}

/** Tailwind class helpers por cor */
export const COLOR_BG: Record<CategoryColor, string> = {
  niver: "bg-niver-100 text-niver-700",
  rose: "bg-rose-100 text-rose-600",
  violet: "bg-violet-100 text-violet-700",
  sky: "bg-sky-100 text-sky-700",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  stone: "bg-stone-200 text-stone-700",
};

export const COLOR_BG_SOFT: Record<CategoryColor, string> = {
  niver: "from-niver-50 to-warm-50 hover:from-niver-100",
  rose: "from-rose-50 to-warm-50 hover:from-rose-100",
  violet: "from-violet-50 to-warm-50 hover:from-violet-100",
  sky: "from-sky-50 to-warm-50 hover:from-sky-100",
  emerald: "from-emerald-50 to-warm-50 hover:from-emerald-100",
  amber: "from-amber-50 to-warm-50 hover:from-amber-100",
  stone: "from-stone-50 to-warm-50 hover:from-stone-100",
};

export const COLOR_ICON: Record<CategoryColor, string> = {
  niver: "text-niver-600",
  rose: "text-rose-500",
  violet: "text-violet-600",
  sky: "text-sky-600",
  emerald: "text-emerald-600",
  amber: "text-amber-600",
  stone: "text-stone-600",
};

export const COLOR_BG_ICON_LARGE: Record<CategoryColor, string> = {
  niver: "bg-gradient-to-br from-niver-100 to-niver-50 text-niver-700",
  rose: "bg-gradient-to-br from-rose-100 to-rose-50 text-rose-600",
  violet: "bg-gradient-to-br from-violet-100 to-violet-50 text-violet-700",
  sky: "bg-gradient-to-br from-sky-100 to-sky-50 text-sky-700",
  emerald: "bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700",
  amber: "bg-gradient-to-br from-amber-100 to-amber-50 text-amber-700",
  stone: "bg-gradient-to-br from-stone-200 to-stone-100 text-stone-700",
};

export { Flame, Heart };
