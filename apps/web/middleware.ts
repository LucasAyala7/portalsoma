import { NextResponse, type NextRequest } from "next/server";
import { lookupRedirect } from "./app/redirects-data";

/**
 * Middleware que checa redirects 301/410 das URLs antigas do WP.
 * Runtime: nodejs (precisa de Prisma).
 *
 * Roda ANTES do roteamento Next:
 *  - Se URL bate em um Redirect ativo no DB:
 *    - status 301 → NextResponse.redirect(destino, 301)
 *    - status 410 → NextResponse pronta com status 410 + body simples
 *  - Senão: deixa passar pro Next normal
 */
export const config = {
  // ignora estáticos e API
  matcher: [
    "/((?!_next/|api/|favicon|robots\\.txt|sitemap\\.xml|sitemap-clusters\\.xml|sitemap-autores\\.xml|sitemap-web-stories\\.xml|sitemap-mensagens-|sitemap-mensagens/|m/).*)",
  ],
};

export const runtime = "nodejs";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Redirect raiz → www (301): canonical é www.portalsoma.com.br
  const host = req.headers.get("host") ?? "";
  if (host === "portalsoma.com.br") {
    const url = new URL(req.url);
    url.host = "www.portalsoma.com.br";
    return NextResponse.redirect(url, 301);
  }

  // Só interesssa em URLs do nicho legado
  if (!path.startsWith("/mensagem-de-aniversario/")) {
    return NextResponse.next();
  }

  // Normaliza com trailing slash
  const normalized = path.endsWith("/") ? path : `${path}/`;

  const redirect = await lookupRedirect(normalized);
  if (!redirect) {
    return NextResponse.next();
  }

  if (redirect.status === 301 && redirect.destino) {
    const url = new URL(redirect.destino, req.url);
    return NextResponse.redirect(url, 301);
  }

  if (redirect.status === 410) {
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Página removida — Portal Soma</title>
  <style>body{font-family:system-ui;text-align:center;padding:60px 20px;max-width:500px;margin:0 auto;color:#44403c}h1{color:#c2410c;margin-bottom:8px}a{color:#ea580c;text-decoration:none;font-weight:600}</style>
</head>
<body>
  <h1>Página removida</h1>
  <p>Essa mensagem não está mais disponível neste endereço.</p>
  <p style="margin-top:30px"><a href="/">← Voltar para o início</a></p>
</body>
</html>`,
      {
        status: 410,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  }

  return NextResponse.next();
}
