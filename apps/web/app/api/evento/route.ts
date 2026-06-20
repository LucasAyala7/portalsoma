import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@nivertotal/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EventoSchema = z.object({
  tipo: z.enum(["copy", "share", "like", "unlike", "view", "search"]),
  mensagemId: z.string().min(1).optional(),
  meta: z.record(z.unknown()).optional(),
});

/**
 * Recebe eventos via sendBeacon do cliente.
 * - Persiste em Evento (telemetria histórica completa)
 * - Incrementa atomicamente o contador agregado em Mensagem
 *
 * Sem auth: rate-limit acontece no nginx/Cloudflare antes de chegar aqui em prod.
 * IP é gravado pra detectar abuse em análise posterior.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, erro: "json inválido" }, { status: 400 });
  }

  const parsed = EventoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, erro: parsed.error.errors[0]?.message }, { status: 400 });
  }
  const { tipo, mensagemId, meta } = parsed.data;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = req.headers.get("user-agent")?.slice(0, 200) ?? null;

  try {
    // grava evento histórico
    await prisma.evento.create({
      data: {
        tipo,
        mensagemId: mensagemId ?? null,
        meta: meta as object | undefined,
        ip,
        userAgent,
      },
    });

    // incrementa contador agregado (atômico)
    if (mensagemId) {
      const updates: Record<string, { increment: number }> = {};
      if (tipo === "copy") updates.copies = { increment: 1 };
      else if (tipo === "share") updates.shares = { increment: 1 };
      else if (tipo === "like") updates.likes = { increment: 1 };
      else if (tipo === "unlike") updates.likes = { increment: -1 };
      else if (tipo === "view") updates.visualizacoes = { increment: 1 };

      if (Object.keys(updates).length > 0) {
        await prisma.mensagem.update({
          where: { id: mensagemId },
          data: updates,
        }).catch(() => {
          // mensagem pode não existir mais · silencioso
        });
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("[api/evento] erro:", e);
    return NextResponse.json({ ok: false, erro: "interno" }, { status: 500 });
  }
}
