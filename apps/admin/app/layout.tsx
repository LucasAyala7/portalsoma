import "./globals.css";
import type { Metadata } from "next";
import { auth, signOut } from "../auth";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Portal Soma — Admin",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="pt-BR">
      <body>
        {session ? (
          <div className="flex min-h-screen">
            <Sidebar username={session.user?.name ?? "admin"} />
            <main className="flex-1 p-8 overflow-x-auto">{children}</main>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}

function Sidebar({ username }: { username: string }) {
  const items = [
    { href: "/", label: "Dashboard" },
    { href: "/revisar", label: "📋 Revisar (REVIEW)" },
    { href: "/mensagens", label: "Mensagens" },
    { href: "/mensagens/nova", label: "Nova mensagem" },
    { href: "/mensagens/bulk-import", label: "Bulk import" },
    { href: "/clusters", label: "Clusters" },
    { href: "/personas", label: "Personas" },
    { href: "/autores", label: "Autores" },
    { href: "/web-stories", label: "Web Stories" },
    { href: "/fila", label: "Fila (BullMQ)" },
    { href: "/redirects", label: "Redirects 301" },
  ];
  return (
    <aside className="w-60 bg-stone-900 text-stone-300 flex flex-col">
      <div className="p-5 border-b border-stone-800">
        <div className="font-semibold text-white">Portal Soma</div>
        <div className="text-xs text-stone-500">Admin</div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="block px-3 py-2 rounded-md text-sm hover:bg-stone-800 hover:text-white"
          >
            {it.label}
          </Link>
        ))}
      </nav>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
        className="p-4 border-t border-stone-800 text-xs"
      >
        <div className="text-stone-500 mb-2">{username}</div>
        <button type="submit" className="hover:text-white">
          Sair
        </button>
      </form>
    </aside>
  );
}
