import type { Metadata } from "next";
import { prisma } from "@nivertotal/db";
import { jsonLdScript, breadcrumbSchema } from "@/lib/seo";
import { Users, CheckCircle2, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Nossa Equipe — Autores e editores do Portal Soma",
  description:
    "Conheça os autores e editores por trás do Portal Soma. Vozes reais e personagens autorais que escrevem mensagens de aniversário com cuidado editorial.",
  alternates: { canonical: "/equipe/" },
  openGraph: {
    title: "Nossa Equipe — Portal Soma",
    description: "Os autores e editores que escrevem mensagens no Portal Soma.",
    url: "/equipe/",
    type: "website",
  },
};

export const revalidate = 300;

export default async function EquipePage() {
  const autores = await prisma.author.findMany({
    where: { ativo: true },
    orderBy: [{ real: "desc" }, { ordem: "asc" }, { nome: "asc" }],
    select: {
      slug: true,
      nome: true,
      bio: true,
      fotoUrl: true,
      real: true,
    },
  });

  const reais = autores.filter((a) => a.real);
  const virtuais = autores.filter((a) => !a.real);

  const teamSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "Equipe do Portal Soma",
    url: "https://www.portalsoma.com.br/equipe/",
    inLanguage: "pt-BR",
    about: autores.map((a) => ({
      "@type": "Person",
      name: a.nome,
      description: a.bio?.slice(0, 240),
      image: a.fotoUrl ?? undefined,
      url: `https://www.portalsoma.com.br/autor/${a.slug}/`,
    })),
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript([
          breadcrumbSchema([
            { name: "Início", url: "/" },
            { name: "Equipe", url: "/equipe/" },
          ]),
          teamSchema,
        ])}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-niver-50 via-warm-100 to-warm-50 py-16 sm:py-20">
        <div className="container-niver">
          <nav aria-label="Breadcrumb" className="text-xs text-stone-500 mb-6">
            <ol className="flex gap-2">
              <li><a href="/" className="hover:text-niver-700">Início</a></li>
              <li aria-hidden="true">/</li>
              <li className="text-stone-700">Equipe</li>
            </ol>
          </nav>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-niver-700 bg-niver-100 px-3 py-1 rounded-full mb-4">
            <Users size={12} /> Quem escreve
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-semibold text-niver-900 leading-tight">
            As pessoas e personagens que escrevem com a gente
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-stone-700 max-w-3xl leading-relaxed">
            O Portal Soma é editado por uma equipe pequena mas atenta. Cada mensagem do site tem um autor
            vinculado, e cada autor tem uma página própria onde você conhece sua voz, sua história e o
            tipo de mensagem que ele costuma escrever.
          </p>
        </div>
      </section>

      {/* Como funciona */}
      <section className="container-niver py-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="heading-section-bar mb-6">Como nossa redação funciona</h2>
          <p className="text-stone-700 leading-relaxed mb-4">
            Trabalhamos com dois tipos de autores: <strong>editores reais</strong>, que são pessoas de
            verdade com nome, foto e e-mail; e <strong>autores virtuais</strong>, que são personagens
            autorais criados pela nossa equipe — sempre identificados como tais — para dar variedade de
            voz ao acervo. Eles representam tipos de pessoas que escrevem mensagens de aniversário no dia
            a dia: a avó religiosa, o pastor da igreja, a tia engraçada, o irmão mais novo.
          </p>
          <p className="text-stone-700 leading-relaxed mb-4">
            Ao escrever como esses personagens, ampliamos o leque de estilos disponíveis no site sem
            perder a coerência editorial. Toda mensagem — seja escrita por humano ou assinada por
            personagem virtual — passa pela mesma régua: precisa ser correta no português, respeitosa,
            original e emocionalmente verdadeira pro contexto que se propõe.
          </p>
          <p className="text-stone-700 leading-relaxed">
            A distinção entre real e personagem é declarada na página de cada autor e abaixo. Não
            escondemos isso de ninguém — transparência editorial é parte do nosso compromisso com você.
          </p>
        </div>
      </section>

      {/* Editores Reais */}
      {reais.length > 0 && (
        <section className="container-niver py-10">
          <h2 className="heading-section-bar mb-2">
            Editores reais
          </h2>
          <p className="text-stone-600 mb-8 ml-5">
            Pessoas de verdade que assinam a curadoria do Portal Soma.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reais.map((a) => (
              <AutorCard key={a.slug} autor={a} real />
            ))}
          </div>
        </section>
      )}

      {/* Autores Virtuais */}
      {virtuais.length > 0 && (
        <section className="bg-warm-100 py-12">
          <div className="container-niver">
            <h2 className="heading-section-bar mb-2">Autores virtuais</h2>
            <p className="text-stone-600 mb-8 ml-5">
              Personagens autorais com vozes próprias, claramente identificados como tais.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {virtuais.map((a) => (
                <AutorCard key={a.slug} autor={a} real={false} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="container-niver py-14">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-niver-900 mb-4">
            Quer escrever com a gente?
          </h2>
          <p className="text-stone-700 leading-relaxed mb-6">
            Estamos sempre abertos a redatores brasileiros que tenham boa escrita, sensibilidade e
            interesse em colaborar com o nosso acervo. Se esse for o seu caso, escreva pra gente.
          </p>
          <a href="/contato/" className="btn-primary">Fale conosco</a>
        </div>
      </section>
    </article>
  );
}

function AutorCard({
  autor,
  real,
}: {
  autor: { slug: string; nome: string; bio: string; fotoUrl: string | null };
  real: boolean;
}) {
  return (
    <a
      href={`/autor/${autor.slug}/`}
      className="card-message p-5 flex flex-col group"
      itemScope
      itemType="https://schema.org/Person"
    >
      <div className="flex items-center gap-3 mb-3">
        {autor.fotoUrl ? (
          <img
            src={autor.fotoUrl}
            alt={autor.nome}
            className="w-14 h-14 rounded-full object-cover border-2 border-warm-200"
            itemProp="image"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-niver-200 grid place-items-center text-xl font-display text-niver-700">
            {autor.nome.slice(0, 1)}
          </div>
        )}
        <div>
          <h3 className="font-display text-lg font-semibold text-stone-900 group-hover:text-niver-700 transition" itemProp="name">
            {autor.nome}
          </h3>
          <span
            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
              real
                ? "bg-emerald-50 text-emerald-700"
                : "bg-violet-50 text-violet-700"
            }`}
            itemProp="jobTitle"
          >
            {real ? (
              <>
                <CheckCircle2 size={11} /> Editor real
              </>
            ) : (
              <>
                <Sparkles size={11} /> Personagem autoral
              </>
            )}
          </span>
        </div>
      </div>
      <p className="text-sm text-stone-600 leading-relaxed line-clamp-4" itemProp="description">
        {autor.bio}
      </p>
      <span className="text-xs text-niver-700 mt-3 group-hover:underline">
        Ver mensagens deste autor →
      </span>
    </a>
  );
}
