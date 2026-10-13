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
  { id: "acougue", nome: "Açougue e churrasco", themeKey: "acougue", busca: "carne churrasco acougue boi frango picanha linguica", emblemas: ["terca-da-carne", "acougue-e-churrasco", "hora-da-carne", "sabado-do-churrasco", "churrasco-de-domingo", "terca-da-carne"], fundos: ["dp05", "dp06", "pa16", "pa02", "cs33", "cs48"], caixas: ["cx07", "cx04", "cx17", "cx16", "cx10", "cx19"] },
  { id: "padaria", nome: "Padaria", themeKey: "padaria", busca: "pao padaria bolo confeitaria cafe da manha", emblemas: ["padaria", "padaria", "padaria", "padaria", "padaria", "padaria"], fundos: ["dp12", "pa04", "pp06", "pa19", "dp11", "pa23"], caixas: ["cx19", "cx10", "cx13", "cx21", "cx22", "cx06"] },
  { id: "bebidas", nome: "Bebidas", themeKey: "bebidas", busca: "bebida cerveja refrigerante suco agua vinho", emblemas: ["bebidas", "sexta-da-cerveja", "bebidas", "sexta-da-cerveja", "bebidas", "sexta-da-cerveja"], fundos: ["dp16", "pa03", "pp16", "cs37", "pa07", "cs28"], caixas: ["cx05", "cx11", "cx12", "cx18", "cx15", "cx04"] },
  { id: "limpeza", nome: "Limpeza e higiene", themeKey: "limpeza", busca: "limpeza higiene sabao detergente shampoo papel", emblemas: ["limpeza", "higiene", "limpeza", "higiene", "limpeza", "higiene"], fundos: ["dp08", "dp07", "pa03", "pp13", "pa24", "cs45"], caixas: ["cx05", "cx15", "cx12", "cx08", "cx09", "cx18"] },
  { id: "mercearia", nome: "Mercearia e cesta", themeKey: "ofertas", busca: "mercearia cesta basica arroz feijao atacarejo clube", emblemas: ["mercearia", "cesta-basica", "ofertas-do-atacarejo", "clube-de-ofertas", "mercearia", "cesta-basica"], fundos: ["dp15", "pp21", "cs39", "pa12", "cs41", "pp10"], caixas: ["cx06", "cx21", "cx13", "cx20", "cx01", "cx03"] },
  { id: "frios", nome: "Frios e congelados", themeKey: "ofertas", busca: "frios laticinios queijo presunto leite iogurte congelados sorvete", emblemas: ["frios-e-laticinios", "congelados", "frios-e-laticinios", "congelados", "frios-e-laticinios", "congelados"], fundos: ["dp17", "dp09", "dp14", "pa09", "pa05", "pp14"], caixas: ["cx15", "cx08", "cx12", "cx05", "cx14", "cx22"] },
  { id: "pet-bazar", nome: "Pet e bazar", themeKey: "ofertas", busca: "pet racao animal bazar utilidades casa", emblemas: ["pet", "bazar", "pet", "bazar", "pet", "bazar"], fundos: ["dp21", "dp23", "pa21", "cs40", "pp18", "pa10"], caixas: ["cx09", "cx06", "cx11", "cx18", "cx08", "cx20"] },
  { id: "black-friday", nome: "Black Friday", themeKey: "black-friday", busca: "black friday esquenta week desconto preto", emblemas: ["black-friday", "esquenta-black-friday", "black-week", "black-friday", "esquenta-black-friday", "black-week"], fundos: ["cs31", "pp24", "cs42", "cs46", "cs48", "pa19"], caixas: ["cx04", "cx17", "cx11", "cx12", "cx05", "cx03"] },
  { id: "natal", nome: "Natal e ano novo", themeKey: "natal", busca: "natal ceia panetone chocotone ano novo reveillon", emblemas: ["natal-de-ofertas", "ceia-de-natal", "panetones-e-chocotones", "ofertas-de-ano-novo", "ceia-de-ano-novo", "natal-de-ofertas"], fundos: ["fs25", "fs26", "fs38", "fs28", "fs34", "cs48"], caixas: ["cx16", "cx01", "cx17", "cx22", "cx03", "cx07"] },
  { id: "pascoa", nome: "Páscoa", themeKey: "pascoa", busca: "pascoa ovo chocolate coelho", emblemas: ["pascoa-de-ofertas", "ovos-de-pascoa", "pascoa-de-ofertas", "ovos-de-pascoa", "pascoa-de-ofertas", "ovos-de-pascoa"], fundos: ["fs29", "fs39", "pp03", "pa11", "pa17", "cs38"], caixas: ["cx22", "cx16", "cx13", "cx14", "cx15", "cx08"] },
  { id: "maes", nome: "Mães, namorados e mulher", themeKey: "dia-das-maes", busca: "mae maes namorados mulher flores dia das maes", emblemas: ["dia-das-maes", "dia-dos-namorados", "dia-da-mulher", "dia-das-maes", "dia-dos-namorados", "dia-da-mulher"], fundos: ["fs39", "fs31", "fs29", "pp20", "pa17", "cs38"], caixas: ["cx22", "cx16", "cx13", "cx19", "cx14", "cx08"] },
  { id: "pais-criancas", nome: "Pais e crianças", themeKey: "dia-dos-pais", busca: "pai pais crianca criancas infantil brinquedo dia dos pais", emblemas: ["dia-dos-pais", "dia-das-criancas", "dia-dos-pais", "dia-das-criancas", "dia-dos-pais", "dia-das-criancas"], fundos: ["cs37", "cs28", "pa21", "fs35", "fs32", "pa03"], caixas: ["cx05", "cx11", "cx18", "cx06", "cx03", "cx12"] },
  { id: "junina", nome: "Festa junina", themeKey: "festa-junina", busca: "junina sao joao milho quermesse caipira", emblemas: ["festa-junina", "festa-junina", "festa-junina", "festa-junina", "festa-junina", "festa-junina"], fundos: ["fs33", "fs32", "pa12", "pp12", "pa15", "pa04"], caixas: ["cx06", "cx21", "cx13", "cx10", "cx19", "cx01"] },
  { id: "aniversario", nome: "Aniversário e inauguração", themeKey: "aniversario", busca: "aniversario inauguracao reinauguracao festa loja nova", emblemas: ["aniversario-da-loja", "inauguracao", "reinauguracao", "aniversario-da-loja", "inauguracao", "reinauguracao"], fundos: ["fs27", "fs28", "fs34", "cs33", "fs32", "pa14"], caixas: ["cx03", "cx01", "cx18", "cx05", "cx17", "cx11"] },
  { id: "condicoes", nome: "Condições e liquidação", themeKey: "ofertas", busca: "leve 3 pague 2 liquidacao queima estoque pix frete gratis fabrica exclusivo lancamento novidade", emblemas: ["leve-3-pague-2", "liquidacao", "queima-de-estoque", "pague-com-pix", "preco-de-fabrica", "novidade"], fundos: ["cs41", "cs33", "cs44", "pp12", "cs47", "pa14"], caixas: ["cx06", "cx03", "cx04", "cx18", "cx01", "cx11"] },
  { id: "calendario", nome: "Dias de cliente e salário", themeKey: "ofertas", busca: "dia 5 dia 20 salario cartao cliente consumidor fim de mes", emblemas: ["dia-5-ofertas", "dia-20-ofertas", "ofertas-do-dia-de-salario", "dia-do-cartao", "dia-do-cliente", "fim-de-mes"], fundos: ["cs37", "cs36", "cs39", "cs28", "cs40", "pp15"], caixas: ["cx05", "cx02", "cx21", "cx12", "cx18", "cx15"] },
  { id: "eventos", nome: "Copa, carnaval e aulas", themeKey: "ofertas", busca: "copa carnaval volta as aulas escola evento", emblemas: ["ofertas-da-copa", "carnaval-de-ofertas", "volta-as-aulas", "ofertas-da-copa", "carnaval-de-ofertas", "volta-as-aulas"], fundos: ["cs36", "fs27", "pa21", "pa01", "fs35", "pp07"], caixas: ["cx02", "cx09", "cx05", "cx14", "cx11", "cx18"] },
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

export { semAcento as normalizarBusca };
