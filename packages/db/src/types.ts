import type { Mensagem, Cluster, Complemento, Author, Persona, Image } from "@prisma/client";

export type MensagemFull = Mensagem & {
  cluster: Cluster;
  complemento: Complemento | null;
  autor: Author;
  persona: Persona | null;
  imagemHero: Image | null;
  imagemOg: Image | null;
  imagemPin: Image | null;
};

export type ClusterFull = Cluster & {
  complementos: Complemento[];
  mensagens: Mensagem[];
};

export type ComplementoFull = Complemento & {
  cluster: Cluster;
  mensagens: Mensagem[];
};

export type { Mensagem, Cluster, Complemento, Author, Persona, Image };
