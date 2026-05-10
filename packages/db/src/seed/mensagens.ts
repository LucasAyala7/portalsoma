/**
 * Seed manual de mensagens — 36 mensagens em 6 categorias top.
 * Escritas com voz autêntica das 8 personas, cuidadosamente variadas
 * pra evitar clichês do quality gate (sem "Hoje celebro", sem "Que Deus
 * te abençoe" como fórmula automática, etc).
 *
 * Distribuição: ~6 mensagens por categoria, persona variada.
 */

export interface MensagemSeed {
  slug: string;
  titulo: string;
  conteudo: string;
  resumo: string;
  clusterSlug: string;
  complementoSlug?: string;
  personaSlug: string;
  tier?: "TIER_1" | "TIER_2" | "TIER_3";
  destacada?: boolean;
}

export const MENSAGENS_SEED: MensagemSeed[] = [
  // ============================================================
  // /para-amiga/  — 6 mensagens variadas
  // ============================================================
  {
    slug: "amiga-do-meu-melhor-pedaco-feliz-aniversario",
    titulo: "Pra amiga que ouve quem eu sou no silêncio",
    conteudo: `Você é o tipo de amiga que entende quando eu rio alto demais e quando eu sumo demais.

Não tem como medir isso. Tem como agradecer.

Hoje é o seu dia, e o que eu mais quero é que ele venha cheio dessas pequenas coisas que te fazem feliz — café morno, mensagem boa, abraço apertado, alguém que escuta sem julgar.

Que esse novo ano traga mais leveza, mais tempo pra você, mais histórias boas pra gente contar depois.

Feliz aniversário, amiga. Eu te amo do meu jeito esquisito.`,
    resumo: "Mensagem emocionante para aquela amiga que entende seus silêncios e te conhece de verdade.",
    clusterSlug: "para-amiga",
    personaSlug: "julia-poeta",
    tier: "TIER_1",
    destacada: true,
  },
  {
    slug: "amiga-mais-um-ano-juntas-na-aventura",
    titulo: "Mais um ano juntas nessa aventura, amiga",
    conteudo: `Olha só, mais um ano da sua vida e da nossa amizade. Acho engraçado pensar em quanta coisa a gente já passou — risada boba, choro feio, decisão errada, decisão certa. E aqui estamos, lado a lado.

Que esse novo ano te traga muita coragem pra continuar sendo essa pessoa que faz o mundo girar mais bonito ao seu redor.

Vou estar aqui, do mesmo jeito de sempre. Comemorando, brigando, rindo, ouvindo. Parabéns! 🎉`,
    resumo: "Mensagem para celebrar a história de uma amizade duradoura, com leveza e verdade.",
    clusterSlug: "para-amiga",
    personaSlug: "marcos-pai",
    tier: "TIER_1",
  },
  {
    slug: "amiga-uma-benção-na-minha-vida",
    titulo: "Uma bênção na minha vida, minha amiga",
    conteudo: `Minha querida, neste seu dia eu paro e penso em como Deus foi bom comigo quando colocou você no meu caminho.

Você é dessas pessoas raras que aparecem na vida da gente sem fazer alarde, mas marcam a alma profundamente. Sua amizade é um presente que eu agradeço todo dia.

Que Cristo continue guardando seu coração, seus passos, seus sonhos. Que esse novo ciclo seja regado de paz, de saúde, de provisão e de muita alegria.

Te amo, amiga. Conte sempre comigo nas orações.`,
    resumo: "Mensagem evangélica para amiga, com gratidão pela amizade e bênçãos para o novo ano.",
    clusterSlug: "para-amiga",
    personaSlug: "vo-lurdes",
    tier: "TIER_2",
  },
  {
    slug: "amiga-do-axe-da-festa-da-vida",
    titulo: "Do meu axé pra sua festa, minha linda!",
    conteudo: `Minha linda, hoje é o seu dia e eu faço questão de mandar todo o axé bom dessa Bahia pra te abraçar.

Você merece tudo de melhor — vida cheia de cor, casa cheia de gente boa, mesa cheia de comida quente, coração cheio de gratidão.

Que esse novo ano venha com música nas janelas, sol na pele e amor por todos os cantos. ✨

Beijo na sua testa, minha amiga querida. Felicidades!`,
    resumo: "Mensagem calorosa baiana para uma amiga, cheia de axé, alegria e bênçãos.",
    clusterSlug: "para-amiga",
    personaSlug: "tia-fatima",
    tier: "TIER_2",
  },
  {
    slug: "amiga-novo-ciclo-novos-comeco",
    titulo: "Mais um ciclo se abre — e olha quanto você cresceu",
    conteudo: `Amiga, parar e olhar pra trás às vezes assusta — quanto você já conquistou, quanta coisa você já superou.

Esse novo ano que se inicia não é só mais uma vela no bolo. É terreno novo pra você plantar o que ainda não plantou, sonhar o que ainda não sonhou.

Você tem dentro de você tudo que precisa pra fazer dele o melhor de todos. Continue acreditando. Continue caminhando.

Tô aqui torcendo, vibrando, comemorando. Parabéns! 🚀`,
    resumo: "Mensagem motivacional para amiga, celebrando crescimento e novos começos.",
    clusterSlug: "para-amiga",
    personaSlug: "coach-rafael",
    tier: "TIER_2",
  },
  {
    slug: "amiga-elegante-palavras-de-uma-vida",
    titulo: "Algumas palavras de uma vida que te cabe",
    conteudo: `Querida amiga,

Há quem diga que a amizade é o vinho que o tempo aprimora — e neste seu aniversário eu confirmo: a nossa amadureceu bonito.

Você atravessou outro ciclo de existência com aquela elegância silenciosa que poucos conseguem manter. Não é sobre os anos que passaram, mas sobre a profundidade que você ganhou em cada um deles.

Que este novo capítulo te encontre em paz, com saúde plena e com a certeza serena de quem sabe quem é.

Com carinho de sempre,`,
    resumo: "Mensagem elegante e formal para uma amiga querida, com tom literário e profundo.",
    clusterSlug: "para-amiga",
    personaSlug: "profa-beatriz",
    tier: "TIER_3",
  },

  // ============================================================
  // /para-amiga/especial/  — 6 mensagens
  // ============================================================
  {
    slug: "amiga-especial-aquela-que-eu-escolheria-mil-vezes",
    titulo: "Você é a amiga que eu escolheria mil vezes",
    conteudo: `Existem amigas. E existem amigas como você — daquelas que a vida coloca no caminho e a gente pensa: "que sorte a minha".

Você é especial não pelas grandes coisas, mas pelas pequenas. Pela mensagem que chega antes da gente pedir. Pelo silêncio que entende. Pela risada que cura.

Hoje, no seu dia, eu quero que você saiba que você é importante demais. Que faz diferença. Que é amada.

Feliz aniversário pra você que é meu lugar seguro. ❤️`,
    resumo: "Mensagem profunda para a amiga especial que faz toda a diferença na sua vida.",
    clusterSlug: "para-amiga",
    complementoSlug: "especial",
    personaSlug: "julia-poeta",
    tier: "TIER_1",
    destacada: true,
  },
  {
    slug: "amiga-especial-irma-que-a-vida-me-deu",
    titulo: "Irmã que a vida me deu, parabéns",
    conteudo: `Se a gente pudesse escolher a família, eu te escolhia de novo. E de novo. E de novo.

Você não nasceu da minha mãe, mas é minha irmã do mesmo jeito. A irmã que a vida foi sábia em colocar no meu caminho.

Hoje é o seu aniversário, mas quem ganha presente sou eu — por ter você ao meu lado mais um ano.

Que tudo de mais bonito venha em dose dupla pra você. Você merece o mundo, amiga.`,
    resumo: "Mensagem para amiga especial que se tornou irmã de coração — parabéns emocionante.",
    clusterSlug: "para-amiga",
    complementoSlug: "especial",
    personaSlug: "marcos-pai",
    tier: "TIER_1",
  },
  {
    slug: "amiga-especial-presente-de-deus-na-vida",
    titulo: "Presente de Deus na minha vida",
    conteudo: `Minha amiga especial,

Quando paro pra refletir sobre as coisas boas que recebi nesta vida, sua amizade aparece logo entre as primeiras. Foi mesmo presente do Pai a sua chegada.

Hoje, neste dia tão importante, oro pedindo a Deus que renove suas forças, que cure o que precisa ser curado, que abra portas, que sustente em paz.

Você é amada — por mim e pelo Senhor. Tenha um aniversário cheio de luz.`,
    resumo: "Mensagem evangélica emocionante para amiga especial, com gratidão e oração de bênção.",
    clusterSlug: "para-amiga",
    complementoSlug: "especial",
    personaSlug: "vo-lurdes",
    tier: "TIER_2",
  },
  {
    slug: "amiga-especial-axe-luz-festa-bahia",
    titulo: "Pra sua festa, minha amiga especial",
    conteudo: `Minha linda, minha amiga especial!

Você é dessas pessoas que iluminam o ambiente quando entram. Tem energia boa demais, sorriso largo, abraço quentinho. A gente se sente em casa do seu lado.

Hoje é dia de festa, dia de celebrar você. Que tenha muita música, muita comida boa, muita gente querida ao redor.

Te desejo um ano cheio de coisa boa pra contar. Beijos, minha flor! ✨`,
    resumo: "Mensagem festiva e calorosa baiana para amiga especial.",
    clusterSlug: "para-amiga",
    complementoSlug: "especial",
    personaSlug: "tia-fatima",
    tier: "TIER_2",
  },
  {
    slug: "amiga-especial-novo-capitulo-melhor-versao",
    titulo: "Novo capítulo, melhor versão de você",
    conteudo: `Amiga especial,

Eu acompanho sua jornada faz tempo. Vi você decidir, errar, recomeçar, conquistar. Vi a versão de você que você mesma duvidava existir aparecer aos poucos. E é linda.

Hoje começa mais um capítulo. Você está mais preparada que nunca pra escrever ele do jeito que você quer.

Confia no seu processo. Continua firme. O melhor ainda tá por vir. Parabéns! 🚀`,
    resumo: "Mensagem motivacional para amiga especial, celebrando crescimento e potencial.",
    clusterSlug: "para-amiga",
    complementoSlug: "especial",
    personaSlug: "coach-rafael",
    tier: "TIER_3",
  },
  {
    slug: "amiga-especial-vinho-amizade-aprimora",
    titulo: "A amizade que o tempo aprimorou",
    conteudo: `Drummond escreveu que ter amigos é a única possibilidade que temos de ser felizes apesar de tudo. E neste seu aniversário, eu releio essa frase e penso em você.

Nossa amizade tem aquela qualidade rara das coisas que o tempo só faz melhorar. E você, no seu novo ano de vida, segue sendo essa figura especial e única na minha história.

Desejo que este ciclo te encontre em plenitude — saúde, propósito, amor próprio. Você merece tudo isto e mais.

Com afeto sincero,`,
    resumo: "Mensagem literária e elegante para amiga especial, citando Drummond.",
    clusterSlug: "para-amiga",
    complementoSlug: "especial",
    personaSlug: "profa-beatriz",
    tier: "TIER_3",
  },

  // ============================================================
  // /para-mae/  — 6 mensagens
  // ============================================================
  {
    slug: "mae-suas-maos-ensinaram-quase-tudo",
    titulo: "Suas mãos me ensinaram quase tudo, mãe",
    conteudo: `Mãe, hoje eu olho pras minhas mãos e vejo as suas. Foi com elas que aprendi a abraçar, a fazer o pão, a cuidar de quem precisa.

Você não me ensinou só com palavras. Me ensinou principalmente com o que fez calado, no dia a dia, quando achava que ninguém estava olhando — mas eu estava.

Neste seu aniversário, queria te dizer obrigado por tudo. Pelo que você nem se lembra mais. Pelo que você nem sabe que fez.

Eu te amo demais. Feliz aniversário.`,
    resumo: "Mensagem emocionante para mãe — gratidão pelos ensinamentos silenciosos do dia a dia.",
    clusterSlug: "para-mae",
    personaSlug: "julia-poeta",
    tier: "TIER_1",
    destacada: true,
  },
  {
    slug: "mae-mais-um-ano-da-mulher-mais-incrivel",
    titulo: "Mais um ano da mulher mais incrível que conheço",
    conteudo: `Mãe, tô aqui parando pra pensar em você no seu dia.

Você é a pessoa mais forte que eu conheço. Aguentou o que tinha que aguentar, riu quando podia rir, cuidou de todo mundo — e ainda tem energia pra cuidar de mais.

Que esse novo ano traga descanso, traga alegria, traga aquele tempo só pra você que você nunca tira. Você merece muito.

Te amo, mãe. Parabéns! ❤️`,
    resumo: "Mensagem moderna e direta para mãe forte, com gratidão pela jornada dela.",
    clusterSlug: "para-mae",
    personaSlug: "marcos-pai",
    tier: "TIER_1",
  },
  {
    slug: "mae-rainha-da-nossa-casa-tia-fatima",
    titulo: "Rainha da nossa casa, parabéns!",
    conteudo: `Minha rainha, minha mãe!

Hoje é seu dia e a casa toda tá em festa pra te celebrar. Você é o coração que faz nossa família bater.

Mesa cheia, risada alta, comida boa, criança no colo, todos em volta — é você que faz tudo isso acontecer. E faz com tanto amor que ninguém percebe o trabalho.

Te desejo um ano de muita saúde, muita paz, muita alegria. Porque você merece tudo isso vezes mil.

Beijo grande no seu rosto bonito. ✨`,
    resumo: "Mensagem calorosa e festiva para mãe — a rainha que mantém a casa unida.",
    clusterSlug: "para-mae",
    personaSlug: "tia-fatima",
    tier: "TIER_1",
  },
  {
    slug: "mae-elegancia-sabia-mulher",
    titulo: "Sobre a mulher que aprendi a admirar",
    conteudo: `Mãe,

Há um tipo específico de elegância que vem do tempo, da sabedoria e da experiência vivida com inteireza. Esta é a sua elegância — natural, discreta, profunda.

Neste novo ano de vida, desejo que você continue desfrutando das coisas que ama, cercada das pessoas que ama, sendo essa figura admirável que sempre foi.

A mulher que você se tornou é também a mulher que você me ensinou a tentar ser. Obrigada por isso, por tudo.

Com amor profundo,`,
    resumo: "Mensagem elegante e literária para mãe, com admiração e gratidão.",
    clusterSlug: "para-mae",
    personaSlug: "profa-beatriz",
    tier: "TIER_2",
  },
  {
    slug: "mae-casa-cheia-amor-segue-firme",
    titulo: "A casa cheia de amor que você fez",
    conteudo: `Mãe querida,

Esses dias eu olhei pra essa nossa casa e percebi: tudo de bom que tem aqui dentro foi você que construiu. Tijolo por tijolo, mesmo nos dias difíceis.

Você ensinou a gente a se cuidar, a respeitar, a sonhar. E principalmente a amar uns aos outros.

No seu aniversário, oro pedindo a Deus que retribua dobrado tudo que você fez por nós. Que te dê saúde, paz, e muitos anos pra continuar sendo nossa rocha.

Eu te amo, mãe. De todo o coração.`,
    resumo: "Mensagem cristã para mãe, gratidão pela casa de amor que ela construiu.",
    clusterSlug: "para-mae",
    personaSlug: "vo-lurdes",
    tier: "TIER_2",
  },
  {
    slug: "mae-colo-volta-sempre-mesmo-adulta",
    titulo: "Pra onde eu sempre volto, é o seu colo",
    conteudo: `Mãe, mesmo já adulto, mesmo levando minha vida, mesmo tendo minha própria família — quando o mundo aperta, é pro seu colo que eu sempre volto. Mesmo que só na lembrança.

Você é meu chão. É o lugar onde eu sou eu sem vergonha, sem máscara, sem cansaço.

Hoje, no seu dia, queria que você soubesse que isso nunca vai mudar. Você vai sempre ser meu porto.

Tudo de melhor pra você, mãe. Te amo demais.`,
    resumo: "Mensagem emocionante para mãe sobre ser o porto seguro do filho adulto.",
    clusterSlug: "para-mae",
    personaSlug: "marcos-pai",
    tier: "TIER_3",
  },

  // ============================================================
  // /para-mae/evangelica/  — 6 mensagens
  // ============================================================
  {
    slug: "mae-evangelica-mulher-virtuosa-provérbios",
    titulo: "Mulher virtuosa, quem a achará? — Pv 31:10",
    conteudo: `Mãe amada,

Provérbios 31 fala daquela mulher cujo valor excede o de finas joias. E eu posso testemunhar: essa mulher é você.

Você foi minha primeira escola de fé. Foi nos seus joelhos dobrados que aprendi a orar. Foi vendo você confiar nos momentos difíceis que entendi o que é fé.

Neste seu aniversário, peço ao Senhor que renove suas forças como as da águia, que te dê dias de sol e dias de chuva mansa, que te conserve com saúde até a velhice mais bonita.

Você é bênção na minha vida. Eu te amo, mãe.`,
    resumo: "Mensagem evangélica para mãe com versículo de Provérbios 31, exaltando sua fé.",
    clusterSlug: "para-mae",
    complementoSlug: "evangelica",
    personaSlug: "pastor-antonio",
    tier: "TIER_1",
    destacada: true,
  },
  {
    slug: "mae-evangelica-oraçoes-foram-meu-alicerce",
    titulo: "Suas orações foram meu alicerce",
    conteudo: `Mãe,

Eu não sei quantas vezes você orou por mim que eu nunca soube. Mas hoje eu reconheço que cada coisa boa na minha vida tem digital das suas orações.

Você plantou no meu coração a semente do Evangelho. Regou com paciência, mesmo quando eu mesmo me afastei. E hoje eu colho do que você plantou.

Que Deus te recompense em tudo. Que sua casa seja farta, sua saúde seja firme, sua mesa seja cheia, seu coração seja em paz.

Feliz aniversário, mãezinha. Você é minha bênção.`,
    resumo: "Mensagem evangélica emocionante reconhecendo o legado das orações da mãe.",
    clusterSlug: "para-mae",
    complementoSlug: "evangelica",
    personaSlug: "vo-lurdes",
    tier: "TIER_1",
  },
  {
    slug: "mae-evangelica-tempo-tudo-eclesiastes",
    titulo: "Tudo tem o seu tempo — e o seu tempo é de festa",
    conteudo: `Mãe,

Eclesiastes nos lembra que há tempo de plantar e tempo de colher. Você plantou tanta coisa boa na nossa família — e o tempo que se inicia hoje é tempo de você colher.

Que o Senhor multiplique a colheita: paz no coração, alegria no rosto, saúde no corpo, propósito renovado no espírito.

Que o salmo 91 cubra seus dias com sua proteção. Que cada manhã traga uma misericórdia nova.

Eu te amo. Tenha um aniversário lindo, abençoado, cheio do Senhor.`,
    resumo: "Mensagem evangélica para mãe com Eclesiastes e Salmo 91 — tempo de colher.",
    clusterSlug: "para-mae",
    complementoSlug: "evangelica",
    personaSlug: "pastor-antonio",
    tier: "TIER_2",
  },
  {
    slug: "mae-evangelica-deus-te-fez-meu-refugio",
    titulo: "Deus te fez meu refúgio nesta terra",
    conteudo: `Mãe,

Antes mesmo de eu nascer, Deus já tinha planejado: você seria meu primeiro abraço, minha primeira casa, meu primeiro refúgio neste mundo.

E foi exatamente isso que você foi — e continua sendo. Refúgio. Lugar de descanso. Mesmo na vida adulta, é em você que eu encontro a paz que o mundo não dá.

Hoje, no seu dia, oro com gratidão por sua vida. Que o Senhor te conserve com vigor, com sabedoria e com aquela alegria mansa que sempre foi sua marca.

Eu te amo, mãe. Para sempre.`,
    resumo: "Mensagem evangélica para mãe — gratidão por ela ser refúgio desde sempre.",
    clusterSlug: "para-mae",
    complementoSlug: "evangelica",
    personaSlug: "vo-lurdes",
    tier: "TIER_2",
  },
  {
    slug: "mae-evangelica-versiculo-31-anos-seu-coracao",
    titulo: "O Senhor encheu seus dias de bondade",
    conteudo: `Minha mãe querida,

Cada vela que se acende hoje é também um sinal de fidelidade — a fidelidade do Deus que te sustentou por todos esses anos.

Você passou por tempestades, mas o Senhor te firmou. Passou por desertos, mas Ele te alimentou. Passou por alegrias, e Ele esteve junto rindo também.

Que neste novo ano você experimente, do tipo bem concreto, o "bondade e misericórdia me seguirão todos os dias da minha vida" do salmo 23.

Te amo, mãe.`,
    resumo: "Mensagem evangélica para mãe com Salmo 23 — celebrando a fidelidade de Deus na vida dela.",
    clusterSlug: "para-mae",
    complementoSlug: "evangelica",
    personaSlug: "pastor-antonio",
    tier: "TIER_3",
  },
  {
    slug: "mae-evangelica-curta-bencao-do-senhor",
    titulo: "A bênção do Senhor é sobre você, mãe",
    conteudo: `Mãezinha querida,

Que neste seu novo ano de vida o Senhor te abençoe e te guarde, faça resplandecer o rosto sobre você, e te dê paz.

Você é minha alegria. Você é minha referência. Você é meu amor de toda vida.

Feliz aniversário, mãe.`,
    resumo: "Mensagem evangélica curta para mãe com a bênção sacerdotal de Números 6.",
    clusterSlug: "para-mae",
    complementoSlug: "evangelica",
    personaSlug: "vo-lurdes",
    tier: "TIER_3",
  },

  // ============================================================
  // /no-whatsapp/  — 6 curtas pro canal
  // ============================================================
  {
    slug: "whatsapp-curta-feliz-niver-pessoa-incrivel",
    titulo: "Feliz niver, pessoa incrível!",
    conteudo: `Feliz aniversário, pessoa incrível! 🎂

Que o seu dia seja tão especial quanto você é pra todo mundo que te ama.

Aproveita cada minuto. Você merece. ❤️`,
    resumo: "Mensagem curta de feliz aniversário para WhatsApp, calorosa e direta.",
    clusterSlug: "no-whatsapp",
    personaSlug: "marcos-pai",
    tier: "TIER_2",
    destacada: true,
  },
  {
    slug: "whatsapp-mais-um-ano-mais-historias",
    titulo: "Mais um ano, mais histórias pra contar",
    conteudo: `Mais um ano de vida, mais histórias pra contar, mais alegrias pra celebrar.

Que esse novo ciclo seja leve, gostoso, cheio de coisa boa.

Parabéns! 🎉`,
    resumo: "Mensagem curta para WhatsApp celebrando mais um ano de histórias.",
    clusterSlug: "no-whatsapp",
    personaSlug: "marcos-pai",
    tier: "TIER_2",
  },
  {
    slug: "whatsapp-deus-abencoe-novo-ano-vida",
    titulo: "Deus te abençoe neste novo ano",
    conteudo: `Querido(a), neste seu dia oro pedindo ao Senhor que te conceda saúde, paz, alegria e propósito renovado.

Que cada dia deste novo ano seja uma testemunha viva do amor de Deus em sua vida.

Feliz aniversário! 🙏`,
    resumo: "Mensagem evangélica curta de aniversário para mandar no WhatsApp.",
    clusterSlug: "no-whatsapp",
    personaSlug: "pastor-antonio",
    tier: "TIER_3",
  },
  {
    slug: "whatsapp-axe-pra-você-minha-flor",
    titulo: "Todo o axé pra você, minha flor!",
    conteudo: `Minha flor, todo o axé bom desse universo pra você hoje! ✨

Que o seu dia seja regado de sol, de risadas, de pessoas amadas em volta.

Beijo enorme, parabéns!`,
    resumo: "Mensagem curta calorosa baiana de aniversário para WhatsApp.",
    clusterSlug: "no-whatsapp",
    personaSlug: "tia-fatima",
    tier: "TIER_3",
  },
  {
    slug: "whatsapp-quem-iluminou-meu-dia",
    titulo: "Você ilumina meu dia",
    conteudo: `Hoje é o dia de quem ilumina os meus dias.

Que sua vida seja cheia da mesma luz que você espalha por aí.

Feliz aniversário ❤️`,
    resumo: "Mensagem curta poética de aniversário para WhatsApp, sobre quem ilumina sua vida.",
    clusterSlug: "no-whatsapp",
    personaSlug: "julia-poeta",
    tier: "TIER_3",
  },
  {
    slug: "whatsapp-ano-decolagem-sonhos-grandes",
    titulo: "Ano de decolagem dos sonhos grandes 🚀",
    conteudo: `Que esse novo ano seja o ano de decolagem dos seus sonhos maiores.

Você tem tudo pra voar alto. Confia no processo, confia em você.

Parabéns!`,
    resumo: "Mensagem motivacional curta para WhatsApp — ano de novos sonhos.",
    clusterSlug: "no-whatsapp",
    personaSlug: "coach-rafael",
    tier: "TIER_3",
  },

  // ============================================================
  // /de-15-anos/  — 6 mensagens
  // ============================================================
  {
    slug: "15-anos-momento-onde-tudo-comeca",
    titulo: "15 anos — o momento onde tudo começa",
    conteudo: `Quinze anos.

A gente fala como se fosse só um número, mas você sabe que é mais do que isso. É o momento em que você começa a se descobrir de verdade. A escolher o que te faz feliz. A escrever o tipo de história que vai contar.

Quero que você saiba: tem tempo. Tem tempo pra ser quem você quiser ser, pra mudar de ideia mil vezes, pra errar bonito, pra acertar do seu jeito.

Hoje, neste dia tão especial, te desejo o que de mais importante existe: que você seja livre pra ser você.

Parabéns. Que seja só o começo. ✨`,
    resumo: "Mensagem poética para os 15 anos — sobre liberdade de ser quem se é.",
    clusterSlug: "de-15-anos",
    personaSlug: "julia-poeta",
    tier: "TIER_1",
    destacada: true,
  },
  {
    slug: "15-anos-princesinha-festa-tia-fatima",
    titulo: "Minha princesinha de 15 anos!",
    conteudo: `Olha minha menina, hoje tá um arraso!

Quinze anos é uma data que merece ser celebrada com tudo. Vestido bonito, foto pra guardar pra sempre, abraço de quem te ama, festa daquelas.

Você cresceu tanto, minha flor. E vai crescer ainda mais, ainda mais bonita por dentro e por fora.

Te desejo um ano cheio de descobertas legais, amizades verdadeiras e muita confiança em você. Beijo grande! ✨`,
    resumo: "Mensagem festiva e calorosa para a princesa de 15 anos.",
    clusterSlug: "de-15-anos",
    personaSlug: "tia-fatima",
    tier: "TIER_1",
  },
  {
    slug: "15-anos-rito-passagem-elegancia",
    titulo: "O rito de passagem que merece celebração",
    conteudo: `Aos seus quinze anos,

Há culturas que celebram esta idade como o início simbólico da maturidade. E há razão para isto: aos quinze, começamos a tomar decisões que moldam quem nos tornamos.

Que você atravesse este novo ciclo com curiosidade aberta para o mundo, com afeto pelos seus, com leveza para errar, com inteligência para escolher.

A vida adulta tem suas belezas próprias — e você tem todo direito a descobri-las no seu tempo.

Parabéns por estes quinze anos.`,
    resumo: "Mensagem elegante e reflexiva para os 15 anos como rito de passagem.",
    clusterSlug: "de-15-anos",
    personaSlug: "profa-beatriz",
    tier: "TIER_2",
  },
  {
    slug: "15-anos-evangelica-jovem-lembre-criador",
    titulo: "Lembra-te do teu Criador nos dias da tua mocidade",
    conteudo: `Minha querida,

O livro de Eclesiastes diz: "Lembra-te do teu Criador nos dias da tua mocidade". E hoje, aos quinze, você inicia oficialmente esses anos lindos.

Que você os atravesse caminhando com Deus. Não que tudo seja fácil — não vai ser. Mas com Cristo no centro, você terá raiz pra não cair quando os ventos vierem.

Sonhe grande, ame de verdade, decida com sabedoria. E saiba: o Senhor está ao seu lado em cada passo.

Feliz aniversário, querida. Deus te abençoe neste novo tempo. 🙏`,
    resumo: "Mensagem evangélica para os 15 anos com versículo de Eclesiastes.",
    clusterSlug: "de-15-anos",
    personaSlug: "pastor-antonio",
    tier: "TIER_2",
  },
  {
    slug: "15-anos-coach-rafael-decolagem-vida",
    titulo: "15 anos: a primeira pista de decolagem",
    conteudo: `Quinze anos é a primeira pista de decolagem da sua vida.

Você ainda não decolou completamente, e tudo bem. Você está aprendendo a sentir o motor, a entender o vento, a confiar nos próprios instrumentos.

O que eu te desejo neste novo ano: coragem pra fazer testes, paciência com seus erros, e pessoas boas ao seu redor enquanto você ganha altura.

A vida que você quer começa nessas escolhas pequenas que você vai fazer agora. Boa decolagem! 🚀`,
    resumo: "Mensagem motivacional para os 15 anos — primeira pista de decolagem da vida.",
    clusterSlug: "de-15-anos",
    personaSlug: "coach-rafael",
    tier: "TIER_3",
  },
  {
    slug: "15-anos-descolada-marcos-pai-jovem",
    titulo: "Quinze anos é só o começo, viu?",
    conteudo: `15 anos!

Eu sei que parece um marcão da vida, mas vou te contar um segredo: é só o começo mesmo. Tipo, sério.

Aproveita essa idade. Faz coisa boba, ri alto, ouve música alta, sonha com tudo, escreve no diário, manda mensagem demorada pros amigos. Esses momentos a gente lembra pra sempre.

E não tenta ser adulto rápido demais. Tem tempo. Curte agora.

Parabéns demais! 🎉`,
    resumo: "Mensagem moderna e descolada para os 15 anos — curta o momento sem pressa.",
    clusterSlug: "de-15-anos",
    personaSlug: "marcos-pai",
    tier: "TIER_3",
  },
];
