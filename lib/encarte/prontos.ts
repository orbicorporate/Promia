import { emblemaPorSlug } from "@/lib/emblemas/catalog";
import { FUNDO_LABELS } from "./labels";
import type { EncarteFundo, EncarteModelo } from "./types";

// Combinações prontas: um clique e a arte já sai com logo, fundo e caixa que
// combinam. Cada tema tem seis variações (logo, fundo e caixa diferentes).
// O primeiro passo do montador mostra tudo com filtro por tema e busca.

type Tema = {
  id: string;
  nome: string;
  themeKey: string; // tema de cores do encarte
  busca: string; // palavras que o dono pode digitar
  emblemas: string[];
  fundos: string[];
  caixas: string[];
};

export const TEMAS_PRONTOS: Tema[] = [
  { id: "ofertas", nome: "Ofertas", themeKey: "ofertas", busca: "oferta promocao semana preco baixo imperdivel relampago hoje", emblemas: ["ofertas-da-semana", "imperdivel", "oferta-relampago", "preco-baixo", "so-hoje", "semana-de-ofertas"], fundos: ["cs33", "cs37", "cs48", "pp08", "cs41", "pa03"], caixas: ["cx01", "cx03", "cx05", "cx06", "cx11", "cx18"] },
  { id: "fim-de-semana", nome: "Fim de semana", themeKey: "fim-de-semana", busca: "sabado domingo feriado feriadao sexta weekend", emblemas: ["ofertao-de-sabado", "sabado-de-ofertas", "ofertas-de-fim-de-semana", "feriadao-de-ofertas", "ofertao-de-sexta", "ofertao-do-mes"], fundos: ["cs33", "pp08", "cs40", "pp10", "fs37", "cs28"], caixas: ["cx01", "cx05", "cx03", "cx06", "cx12", "cx18"] },
  { id: "hortifruti", nome: "Hortifruti", themeKey: "hortifruti", busca: "fruta verdura legume feira horta quitanda produtor", emblemas: ["quarta-do-hortifruti", "hortifruti", "dia-de-feira", "direto-do-produtor", "feirao-de-ofertas", "quarta-do-hortifruti"], fundos: ["dp01", "dp02", "dp10", "pa01", "pp01", "pa13"], caixas: ["cx02", "cx14", "cx20", "cx13", "cx21", "cx09"] },
  { id: "acougue", nome: "Açougue e churrasco", themeKey: "acougue", busca: "carne churrasco acougue boi frango picanha linguica", emblemas: ["terca-da-carne", "acougue-e-churrasco", "hora-da-carne", "sabado-do-churrasco", "churrasco-de-domingo", "terca-da-carne"], fundos: ["ar03", "ar07", "pa16", "pa02", "cs33", "cs48"], caixas: ["cx07", "cx04", "cx17", "cx16", "cx10", "cx19"] },
  { id: "padaria", nome: "Padaria", themeKey: "padaria", busca: "pao padaria bolo confeitaria cafe da manha", emblemas: ["padaria", "padaria", "padaria", "padaria", "padaria", "padaria"], fundos: ["ar16", "pa04", "pp06", "pa19", "dp11", "pa23"], caixas: ["cx19", "cx10", "cx13", "cx21", "cx22", "cx06"] },
  { id: "bebidas", nome: "Bebidas", themeKey: "bebidas", busca: "bebida cerveja refrigerante suco agua vinho", emblemas: ["bebidas", "sexta-da-cerveja", "bebidas", "sexta-da-cerveja", "bebidas", "sexta-da-cerveja"], fundos: ["ar04", "ar06", "pp16", "cs37", "pa07", "cs28"], caixas: ["cx05", "cx11", "cx12", "cx18", "cx15", "cx04"] },
  { id: "limpeza", nome: "Limpeza e higiene", themeKey: "limpeza", busca: "limpeza higiene sabao detergente shampoo papel", emblemas: ["limpeza", "higiene", "limpeza", "higiene", "limpeza", "higiene"], fundos: ["ar09", "dp07", "pa03", "pp13", "pa24", "cs45"], caixas: ["cx05", "cx15", "cx12", "cx08", "cx09", "cx18"] },
  { id: "mercearia", nome: "Mercearia e cesta", themeKey: "ofertas", busca: "mercearia cesta basica arroz feijao atacarejo clube", emblemas: ["mercearia", "cesta-basica", "ofertas-do-atacarejo", "clube-de-ofertas", "mercearia", "cesta-basica"], fundos: ["ar10", "pp21", "cs39", "pa12", "cs41", "pp10"], caixas: ["cx06", "cx21", "cx13", "cx20", "cx01", "cx03"] },
  { id: "frios", nome: "Frios e congelados", themeKey: "ofertas", busca: "frios laticinios queijo presunto leite iogurte congelados sorvete", emblemas: ["frios-e-laticinios", "congelados", "frios-e-laticinios", "congelados", "frios-e-laticinios", "congelados"], fundos: ["ar01", "ar02", "ar05", "pa09", "pa05", "pp14"], caixas: ["cx15", "cx08", "cx12", "cx05", "cx14", "cx22"] },
  { id: "pet-bazar", nome: "Pet e bazar", themeKey: "ofertas", busca: "pet racao animal bazar utilidades casa", emblemas: ["pet", "bazar", "pet", "bazar", "pet", "bazar"], fundos: ["dp21", "dp23", "pa21", "cs40", "pp18", "pa10"], caixas: ["cx09", "cx06", "cx11", "cx18", "cx08", "cx20"] },
  { id: "black-friday", nome: "Black Friday", themeKey: "black-friday", busca: "black friday esquenta week desconto preto", emblemas: ["black-friday", "esquenta-black-friday", "black-week", "black-friday", "esquenta-black-friday", "black-week"], fundos: ["ar20", "pp24", "cs42", "cs46", "cs48", "pa19"], caixas: ["cx04", "cx17", "cx11", "cx12", "cx05", "cx03"] },
  { id: "natal", nome: "Natal e ano novo", themeKey: "natal", busca: "natal ceia panetone chocotone ano novo reveillon", emblemas: ["natal-de-ofertas", "ceia-de-natal", "panetones-e-chocotones", "ofertas-de-ano-novo", "ceia-de-ano-novo", "natal-de-ofertas"], fundos: ["ar11", "ar18", "fs38", "fs28", "fs34", "cs48"], caixas: ["cx16", "cx01", "cx17", "cx22", "cx03", "cx07"] },
  { id: "pascoa", nome: "Páscoa", themeKey: "pascoa", busca: "pascoa ovo chocolate coelho", emblemas: ["pascoa-de-ofertas", "ovos-de-pascoa", "pascoa-de-ofertas", "ovos-de-pascoa", "pascoa-de-ofertas", "ovos-de-pascoa"], fundos: ["ar14", "fs39", "pp03", "pa11", "pa17", "cs38"], caixas: ["cx22", "cx16", "cx13", "cx14", "cx15", "cx08"] },
  { id: "maes", nome: "Mães, namorados e mulher", themeKey: "dia-das-maes", busca: "mae maes namorados mulher flores dia das maes", emblemas: ["dia-das-maes", "dia-dos-namorados", "dia-da-mulher", "dia-das-maes", "dia-dos-namorados", "dia-da-mulher"], fundos: ["ar08", "ar17", "fs29", "pp20", "pa17", "cs38"], caixas: ["cx22", "cx16", "cx13", "cx19", "cx14", "cx08"] },
  { id: "pais-criancas", nome: "Pais e crianças", themeKey: "dia-dos-pais", busca: "pai pais crianca criancas infantil brinquedo dia dos pais", emblemas: ["dia-dos-pais", "dia-das-criancas", "dia-dos-pais", "dia-das-criancas", "dia-dos-pais", "dia-das-criancas"], fundos: ["ar07", "ar15", "pa21", "fs35", "fs32", "pa03"], caixas: ["cx05", "cx11", "cx18", "cx06", "cx03", "cx12"] },
  { id: "halloween", nome: "Halloween", themeKey: "halloween", busca: "halloween bruxa abobora doce travessura noite 31 de outubro terror", emblemas: ["halloween", "halloween", "halloween", "halloween", "halloween", "halloween"], fundos: ["ar80", "cs31", "cs41", "cs29", "fs36", "pa16"], caixas: ["cx04", "cx17", "cx11", "cx03", "cx12", "cx16"] },
  { id: "carnaval", nome: "Carnaval", themeKey: "carnaval", busca: "carnaval folia bloco fantasia cerveja bebida", emblemas: ["carnaval-de-ofertas", "carnaval-de-ofertas", "carnaval-de-ofertas", "carnaval-de-ofertas", "carnaval-de-ofertas", "carnaval-de-ofertas"], fundos: ["ar12", "fs27", "cs44", "pa14", "fs35", "cs34"], caixas: ["cx05", "cx11", "cx18", "cx03", "cx12", "cx06"] },
  { id: "junina", nome: "Festa junina", themeKey: "festa-junina", busca: "junina sao joao milho quermesse caipira", emblemas: ["festa-junina", "festa-junina", "festa-junina", "festa-junina", "festa-junina", "festa-junina"], fundos: ["ar13", "fs32", "pa12", "pp12", "pa15", "pa04"], caixas: ["cx06", "cx21", "cx13", "cx10", "cx19", "cx01"] },
  { id: "aniversario", nome: "Aniversário e inauguração", themeKey: "aniversario", busca: "aniversario inauguracao reinauguracao festa loja nova", emblemas: ["aniversario-da-loja", "inauguracao", "reinauguracao", "aniversario-da-loja", "inauguracao", "reinauguracao"], fundos: ["ar19", "fs28", "fs34", "cs33", "fs32", "pa14"], caixas: ["cx03", "cx01", "cx18", "cx05", "cx17", "cx11"] },
  { id: "condicoes", nome: "Condições e liquidação", themeKey: "ofertas", busca: "leve 3 pague 2 liquidacao queima estoque pix frete gratis fabrica exclusivo lancamento novidade", emblemas: ["leve-3-pague-2", "liquidacao", "queima-de-estoque", "pague-com-pix", "preco-de-fabrica", "novidade"], fundos: ["cs41", "cs33", "cs44", "pp12", "cs47", "pa14"], caixas: ["cx06", "cx03", "cx04", "cx18", "cx01", "cx11"] },
  { id: "calendario", nome: "Dias de cliente e salário", themeKey: "ofertas", busca: "dia 5 dia 20 salario cartao cliente consumidor fim de mes", emblemas: ["dia-5-ofertas", "dia-20-ofertas", "ofertas-do-dia-de-salario", "dia-do-cartao", "dia-do-cliente", "fim-de-mes"], fundos: ["cs37", "cs36", "cs39", "cs28", "cs40", "pp15"], caixas: ["cx05", "cx02", "cx21", "cx12", "cx18", "cx15"] },
  { id: "eventos", nome: "Copa, carnaval e aulas", themeKey: "ofertas", busca: "copa carnaval volta as aulas escola evento", emblemas: ["ofertas-da-copa", "carnaval-de-ofertas", "volta-as-aulas", "ofertas-da-copa", "carnaval-de-ofertas", "volta-as-aulas"], fundos: ["ar12", "fs27", "pa21", "pa01", "fs35", "pp07"], caixas: ["cx02", "cx09", "cx05", "cx14", "cx11", "cx18"] },
  { id: "feira-quitanda", nome: "Feira e quitanda", themeKey: "hortifruti", busca: "feira livre quitanda bairro produtor horta fruta verdura legume", emblemas: ["dia-de-feira", "hortifruti", "quarta-do-hortifruti", "direto-do-produtor", "fruta-da-estacao", "feirao-de-ofertas"], fundos: ["ar21", "ar22", "ar25", "ar58", "ar24", "ar34"], caixas: ["cx02", "cx14", "cx20", "cx13", "cx21", "cx09"] },
  { id: "dias-da-semana", nome: "Dias da semana", themeKey: "ofertas", busca: "segunda terca quinta sexta sabado domingo dia da semana economia churrasco peixe familia", emblemas: ["ofertao-de-segunda", "ofertao-de-terca", "ofertao-de-quinta", "ofertao-de-sexta", "sabado-de-ofertas", "ofertao-de-domingo"], fundos: ["ar23", "ar24", "ar26", "ar27", "ar28", "ar29"], caixas: ["cx05", "cx02", "cx07", "cx15", "cx06", "cx04"] },
  { id: "festivais-sabores", nome: "Festivais de sabores", themeKey: "ofertas", busca: "festival cafe massa macarrao azeite uva vinho pao doce chocolate", emblemas: ["dia-do-cafe", "massas-e-molhos", "mercearia", "vinhos", "hora-do-pao-quente", "doces-e-chocolates"], fundos: ["ar30", "ar31", "ar32", "ar36", "ar37", "ar38"], caixas: ["cx19", "cx13", "cx21", "cx22", "cx10", "cx16"] },
  { id: "saudavel-e-mar", nome: "Saudável, frutas e mar", themeKey: "hortifruti", busca: "organico natural citrico laranja limao tropical vegana sorvete peixe frutos do mar", emblemas: ["organicos-e-naturais", "fruta-da-estacao", "fruta-da-estacao", "organicos-e-naturais", "sorvetes", "peixaria-e-pescados"], fundos: ["ar33", "ar35", "ar34", "ar40", "ar39", "ar55"], caixas: ["cx14", "cx20", "cx02", "cx09", "cx15", "cx08"] },
  { id: "datas-comemorativas", nome: "Datas comemorativas", themeKey: "ofertas", busca: "volta as aulas namorados avos trabalhador independencia sao joao data comemorativa", emblemas: ["volta-as-aulas", "dia-dos-namorados", "dia-dos-avos", "dia-do-trabalhador", "super-oferta", "festa-junina"], fundos: ["ar41", "ar45", "ar44", "ar46", "ar47", "ar48"], caixas: ["cx09", "cx22", "cx19", "cx05", "cx11", "cx06"] },
  { id: "estacoes-do-ano", nome: "Estações do ano", themeKey: "ofertas", busca: "primavera verao outono inverno sopa pizza estacao frio calor", emblemas: ["semana-de-ofertas", "verao-e-praia", "ofertas-da-semana", "festival-de-inverno", "sopas-e-caldos", "dia-da-pizza"], fundos: ["ar49", "ar50", "ar51", "ar52", "ar53", "ar54"], caixas: ["cx01", "cx15", "cx10", "cx12", "cx21", "cx06"] },
  { id: "clientes-e-liquidacao", nome: "Clientes, atacado e liquidação", themeKey: "ofertas", busca: "consumidor cliente higiene beleza pet atacado queima estoque liquidacao", emblemas: ["dia-do-consumidor", "dia-do-cliente", "perfumaria-e-beleza", "pet", "preco-de-atacado", "queima-de-estoque"], fundos: ["ar42", "ar43", "ar56", "ar57", "ar59", "ar60"], caixas: ["cx05", "cx03", "cx08", "cx09", "cx06", "cx04"] },
];

export type VisualPronto = {
  slug: string; // pronto-<slug>.webp em public/miniaturas
  tema: string;
  nome: string; // nome do logo
  fundoNome: string;
  modelo: EncarteModelo;
  fundo: EncarteFundo;
  emblema: string;
  themeKey: string;
  busca: string; // texto normalizado para a busca
};

const semAcento = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export const VISUAIS_PRONTOS: VisualPronto[] = TEMAS_PRONTOS.flatMap((t) =>
  t.emblemas.map((emblema, i) => {
    const fundo = t.fundos[i] as EncarteFundo;
    const nome = emblemaPorSlug(emblema)?.nome ?? emblema;
    const fundoNome = (FUNDO_LABELS[fundo] ?? fundo).replace(/^\d{2} /, "");
    return {
      slug: `${t.id}-${i + 1}`,
      tema: t.id,
      nome,
      fundoNome,
      modelo: t.caixas[i] as EncarteModelo,
      fundo,
      emblema,
      themeKey: t.themeKey,
      busca: semAcento(`${t.nome} ${t.busca} ${nome} ${fundoNome}`),
    };
  })
);

// Cada data do calendário aponta para o grupo de combinações que combina com
// ela e para o logo que abre selecionado.
const OCASIOES: { quando: RegExp; tema: string; emblema: string }[] = [
  { quando: /halloween|bruxas/, tema: "halloween", emblema: "halloween" },
  { quando: /carnaval/, tema: "carnaval", emblema: "carnaval-de-ofertas" },
  { quando: /pascoa/, tema: "pascoa", emblema: "pascoa-de-ofertas" },
  { quando: /consumidor/, tema: "clientes-e-liquidacao", emblema: "dia-do-consumidor" },
  { quando: /dia dos? clientes?/, tema: "clientes-e-liquidacao", emblema: "dia-do-cliente" },
  { quando: /maes/, tema: "maes", emblema: "dia-das-maes" },
  { quando: /namorados/, tema: "maes", emblema: "dia-dos-namorados" },
  { quando: /junina|sao joao/, tema: "junina", emblema: "festa-junina" },
  { quando: /dia dos pais/, tema: "pais-criancas", emblema: "dia-dos-pais" },
  { quando: /criancas/, tema: "pais-criancas", emblema: "dia-das-criancas" },
  { quando: /black friday/, tema: "black-friday", emblema: "black-friday" },
  { quando: /reveillon|ano novo/, tema: "natal", emblema: "ofertas-de-ano-novo" },
  { quando: /natal/, tema: "natal", emblema: "natal-de-ofertas" },
  { quando: /aniversario/, tema: "aniversario", emblema: "aniversario-da-loja" },
];

// Combinação com que o montador abre quando o dono chega por uma data
// ("Halloween", "Dia das Mães"...). null quando a data não tem grupo próprio.
export function prontoDaOcasiao(titulo: string | null | undefined): VisualPronto | null {
  const t = semAcento(titulo ?? "");
  const o = OCASIOES.find((x) => x.quando.test(t));
  if (!o) return null;
  return VISUAIS_PRONTOS.find((v) => v.tema === o.tema && v.emblema === o.emblema) ?? VISUAIS_PRONTOS.find((v) => v.tema === o.tema) ?? null;
}

export { semAcento as normalizarBusca };
