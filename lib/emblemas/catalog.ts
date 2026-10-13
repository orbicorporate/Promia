import type { Feriado, Quando, TipoOferta } from "./tipos";

// Repositório de emblemas (logos de campanha) já prontos. Cada arquivo fica
// em public/emblemas/{slug}.png (até 960 px, fundo transparente) com a
// miniatura em public/emblemas/t/{slug}.webp. Os campos abaixo alimentam
// os filtros da galeria: tipo de oferta, tema do encarte, data e feriado.

// Variações técnicas do mesmo emblema. O arquivo da versão ilustrada é
// {slug}.png; as outras ficam em {slug}--{variante}.png.
export const VARIANTES = ["so-texto", "monocromatico", "horizontal"] as const;
export type Variante = (typeof VARIANTES)[number];
export const VARIANTE_LABEL: Record<Variante, string> = {
  "so-texto": "Só texto",
  monocromatico: "Uma cor",
  horizontal: "Horizontal",
};
export const VARIANTE_USO: Record<Variante, string> = {
  "so-texto": "Cabeçalho pequeno, story com pouca altura e quadrado",
  monocromatico: "Impressão em preto e branco ou na cor do mercado",
  horizontal: "Barra de topo do encarte e capa de WhatsApp",
};

export type Emblema = {
  slug: string;
  nome: string;
  tipo: TipoOferta;
  grupo: string; // pasta de origem
  temas: string[]; // chaves de tema do motor de encarte (lib/encarte/themes.ts)
  quando: Quando;
  feriados: Feriado[];
  tags: string[]; // palavras para a busca
  alternativa?: boolean; // primeira versão, serve de variação
  nota?: string; // ponto de atenção sobre o arquivo
  variantes?: Variante[]; // versões extras além da ilustrada
  baixaResolucao?: boolean; // arquivo original com menos de 1000 px de largura (fraco para A4 impresso)
  versoesPequenas?: boolean; // só texto e uma cor ainda em baixa resolução
};

const SEMPRE: Quando = { kind: "sempre" };
const V: Variante[] = [...VARIANTES];
const SEM = (...dias: number[]): Quando => ({ kind: "semana", dias });

export const EMBLEMAS: Emblema[] = [
  // 01 Campanhas recorrentes
  { slug: "ofertas-da-semana", nome: "Ofertas da Semana", tipo: "periodo", grupo: "Campanhas recorrentes", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["semanal", "cesta", "encarte da semana"] },
  { slug: "ofertas-de-fim-de-semana", nome: "Ofertas de Fim de Semana", tipo: "periodo", grupo: "Campanhas recorrentes", temas: ["fim-de-semana"], quando: { kind: "semana", dias: [4, 5, 6, 0] }, feriados: [], tags: ["sabado", "domingo", "calendario"] },
  { slug: "quarta-do-hortifruti", nome: "Quarta do Hortifrúti", tipo: "dia-da-semana", grupo: "Campanhas recorrentes", temas: ["hortifruti"], quando: { kind: "semana", dias: [3] }, feriados: [], tags: ["frutas", "verduras", "legumes", "quarta verde"] },
  { slug: "sexta-da-cerveja", nome: "Sexta da Cerveja", tipo: "dia-da-semana", grupo: "Campanhas recorrentes", temas: ["bebidas"], quando: { kind: "semana", dias: [5] }, feriados: [], tags: ["cerveja", "chopp", "bar"] },
  { slug: "so-hoje", nome: "Só Hoje", tipo: "periodo", grupo: "Campanhas recorrentes", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["urgencia", "relampago", "um dia"] },
  { slug: "terca-da-carne", nome: "Terça da Carne", tipo: "dia-da-semana", grupo: "Campanhas recorrentes", temas: ["acougue"], quando: { kind: "semana", dias: [2] }, feriados: [], tags: ["carne", "churrasco", "bovina"] },

  // 02 Loja e economia
  { slug: "aniversario-da-loja", nome: "Aniversário da Loja", tipo: "loja", grupo: "Loja e economia", temas: ["aniversario"], quando: SEMPRE, feriados: [], tags: ["parabens", "festa", "presentes", "balao"] },
  { slug: "cesta-basica", nome: "Cesta Básica", tipo: "loja", grupo: "Loja e economia", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["arroz", "feijao", "oleo", "essenciais"] },
  { slug: "inauguracao", nome: "Inauguração", tipo: "loja", grupo: "Loja e economia", temas: ["aniversario", "ofertas"], quando: SEMPRE, feriados: [], tags: ["nova loja", "abertura", "tesoura", "fita"] },
  { slug: "preco-baixo", nome: "Preço Baixo", tipo: "loja", grupo: "Loja e economia", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["economia", "menor preco", "seta"] },
  { slug: "preco-de-fabrica", nome: "Preço de Fábrica", tipo: "loja", grupo: "Loja e economia", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["atacado", "industria", "direto"] },
  { slug: "reinauguracao", nome: "Reinauguração", tipo: "loja", grupo: "Loja e economia", temas: ["aniversario", "ofertas"], quando: SEMPRE, feriados: [], tags: ["reforma", "loja nova", "reabertura"] },

  // 03 Datas em família
  { slug: "dia-das-criancas", nome: "Dia das Crianças", tipo: "data", grupo: "Datas em família", temas: ["dia-das-criancas"], quando: { kind: "feriado", titulo: "Dia das Crianças", antes: 15 }, feriados: ["Dia das Crianças"], tags: ["brinquedos", "doces", "12 de outubro"] },
  { slug: "dia-das-maes", nome: "Dia das Mães", tipo: "data", grupo: "Datas em família", temas: ["dia-das-maes"], quando: { kind: "feriado", titulo: "Dia das Mães", antes: 14 }, feriados: ["Dia das Mães"], tags: ["rosas", "presente", "maio"] },
  { slug: "dia-dos-namorados", nome: "Dia dos Namorados", tipo: "data", grupo: "Datas em família", temas: [], quando: { kind: "feriado", titulo: "Dia dos Namorados", antes: 12 }, feriados: ["Dia dos Namorados"], tags: ["coracao", "12 de junho", "vinho", "chocolate"], nota: "O motor de encarte ainda não tem tema próprio para esta data." },
  { slug: "dia-dos-pais", nome: "Dia dos Pais", tipo: "data", grupo: "Datas em família", temas: ["dia-dos-pais"], quando: { kind: "feriado", titulo: "Dia dos Pais", antes: 14 }, feriados: ["Dia dos Pais"], tags: ["gravata", "churrasco", "cerveja", "agosto"] },

  // 04 Datas e celebrações
  { slug: "natal-de-ofertas", nome: "Natal de Ofertas", tipo: "data", grupo: "Datas e celebrações", temas: ["natal"], quando: { kind: "feriado", titulo: "Natal", antes: 35 }, feriados: ["Natal"], tags: ["ceia", "panetone", "papai noel", "dezembro"] },
  { slug: "festa-junina", nome: "Festa Junina", tipo: "data", grupo: "Datas e celebrações", temas: ["festa-junina"], quando: { kind: "feriado", titulo: "Festa Junina", antes: 21, depois: 6 }, feriados: ["Festa Junina"], tags: ["sao joao", "milho", "quentao", "bandeirinha"] },
  { slug: "pascoa-de-ofertas", nome: "Páscoa de Ofertas", tipo: "data", grupo: "Datas e celebrações", temas: ["pascoa"], quando: { kind: "feriado", titulo: "Páscoa", antes: 28 }, feriados: ["Páscoa"], tags: ["chocolate", "ovo", "coelho", "bacalhau"] },
  { slug: "ofertas-de-ano-novo", nome: "Ofertas de Ano Novo", tipo: "data", grupo: "Datas e celebrações", temas: [], quando: { kind: "feriado", titulo: "Réveillon", antes: 10 }, feriados: ["Réveillon"], tags: ["reveillon", "champanhe", "fogos", "virada"], nota: "O motor de encarte ainda não tem tema de Ano Novo." },

  // 05 Grandes campanhas
  { slug: "black-friday", nome: "Black Friday", tipo: "campanha", grupo: "Grandes campanhas", temas: ["black-friday"], quando: { kind: "feriado", titulo: "Black Friday", antes: 14, depois: 3 }, feriados: ["Black Friday"], tags: ["novembro", "descontos", "cyber"] },
  { slug: "carnaval-de-ofertas", nome: "Carnaval de Ofertas", tipo: "campanha", grupo: "Grandes campanhas", temas: [], quando: { kind: "feriado", titulo: "Carnaval", antes: 12 }, feriados: ["Carnaval"], tags: ["mascara", "serpentina", "folia", "cerveja"], nota: "O motor de encarte ainda não tem tema de Carnaval." },
  { slug: "ofertas-da-copa", nome: "Ofertas da Copa", tipo: "campanha", grupo: "Grandes campanhas", temas: [], quando: { kind: "periodo", de: "2026-05-28", ate: "2026-07-19" }, feriados: ["Copa do Mundo"], tags: ["futebol", "jogo", "bola", "brasil", "cerveja"], nota: "Evite a marca oficial da Copa nas artes. A janela de data é a da Copa de 2026 e muda a cada edição." },
  { slug: "volta-as-aulas", nome: "Volta às Aulas", tipo: "campanha", grupo: "Grandes campanhas", temas: [], quando: { kind: "periodo", de: "01-10", ate: "02-20" }, feriados: ["Volta às aulas"], tags: ["escola", "caderno", "lanche", "material escolar", "janeiro", "fevereiro"], nota: "O motor de encarte ainda não tem tema de volta às aulas." },

  // 06 Setores de alimentos
  { slug: "acougue-e-churrasco", nome: "Açougue e Churrasco", tipo: "setor", grupo: "Setores de alimentos", temas: ["acougue"], quando: SEMPRE, feriados: [], tags: ["carne", "costela", "picanha", "brasa"] },
  { slug: "congelados", nome: "Congelados", tipo: "setor", grupo: "Setores de alimentos", temas: [], quando: SEMPRE, feriados: [], tags: ["gelo", "frio", "pizza", "sorvete"], nota: "O motor de encarte ainda não tem tema de congelados." },
  { slug: "frios-e-laticinios", nome: "Frios e Laticínios", tipo: "setor", grupo: "Setores de alimentos", temas: [], quando: SEMPRE, feriados: [], tags: ["queijo", "presunto", "leite", "iogurte"], nota: "O motor de encarte ainda não tem tema de frios e laticínios." },
  { slug: "hortifruti", nome: "Hortifrúti", tipo: "setor", grupo: "Setores de alimentos", temas: ["hortifruti"], quando: SEMPRE, feriados: [], tags: ["frutas", "verduras", "legumes", "feira"] },
  { slug: "mercearia", nome: "Mercearia", tipo: "setor", grupo: "Setores de alimentos", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["arroz", "macarrao", "enlatados", "secos"] },
  { slug: "padaria", nome: "Padaria", tipo: "setor", grupo: "Setores de alimentos", temas: ["padaria"], quando: SEMPRE, feriados: [], tags: ["pao", "croissant", "confeitaria", "trigo"] },

  // 07 Setores de casa e cuidados
  { slug: "bazar", nome: "Bazar", tipo: "setor", grupo: "Setores de casa e cuidados", temas: [], quando: SEMPRE, feriados: [], tags: ["panelas", "utilidades", "cozinha", "casa"], nota: "O motor de encarte ainda não tem tema de bazar." },
  { slug: "bebidas", nome: "Bebidas", tipo: "setor", grupo: "Setores de casa e cuidados", temas: ["bebidas"], quando: SEMPRE, feriados: [], tags: ["cerveja", "refrigerante", "suco", "gelada"] },
  { slug: "higiene", nome: "Higiene", tipo: "setor", grupo: "Setores de casa e cuidados", temas: [], quando: SEMPRE, feriados: [], tags: ["sabonete", "papel higienico", "shampoo", "perfumaria"], nota: "Sem tema próprio no motor de encarte (o de limpeza é o mais próximo)." },
  { slug: "limpeza", nome: "Limpeza", tipo: "setor", grupo: "Setores de casa e cuidados", temas: ["limpeza"], quando: SEMPRE, feriados: [], tags: ["detergente", "sabao", "desinfetante", "casa"] },
  { slug: "pet", nome: "Pet", tipo: "setor", grupo: "Setores de casa e cuidados", temas: [], quando: SEMPRE, feriados: [], tags: ["cachorro", "gato", "racao", "animais"], nota: "O motor de encarte ainda não tem tema de pet." },

  // 08 Condições comerciais
  { slug: "clube-de-ofertas", nome: "Clube de Ofertas", tipo: "condicao", grupo: "Condições comerciais", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["fidelidade", "cartao", "cadastro", "app"] },
  { slug: "lancamento-de-marca", nome: "Lançamento de Marca", tipo: "condicao", grupo: "Condições comerciais", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["novidade", "estreia", "fornecedor", "degustacao"] },
  { slug: "liquidacao", nome: "Liquidação", tipo: "condicao", grupo: "Condições comerciais", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["saldao", "descontao", "limpa estoque"] },
  { slug: "ofertas-do-atacarejo", nome: "Ofertas do Atacarejo", tipo: "condicao", grupo: "Condições comerciais", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["atacado", "varejo", "caixa", "fardo"] },
  { slug: "preco-exclusivo", nome: "Preço Exclusivo", tipo: "condicao", grupo: "Condições comerciais", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["clube", "cartao", "so para clientes"] },
  { slug: "queima-de-estoque", nome: "Queima de Estoque", tipo: "condicao", grupo: "Condições comerciais", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["liquidacao", "ultimas unidades", "fogo"] },

  // 09 Clientes e calendário
  { slug: "dia-20-ofertas", nome: "Dia 20 Ofertas", tipo: "calendario", grupo: "Clientes e calendário", temas: ["ofertas"], quando: { kind: "diaDoMes", dias: [20], antes: 3 }, feriados: [], tags: ["quinzena", "vale", "pagamento"] },
  { slug: "dia-5-ofertas", nome: "Dia 5 Ofertas", tipo: "calendario", grupo: "Clientes e calendário", temas: ["ofertas"], quando: { kind: "diaDoMes", dias: [5], antes: 3 }, feriados: [], tags: ["quinto dia util", "salario", "pagamento"] },
  { slug: "dia-do-cartao", nome: "Dia do Cartão", tipo: "calendario", grupo: "Clientes e calendário", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["cartao da casa", "parcelado", "fatura"] },
  { slug: "dia-do-cliente", nome: "Dia do Cliente", tipo: "calendario", grupo: "Clientes e calendário", temas: ["ofertas"], quando: { kind: "feriado", titulo: "Dia do Cliente", antes: 7 }, feriados: ["Dia do Cliente"], tags: ["15 de setembro", "fidelidade", "agradecimento"] },
  { slug: "feriadao-de-ofertas", nome: "Feriadão de Ofertas", tipo: "calendario", grupo: "Clientes e calendário", temas: ["fim-de-semana", "ofertas"], quando: SEMPRE, feriados: ["Feriado prolongado"], tags: ["praia", "viagem", "churrasco", "emenda"] },
  { slug: "ofertas-do-dia-de-salario", nome: "Ofertas do Dia de Salário", tipo: "calendario", grupo: "Clientes e calendário", temas: ["ofertas"], quando: { kind: "diaDoMes", dias: [5, 20], antes: 2 }, feriados: [], tags: ["pagamento", "quinto dia util", "dinheiro", "vale"] },

  // 10 Ofertões
  { slug: "ofertao-de-segunda", nome: "Ofertão de Segunda", tipo: "ofertao", grupo: "Ofertões", temas: ["ofertas"], quando: { kind: "semana", dias: [1] }, feriados: [], tags: ["segunda-feira"] },
  { slug: "ofertao-de-terca", nome: "Ofertão de Terça", tipo: "ofertao", grupo: "Ofertões", temas: ["ofertas"], quando: { kind: "semana", dias: [2] }, feriados: [], tags: ["terca-feira"] },
  { slug: "ofertao-de-quarta", nome: "Ofertão de Quarta", tipo: "ofertao", grupo: "Ofertões", temas: ["ofertas"], quando: { kind: "semana", dias: [3] }, feriados: [], tags: ["quarta-feira"] },
  { slug: "ofertao-de-quinta", nome: "Ofertão de Quinta", tipo: "ofertao", grupo: "Ofertões", temas: ["ofertas"], quando: { kind: "semana", dias: [4] }, feriados: [], tags: ["quinta-feira"] },
  { slug: "ofertao-de-sexta", nome: "Ofertão de Sexta", tipo: "ofertao", grupo: "Ofertões", temas: ["ofertas"], quando: { kind: "semana", dias: [5] }, feriados: [], tags: ["sexta-feira"] },
  { slug: "ofertao-de-setembro", nome: "Ofertão de Setembro", tipo: "ofertao", grupo: "Ofertões", temas: ["ofertas"], quando: { kind: "mes", mes: 9 }, feriados: [], tags: ["mes", "mensal"] },

  // 11 Primeiras versões (servem como variação)
  { slug: "aqui-tem-mais-oferta", nome: "Aqui Tem Mais Oferta", tipo: "periodo", grupo: "Primeiras versões", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["faixa", "slogan", "assinatura", "horizontal"], alternativa: true },
  { slug: "dia-de-feira", nome: "É Dia de Feira", tipo: "dia-da-semana", grupo: "Primeiras versões", temas: ["hortifruti"], quando: SEMPRE, feriados: [], tags: ["frutas", "verduras", "feira livre", "quarta verde"], alternativa: true },
  { slug: "hora-da-carne", nome: "Hora da Carne", tipo: "setor", grupo: "Primeiras versões", temas: ["acougue"], quando: SEMPRE, feriados: [], tags: ["carne", "churrasco", "relogio"], alternativa: true },
  { slug: "oferta-da-semana", nome: "Oferta da Semana", tipo: "periodo", grupo: "Primeiras versões", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["semanal", "cesta"], alternativa: true },
  { slug: "ofertas-do-dia", nome: "Ofertas do Dia", tipo: "periodo", grupo: "Primeiras versões", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["diaria", "calendario", "hoje"], alternativa: true },
  { slug: "semana-de-ofertas", nome: "Semana de Ofertas", tipo: "periodo", grupo: "Primeiras versões", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["semanal", "etiqueta"], alternativa: true },

  // 12 Prioridade alta (lote 2, com quatro versões cada)
  { slug: "ceia-de-natal", nome: "Ceia de Natal", tipo: "data", grupo: "Prioridade alta", temas: ["natal"], quando: { kind: "feriado", titulo: "Natal", antes: 21 }, feriados: ["Natal"], tags: ["peru", "chester", "panetone", "mesa farta", "dezembro", "ceia"], variantes: V, versoesPequenas: true },
  { slug: "dia-da-mulher", nome: "Dia da Mulher", tipo: "data", grupo: "Prioridade alta", temas: [], quando: { kind: "periodo", de: "02-25", ate: "03-08" }, feriados: [], tags: ["8 de marco", "flores", "rosa", "marco"], variantes: V, versoesPequenas: true, nota: "O motor de encarte ainda não tem tema do Dia da Mulher." },
  { slug: "dia-do-consumidor", nome: "Dia do Consumidor", tipo: "data", grupo: "Prioridade alta", temas: ["ofertas"], quando: { kind: "periodo", de: "03-05", ate: "03-15" }, feriados: [], tags: ["15 de marco", "carrinho", "cesta", "marco"], variantes: V, versoesPequenas: true },
  { slug: "esquenta-black-friday", nome: "Esquenta Black Friday", tipo: "campanha", grupo: "Prioridade alta", temas: ["black-friday"], quando: { kind: "feriado", titulo: "Black Friday", antes: 30, depois: -14 }, feriados: ["Black Friday"], tags: ["pre black friday", "chama", "novembro", "antecipado"], variantes: V, versoesPequenas: true },
  { slug: "imperdivel", nome: "Imperdível", tipo: "condicao", grupo: "Prioridade alta", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["megafone", "destaque", "rotulo", "oportunidade"], variantes: V, versoesPequenas: true },
  { slug: "leve-3-pague-2", nome: "Leve 3 Pague 2", tipo: "condicao", grupo: "Prioridade alta", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["combo", "promocao", "leve mais", "rotulo"], variantes: V, versoesPequenas: true },
  { slug: "novidade", nome: "Novidade", tipo: "condicao", grupo: "Prioridade alta", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["novo", "lancamento", "estrelas", "rotulo"], variantes: V, versoesPequenas: true },
  { slug: "oferta-relampago", nome: "Oferta Relâmpago", tipo: "periodo", grupo: "Prioridade alta", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["raio", "urgencia", "poucas horas", "story"], variantes: V, versoesPequenas: true },
  { slug: "ofertao-de-sabado", nome: "Ofertão de Sábado", tipo: "ofertao", grupo: "Prioridade alta", temas: ["ofertas", "fim-de-semana"], quando: SEM(6), feriados: [], tags: ["sabado", "fim de semana", "calendario"], variantes: V, versoesPequenas: true },
  { slug: "ofertao-do-mes", nome: "Ofertão do Mês", tipo: "ofertao", grupo: "Prioridade alta", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["mensal", "mes", "calendario", "qualquer mes"], variantes: V, versoesPequenas: true },
  { slug: "sabado-de-ofertas", nome: "Sábado de Ofertas", tipo: "periodo", grupo: "Prioridade alta", temas: ["fim-de-semana", "ofertas"], quando: SEM(6), feriados: [], tags: ["sabado", "cesta", "fim de semana"], variantes: V, versoesPequenas: true },
  { slug: "sabado-do-churrasco", nome: "Sábado do Churrasco", tipo: "dia-da-semana", grupo: "Prioridade alta", temas: ["acougue", "fim-de-semana"], quando: SEM(6), feriados: [], tags: ["carne", "grelha", "espeto", "picanha", "cerveja"], variantes: V, versoesPequenas: true },

  // 13 Sugestões de mercado (lote 3, alta resolução)
  { slug: "pague-com-pix", nome: "Pague com Pix", tipo: "condicao", grupo: "Sugestões de mercado", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["pix", "desconto", "celular", "pagamento", "caixa"] },
  { slug: "cobrimos-qualquer-oferta", nome: "Cobrimos Qualquer Oferta", tipo: "condicao", grupo: "Sugestões de mercado", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["garantia", "menor preco", "concorrencia", "escudo"], nota: "É uma promessa de preço: só use se o mercado puder cumprir." },
  { slug: "fim-de-mes", nome: "Fim de Mês", tipo: "calendario", grupo: "Sugestões de mercado", temas: ["ofertas"], quando: { kind: "diaDoMes", dias: [30], antes: 4 }, feriados: [], tags: ["abastecimento", "calendario", "ultimos dias", "sacola"] },
  { slug: "mes-do-cliente", nome: "Mês do Cliente", tipo: "calendario", grupo: "Sugestões de mercado", temas: ["ofertas"], quando: { kind: "mes", mes: 9 }, feriados: [], tags: ["setembro", "agradecimento", "fidelidade", "coracao"] },
  { slug: "feirao-de-ofertas", nome: "Feirão de Ofertas", tipo: "condicao", grupo: "Sugestões de mercado", temas: ["hortifruti", "ofertas"], quando: SEMPRE, feriados: [], tags: ["feira", "barraca", "frutas", "liquidacao"] },
  { slug: "churrasco-de-domingo", nome: "Churrasco de Domingo", tipo: "dia-da-semana", grupo: "Sugestões de mercado", temas: ["acougue", "fim-de-semana"], quando: SEM(0), feriados: [], tags: ["carne", "linguica", "brasa", "domingo"] },
  { slug: "direto-do-produtor", nome: "Direto do Produtor", tipo: "setor", grupo: "Sugestões de mercado", temas: ["hortifruti"], quando: SEMPRE, feriados: [], tags: ["frutas", "verduras", "local", "caixote", "fresco"] },
  { slug: "frete-gratis", nome: "Frete Grátis", tipo: "condicao", grupo: "Sugestões de mercado", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["entrega", "delivery", "moto", "online"] },
  { slug: "panetones-e-chocotones", nome: "Panetones e Chocotones", tipo: "data", grupo: "Sugestões de mercado", temas: ["natal"], quando: { kind: "feriado", titulo: "Natal", antes: 50 }, feriados: ["Natal"], tags: ["panetone", "chocotone", "natal", "dezembro"] },
  { slug: "ovos-de-pascoa", nome: "Ovos de Páscoa", tipo: "data", grupo: "Sugestões de mercado", temas: ["pascoa"], quando: { kind: "feriado", titulo: "Páscoa", antes: 40 }, feriados: ["Páscoa"], tags: ["chocolate", "ovo", "cesta", "coelho"] },
  { slug: "ceia-de-ano-novo", nome: "Ceia de Ano Novo", tipo: "data", grupo: "Sugestões de mercado", temas: [], quando: { kind: "feriado", titulo: "Réveillon", antes: 10 }, feriados: ["Réveillon"], tags: ["reveillon", "champanhe", "roma", "lentilha", "fogos"], nota: "O motor de encarte ainda não tem tema de Ano Novo." },
  { slug: "black-week", nome: "Black Week", tipo: "campanha", grupo: "Sugestões de mercado", temas: ["black-friday"], quando: { kind: "feriado", titulo: "Black Friday", antes: 7, depois: 3 }, feriados: ["Black Friday"], tags: ["semana", "novembro", "descontos", "calendario"] },
  // 78 emblemas novos (prioridade média, ofertões mensais e prioridade baixa)
  { slug: "ofertao-de-domingo", nome: "Ofertão de Domingo", tipo: "ofertao", grupo: "Prioridade média", temas: ["ofertas"], quando: SEM(0), feriados: [], tags: ["domingo", "ofertao", "calendario"] },
  { slug: "sexta-do-churrasco", nome: "Sexta do Churrasco", tipo: "dia-da-semana", grupo: "Prioridade média", temas: ["acougue", "fim-de-semana"], quando: SEM(5), feriados: [], tags: ["churrasco", "sexta", "linguica", "espeto"] },
  { slug: "domingo-de-ofertas", nome: "Domingo de Ofertas", tipo: "periodo", grupo: "Prioridade média", temas: ["fim-de-semana", "ofertas"], quando: SEM(0), feriados: [], tags: ["domingo", "cesta", "sol"] },
  { slug: "ultima-chance", nome: "Última Chance", tipo: "periodo", grupo: "Prioridade média", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["urgencia", "ampulheta", "acaba hoje"] },
  { slug: "estoque-limitado", nome: "Estoque Limitado", tipo: "condicao", grupo: "Prioridade média", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["estoque", "acaba", "limitado"] },
  { slug: "compre-1-leve-2", nome: "Compre 1 Leve 2", tipo: "condicao", grupo: "Prioridade média", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["leve 2", "promocao", "2 por 1"] },
  { slug: "super-oferta", nome: "Super Oferta", tipo: "condicao", grupo: "Prioridade média", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["super", "destaque"] },
  { slug: "preco-de-atacado", nome: "Preço de Atacado", tipo: "condicao", grupo: "Prioridade média", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["atacado", "caixa", "fardo"] },
  { slug: "2-unidade-com-desconto", nome: "2ª Unidade com Desconto", tipo: "condicao", grupo: "Prioridade média", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["segunda unidade", "2a unidade", "percentual"] },
  { slug: "compre-e-ganhe", nome: "Compre e Ganhe", tipo: "condicao", grupo: "Prioridade média", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["brinde", "presente", "ganhe"] },
  { slug: "preco-minimo-garantido", nome: "Preço Mínimo Garantido", tipo: "condicao", grupo: "Prioridade média", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["garantia", "menor preco", "cobrimos"] },
  { slug: "ofertas-do-app", nome: "Ofertas do App", tipo: "condicao", grupo: "Prioridade média", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["aplicativo", "app", "celular"] },
  { slug: "ofertas-pelo-whatsapp", nome: "Ofertas pelo WhatsApp", tipo: "condicao", grupo: "Prioridade média", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["whatsapp", "zap", "pedido"] },
  { slug: "semana-santa-e-bacalhau", nome: "Semana Santa e Bacalhau", tipo: "data", grupo: "Prioridade média", temas: ["pascoa"], quando: { kind: "feriado", titulo: "Páscoa", antes: 14 }, feriados: ["Páscoa"], tags: ["bacalhau", "quaresma", "sexta santa", "peixe"] },
  { slug: "halloween", nome: "Halloween", tipo: "data", grupo: "Prioridade média", temas: [], quando: { kind: "periodo", de: "10-15", ate: "10-31" }, feriados: [], tags: ["bruxas", "abobora", "doces", "31 de outubro"] },
  { slug: "dia-dos-avos", nome: "Dia dos Avós", tipo: "data", grupo: "Prioridade média", temas: [], quando: { kind: "periodo", de: "07-18", ate: "07-26" }, feriados: [], tags: ["avo", "avos", "vovo", "26 de julho"] },
  { slug: "aniversario-da-cidade", nome: "Aniversário da Cidade", tipo: "campanha", grupo: "Prioridade média", temas: ["aniversario"], quando: SEMPRE, feriados: [], tags: ["cidade", "prefeitura", "faixa", "personalizar"] },
  { slug: "festival-de-inverno", nome: "Festival de Inverno", tipo: "campanha", grupo: "Prioridade média", temas: ["ofertas"], quando: { kind: "periodo", de: "06-15", ate: "08-31" }, feriados: [], tags: ["inverno", "frio", "caldo", "chocolate quente"] },
  { slug: "verao-e-praia", nome: "Verão e Praia", tipo: "campanha", grupo: "Prioridade média", temas: ["ofertas"], quando: { kind: "periodo", de: "12-10", ate: "02-28" }, feriados: [], tags: ["verao", "praia", "calor", "sorvete", "bebidas"] },
  { slug: "dia-de-jogo", nome: "Dia de Jogo", tipo: "campanha", grupo: "Prioridade média", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["futebol", "jogo", "cerveja", "petisco"] },
  { slug: "peixaria-e-pescados", nome: "Peixaria e Pescados", tipo: "setor", grupo: "Prioridade média", temas: [], quando: SEMPRE, feriados: [], tags: ["peixe", "camarao", "pescado", "frutos do mar"] },
  { slug: "rotisseria-e-pratos-prontos", nome: "Rotisseria e Pratos Prontos", tipo: "setor", grupo: "Prioridade média", temas: [], quando: SEMPRE, feriados: [], tags: ["pratos prontos", "marmita", "almoco", "rotisseria"] },
  { slug: "doces-e-chocolates", nome: "Doces e Chocolates", tipo: "setor", grupo: "Prioridade média", temas: [], quando: SEMPRE, feriados: [], tags: ["doce", "chocolate", "bombom", "sobremesa"] },
  { slug: "matinal-e-cafe", nome: "Matinal e Café", tipo: "setor", grupo: "Prioridade média", temas: ["padaria"], quando: SEMPRE, feriados: [], tags: ["cafe da manha", "matinal", "achocolatado", "cereal"] },
  { slug: "vinhos", nome: "Vinhos", tipo: "setor", grupo: "Prioridade média", temas: ["bebidas"], quando: SEMPRE, feriados: [], tags: ["vinho", "uva", "adega"] },
  { slug: "cervejas", nome: "Cervejas", tipo: "setor", grupo: "Prioridade média", temas: ["bebidas"], quando: SEMPRE, feriados: [], tags: ["cerveja", "gelada", "latinha", "long neck"] },
  { slug: "bebe-e-infantil", nome: "Bebê e Infantil", tipo: "setor", grupo: "Prioridade média", temas: [], quando: SEMPRE, feriados: [], tags: ["bebe", "fralda", "infantil", "crianca"] },
  { slug: "perfumaria-e-beleza", nome: "Perfumaria e Beleza", tipo: "setor", grupo: "Prioridade média", temas: [], quando: SEMPRE, feriados: [], tags: ["perfume", "beleza", "cosmeticos", "shampoo"] },
  { slug: "sorvetes", nome: "Sorvetes", tipo: "setor", grupo: "Prioridade média", temas: ["fim-de-semana"], quando: SEMPRE, feriados: [], tags: ["sorvete", "picole", "sobremesa", "calor"] },
  { slug: "fruta-da-estacao", nome: "Fruta da Estação", tipo: "setor", grupo: "Prioridade média", temas: ["hortifruti"], quando: SEMPRE, feriados: [], tags: ["fruta", "safra", "estacao"] },
  { slug: "semana-do-aniversario", nome: "Semana do Aniversário", tipo: "loja", grupo: "Prioridade média", temas: ["aniversario"], quando: SEMPRE, feriados: [], tags: ["aniversario", "semana", "festa", "loja"] },
  { slug: "delivery-e-compre-online", nome: "Delivery e Compre Online", tipo: "condicao", grupo: "Prioridade média", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["delivery", "online", "entrega", "pedido"] },
  { slug: "hora-do-pao-quente", nome: "Hora do Pão Quente", tipo: "setor", grupo: "Prioridade média", temas: ["padaria"], quando: SEMPRE, feriados: [], tags: ["pao quente", "fornada", "padaria", "manha"] },
  { slug: "cliente-fiel", nome: "Cliente Fiel", tipo: "loja", grupo: "Prioridade média", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["fidelidade", "cliente", "clube", "pontos"] },
  { slug: "semana-do-salario", nome: "Semana do Salário", tipo: "calendario", grupo: "Prioridade média", temas: ["ofertas"], quando: { kind: "diaDoMes", dias: [5], antes: 5 }, feriados: [], tags: ["salario", "pagamento", "quinto dia util"] },
  { slug: "ofertao-de-janeiro", nome: "Ofertão de Janeiro", tipo: "ofertao", grupo: "Ofertões mensais", temas: ["ofertas"], quando: { kind: "mes", mes: 1 }, feriados: [], tags: ["mensal", "mes", "janeiro"] },
  { slug: "ofertao-de-fevereiro", nome: "Ofertão de Fevereiro", tipo: "ofertao", grupo: "Ofertões mensais", temas: ["ofertas"], quando: { kind: "mes", mes: 2 }, feriados: [], tags: ["mensal", "mes", "fevereiro"] },
  { slug: "ofertao-de-marco", nome: "Ofertão de Março", tipo: "ofertao", grupo: "Ofertões mensais", temas: ["ofertas"], quando: { kind: "mes", mes: 3 }, feriados: [], tags: ["mensal", "mes", "março"] },
  { slug: "ofertao-de-abril", nome: "Ofertão de Abril", tipo: "ofertao", grupo: "Ofertões mensais", temas: ["ofertas"], quando: { kind: "mes", mes: 4 }, feriados: [], tags: ["mensal", "mes", "abril"] },
  { slug: "ofertao-de-maio", nome: "Ofertão de Maio", tipo: "ofertao", grupo: "Ofertões mensais", temas: ["ofertas"], quando: { kind: "mes", mes: 5 }, feriados: [], tags: ["mensal", "mes", "maio"] },
  { slug: "ofertao-de-junho", nome: "Ofertão de Junho", tipo: "ofertao", grupo: "Ofertões mensais", temas: ["ofertas"], quando: { kind: "mes", mes: 6 }, feriados: [], tags: ["mensal", "mes", "junho"] },
  { slug: "ofertao-de-julho", nome: "Ofertão de Julho", tipo: "ofertao", grupo: "Ofertões mensais", temas: ["ofertas"], quando: { kind: "mes", mes: 7 }, feriados: [], tags: ["mensal", "mes", "julho"] },
  { slug: "ofertao-de-agosto", nome: "Ofertão de Agosto", tipo: "ofertao", grupo: "Ofertões mensais", temas: ["ofertas"], quando: { kind: "mes", mes: 8 }, feriados: [], tags: ["mensal", "mes", "agosto"] },
  { slug: "ofertao-de-outubro", nome: "Ofertão de Outubro", tipo: "ofertao", grupo: "Ofertões mensais", temas: ["ofertas"], quando: { kind: "mes", mes: 10 }, feriados: [], tags: ["mensal", "mes", "outubro"] },
  { slug: "ofertao-de-novembro", nome: "Ofertão de Novembro", tipo: "ofertao", grupo: "Ofertões mensais", temas: ["ofertas"], quando: { kind: "mes", mes: 11 }, feriados: [], tags: ["mensal", "mes", "novembro"] },
  { slug: "ofertao-de-dezembro", nome: "Ofertão de Dezembro", tipo: "ofertao", grupo: "Ofertões mensais", temas: ["ofertas"], quando: { kind: "mes", mes: 12 }, feriados: [], tags: ["mensal", "mes", "dezembro"] },
  { slug: "segunda-da-limpeza", nome: "Segunda da Limpeza", tipo: "dia-da-semana", grupo: "Prioridade baixa", temas: ["limpeza"], quando: SEM(1), feriados: [], tags: ["segunda", "limpeza", "detergente", "sabao"] },
  { slug: "quinta-da-padaria", nome: "Quinta da Padaria", tipo: "dia-da-semana", grupo: "Prioridade baixa", temas: ["padaria"], quando: SEM(4), feriados: [], tags: ["quinta", "pao", "padaria", "bolo"] },
  { slug: "mega-oferta", nome: "Mega Oferta", tipo: "periodo", grupo: "Prioridade baixa", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["mega", "destaque", "oferta"] },
  { slug: "cashback", nome: "Cashback", tipo: "condicao", grupo: "Prioridade baixa", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["dinheiro de volta", "cashback", "app"] },
  { slug: "cartao-da-casa", nome: "Cartão da Casa", tipo: "condicao", grupo: "Prioridade baixa", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["cartao", "credito da casa", "parcelado"] },
  { slug: "vence-logo", nome: "Vence Logo", tipo: "periodo", grupo: "Prioridade baixa", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["validade", "vencimento", "queima"] },
  { slug: "dia-do-amigo", nome: "Dia do Amigo", tipo: "data", grupo: "Prioridade baixa", temas: [], quando: { kind: "periodo", de: "07-14", ate: "07-20" }, feriados: [], tags: ["amigo", "20 de julho", "amizade"] },
  { slug: "dia-do-chocolate", nome: "Dia do Chocolate", tipo: "data", grupo: "Prioridade baixa", temas: [], quando: { kind: "periodo", de: "07-01", ate: "07-07" }, feriados: [], tags: ["chocolate", "7 de julho", "doces"] },
  { slug: "dia-da-pizza", nome: "Dia da Pizza", tipo: "data", grupo: "Prioridade baixa", temas: [], quando: { kind: "periodo", de: "07-04", ate: "07-10" }, feriados: [], tags: ["pizza", "10 de julho", "massa", "queijo"] },
  { slug: "dia-do-cafe", nome: "Dia do Café", tipo: "data", grupo: "Prioridade baixa", temas: ["padaria"], quando: { kind: "periodo", de: "05-18", ate: "05-24" }, feriados: [], tags: ["cafe", "24 de maio", "cafeteira"] },
  { slug: "dia-do-trabalhador", nome: "Dia do Trabalhador", tipo: "data", grupo: "Prioridade baixa", temas: [], quando: { kind: "periodo", de: "04-24", ate: "05-01" }, feriados: [], tags: ["trabalhador", "1 de maio", "feriado", "churrasco"] },
  { slug: "oktoberfest", nome: "Oktoberfest", tipo: "campanha", grupo: "Prioridade baixa", temas: ["bebidas"], quando: { kind: "periodo", de: "09-25", ate: "10-31" }, feriados: [], tags: ["cerveja", "chope", "alemao", "salsicha"] },
  { slug: "cyber-monday", nome: "Cyber Monday", tipo: "campanha", grupo: "Prioridade baixa", temas: ["black-friday"], quando: { kind: "periodo", de: "11-24", ate: "12-02" }, feriados: [], tags: ["cyber", "online", "segunda", "desconto"] },
  { slug: "massas-e-molhos", nome: "Massas e Molhos", tipo: "setor", grupo: "Prioridade baixa", temas: [], quando: SEMPRE, feriados: [], tags: ["macarrao", "molho", "massa", "extrato"] },
  { slug: "aves-e-frango", nome: "Aves e Frango", tipo: "setor", grupo: "Prioridade baixa", temas: ["acougue"], quando: SEMPRE, feriados: [], tags: ["frango", "ave", "peito", "coxa"] },
  { slug: "ovos", nome: "Ovos", tipo: "setor", grupo: "Prioridade baixa", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["ovo", "granja", "duzia", "bandeja"] },
  { slug: "organicos-e-naturais", nome: "Orgânicos e Naturais", tipo: "setor", grupo: "Prioridade baixa", temas: ["hortifruti"], quando: SEMPRE, feriados: [], tags: ["organico", "natural", "saudavel", "integral"] },
  { slug: "lanches-e-salgadinhos", nome: "Lanches e Salgadinhos", tipo: "setor", grupo: "Prioridade baixa", temas: [], quando: SEMPRE, feriados: [], tags: ["salgadinho", "lanche", "snack", "biscoito"] },
  { slug: "utilidades-e-descartaveis", nome: "Utilidades e Descartáveis", tipo: "setor", grupo: "Prioridade baixa", temas: [], quando: SEMPRE, feriados: [], tags: ["descartavel", "copo", "prato", "utilidades"] },
  { slug: "papelaria-e-escolar", nome: "Papelaria e Escolar", tipo: "setor", grupo: "Prioridade baixa", temas: ["ofertas"], quando: { kind: "periodo", de: "01-15", ate: "02-28" }, feriados: ["Volta às aulas"], tags: ["escola", "caderno", "lapis", "material escolar"] },
  { slug: "eletro-e-ventilacao", nome: "Eletro e Ventilação", tipo: "setor", grupo: "Prioridade baixa", temas: [], quando: SEMPRE, feriados: [], tags: ["ventilador", "eletro", "eletrodomestico", "calor"] },
  { slug: "nova-loja", nome: "Nova Loja", tipo: "loja", grupo: "Prioridade baixa", temas: ["aniversario"], quando: SEMPRE, feriados: [], tags: ["nova loja", "inauguracao", "abertura", "filial"] },
  { slug: "plantao-de-feriado", nome: "Plantão de Feriado", tipo: "calendario", grupo: "Prioridade baixa", temas: ["fim-de-semana"], quando: SEMPRE, feriados: ["Feriado prolongado"], tags: ["feriado", "plantao", "aberto", "emenda"] },
  { slug: "dia-10-ofertas", nome: "Dia 10 Ofertas", tipo: "calendario", grupo: "Prioridade baixa", temas: ["ofertas"], quando: { kind: "diaDoMes", dias: [10], antes: 3 }, feriados: [], tags: ["dia 10", "pagamento", "quinzena"] },
  { slug: "dia-15-ofertas", nome: "Dia 15 Ofertas", tipo: "calendario", grupo: "Prioridade baixa", temas: ["ofertas"], quando: { kind: "diaDoMes", dias: [15], antes: 3 }, feriados: [], tags: ["dia 15", "pagamento", "quinzena"] },
  { slug: "dia-30-ofertas", nome: "Dia 30 Ofertas", tipo: "calendario", grupo: "Prioridade baixa", temas: ["ofertas"], quando: { kind: "diaDoMes", dias: [30], antes: 3 }, feriados: [], tags: ["dia 30", "fim de mes", "salario"] },
  { slug: "lanche-escolar", nome: "Lanche Escolar", tipo: "campanha", grupo: "Prioridade baixa", temas: ["ofertas"], quando: { kind: "periodo", de: "01-20", ate: "03-10" }, feriados: ["Volta às aulas"], tags: ["lanche", "escola", "lancheira", "suco"] },
  { slug: "retirada-na-loja", nome: "Retirada na Loja", tipo: "condicao", grupo: "Prioridade baixa", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["retirada", "retire na loja", "click e retire"] },
  { slug: "carvao-gelo-e-espetos", nome: "Carvão Gelo e Espetos", tipo: "setor", grupo: "Prioridade baixa", temas: ["acougue", "fim-de-semana"], quando: SEMPRE, feriados: [], tags: ["carvao", "gelo", "espeto", "churrasco"] },
  { slug: "produtos-da-regiao", nome: "Produtos da Região", tipo: "setor", grupo: "Prioridade baixa", temas: ["hortifruti"], quando: SEMPRE, feriados: [], tags: ["regiao", "local", "produtor", "fazenda"] },
  { slug: "sopas-e-caldos", nome: "Sopas e Caldos", tipo: "setor", grupo: "Prioridade baixa", temas: [], quando: { kind: "periodo", de: "05-01", ate: "09-15" }, feriados: [], tags: ["sopa", "caldo", "inverno", "frio"] },
];

export const emblemaPng = (slug: string, variante?: Variante) => `/emblemas/${slug}${variante ? `--${variante}` : ""}.png`;
export const emblemaThumb = (slug: string) => `/emblemas/t/${slug}.webp`;
export function emblemaPorSlug(slug: string): Emblema | undefined {
  return EMBLEMAS.find((e) => e.slug === slug);
}
