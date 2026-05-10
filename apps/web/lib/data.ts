import { prisma } from "@nivertotal/db";
import type { Cluster, Complemento, Mensagem } from "@nivertotal/db";

export async function getNicho(slug: string) {
  return prisma.nicho.findUnique({
    where: { slug, ativo: true },
    include: {
      clusters: {
        where: { ativo: true },
        orderBy: { volumeMensal: "desc" },
        include: { complementos: { where: { ativo: true } } },
      },
    },
  });
}

export async function getCluster(nichoSlug: string, clusterSlug: string) {
  return prisma.cluster.findFirst({
    where: { slug: clusterSlug, nicho: { slug: nichoSlug }, ativo: true },
    include: {
      nicho: true,
      complementos: { where: { ativo: true }, orderBy: { volumeMensal: "desc" } },
    },
  });
}

export async function getComplemento(
  nichoSlug: string,
  clusterSlug: string,
  complementoSlug: string,
) {
  return prisma.complemento.findFirst({
    where: {
      slug: complementoSlug,
      cluster: { slug: clusterSlug, nicho: { slug: nichoSlug } },
      ativo: true,
    },
    include: { cluster: { include: { nicho: true } } },
  });
}

export async function getMensagensByCluster(clusterId: string, limit = 30) {
  return prisma.mensagem.findMany({
    where: { clusterId, status: "PUBLISHED" },
    orderBy: [{ qualidade: "desc" }, { publicadoEm: "desc" }],
    take: limit,
    include: { autor: true, persona: true, imagemHero: true },
  });
}

export async function getMensagensByComplemento(complementoId: string, limit = 30) {
  return prisma.mensagem.findMany({
    where: { complementoId, status: "PUBLISHED" },
    orderBy: [{ qualidade: "desc" }, { publicadoEm: "desc" }],
    take: limit,
    include: { autor: true, persona: true, imagemHero: true },
  });
}

export async function getMensagem(slug: string) {
  return prisma.mensagem.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      cluster: { include: { nicho: true } },
      complemento: true,
      autor: true,
      persona: true,
      imagemHero: true,
      imagemOg: true,
    },
  });
}

export async function getRelatedMensagens(mensagem: Mensagem, limit = 6) {
  return prisma.mensagem.findMany({
    where: {
      clusterId: mensagem.clusterId,
      id: { not: mensagem.id },
      status: "PUBLISHED",
    },
    orderBy: { qualidade: "desc" },
    take: limit,
    include: { autor: true, persona: true },
  });
}

export async function getAutor(slug: string) {
  return prisma.author.findUnique({
    where: { slug, ativo: true },
    include: {
      persona: true,
      mensagens: {
        where: { status: "PUBLISHED" },
        orderBy: { publicadoEm: "desc" },
        take: 50,
        include: { cluster: true },
      },
    },
  });
}

export async function getAllPublishedSlugs() {
  return prisma.mensagem.findMany({
    where: { status: "PUBLISHED" },
    select: {
      slug: true,
      cluster: { select: { slug: true, nicho: { select: { slug: true } } } },
      complemento: { select: { slug: true } },
      atualizadoEm: true,
    },
  });
}

export async function getAllClusters() {
  return prisma.cluster.findMany({
    where: { ativo: true },
    include: {
      nicho: { select: { slug: true } },
      complementos: { where: { ativo: true } },
    },
  });
}

export type ClusterWithChildren = Awaited<ReturnType<typeof getCluster>>;
export type MensagemListItem = Awaited<ReturnType<typeof getMensagensByCluster>>[number];
