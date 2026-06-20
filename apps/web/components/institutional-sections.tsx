import { Sparkles, Heart, Send, Quote, Mail, ShieldCheck } from "lucide-react";

/**
 * Bloco "Como funciona" · 3 steps em grid 3 col.
 */
export function HowItWorks() {
  const steps = [
    {
      icon: Heart,
      title: "Encontre a mensagem",
      desc: "Navegue por categoria, autor ou tom. Use a busca pra refinar.",
    },
    {
      icon: Sparkles,
      title: "Copie em 1 clique",
      desc: "Botão Copiar deixa a mensagem pronta na área de transferência.",
    },
    {
      icon: Send,
      title: "Compartilhe",
      desc: "Cole no WhatsApp, Telegram ou e-mail. Emocione quem você ama.",
    },
  ];
  return (
    <section className="container-niver py-16">
      <div className="text-center mb-12">
        <h2 className="font-display text-3xl sm:text-4xl text-stone-900 mb-3">
          Como funciona
        </h2>
        <p className="text-stone-600 max-w-xl mx-auto">
          Em 3 passos você manda a mensagem certa pra quem importa.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="text-center px-4">
              <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-niver-100 to-niver-50 mb-4">
                <Icon size={28} className="text-niver-700" strokeWidth={2.2} />
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-niver-600 text-white text-xs font-bold grid place-items-center font-display">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-display text-xl font-semibold text-stone-900 mb-2">
                {s.title}
              </h3>
              <p className="text-stone-600 leading-relaxed">{s.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Bloco "Sobre" · texto + counter selo.
 */
export function AboutBlock({ totalMensagens }: { totalMensagens: number }) {
  return (
    <section className="container-niver py-16">
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <span className="badge-trending mb-4 inline-flex">
            <Heart size={12} />
            Sobre o Portal Soma
          </span>
          <h2 className="font-display text-3xl sm:text-4xl text-stone-900 leading-tight mb-5">
            Mensagens que viram lembrança
          </h2>
          <div className="space-y-4 text-stone-700 leading-relaxed">
            <p>
              O Portal Soma nasceu de uma ideia simples: toda pessoa merece receber uma
              mensagem de aniversário que toque o coração · não uma fórmula pronta, não um
              clichê de internet.
            </p>
            <p>
              Aqui cada mensagem é escrita com cuidado pelos nossos autores. São vozes
              diferentes, idades diferentes, jeitos diferentes · pra você sempre encontrar a
              que combina com a pessoa, a ocasião e o sentimento.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/sobre/" className="btn-primary">
              Sobre nós
            </a>
            <a href="/contato/" className="btn-secondary">
              Fale com a gente
            </a>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={Heart}
            value={totalMensagens.toLocaleString("pt-BR")}
            label="mensagens originais"
            highlight
          />
          <StatCard icon={Sparkles} value="8" label="autores e personas" />
          <StatCard icon={ShieldCheck} value="100%" label="revisão editorial" />
          <StatCard icon={Send} value="1 clique" label="pra compartilhar" />
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  highlight,
}: {
  icon: typeof Heart;
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 border ${
        highlight
          ? "bg-niver-600 text-white border-niver-600 shadow-lg shadow-niver-600/20"
          : "bg-white border-stone-100"
      }`}
    >
      <Icon
        size={20}
        className={`mb-3 ${highlight ? "text-niver-100" : "text-niver-500"}`}
        strokeWidth={2.2}
      />
      <div
        className={`font-display text-2xl font-semibold tabular-nums ${
          highlight ? "text-white" : "text-stone-900"
        }`}
      >
        {value}
      </div>
      <div className={`text-xs uppercase tracking-wider mt-1 ${highlight ? "text-niver-100" : "text-stone-500"}`}>
        {label}
      </div>
    </div>
  );
}

/**
 * Depoimentos curtos · bloco de 3 quotes.
 */
export function TestimonialsBlock() {
  const testimonials = [
    {
      texto: "Nunca consegui escrever bonito pra minha mãe. Aqui achei a mensagem que eu queria dizer há anos.",
      autor: "Camila R.",
      contexto: "São Paulo",
    },
    {
      texto: "Mando direto do botão copiar. Minha família acha que eu fiquei poeta da noite pro dia.",
      autor: "Roberto M.",
      contexto: "Belo Horizonte",
    },
    {
      texto: "As mensagens evangélicas são as mais bem escritas que já vi na internet. Compartilho toda semana.",
      autor: "Pastora Cristina",
      contexto: "Recife",
    },
  ];
  return (
    <section className="bg-gradient-to-b from-warm-100 to-warm-50 py-16">
      <div className="container-niver">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl text-stone-900 mb-3">
            Quem já usou conta
          </h2>
          <p className="text-stone-600">Histórias de quem emocionou alguém com a gente.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm relative"
            >
              <Quote size={24} className="text-niver-300 absolute top-4 right-4" />
              <p className="text-stone-700 leading-relaxed mb-4 italic">"{t.texto}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
                <div className="w-10 h-10 rounded-full bg-niver-100 grid place-items-center text-niver-700 font-display font-semibold">
                  {t.autor[0]}
                </div>
                <div>
                  <div className="font-medium text-sm text-stone-900">{t.autor}</div>
                  <div className="text-xs text-stone-500">{t.contexto}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Newsletter signup · bloco com gradient niver.
 */
export function NewsletterBlock() {
  return (
    <section className="container-niver py-16">
      <div className="relative bg-gradient-to-br from-niver-600 to-niver-700 rounded-3xl p-8 sm:p-12 overflow-hidden">
        <div className="absolute -top-12 -right-12 text-[200px] opacity-10">🎂</div>
        <div className="relative max-w-2xl">
          <Mail size={32} className="text-niver-100 mb-4" strokeWidth={2.2} />
          <h2 className="font-display text-3xl sm:text-4xl text-white leading-tight mb-3">
            Receba mensagens novas no seu email
          </h2>
          <p className="text-niver-100 mb-6 leading-relaxed">
            Toda semana, uma seleção das mensagens mais bonitas pra você ter sempre uma
            pronta na manga. Sem spam, sem barulho · só carinho.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md">
            <input
              type="email"
              required
              placeholder="seu@email.com"
              className="flex-1 px-4 py-3 rounded-full bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-white/40"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-full bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors active:scale-95"
            >
              Quero receber
            </button>
          </form>
          <p className="text-xs text-niver-200 mt-3">
            Você pode cancelar quando quiser. Sem letra miúda.
          </p>
        </div>
      </div>
    </section>
  );
}
