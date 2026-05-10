-- CreateEnum
CREATE TYPE "ClusterTipo" AS ENUM ('DESTINATARIO', 'TOM', 'OCASIAO', 'CANAL', 'FALECIDO');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('TIER_1', 'TIER_2', 'TIER_3');

-- CreateEnum
CREATE TYPE "Origem" AS ENUM ('IA', 'MANUAL', 'IMPORT_WP', 'IMPORT_BULK');

-- CreateEnum
CREATE TYPE "TipoTag" AS ENUM ('TOM', 'OCASIAO', 'IDADE', 'CANAL', 'RELACAO', 'EMOCAO');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Nicho" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "headTerm" TEXT NOT NULL,
    "volumeMensal" INTEGER NOT NULL DEFAULT 0,
    "descricao" TEXT,
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "hero" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nicho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cluster" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "prefixoSlug" TEXT,
    "tipo" "ClusterTipo" NOT NULL,
    "headKeyword" TEXT NOT NULL,
    "volumeMensal" INTEGER NOT NULL DEFAULT 0,
    "permiteEmpilhar" BOOLEAN NOT NULL DEFAULT false,
    "descricao" TEXT,
    "intro" TEXT,
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "hero" TEXT,
    "faq" JSONB,
    "serpScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cotaDiaria" INTEGER NOT NULL DEFAULT 0,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "nichoId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complemento" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "headKeyword" TEXT NOT NULL,
    "volumeMensal" INTEGER NOT NULL DEFAULT 0,
    "descricao" TEXT,
    "intro" TEXT,
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "hero" TEXT,
    "faq" JSONB,
    "serpScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "clusterId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complemento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mensagem" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "resumo" TEXT,
    "preview" TEXT,
    "clusterId" TEXT NOT NULL,
    "complementoId" TEXT,
    "autorId" TEXT NOT NULL,
    "personaId" TEXT,
    "imagemHeroId" TEXT,
    "imagemOgId" TEXT,
    "imagemPinId" TEXT,
    "status" "Status" NOT NULL DEFAULT 'DRAFT',
    "tier" "Tier" NOT NULL DEFAULT 'TIER_3',
    "qualidade" DOUBLE PRECISION,
    "origem" "Origem" NOT NULL DEFAULT 'IA',
    "serpScore" DOUBLE PRECISION,
    "copies" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "visualizacoes" INTEGER NOT NULL DEFAULT 0,
    "publicadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mensagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Author" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "real" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT,
    "bio" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "redes" JSONB,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Persona" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "vozPrompt" TEXT NOT NULL,
    "fotoPrompt" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "pesos" JSONB NOT NULL,
    "caracteristicas" JSONB,
    "autorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoTag" NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MensagemTag" (
    "mensagemId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "MensagemTag_pkey" PRIMARY KEY ("mensagemId","tagId")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "formato" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "alt" TEXT NOT NULL,
    "promptUsado" TEXT,
    "modelo" TEXT,
    "custo" DOUBLE PRECISION,
    "hashContent" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeywordCluster" (
    "id" TEXT NOT NULL,
    "termo" TEXT NOT NULL,
    "volume" INTEGER NOT NULL,
    "competicao" DOUBLE PRECISION,
    "cpc" DOUBLE PRECISION,
    "intencao" TEXT,
    "posicaoGsc" INTEGER,
    "impressoesGsc" INTEGER,
    "cliquesGsc" INTEGER,
    "ctrGsc" DOUBLE PRECISION,
    "clusterId" TEXT,
    "complementoId" TEXT,
    "features" JSONB,
    "ultimaConsulta" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeywordCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebStory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tema" TEXT NOT NULL,
    "poster" TEXT,
    "frames" JSONB NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'DRAFT',
    "publicadoEm" TIMESTAMP(3),
    "views" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebStory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobLog" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "resultado" JSONB,
    "custo" DOUBLE PRECISION,
    "duracao" INTEGER,
    "erro" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkImport" (
    "id" TEXT NOT NULL,
    "arquivo" TEXT NOT NULL,
    "totalLinhas" INTEGER NOT NULL,
    "processadas" INTEGER NOT NULL DEFAULT 0,
    "sucessos" INTEGER NOT NULL DEFAULT 0,
    "falhas" INTEGER NOT NULL DEFAULT 0,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "errosLog" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "iniciadoEm" TIMESTAMP(3),
    "finalizadoEm" TIMESTAMP(3),

    CONSTRAINT "BulkImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Redirect" (
    "id" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 301,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Redirect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evento" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "mensagemId" TEXT,
    "meta" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoLogin" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Nicho_slug_key" ON "Nicho"("slug");

-- CreateIndex
CREATE INDEX "Cluster_tipo_idx" ON "Cluster"("tipo");

-- CreateIndex
CREATE INDEX "Cluster_volumeMensal_idx" ON "Cluster"("volumeMensal");

-- CreateIndex
CREATE UNIQUE INDEX "Cluster_nichoId_slug_key" ON "Cluster"("nichoId", "slug");

-- CreateIndex
CREATE INDEX "Complemento_volumeMensal_idx" ON "Complemento"("volumeMensal");

-- CreateIndex
CREATE UNIQUE INDEX "Complemento_clusterId_slug_key" ON "Complemento"("clusterId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Mensagem_slug_key" ON "Mensagem"("slug");

-- CreateIndex
CREATE INDEX "Mensagem_status_publicadoEm_idx" ON "Mensagem"("status", "publicadoEm");

-- CreateIndex
CREATE INDEX "Mensagem_clusterId_status_idx" ON "Mensagem"("clusterId", "status");

-- CreateIndex
CREATE INDEX "Mensagem_complementoId_status_idx" ON "Mensagem"("complementoId", "status");

-- CreateIndex
CREATE INDEX "Mensagem_autorId_idx" ON "Mensagem"("autorId");

-- CreateIndex
CREATE INDEX "Mensagem_personaId_idx" ON "Mensagem"("personaId");

-- CreateIndex
CREATE UNIQUE INDEX "Author_slug_key" ON "Author"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Persona_slug_key" ON "Persona"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Persona_autorId_key" ON "Persona"("autorId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "KeywordCluster_termo_key" ON "KeywordCluster"("termo");

-- CreateIndex
CREATE INDEX "KeywordCluster_volume_idx" ON "KeywordCluster"("volume");

-- CreateIndex
CREATE INDEX "KeywordCluster_clusterId_idx" ON "KeywordCluster"("clusterId");

-- CreateIndex
CREATE UNIQUE INDEX "WebStory_slug_key" ON "WebStory"("slug");

-- CreateIndex
CREATE INDEX "WebStory_status_publicadoEm_idx" ON "WebStory"("status", "publicadoEm");

-- CreateIndex
CREATE INDEX "JobLog_tipo_status_idx" ON "JobLog"("tipo", "status");

-- CreateIndex
CREATE INDEX "JobLog_criadoEm_idx" ON "JobLog"("criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "Redirect_origem_key" ON "Redirect"("origem");

-- CreateIndex
CREATE INDEX "Redirect_ativo_idx" ON "Redirect"("ativo");

-- CreateIndex
CREATE INDEX "Evento_tipo_criadoEm_idx" ON "Evento"("tipo", "criadoEm");

-- CreateIndex
CREATE INDEX "Evento_mensagemId_idx" ON "Evento"("mensagemId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- AddForeignKey
ALTER TABLE "Cluster" ADD CONSTRAINT "Cluster_nichoId_fkey" FOREIGN KEY ("nichoId") REFERENCES "Nicho"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complemento" ADD CONSTRAINT "Complemento_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "Cluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensagem" ADD CONSTRAINT "Mensagem_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "Cluster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensagem" ADD CONSTRAINT "Mensagem_complementoId_fkey" FOREIGN KEY ("complementoId") REFERENCES "Complemento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensagem" ADD CONSTRAINT "Mensagem_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Author"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensagem" ADD CONSTRAINT "Mensagem_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensagem" ADD CONSTRAINT "Mensagem_imagemHeroId_fkey" FOREIGN KEY ("imagemHeroId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensagem" ADD CONSTRAINT "Mensagem_imagemOgId_fkey" FOREIGN KEY ("imagemOgId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensagem" ADD CONSTRAINT "Mensagem_imagemPinId_fkey" FOREIGN KEY ("imagemPinId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Persona" ADD CONSTRAINT "Persona_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Author"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemTag" ADD CONSTRAINT "MensagemTag_mensagemId_fkey" FOREIGN KEY ("mensagemId") REFERENCES "Mensagem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemTag" ADD CONSTRAINT "MensagemTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
