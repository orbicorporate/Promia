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
  { slug: "ofertas-da-semana", nome: "Ofertas da Semana", tipo: "periodo", grupo: "Campanhas recorrentes", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["semanal", "cesta", "encarte da semana"], baixaResolucao: true },
  { slug: "ofertas-de-fim-de-semana", nome: "Ofertas de Fim de Semana", tipo: "periodo", grupo: "Campanhas recorrentes", temas: ["fim-de-semana"], quando: { kind: "semana", dias: [4, 5, 6, 0] }, feriados: [], tags: ["sabado", "domingo", "calendario"], baixaResolucao: true },
  { slug: "quarta-do-hortifruti", nome: "Quarta do Hortifrúti", tipo: "dia-da-semana", grupo: "Campanhas recorrentes", temas: ["hortifruti"], quando: { kind: "semana", dias: [3] }, feriados: [], tags: ["frutas", "verduras", "legumes", "quarta verde"], baixaResolucao: true },
  { slug: "sexta-da-cerveja", nome: "Sexta da Cerveja", tipo: "dia-da-semana", grupo: "Campanhas recorrentes", temas: ["bebidas"], quando: { kind: "semana", dias: [5] }, feriados: [], tags: ["cerveja", "chopp", "bar"], baixaResolucao: true },
  { slug: "so-hoje", nome: "Só Hoje", tipo: "periodo", grupo: "Campanhas recorrentes", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["urgencia", "relampago", "um dia"], baixaResolucao: true },
  { slug: "terca-da-carne", nome: "Terça da Carne", tipo: "dia-da-semana", grupo: "Campanhas recorrentes", temas: ["acougue"], quando: { kind: "semana", dias: [2] }, feriados: [], tags: ["carne", "churrasco", "bovina"], baixaResolucao: true },

  // 02 Loja e economia
  { slug: "aniversario-da-loja", nome: "Aniversário da Loja", tipo: "loja", grupo: "Loja e economia", temas: ["aniversario"], quando: SEMPRE, feriados: [], tags: ["parabens", "festa", "presentes", "balao"], baixaResolucao: true },
  { slug: "cesta-basica", nome: "Cesta Básica", tipo: "loja", grupo: "Loja e economia", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["arroz", "feijao", "oleo", "essenciais"], baixaResolucao: true },
  { slug: "inauguracao", nome: "Inauguração", tipo: "loja", grupo: "Loja e economia", temas: ["aniversario", "ofertas"], quando: SEMPRE, feriados: [], tags: ["nova loja", "abertura", "tesoura", "fita"], baixaResolucao: true },
  { slug: "preco-baixo", nome: "Preço Baixo", tipo: "loja", grupo: "Loja e economia", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["economia", "menor preco", "seta"], baixaResolucao: true },
  { slug: "preco-de-fabrica", nome: "Preço de Fábrica", tipo: "loja", grupo: "Loja e economia", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["atacado", "industria", "direto"], baixaResolucao: true },
  { slug: "reinauguracao", nome: "Reinauguração", tipo: "loja", grupo: "Loja e economia", temas: ["aniversario", "ofertas"], quando: SEMPRE, feriados: [], tags: ["reforma", "loja nova", "reabertura"], baixaResolucao: true },

  // 03 Datas em família
  { slug: "dia-das-criancas", nome: "Dia das Crianças", tipo: "data", grupo: "Datas em família", temas: ["dia-das-criancas"], quando: { kind: "feriado", titulo: "Dia das Crianças", antes: 15 }, feriados: ["Dia das Crianças"], tags: ["brinquedos", "doces", "12 de outubro"], baixaResolucao: true },
  { slug: "dia-das-maes", nome: "Dia das Mães", tipo: "data", grupo: "Datas em família", temas: ["dia-das-maes"], quando: { kind: "feriado", titulo: "Dia das Mães", antes: 14 }, feriados: ["Dia das Mães"], tags: ["rosas", "presente", "maio"], baixaResolucao: true },
  { slug: "dia-dos-namorados", nome: "Dia dos Namorados", tipo: "data", grupo: "Datas em família", temas: [], quando: { kind: "feriado", titulo: "Dia dos Namorados", antes: 12 }, feriados: ["Dia dos Namorados"], tags: ["coracao", "12 de junho", "vinho", "chocolate"], nota: "O motor de encarte ainda não tem tema próprio para esta data.", baixaResolucao: true },
  { slug: "dia-dos-pais", nome: "Dia dos Pais", tipo: "data", grupo: "Datas em família", temas: ["dia-dos-pais"], quando: { kind: "feriado", titulo: "Dia dos Pais", antes: 14 }, feriados: ["Dia dos Pais"], tags: ["gravata", "churrasco", "cerveja", "agosto"], baixaResolucao: true },

  // 04 Datas e celebrações
  { slug: "natal-de-ofertas", nome: "Natal de Ofertas", tipo: "data", grupo: "Datas e celebrações", temas: ["natal"], quando: { kind: "feriado", titulo: "Natal", antes: 35 }, feriados: ["Natal"], tags: ["ceia", "panetone", "papai noel", "dezembro"], baixaResolucao: true },
  { slug: "festa-junina", nome: "Festa Junina", tipo: "data", grupo: "Datas e celebrações", temas: ["festa-junina"], quando: { kind: "feriado", titulo: "Festa Junina", antes: 21, depois: 6 }, feriados: ["Festa Junina"], tags: ["sao joao", "milho", "quentao", "bandeirinha"], baixaResolucao: true },
  { slug: "pascoa-de-ofertas", nome: "Páscoa de Ofertas", tipo: "data", grupo: "Datas e celebrações", temas: ["pascoa"], quando: { kind: "feriado", titulo: "Páscoa", antes: 28 }, feriados: ["Páscoa"], tags: ["chocolate", "ovo", "coelho", "bacalhau"], baixaResolucao: true },
  { slug: "ofertas-de-ano-novo", nome: "Ofertas de Ano Novo", tipo: "data", grupo: "Datas e celebrações", temas: [], quando: { kind: "feriado", titulo: "Réveillon", antes: 10 }, feriados: ["Réveillon"], tags: ["reveillon", "champanhe", "fogos", "virada"], nota: "O motor de encarte ainda não tem tema de Ano Novo.", baixaResolucao: true },

  // 05 Grandes campanhas
  { slug: "black-friday", nome: "Black Friday", tipo: "campanha", grupo: "Grandes campanhas", temas: ["black-friday"], quando: { kind: "feriado", titulo: "Black Friday", antes: 14, depois: 3 }, feriados: ["Black Friday"], tags: ["novembro", "descontos", "cyber"], baixaResolucao: true },
  { slug: "carnaval-de-ofertas", nome: "Carnaval de Ofertas", tipo: "campanha", grupo: "Grandes campanhas", temas: [], quando: { kind: "feriado", titulo: "Carnaval", antes: 12 }, feriados: ["Carnaval"], tags: ["mascara", "serpentina", "folia", "cerveja"], nota: "O motor de encarte ainda não tem tema de Carnaval.", baixaResolucao: true },
  { slug: "ofertas-da-copa", nome: "Ofertas da Copa", tipo: "campanha", grupo: "Grandes campanhas", temas: [], quando: { kind: "periodo", de: "2026-05-28", ate: "2026-07-19" }, feriados: ["Copa do Mundo"], tags: ["futebol", "jogo", "bola", "brasil", "cerveja"], nota: "Evite a marca oficial da Copa nas artes. A janela de data é a da Copa de 2026 e muda a cada edição.", baixaResolucao: true },
  { slug: "volta-as-aulas", nome: "Volta às Aulas", tipo: "campanha", grupo: "Grandes campanhas", temas: [], quando: { kind: "periodo", de: "01-10", ate: "02-20" }, feriados: ["Volta às aulas"], tags: ["escola", "caderno", "lanche", "material escolar", "janeiro", "fevereiro"], nota: "O motor de encarte ainda não tem tema de volta às aulas.", baixaResolucao: true },

  // 06 Setores de alimentos
  { slug: "acougue-e-churrasco", nome: "Açougue e Churrasco", tipo: "setor", grupo: "Setores de alimentos", temas: ["acougue"], quando: SEMPRE, feriados: [], tags: ["carne", "costela", "picanha", "brasa"], baixaResolucao: true },
  { slug: "congelados", nome: "Congelados", tipo: "setor", grupo: "Setores de alimentos", temas: [], quando: SEMPRE, feriados: [], tags: ["gelo", "frio", "pizza", "sorvete"], nota: "O motor de encarte ainda não tem tema de congelados.", baixaResolucao: true },
  { slug: "frios-e-laticinios", nome: "Frios e Laticínios", tipo: "setor", grupo: "Setores de alimentos", temas: [], quando: SEMPRE, feriados: [], tags: ["queijo", "presunto", "leite", "iogurte"], nota: "O motor de encarte ainda não tem tema de frios e laticínios.", baixaResolucao: true },
  { slug: "hortifruti", nome: "Hortifrúti", tipo: "setor", grupo: "Setores de alimentos", temas: ["hortifruti"], quando: SEMPRE, feriados: [], tags: ["frutas", "verduras", "legumes", "feira"], baixaResolucao: true },
  { slug: "mercearia", nome: "Mercearia", tipo: "setor", grupo: "Setores de alimentos", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["arroz", "macarrao", "enlatados", "secos"], baixaResolucao: true },
  { slug: "padaria", nome: "Padaria", tipo: "setor", grupo: "Setores de alimentos", temas: ["padaria"], quando: SEMPRE, feriados: [], tags: ["pao", "croissant", "confeitaria", "trigo"], baixaResolucao: true },

  // 07 Setores de casa e cuidados
  { slug: "bazar", nome: "Bazar", tipo: "setor", grupo: "Setores de casa e cuidados", temas: [], quando: SEMPRE, feriados: [], tags: ["panelas", "utilidades", "cozinha", "casa"], nota: "O motor de encarte ainda não tem tema de bazar.", baixaResolucao: true },
  { slug: "bebidas", nome: "Bebidas", tipo: "setor", grupo: "Setores de casa e cuidados", temas: ["bebidas"], quando: SEMPRE, feriados: [], tags: ["cerveja", "refrigerante", "suco", "gelada"], baixaResolucao: true },
  { slug: "higiene", nome: "Higiene", tipo: "setor", grupo: "Setores de casa e cuidados", temas: [], quando: SEMPRE, feriados: [], tags: ["sabonete", "papel higienico", "shampoo", "perfumaria"], nota: "Sem tema próprio no motor de encarte (o de limpeza é o mais próximo).", baixaResolucao: true },
  { slug: "limpeza", nome: "Limpeza", tipo: "setor", grupo: "Setores de casa e cuidados", temas: ["limpeza"], quando: SEMPRE, feriados: [], tags: ["detergente", "sabao", "desinfetante", "casa"], baixaResolucao: true },
  { slug: "pet", nome: "Pet", tipo: "setor", grupo: "Setores de casa e cuidados", temas: [], quando: SEMPRE, feriados: [], tags: ["cachorro", "gato", "racao", "animais"], nota: "O motor de encarte ainda não tem tema de pet.", baixaResolucao: true },

  // 08 Condições comerciais
  { slug: "clube-de-ofertas", nome: "Clube de Ofertas", tipo: "condicao", grupo: "Condições comerciais", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["fidelidade", "cartao", "cadastro", "app"], nota: "Pequeno corte na borda esquerda no arquivo original, já limpo na galeria.", baixaResolucao: true },
  { slug: "lancamento-de-marca", nome: "Lançamento de Marca", tipo: "condicao", grupo: "Condições comerciais", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["novidade", "estreia", "fornecedor", "degustacao"], baixaResolucao: true },
  { slug: "liquidacao", nome: "Liquidação", tipo: "condicao", grupo: "Condições comerciais", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["saldao", "descontao", "limpa estoque"], baixaResolucao: true },
  { slug: "ofertas-do-atacarejo", nome: "Ofertas do Atacarejo", tipo: "condicao", grupo: "Condições comerciais", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["atacado", "varejo", "caixa", "fardo"], baixaResolucao: true },
  { slug: "preco-exclusivo", nome: "Preço Exclusivo", tipo: "condicao", grupo: "Condições comerciais", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["clube", "cartao", "so para clientes"], baixaResolucao: true },
  { slug: "queima-de-estoque", nome: "Queima de Estoque", tipo: "condicao", grupo: "Condições comerciais", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["liquidacao", "ultimas unidades", "fogo"], baixaResolucao: true },

  // 09 Clientes e calendário
  { slug: "dia-20-ofertas", nome: "Dia 20 Ofertas", tipo: "calendario", grupo: "Clientes e calendário", temas: ["ofertas"], quando: { kind: "diaDoMes", dias: [20], antes: 3 }, feriados: [], tags: ["quinzena", "vale", "pagamento"], nota: "Há um ponto depois do número no arquivo. Confira se é intencional.", baixaResolucao: true },
  { slug: "dia-5-ofertas", nome: "Dia 5 Ofertas", tipo: "calendario", grupo: "Clientes e calendário", temas: ["ofertas"], quando: { kind: "diaDoMes", dias: [5], antes: 3 }, feriados: [], tags: ["quinto dia util", "salario", "pagamento"], nota: "Há um ponto depois do número no arquivo. Confira se é intencional.", baixaResolucao: true },
  { slug: "dia-do-cartao", nome: "Dia do Cartão", tipo: "calendario", grupo: "Clientes e calendário", temas: ["ofertas"], quando: SEMPRE, feriados: [], tags: ["cartao da casa", "parcelado", "fatura"], baixaResolucao: true },
  { slug: "dia-do-cliente", nome: "Dia do Cliente", tipo: "calendario", grupo: "Clientes e calendário", temas: ["ofertas"], quando: { kind: "feriado", titulo: "Dia do Cliente", antes: 7 }, feriados: ["Dia do Cliente"], tags: ["15 de setembro", "fidelidade", "agradecimento"], baixaResolucao: true },
  { slug: "feriadao-de-ofertas", nome: "Feriadão de Ofertas", tipo: "calendario", grupo: "Clientes e calendário", temas: ["fim-de-semana", "ofertas"], quando: SEMPRE, feriados: ["Feriado prolongado"], tags: ["praia", "viagem", "churrasco", "emenda"], baixaResolucao: true },
  { slug: "ofertas-do-dia-de-salario", nome: "Ofertas do Dia de Salário", tipo: "calendario", grupo: "Clientes e calendário", temas: ["ofertas"], quando: { kind: "diaDoMes", dias: [5, 20], antes: 2 }, feriados: [], tags: ["pagamento", "quinto dia util", "dinheiro", "vale"], baixaResolucao: true },

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
];

export const emblemaPng = (slug: string, variante?: Variante) => `/emblemas/${slug}${variante ? `--${variante}` : ""}.png`;
export const emblemaThumb = (slug: string) => `/emblemas/t/${slug}.webp`;
export function emblemaPorSlug(slug: string): Emblema | undefined {
  return EMBLEMAS.find((e) => e.slug === slug);
}
