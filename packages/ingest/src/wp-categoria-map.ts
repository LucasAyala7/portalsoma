/**
 * Mapa de categoria do WP atual → cluster slug novo.
 * Baseado nas URLs do site nivertotal.com.br atual.
 *
 * Categorias do WP virão como slug (ex: "avo", "biblica", "whatsapp", "15-anos").
 * Cada uma vira um clusterSlug + opcional complementoSlug.
 */

export interface ClusterMapping {
  clusterSlug: string;
  complementoSlug?: string;
}

export const WP_CATEGORIA_MAP: Record<string, ClusterMapping> = {
  // Destinatários família
  "avo": { clusterSlug: "para-avo" },
  "pai": { clusterSlug: "para-pai" },
  "mae": { clusterSlug: "para-mae" },
  "filho": { clusterSlug: "para-filho" },
  "filha": { clusterSlug: "para-filha" },
  "irma": { clusterSlug: "para-irma" },
  "irmao": { clusterSlug: "para-irmao" },
  "sobrinha": { clusterSlug: "para-sobrinha" },
  "sobrinho": { clusterSlug: "para-sobrinho" },
  "neta": { clusterSlug: "para-neta" },
  "neto": { clusterSlug: "para-neto" },
  "prima": { clusterSlug: "para-prima" },
  "primo": { clusterSlug: "para-primo" },
  "tia": { clusterSlug: "para-tia" },
  "tio": { clusterSlug: "para-tio" },
  "afilhada": { clusterSlug: "para-afilhada" },
  "afilhado": { clusterSlug: "para-afilhado" },
  "madrinha": { clusterSlug: "para-madrinha" },
  "padrinho": { clusterSlug: "para-padrinho" },
  "sogra": { clusterSlug: "para-sogra" },
  "sogro": { clusterSlug: "para-sogro" },
  "nora": { clusterSlug: "para-nora" },
  "genro": { clusterSlug: "para-genro" },
  "cunhada": { clusterSlug: "para-cunhada" },
  "cunhado": { clusterSlug: "para-cunhado" },
  "comadre": { clusterSlug: "para-comadre" },

  // Amigos
  "amiga": { clusterSlug: "para-amiga" },
  "amigo": { clusterSlug: "para-amigo" },
  "amiga-especial": { clusterSlug: "para-amiga", complementoSlug: "especial" },
  "amigo-especial": { clusterSlug: "para-amigo", complementoSlug: "especial" },

  // Relacionamento
  "marido": { clusterSlug: "para-marido" },
  "esposa": { clusterSlug: "para-esposa" },
  "namorado": { clusterSlug: "para-namorado" },
  "namorada": { clusterSlug: "para-namorada" },

  // Religiosos
  "pastor": { clusterSlug: "para-pastor" },
  "pastora": { clusterSlug: "para-pastora" },
  "padre": { clusterSlug: "para-padre" },

  // Trabalho
  "chefe": { clusterSlug: "para-chefe" },
  "cliente": { clusterSlug: "para-cliente" },
  "colega": { clusterSlug: "para-colega" },

  // Tons
  "biblica": { clusterSlug: "biblica" },
  "biblicas": { clusterSlug: "biblica" },
  "evangelica": { clusterSlug: "evangelica" },
  "evangelicas": { clusterSlug: "evangelica" },
  "catolica": { clusterSlug: "catolica" },
  "catolicas": { clusterSlug: "catolica" },
  "gospel": { clusterSlug: "gospel" },
  "espirita": { clusterSlug: "espirita" },
  "crista": { clusterSlug: "crista" },
  "engracada": { clusterSlug: "engracada" },
  "engracadas": { clusterSlug: "engracada" },
  "curta": { clusterSlug: "curta" },
  "curtas": { clusterSlug: "curta" },
  "simples": { clusterSlug: "simples" },
  "bonita": { clusterSlug: "bonita" },
  "reflexiva": { clusterSlug: "reflexiva" },
  "motivacional": { clusterSlug: "reflexiva" },
  "motivacionais": { clusterSlug: "reflexiva" },
  "inspiradora": { clusterSlug: "reflexiva" },
  "inspiradoras": { clusterSlug: "reflexiva" },

  // Canais
  "whatsapp": { clusterSlug: "no-whatsapp" },
  "status": { clusterSlug: "para-status" },

  // Idade
  "15-anos": { clusterSlug: "de-15-anos" },
  "18-anos": { clusterSlug: "de-18-anos" },
  "30-anos": { clusterSlug: "de-30-anos" },
  "50-anos": { clusterSlug: "de-50-anos" },
  "80-anos": { clusterSlug: "de-80-anos" },

  // Bodas
  "bodas-de-prata": { clusterSlug: "bodas-de-prata-25-anos" },
  "bodas-de-ouro": { clusterSlug: "bodas-de-ouro-50-anos" },
  "bodas-de-estanho": { clusterSlug: "bodas-de-estanho-10-anos" },
  "bodas-de-cristal": { clusterSlug: "bodas-de-cristal-15-anos" },

  // Namoro tempo (alguns slugs comuns)
  "1-ano-de-namoro": { clusterSlug: "de-1-ano-de-namoro" },
  "2-anos-de-namoro": { clusterSlug: "de-2-anos-de-namoro" },
  "4-anos-de-namoro": { clusterSlug: "de-4-anos-de-namoro" },

  // Falecidos
  "mae-falecida": { clusterSlug: "para-mae-falecida" },
  "pai-falecido": { clusterSlug: "para-pai-falecido" },
};

export function mapearCategoriaWP(slug: string): ClusterMapping | null {
  return WP_CATEGORIA_MAP[slug] ?? null;
}
