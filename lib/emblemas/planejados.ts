import type { Feriado, Quando, TipoOferta } from "./tipos";

// Emblemas que ainda faltam criar para cobrir o que supermercado faz de
// tabloide. A prioridade segue a frequência de uso e o dinheiro que a
// data ou a promoção movimenta: 1 aparece toda semana ou mês, 2 algumas
// vezes por ano, 3 é nicho ou complemento. "ideia" já serve de briefing
// para gerar a arte no mesmo estilo dos 59 prontos (letras 3D, brilho,
// elementos do tema atrás do texto).

export type Planejado = {
  nome: string;
  tipo: TipoOferta;
  prioridade: 1 | 2 | 3;
  ideia: string;
  feriados?: Feriado[];
  quando?: Quando;
  motivo?: string;
};

const sem = (...dias: number[]): Quando => ({ kind: "semana", dias });

export const PLANEJADOS: Planejado[] = [
  // Dias da semana e ofertões
  { nome: "Ofertão de Sábado", tipo: "ofertao", prioridade: 1, ideia: "Mesma família verde e dourada dos outros ofertões, faixa SÁBADO", quando: sem(6), motivo: "Sábado é o dia de maior movimento e não tem ofertão" },
  { nome: "Ofertão de Domingo", tipo: "ofertao", prioridade: 2, ideia: "Mesma família dos ofertões, faixa DOMINGO", quando: sem(0) },
  { nome: "Ofertão do Mês", tipo: "ofertao", prioridade: 1, ideia: "Mesma família dos ofertões, faixa MÊS, sem nome de mês para servir o ano todo", motivo: "Hoje só existe o de Setembro, o genérico evita fazer 12" },
  { nome: "Ofertão de Janeiro a Dezembro (11 meses)", tipo: "ofertao", prioridade: 3, ideia: "Mesma família, um por mês, só se o cliente quiser o nome do mês", quando: { kind: "sempre" } },
  { nome: "Sábado do Churrasco", tipo: "dia-da-semana", prioridade: 1, ideia: "Grelha com chamas, espetos e carne, placa de madeira", quando: sem(6), motivo: "Carne e bebida vendem mais no fim de semana" },
  { nome: "Sexta do Churrasco", tipo: "dia-da-semana", prioridade: 2, ideia: "Variante da Terça da Carne com brasa e linguiça", quando: sem(5) },
  { nome: "Segunda da Limpeza", tipo: "dia-da-semana", prioridade: 3, ideia: "Balde, esponja e bolhas, letras azuis e verdes", quando: sem(1) },
  { nome: "Quinta da Padaria", tipo: "dia-da-semana", prioridade: 3, ideia: "Pão quente com vapor e trigo", quando: sem(4) },
  { nome: "Sábado de Ofertas", tipo: "periodo", prioridade: 1, ideia: "Calendário vermelho no estilo Ofertas de Fim de Semana, faixa SÁBADO", quando: sem(6) },
  { nome: "Domingo de Ofertas", tipo: "periodo", prioridade: 2, ideia: "Variante com sol e cesta", quando: sem(0) },
  { nome: "Oferta Relâmpago", tipo: "periodo", prioridade: 1, ideia: "Raio amarelo e relógio, letras vermelhas, no estilo do Só Hoje", motivo: "Urgência de poucas horas, muito usada em story" },
  { nome: "Última Chance", tipo: "periodo", prioridade: 2, ideia: "Ampulheta e seta, vermelho e preto" },
  { nome: "Estoque Limitado", tipo: "periodo", prioridade: 2, ideia: "Caixas quase vazias e placa de aviso" },

  // Condições comerciais
  { nome: "Leve 3 Pague 2", tipo: "condicao", prioridade: 1, ideia: "Três produtos com o número 3 e o 2 em destaque, selo redondo", motivo: "É um dos rótulos fixos do editor" },
  { nome: "Compre 1 Leve 2", tipo: "condicao", prioridade: 2, ideia: "Duas sacolas de compras, +1 grande" },
  { nome: "Imperdível", tipo: "condicao", prioridade: 1, ideia: "Estrela dourada e letras vermelhas, brilho", motivo: "É um dos rótulos fixos do editor" },
  { nome: "Novidade", tipo: "condicao", prioridade: 1, ideia: "Fita NOVO e estrelas, azul e amarelo", motivo: "É um dos rótulos fixos do editor" },
  { nome: "Super Oferta", tipo: "condicao", prioridade: 2, ideia: "Capa de herói, letras com raio" },
  { nome: "Mega Oferta", tipo: "condicao", prioridade: 3, ideia: "Explosão amarela e letras azuis" },
  { nome: "Preço de Atacado", tipo: "condicao", prioridade: 2, ideia: "Fardo e caixa fechada, etiqueta ATACADO" },
  { nome: "2ª Unidade com Desconto", tipo: "condicao", prioridade: 2, ideia: "Dois produtos e percentual na segunda" },
  { nome: "Compre e Ganhe", tipo: "condicao", prioridade: 2, ideia: "Caixa de presente com laço" },
  { nome: "Preço Mínimo Garantido", tipo: "condicao", prioridade: 2, ideia: "Escudo com selo de garantia e seta para baixo" },
  { nome: "Ofertas do App", tipo: "condicao", prioridade: 2, ideia: "Celular com cupom e raio" },
  { nome: "Ofertas pelo WhatsApp", tipo: "condicao", prioridade: 2, ideia: "Balão verde de conversa com sacola" },
  { nome: "Cashback", tipo: "condicao", prioridade: 3, ideia: "Moedas voltando para a carteira" },
  { nome: "Cartão da Casa", tipo: "condicao", prioridade: 3, ideia: "Cartão dourado com coroa, na linha do Clube de Ofertas" },
  { nome: "Vence Logo", tipo: "condicao", prioridade: 3, ideia: "Relógio e etiqueta de validade para produtos perto do vencimento" },

  // Datas comemorativas
  { nome: "Dia da Mulher", tipo: "data", prioridade: 1, ideia: "Flores, laço lilás e coração, 8 de março", quando: { kind: "periodo", de: "02-25", ate: "03-08" }, motivo: "Entra no calendário do app e não tem emblema" },
  { nome: "Dia do Consumidor", tipo: "data", prioridade: 1, ideia: "Carrinho, sacola e selo 15/03", feriados: [], quando: { kind: "periodo", de: "03-05", ate: "03-15" } },
  { nome: "Ceia de Natal", tipo: "data", prioridade: 1, ideia: "Mesa farta com peru, panetone e taças, verde e dourado", feriados: ["Natal"], quando: { kind: "feriado", titulo: "Natal", antes: 21 }, motivo: "Maior ticket do ano, merece emblema além do Natal de Ofertas" },
  { nome: "Esquenta Black Friday", tipo: "campanha", prioridade: 1, ideia: "Chama e contagem regressiva no preto e amarelo da Black Friday", feriados: ["Black Friday"], quando: { kind: "feriado", titulo: "Black Friday", antes: 30 } },
  { nome: "Semana Santa e Bacalhau", tipo: "data", prioridade: 2, ideia: "Bacalhau, azeite e cruz discreta, tons de azul e dourado", feriados: ["Páscoa"], quando: { kind: "feriado", titulo: "Páscoa", antes: 10 } },
  { nome: "Halloween", tipo: "data", prioridade: 2, ideia: "Abóbora e guloseimas, laranja e roxo", quando: { kind: "periodo", de: "10-20", ate: "10-31" } },
  { nome: "Dia dos Avós", tipo: "data", prioridade: 2, ideia: "Cesta de café da tarde, óculos e xícara", quando: { kind: "periodo", de: "07-15", ate: "07-26" } },
  { nome: "Dia do Amigo", tipo: "data", prioridade: 3, ideia: "Brinde com cerveja e petisco", quando: { kind: "periodo", de: "07-14", ate: "07-20" } },
  { nome: "Dia do Chocolate", tipo: "data", prioridade: 3, ideia: "Barras e calda de chocolate", quando: { kind: "periodo", de: "07-01", ate: "07-07" } },
  { nome: "Dia da Pizza", tipo: "data", prioridade: 3, ideia: "Pizza fumegante com queijo esticando", quando: { kind: "periodo", de: "07-04", ate: "07-10" } },
  { nome: "Dia do Café", tipo: "data", prioridade: 3, ideia: "Xícara com vapor e grãos", quando: { kind: "periodo", de: "05-18", ate: "05-24" } },
  { nome: "Dia do Trabalhador", tipo: "data", prioridade: 3, ideia: "Feriado com churrasco e capacete amarelo", quando: { kind: "periodo", de: "04-24", ate: "05-01" } },
  { nome: "Oktoberfest", tipo: "data", prioridade: 3, ideia: "Canecas de chopp, pretzel e xadrez azul e branco", quando: { kind: "periodo", de: "10-01", ate: "10-20" } },
  { nome: "Cyber Monday", tipo: "campanha", prioridade: 3, ideia: "Mouse e carrinho, azul elétrico", feriados: ["Black Friday"] },
  { nome: "Aniversário da Cidade", tipo: "data", prioridade: 2, ideia: "Bandeirolas e brasão genérico, personalizável com o nome da cidade", motivo: "Mercado de bairro e de interior ama a data local" },
  { nome: "Festival de Inverno", tipo: "campanha", prioridade: 2, ideia: "Caldos, fondue, cobertor e vapor, vinho tinto", quando: { kind: "periodo", de: "06-15", ate: "08-15" } },
  { nome: "Verão e Praia", tipo: "campanha", prioridade: 2, ideia: "Sol, guarda-sol, sorvete e bebida gelada", quando: { kind: "periodo", de: "12-10", ate: "02-28" } },
  { nome: "Dia de Jogo", tipo: "campanha", prioridade: 2, ideia: "Bola, bandeirinhas e petiscos, sem marcas de campeonato", motivo: "Substitui as Ofertas da Copa fora do período" },

  // Setores e departamentos
  { nome: "Peixaria e Pescados", tipo: "setor", prioridade: 2, ideia: "Peixes sobre gelo e ondas, azul e laranja" },
  { nome: "Rotisseria e Pratos Prontos", tipo: "setor", prioridade: 2, ideia: "Frango assado, marmita e vapor" },
  { nome: "Doces e Chocolates", tipo: "setor", prioridade: 2, ideia: "Bombons, barras e calda" },
  { nome: "Matinal e Café", tipo: "setor", prioridade: 2, ideia: "Café, leite, cereal e pão" },
  { nome: "Vinhos", tipo: "setor", prioridade: 2, ideia: "Garrafas, taça e uvas, vinho e dourado" },
  { nome: "Cervejas", tipo: "setor", prioridade: 2, ideia: "Latas e long necks no gelo (a Sexta da Cerveja cobre só um dia)" },
  { nome: "Bebê e Infantil", tipo: "setor", prioridade: 2, ideia: "Fraldas, mamadeira e ursinho" },
  { nome: "Perfumaria e Beleza", tipo: "setor", prioridade: 2, ideia: "Perfume, batom e esmalte, rosa e dourado" },
  { nome: "Sorvetes", tipo: "setor", prioridade: 2, ideia: "Casquinha e picolé, cores vivas" },
  { nome: "Fruta da Estação", tipo: "setor", prioridade: 2, ideia: "Cesta de frutas da estação, versão sem dia da semana" },
  { nome: "Massas e Molhos", tipo: "setor", prioridade: 3, ideia: "Macarrão, molho de tomate e queijo ralado" },
  { nome: "Aves e Frango", tipo: "setor", prioridade: 3, ideia: "Frango assado e coxinha da asa" },
  { nome: "Ovos", tipo: "setor", prioridade: 3, ideia: "Bandeja de ovos e galinha" },
  { nome: "Orgânicos e Naturais", tipo: "setor", prioridade: 3, ideia: "Folhas, selo verde e cesta de palha" },
  { nome: "Lanches e Salgadinhos", tipo: "setor", prioridade: 3, ideia: "Pacotes, biscoitos e refrigerante" },
  { nome: "Utilidades e Descartáveis", tipo: "setor", prioridade: 3, ideia: "Copos, pratos e talheres de festa" },
  { nome: "Papelaria e Escolar", tipo: "setor", prioridade: 3, ideia: "Cadernos e lápis, no estilo do Volta às Aulas" },
  { nome: "Eletro e Ventilação", tipo: "setor", prioridade: 3, ideia: "Ventilador, liquidificador e fritadeira" },

  // Loja e calendário do cliente
  { nome: "Semana do Aniversário", tipo: "loja", prioridade: 2, ideia: "Bolo com velas e balões, faixa SEMANA" },
  { nome: "Nova Loja", tipo: "loja", prioridade: 3, ideia: "Fachada e faixa de abertura" },
  { nome: "Delivery e Compre Online", tipo: "loja", prioridade: 2, ideia: "Moto de entrega e sacola" },
  { nome: "Hora do Pão Quente", tipo: "loja", prioridade: 2, ideia: "Pão saindo do forno e relógio", motivo: "Chama o cliente no horário certo e cabe em story" },
  { nome: "Cliente Fiel", tipo: "loja", prioridade: 2, ideia: "Medalha, coração e estrelas" },
  { nome: "Plantão de Feriado", tipo: "loja", prioridade: 3, ideia: "Placa ABERTO e relógio", feriados: ["Feriado prolongado"] },
  { nome: "Semana do Salário", tipo: "calendario", prioridade: 2, ideia: "Pilha de moedas e sacola, versão de uma semana", quando: { kind: "diaDoMes", dias: [10], antes: 8 } },
  { nome: "Dia 10 Ofertas", tipo: "calendario", prioridade: 3, ideia: "Mesma família do Dia 5 e Dia 20", quando: { kind: "diaDoMes", dias: [10], antes: 3 } },
  { nome: "Dia 15 Ofertas", tipo: "calendario", prioridade: 3, ideia: "Mesma família do Dia 5 e Dia 20", quando: { kind: "diaDoMes", dias: [15], antes: 3 } },
  { nome: "Dia 30 Ofertas", tipo: "calendario", prioridade: 3, ideia: "Mesma família do Dia 5 e Dia 20", quando: { kind: "diaDoMes", dias: [30], antes: 3 } },
];

// Peças que não são logo de campanha e saem em código (selos de preço,
// etiquetas e faixas), para não gastar geração de imagem com o que o motor
// de encarte desenha nítido em qualquer tamanho.
export const EM_CODIGO = [
  "Selo de percentual (-10%, -20%, -30%, -50% OFF)",
  "Selo NOVO, OFERTA, SUPER PREÇO, IMPERDÍVEL",
  "Etiqueta de preço em quatro formas (placa, etiqueta, arco, escudo)",
  "Faixa de validade e faixa de limite por cliente",
  "Selo de preço de clube e preço para quem tem cartão",
  "Monograma do mercado quando o cliente não tem logo",
];

// Variações técnicas dos emblemas prontos que valem pedir de uma vez
export const VARIACOES = [
  { nome: "Versão só texto (sem ilustração)", para: "Cabeçalhos pequenos, story com pouca altura e quadrado" },
  { nome: "Versão em uma cor (preto ou cor do mercado)", para: "Cartaz de gôndola A4 impresso em preto e branco" },
  { nome: "Versão horizontal compacta", para: "Barra de topo do encarte e capa de WhatsApp" },
];
