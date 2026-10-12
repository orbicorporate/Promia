// Cenários de fundo desenhados em código (SVG), replicados das folhas de
// referência: palco, papel, cortinas, festas e departamentos. Sem arquivos de
// imagem. Cada cenário tem cores próprias; o emblema vai por cima.

import { MALHAS, MALHA_COLS, MALHA_ROWS, PISOS } from "./cenarios-malha";

export type CenarioGrupo = "Palco" | "Papel" | "Cortinas" | "Festas" | "Departamentos";
type Fam = "palco" | "papel" | "cortina" | "depto" | "festa" | "malha";
type Mot = [string, ...string[]];
type Def = { id: string; nome: string; grupo: CenarioGrupo; fam: Fam; c: [string, string, string]; banda?: string; mot?: Mot[] };

const D = (id: string, nome: string, grupo: CenarioGrupo, fam: Fam, c: [string, string, string], banda?: string, mot?: Mot[]): Def => ({ id, nome, grupo, fam, c, banda, mot });

// motivos por departamento (preenchido abaixo, depois de MOT)
const MOT_DEPTO: Record<string, Mot[]> = {
  dp01: [["raiosSol"], ["ramo", "#8ad63a", "#2f7a22"], ["ondaPiso", "#c8e87a"]],
  dp02: [["raiosSol"], ["ramo", "#7ab83a", "#3a7a22", "ervas"], ["terra"]],
  dp03: [["seda", "#ffffff"], ["brilhos", "#ffffff"], ["ondaPiso", "#ffd0d8"]],
  dp04: [["geo", "#1a2640", "#d9895a"], ["ondaPiso", "#e8a070"]],
  dp05: [["rasgadoCanto", "#f6ecd6", "#a8161c"], ["ondaPiso", "#e8c070"]],
  dp06: [["ramo", "#7a8a3a", "#3a4a1a", "ervas"], ["luzLado", "#ffb85a"], ["ondaPiso", "#ffb060"]],
  dp07: [["espuma"], ["raiosAgua"], ["ondaPiso", "#ffffff"]],
  dp08: [["seda", "#a8d0ff"], ["brilhos", "#ffffff"], ["ondaPiso", "#ffe070"]],
  dp09: [["seda", "#ffffff"], ["brilhos", "#ffffff"], ["ondaPiso", "#9fd0ff"]],
  dp10: [["folhaCanto", "#f26a3a", "#7ab03a"]],
  dp11: [["toldo", "#1f5a35", "#ffffff"], ["ramo", "#5a8a2a", "#1f4a18"], ["ondaPiso", "#f8e8a0"]],
  dp12: [["rasgadoCanto", "#f3e0c4", "#b8501a"], ["ramo", "#a8602a", "#6a3010", "ervas"]],
  dp13: [["caustica"], ["raiosAgua"], ["ondaPiso", "#7ae8ff"]],
  dp14: [["cristais", "#b898f0"], ["brilhos", "#ffffff"], ["ondaPiso", "#c8b8ff"]],
  dp15: [["diagonais", "#14203f", "#e0a43a"], ["ondaPiso", "#ffd070"]],
  dp16: [["espuma"], ["gotas"], ["ondaPiso", "#4aa8ff"]],
  dp17: [["flores", "#e8a0b8", "#fbe0e8"], ["curvasLado", "#e8b0c0"]],
  dp18: [["bolasCanto", "#e8174f", "#ffd02a"], ["curvasLado", "#f4c040"], ["ondaPiso", "#ff4a7a"]],
  dp19: [["ramo", "#7a7a2a", "#4a5a18", "oliva"], ["curvasLado", "#9a9a4a"]],
  dp20: [["seda", "#ffd8e0"], ["brilhos", "#ffffff"], ["bokeh"], ["ondaPiso", "#ffc8d8"]],
  dp21: [["pontosLaranja"], ["curvasLado", "#5a7a3a"], ["ondaPiso", "#ffb860"]],
  dp22: [["flores", "#f6c8b0", "#fff2ea"], ["ondaPiso", "#bfe0cc"]],
  dp23: [["origami", "#1f4fe0", "#ff7a4a"], ["ondaPiso", "#4a8aff"]],
  dp24: [["cantosOuro"], ["brilhos", "#e8c872"], ["ondaPiso", "#d9b45a"]],
};

export const CENARIOS: Def[] = [
  // palco com piso
  D("pa01", "Folhas e gotas", "Palco", "palco", ["#5cb83a", "#2f8a2c", "#0b3f16"], undefined, [["folhas", "#7ed04a", "#2a7a26"], ["gotas"]]),
  D("pa02", "Cortina vermelha", "Palco", "palco", ["#8a1f1a", "#5a0f0f", "#240404"], undefined, [["cortinaPalco", "#d9a441"], ["holofotes"]]),
  D("pa03", "Bolhas azuis", "Palco", "palco", ["#2a97f5", "#0c5fd0", "#05287a"], undefined, [["bolhas"]]),
  D("pa04", "Trigo", "Palco", "palco", ["#dcb67e", "#c29255", "#8a5f30"], "#7a4a22", [["trigo"]]),
  D("pa05", "Leite", "Palco", "palco", ["#f2f8ff", "#c4def5", "#4a8fc8"], undefined, [["respingo"]]),
  D("pa06", "Dourado e azul", "Palco", "palco", ["#eebb40", "#c98d14", "#6a4106"], undefined, [["diagonais", "#1a3f9a", "#f7d56a"]]),
  D("pa07", "Água", "Palco", "palco", ["#34cfe6", "#0a8ab8", "#06406e"], undefined, [["raiosAgua"]]),
  D("pa08", "Roxo bokeh", "Palco", "palco", ["#bc86f5", "#8a4fe0", "#4a2090"], undefined, [["bokeh"]]),
  D("pa09", "Gelo", "Palco", "palco", ["#d8e8fa", "#9bb8e0", "#2a4a8a"], undefined, [["flocos"]]),
  D("pa10", "Aros turquesa", "Palco", "palco", ["#1fb0c4", "#0d7e98", "#08485f"], undefined, [["aros", "#e8c872"]]),
  D("pa11", "Papel rasgado rosa", "Palco", "palco", ["#dc8095", "#b8506a", "#6a2038"], undefined, [["rasgado", "#f0a6b6", "#8a2a4a"]]),
  D("pa12", "Formas laranja", "Palco", "palco", ["#ffe8c4", "#ffb066", "#e8641a"], undefined, [["memphis", "#ff7a1a"]]),
  D("pa13", "Sálvia", "Palco", "palco", ["#d4dab8", "#9fae7e", "#4f6a38"], undefined, [["aros", "#f2f4e0"], ["pontos", "#f2f4e0"]]),
  D("pa14", "Magenta ondas", "Palco", "palco", ["#ee3ca0", "#a8208a", "#4a1070"], undefined, [["ondas", "#f2c46a"]]),
  D("pa15", "Ocre e folhas", "Palco", "palco", ["#dcc78e", "#b79d5a", "#6a7a30"], undefined, [["folhas", "#7aa83a", "#3a6a22"]]),
  D("pa16", "Brasa", "Palco", "palco", ["#403028", "#241a16", "#0d0907"], "#1a0f0a", [["brasas"]]),
  D("pa17", "Rosé", "Palco", "palco", ["#ecbcc4", "#c08a98", "#6a4050"], undefined, [["seda", "#ffffff"], ["brilhos", "#ffffff"]]),
  D("pa18", "Pêssego e menta", "Palco", "palco", ["#ffdcd0", "#fbe6dc", "#4fb59f"], undefined, [["ondas", "#8fd8c4"]]),
  D("pa19", "Marrom e dourado", "Palco", "palco", ["#6a4528", "#3a2414", "#1a0d06"], undefined, [["cortinaPalco", "#d9a441"], ["holofotes"]]),
  D("pa20", "Toldo verde", "Palco", "palco", ["#62b044", "#2f8a34", "#0f4a1a"], undefined, [["toldo", "#1f5a35", "#ffffff"]]),
  D("pa21", "Jeans", "Palco", "palco", ["#dcc9a6", "#c7b08a", "#2f5a9a"], "#2a56a0", [["jeans"]]),
  D("pa22", "Folhas rosa", "Palco", "palco", ["#ffd6c6", "#f7bcac", "#2f6a50"], undefined, [["folhasSombra", "#2f6a50"]]),
  D("pa23", "Madeira", "Palco", "palco", ["#dcab6e", "#b8803f", "#6a4220"], undefined, [["ripas"]]),
  D("pa24", "Azul e branco", "Palco", "palco", ["#ffffff", "#dbe8fb", "#2f6adf"], undefined, [["diagonais", "#1f5fe0", "#ffffff"]]),

  // papel com faixa
  D("pp01", "Folhas ao sol", "Papel", "papel", ["#f0f6d0", "#cfe6a0", "#9bc870"], "#1f6a30", [["folhas", "#7ed04a", "#2a7a26"]]),
  D("pp02", "Folhas e terra", "Papel", "papel", ["#f6efd8", "#eadfbf", "#d8c9a0"], "#6a4a2a", [["folhasSombra", "#6a7a4a"]]),
  D("pp03", "Rosa e dourado", "Papel", "papel", ["#fbdadc", "#f4c4c8", "#e8a8b0"], "#a82a58", [["seda", "#ffffff"]]),
  D("pp04", "Azul e cobre", "Papel", "papel", ["#b2bfd0", "#9aa8be", "#7e8ea8"], "#1a2f55", [["diagonais", "#c98a5a", "#2a3f6a"]]),
  D("pp05", "Rasgado bordô", "Papel", "papel", ["#f6e6c8", "#efdab4", "#e4c99a"], "#8a1530", [["rasgado", "#b8213f", "#7a1028"]]),
  D("pp06", "Madeira e luz", "Papel", "papel", ["#7a5636", "#5a3c22", "#3a2414"], "#1a0f08", [["ripas"], ["holofotes"]]),
  D("pp07", "Bolhas turquesa", "Papel", "papel", ["#c8f4f2", "#9fe4e8", "#7ad0dc"], "#0b7a8a", [["bolhas"]]),
  D("pp08", "Ondas azuis", "Papel", "papel", ["#86d2ff", "#5cb8f5", "#3a98e8"], "#0b3fa8", [["ondas", "#ffd24a"]]),
  D("pp09", "Ondas brancas", "Papel", "papel", ["#f4f8ff", "#e4eefb", "#d0e0f6"], "#1f4fb0", [["ondas", "#a8c4f0"]]),
  D("pp10", "Coral e amarelo", "Papel", "papel", ["#ffefd4", "#ffe2b8", "#ffd09a"], "#e0364a", [["memphis", "#ff5a4a"]]),
  D("pp11", "Toldo", "Papel", "papel", ["#f8ecc0", "#f2e0a0", "#e8d284"], "#1f5a35", [["toldo", "#1f5a35", "#fff7e0"]]),
  D("pp12", "Rasgado laranja", "Papel", "papel", ["#f0d0a8", "#e6bd8a", "#d9a96e"], "#d0601a", [["rasgado", "#d0701a", "#9a4a10"]]),
  D("pp13", "Água cristalina", "Papel", "papel", ["#c8eef8", "#9fdcf0", "#62c0e4"], "#0a4f84", [["raiosAgua"]]),
  D("pp14", "Gelo lilás", "Papel", "papel", ["#e2e2fa", "#cfcff4", "#b4b4ec"], "#2a3a9a", [["flocos"]]),
  D("pp15", "Dourado e marinho", "Papel", "papel", ["#f8ead0", "#f0dcb4", "#e6c98f"], "#c99a28", [["diagonais", "#1a2f6a", "#d9a441"]]),
  D("pp16", "Azul com gotas", "Papel", "papel", ["#86d8f4", "#4ab8e8", "#1a8ad0"], "#083a70", [["bolhas"], ["gotas"]]),
  D("pp17", "Papel dobrado", "Papel", "papel", ["#f4d0de", "#ecb6ca", "#dd98b4"], "#6a1f5a", [["diagonais", "#a83a8a", "#f4a8c8"]]),
  D("pp18", "Círculos", "Papel", "papel", ["#fff4c8", "#ffe8a0", "#ffd870"], "#e0285a", [["memphis", "#ff4a6a"]]),
  D("pp19", "Folhas e sombra", "Papel", "papel", ["#e8e4c0", "#d8d4a4", "#c4c088"], "#5a7a2c", [["folhasSombra", "#5a7a2c"]]),
  D("pp20", "Rosé e aros", "Papel", "papel", ["#f6d6dc", "#eec0cc", "#e0a4b4"], "#8a3a58", [["seda", "#ffffff"]]),
  D("pp21", "Laranja e verde", "Papel", "papel", ["#ffecd0", "#ffdcb0", "#ffca8a"], "#e8641a", [["memphis", "#8a9a50"], ["pontos", "#e8801a"]]),
  D("pp22", "Pêssego e menta", "Papel", "papel", ["#fff4e8", "#fde6d4", "#f8d4ba"], "#6aba9a", [["memphis", "#f8c0a0"]]),
  D("pp23", "Cinza e coral", "Papel", "papel", ["#d4dcea", "#c4cee0", "#b0bdd4"], "#1f4fb0", [["diagonais", "#1f3f8a", "#f08a6a"]]),
  D("pp24", "Grafite e ouro", "Papel", "papel", ["#44444a", "#2a2a30", "#101012"], "#000000", [["linhasOuro"], ["holofotes"]]),

  // cortinas de seda
  D("cs25", "Cortina creme", "Cortinas", "cortina", ["#faf2e0", "#ecdcb8", "#b8a278"], undefined, [["seda", "#ffffff"]]),
  D("cs26", "Cortina petróleo", "Cortinas", "cortina", ["#14899c", "#0a5568", "#042430"], undefined, [["seda", "#6ae0f0"]]),
  D("cs27", "Cortina salmão", "Cortinas", "cortina", ["#f2a082", "#e0704e", "#8a2a14"], undefined, [["seda", "#c8502a"]]),
  D("cs28", "Cortina azul", "Cortinas", "cortina", ["#2f6af0", "#1a46c8", "#0a1f78"], undefined, [["seda", "#a8c4ff"]]),
  D("cs29", "Cortina roxa", "Cortinas", "cortina", ["#b84fc8", "#7a2a98", "#2f0e48"], undefined, [["seda", "#e8a0f0"]]),
  D("cs30", "Cortina sálvia", "Cortinas", "cortina", ["#c8dcb4", "#a4c088", "#4f6a38"], undefined, [["seda", "#eef6e0"]]),
  D("cs31", "Cortina preta", "Cortinas", "cortina", ["#3a3a3e", "#1c1c20", "#050506"], undefined, [["seda", "#d9a441"]]),
  D("cs32", "Cortina gelo", "Cortinas", "cortina", ["#ffffff", "#e6eefa", "#8aa4c8"], undefined, [["seda", "#cfe0fa"]]),
  D("cs33", "Cortina vermelha", "Cortinas", "cortina", ["#ee3a2a", "#b81414", "#4a0505"], undefined, [["seda", "#ff7a5a"]]),
  D("cs34", "Cortina lilás", "Cortinas", "cortina", ["#cfb4f0", "#b090e0", "#5a4a9a"], undefined, [["seda", "#f0e4ff"]]),
  D("cs35", "Cortina pedra", "Cortinas", "cortina", ["#e6dcc8", "#cfc2a6", "#8a7c60"], undefined, [["seda", "#f6f0e4"]]),
  D("cs36", "Cortina esmeralda", "Cortinas", "cortina", ["#16a070", "#0a6a4a", "#022a1c"], undefined, [["seda", "#5ae8b4"]]),
  D("cs37", "Cortina marinho", "Cortinas", "cortina", ["#1a4a8a", "#0c2c5e", "#030f2a"], undefined, [["seda", "#e8a050"]]),
  D("cs38", "Cortina rosa", "Cortinas", "cortina", ["#f6c4c4", "#eca0a4", "#a85058"], undefined, [["seda", "#fde4e4"]]),
  D("cs39", "Cortina mostarda", "Cortinas", "cortina", ["#eebb3a", "#c98a10", "#5a3a04"], undefined, [["seda", "#ffe08a"]]),
  D("cs40", "Cortina ciano", "Cortinas", "cortina", ["#a4ecf4", "#60c8e0", "#0a6a8a"], undefined, [["seda", "#ffffff"]]),
  D("cs41", "Cortina laranja", "Cortinas", "cortina", ["#f08a3a", "#d0601a", "#6a2a08"], undefined, [["seda", "#ffb070"]]),
  D("cs42", "Cortina aço", "Cortinas", "cortina", ["#4a74a8", "#2a4a78", "#0e2038"], undefined, [["seda", "#d8e6f6"]]),
  D("cs43", "Cortina limão", "Cortinas", "cortina", ["#d8e8a0", "#b0cc6a", "#5a7a20"], undefined, [["seda", "#f2f8d0"]]),
  D("cs44", "Cortina magenta", "Cortinas", "cortina", ["#e8386a", "#a8104a", "#4a0420"], undefined, [["seda", "#ff7aa0"]]),
  D("cs45", "Cortina branca e azul", "Cortinas", "cortina", ["#ffffff", "#eef3fb", "#2f6adf"], undefined, [["seda", "#1f5fe0"]]),
  D("cs46", "Cortina café", "Cortinas", "cortina", ["#8a5a38", "#5a3822", "#1e0f06"], undefined, [["seda", "#e0a468"]]),
  D("cs47", "Cortina aqua", "Cortinas", "cortina", ["#b0f0f0", "#6ad8dc", "#0a8a98"], undefined, [["seda", "#ffffff"]]),
  D("cs48", "Cortina vermelho e ouro", "Cortinas", "cortina", ["#e82a1a", "#a80f10", "#3a0404"], undefined, [["seda", "#f0b43a"]]),

  // festas e datas
  D("fs25", "Natal", "Festas", "festa", ["#1a6a3a", "#0f4a2a", "#052214"], undefined, [["luzes"], ["pinheiro"], ["brilhos", "#ffe8a0"]]),
  D("fs26", "Réveillon", "Festas", "festa", ["#16408a", "#0c2860", "#040c2a"], undefined, [["fogos"]]),
  D("fs27", "Confete", "Festas", "festa", ["#e82aa8", "#b0188a", "#4a0a5a"], undefined, [["confete"], ["fitas", "#f2c46a"]]),
  D("fs28", "Fitas douradas", "Festas", "festa", ["#e6d4f4", "#c8a8e8", "#7a5aa8"], undefined, [["fitas", "#d9a441"]]),
  D("fs29", "Cerejeira", "Festas", "festa", ["#f8c8d4", "#f2a8bc", "#a85a78"], undefined, [["petalas", "#ff9ab8"]]),
  D("fs30", "Geométrico", "Festas", "festa", ["#2a4a7a", "#16305a", "#08142a"], undefined, [["diagonais", "#c98a5a", "#16305a"], ["brilhos", "#e8b46a"]]),
  D("fs31", "Corações", "Festas", "festa", ["#b82030", "#8a1020", "#3a0408"], undefined, [["coracoes"]]),
  D("fs32", "Festa amarela", "Festas", "festa", ["#ffe680", "#ffd84a", "#2a8af0"], undefined, [["memphis", "#2a7af0"], ["confete"]]),
  D("fs33", "Junina", "Festas", "festa", ["#fbe8c8", "#f4d6a8", "#c8683a"], undefined, [["bandeirinhas"]]),
  D("fs34", "Luxo dourado", "Festas", "festa", ["#2e2a24", "#16130f", "#050403"], undefined, [["linhasOuro"], ["brilhos", "#e8c872"]]),
  D("fs35", "Pop art", "Festas", "festa", ["#2060f0", "#1040c8", "#0a1f78"], undefined, [["pop"]]),
  D("fs36", "Festa roxa", "Festas", "festa", ["#8a4fe0", "#5a2aa8", "#240c58"], undefined, [["bolhas"], ["fitas", "#e8b84a"], ["confete"]]),
  D("fs37", "Pôr do sol", "Festas", "festa", ["#ff9a4a", "#2fcfd8", "#0a8aa8"], undefined, [["sol"]]),
  D("fs38", "Neve", "Festas", "festa", ["#c4e0fa", "#7ab0e8", "#1a4a8a"], undefined, [["flocos"]]),
  D("fs39", "Pétalas", "Festas", "festa", ["#fad4d8", "#f4b8c4", "#a85a70"], undefined, [["petalas", "#f08aa8"], ["seda", "#ffffff"]]),
  D("fs40", "Sol vermelho", "Festas", "festa", ["#f02a12", "#c40a0a", "#4a0404"], undefined, [["raios"]]),

  // departamentos: malha de cores amostrada das referências + motivos em vetor
  ...MALHAS.map(([id, nome]) => D(id, ({ Acougue: "Açougue", Laticinios: "Laticínios", Saudaveis: "Saudáveis", Bebe: "Bebê" } as Record<string, string>)[nome] ?? nome, "Departamentos", "malha", ["#fff", "#fff", "#fff"], undefined, MOT_DEPTO[id] ?? [])),
];

export const CENARIO_IDS = CENARIOS.map((c) => c.id);
export const CENARIO_POR_ID: Record<string, Def> = Object.fromEntries(CENARIOS.map((c) => [c.id, c]));

// ---------------------------------------------------------------- utilidades
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(s: string) {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function rgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number): string {
  const x = rgb(a);
  const y = rgb(b);
  const c = x.map((v, i) => Math.round(v + (y[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
const lighten = (h: string, t: number) => mix(h, "#ffffff", t);
const darken = (h: string, t: number) => mix(h, "#000000", t);
function lum(h: string) {
  const [r, g, b] = rgb(h);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// ---------------------------------------------------------------- motivos
type Ctx = { W: number; H: number; u: number; r: () => number; def: Def; n: number };
// cada motivo devolve SVG solto, desenhado por cima do degradê base
type Motivo = (c: Ctx, a: string[]) => string;

const MOT: Record<string, Motivo> = {
  folhas: ({ W, H, u, r }, [c1 = "#6cc04a", c2 = "#2a7a26"]) => {
    let s = "";
    const leaf = (x: number, y: number, len: number, ang: number, f: string) => {
      const w = len * 0.34;
      s += `<g transform="translate(${x} ${y}) rotate(${ang})"><path d="M0 0 C${w} ${-len * 0.25} ${w} ${-len * 0.75} 0 ${-len} C${-w} ${-len * 0.75} ${-w} ${-len * 0.25} 0 0 Z" fill="${f}"/><path d="M0 0 L0 ${-len * 0.92}" stroke="#fff" stroke-opacity="0.35" stroke-width="${len * 0.025}"/></g>`;
    };
    for (const side of [0, 1]) {
      const bx = side ? W : 0;
      const dir = side ? -1 : 1;
      for (let i = 0; i < 13; i++) {
        const len = (220 + r() * 230) * u;
        const ang = (side ? -1 : 1) * (20 + r() * 110) + (side ? 0 : 0);
        const f = i % 3 === 0 ? c1 : i % 3 === 1 ? mix(c1, c2, 0.5) : c2;
        leaf(bx + dir * (r() * 140 * u - 30 * u), r() * H * 0.12 - 20 * u, len, ang * (side ? 1 : 1) + (side ? 0 : 0), f);
      }
    }
    return s;
  },
  folhasSombra: ({ W, H, u, r }, [c = "#3a6a40"]) => {
    let s = `<g opacity="0.3" filter="url(#bl)">`;
    for (const side of [0, 1]) {
      for (let i = 0; i < 7; i++) {
        const x = side ? W - r() * 220 * u : r() * 220 * u;
        const y = r() * H * 0.36;
        const len = (150 + r() * 160) * u;
        const ang = (side ? -1 : 1) * (20 + r() * 90);
        s += `<g transform="translate(${x} ${y}) rotate(${ang})"><path d="M0 0 C${len * 0.3} ${-len * 0.25} ${len * 0.3} ${-len * 0.75} 0 ${-len} C${-len * 0.3} ${-len * 0.75} ${-len * 0.3} ${-len * 0.25} 0 0 Z" fill="${c}"/></g>`;
      }
    }
    return s + `</g>`;
  },
  gotas: ({ W, H, u, r }) => {
    let s = "";
    for (let i = 0; i < 16; i++) {
      const x = r() * W;
      const y = r() * H * 0.55;
      const rr = (5 + r() * 12) * u;
      s += `<circle cx="${x}" cy="${y}" r="${rr}" fill="url(#gt)" stroke="#fff" stroke-opacity="0.5" stroke-width="${u}"/><circle cx="${x - rr * 0.3}" cy="${y - rr * 0.3}" r="${rr * 0.25}" fill="#fff" opacity="0.8"/>`;
    }
    return s;
  },
  bolhas: ({ W, H, u, r }) => {
    let s = "";
    for (let i = 0; i < 22; i++) {
      const left = r() > 0.5;
      const x = left ? r() * W * 0.35 : W - r() * W * 0.35;
      const y = r() * H * 0.34;
      const rr = (14 + r() * 70) * u;
      s += `<circle cx="${x}" cy="${y}" r="${rr}" fill="url(#bb)" stroke="#fff" stroke-opacity="0.55" stroke-width="${1.5 * u}"/><ellipse cx="${x - rr * 0.35}" cy="${y - rr * 0.4}" rx="${rr * 0.22}" ry="${rr * 0.12}" fill="#fff" opacity="0.8" transform="rotate(-35 ${x - rr * 0.35} ${y - rr * 0.4})"/>`;
    }
    return s;
  },
  bokeh: ({ W, H, u, r }) => {
    let s = "";
    for (let i = 0; i < 18; i++) {
      const left = r() > 0.4;
      const x = left ? (r() > 0.5 ? r() * W * 0.3 : W - r() * W * 0.3) : r() * W;
      const y = r() * H * 0.3;
      const rr = (20 + r() * 60) * u;
      s += `<circle cx="${x}" cy="${y}" r="${rr}" fill="#fff" opacity="${0.12 + r() * 0.3}" filter="url(#bl2)"/>`;
    }
    return s;
  },
  respingo: ({ W, u }) => {
    let s = "";
    for (const side of [0, 1]) {
      const p = (x: number) => (side ? W - x : x);
      s += `<path d="M${p(0)} ${60 * u} C${p(120 * u)} ${40 * u} ${p(220 * u)} ${130 * u} ${p(300 * u)} ${210 * u} C${p(220 * u)} ${170 * u} ${p(150 * u)} ${180 * u} ${p(0)} ${250 * u} Z" fill="#fff" opacity="0.92"/><path d="M${p(40 * u)} ${100 * u} C${p(130 * u)} ${90 * u} ${p(200 * u)} ${140 * u} ${p(260 * u)} ${200 * u}" stroke="#bcd8f4" stroke-width="${6 * u}" fill="none" opacity="0.7"/>`;
    }
    return s;
  },
  flocos: ({ W, H, u, r }) => {
    let s = "";
    const fl = (x: number, y: number, R: number) => {
      s += `<g transform="translate(${x} ${y})" stroke="#fff" stroke-opacity="0.85" stroke-width="${R * 0.07}" stroke-linecap="round" fill="none">`;
      for (let k = 0; k < 6; k++) {
        s += `<g transform="rotate(${k * 60})"><path d="M0 0 L0 ${-R}"/><path d="M0 ${-R * 0.55} L${R * 0.22} ${-R * 0.8} M0 ${-R * 0.55} L${-R * 0.22} ${-R * 0.8}"/><path d="M0 ${-R * 0.3} L${R * 0.15} ${-R * 0.46} M0 ${-R * 0.3} L${-R * 0.15} ${-R * 0.46}"/></g>`;
      }
      s += `</g>`;
    };
    for (const side of [0, 1]) {
      for (let i = 0; i < 8; i++) {
        const x = side ? W - r() * W * 0.3 : r() * W * 0.3;
        fl(x, r() * H * 0.3, (26 + r() * 70) * u);
      }
    }
    for (let i = 0; i < 40; i++) s += `<circle cx="${r() * W}" cy="${r() * H * 0.5}" r="${(1.5 + r() * 3) * u}" fill="#fff" opacity="${0.3 + r() * 0.5}"/>`;
    return s;
  },
  confete: ({ W, H, u, r }) => {
    const cols = ["#ffd84a", "#2fd0e8", "#ff4a8a", "#ffffff", "#7aff8a", "#ff8a2a"];
    let s = "";
    for (let i = 0; i < 70; i++) {
      const x = r() * W;
      const y = r() * H * (r() > 0.2 ? 0.3 : 0.85);
      const c = cols[Math.floor(r() * cols.length)];
      const w = (8 + r() * 14) * u;
      s += r() > 0.5 ? `<rect x="${x}" y="${y}" width="${w}" height="${w * 0.5}" fill="${c}" transform="rotate(${r() * 180} ${x} ${y})" opacity="0.9"/>` : `<circle cx="${x}" cy="${y}" r="${w * 0.35}" fill="${c}" opacity="0.9"/>`;
    }
    return s;
  },
  fitas: ({ W, H, u }, [c = "#d9a441"]) => {
    let s = "";
    for (const side of [0, 1]) {
      const p = (x: number) => (side ? W - x : x);
      for (let k = 0; k < 3; k++) {
        s += `<path d="M${p(-20 * u)} ${(30 + k * 24) * u} C${p(160 * u)} ${(10 + k * 30) * u} ${p(240 * u)} ${(220 + k * 20) * u} ${p(150 * u)} ${(360 + k * 30) * u} S${p(40 * u)} ${(480 + k * 20) * u} ${p(180 * u)} ${(560 + k * 10) * u}" fill="none" stroke="${k === 1 ? lighten(c, 0.35) : c}" stroke-width="${(10 - k * 2) * u}" stroke-linecap="round" opacity="0.92"/>`;
      }
    }
    return s + `<rect width="${W}" height="${H}" fill="none"/>`;
  },
  petalas: ({ W, H, u, r }, [c = "#ff9ab8"]) => {
    let s = "";
    for (let i = 0; i < 26; i++) {
      const left = r() > 0.5;
      const x = left ? r() * W * 0.34 : W - r() * W * 0.34;
      const y = r() * H * 0.4;
      const l = (22 + r() * 44) * u;
      s += `<g transform="translate(${x} ${y}) rotate(${r() * 360})"><path d="M0 0 C${l * 0.6} ${-l * 0.2} ${l * 0.7} ${-l * 0.9} 0 ${-l} C${-l * 0.7} ${-l * 0.9} ${-l * 0.6} ${-l * 0.2} 0 0 Z" fill="${r() > 0.5 ? c : lighten(c, 0.3)}" opacity="0.9"/></g>`;
    }
    return s;
  },
  coracoes: ({ W, H, u, r }) => {
    let s = "";
    for (let i = 0; i < 20; i++) {
      const left = r() > 0.5;
      const x = left ? r() * W * 0.3 : W - r() * W * 0.3;
      const y = r() * H * 0.3;
      const k = (10 + r() * 26) * u;
      s += `<path transform="translate(${x} ${y}) rotate(${(r() - 0.5) * 50})" d="M0 ${k * 0.4} C${-k} ${-k * 0.5} ${-k * 0.5} ${-k * 1.1} 0 ${-k * 0.45} C${k * 0.5} ${-k * 1.1} ${k} ${-k * 0.5} 0 ${k * 0.4 + k * 0.9} Z" fill="#ff5a6a" opacity="${0.55 + r() * 0.4}" filter="url(#bl3)"/>`;
    }
    return s;
  },
  trigo: ({ W, u, r }) => {
    let s = "";
    for (const side of [0, 1]) {
      for (let k = 0; k < 4; k++) {
        const bx = side ? W - (10 + k * 80) * u : (10 + k * 80) * u;
        const ang = (side ? -1 : 1) * (18 + k * 12);
        s += `<g transform="translate(${bx} ${-20 * u}) rotate(${ang})"><path d="M0 0 L0 ${440 * u}" stroke="#a87a38" stroke-width="${5 * u}"/>`;
        for (let g = 0; g < 12; g++) {
          const y = (130 + g * 28) * u;
          s += `<ellipse cx="${-11 * u}" cy="${y}" rx="${8 * u}" ry="${18 * u}" fill="#e8c06a" transform="rotate(-25 ${-11 * u} ${y})"/><ellipse cx="${11 * u}" cy="${y + 10 * u}" rx="${8 * u}" ry="${18 * u}" fill="#d9a848" transform="rotate(25 ${11 * u} ${y + 10 * u})"/>`;
        }
        s += `</g>`;
      }
    }
    for (let i = 0; i < 50; i++) s += `<circle cx="${r() * W}" cy="${r() * 260 * u}" r="${(1 + r() * 2.5) * u}" fill="#fff" opacity="0.55"/>`;
    return s;
  },
  diagonais: ({ W, u }, [c1 = "#1a3f9a", c2 = "#f7d56a"]) => {
    let s = "";
    for (const side of [0, 1]) {
      const p = (x: number) => (side ? W - x : x);
      s += `<polygon points="${p(0)},0 ${p(230 * u)},0 ${p(0)},${250 * u}" fill="${c1}"/><polygon points="${p(230 * u)},0 ${p(280 * u)},0 ${p(0)},${310 * u} ${p(0)},${250 * u}" fill="${c2}" opacity="0.92"/><polygon points="${p(280 * u)},0 ${p(296 * u)},0 ${p(0)},${326 * u} ${p(0)},${310 * u}" fill="#fff" opacity="0.5"/>`;
    }
    return s;
  },
  rasgado: ({ W, u, r }, [c1 = "#f0a6b6", c2 = "#8a2a4a"]) => {
    const edge = (y0: number, amp: number, from: string) => {
      let d = `M0 0 H${W} V${y0}`;
      const n = 28;
      for (let i = n; i >= 0; i--) d += ` L${(i / n) * W} ${y0 + amp * (0.2 + r() * 0.9) * (1 - 0.5 * Math.abs(i / n - 0.5))}`;
      return `<path d="${d} Z" fill="${from}"/>`;
    };
    return edge(120 * u, 70 * u, c2) + edge(90 * u, 55 * u, c1);
  },
  memphis: ({ W, H, u, r }, [c = "#ff7a1a"]) => {
    let s = "";
    for (let i = 0; i < 20; i++) {
      const left = r() > 0.5;
      const x = left ? r() * W * 0.28 : W - r() * W * 0.28;
      const y = r() * H * 0.3;
      const k = (12 + r() * 30) * u;
      const t = Math.floor(r() * 4);
      if (t === 0) s += `<circle cx="${x}" cy="${y}" r="${k}" fill="none" stroke="${c}" stroke-width="${3.5 * u}"/>`;
      else if (t === 1) s += `<path d="M${x - k} ${y} H${x + k} M${x} ${y - k} V${y + k}" stroke="${c}" stroke-width="${4 * u}" stroke-linecap="round"/>`;
      else if (t === 2) s += `<polygon points="${x},${y - k} ${x + k},${y + k} ${x - k},${y + k}" fill="${c}" opacity="0.85"/>`;
      else s += `<circle cx="${x}" cy="${y}" r="${k * 0.9}" fill="${lighten(c, 0.2)}" opacity="0.8"/>`;
    }
    return s;
  },
  pontos: ({ W, u }, [c = "#ffffff"]) => {
    let s = "";
    for (const side of [0, 1]) {
      for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) s += `<circle cx="${side ? W - (30 + i * 26) * u : (30 + i * 26) * u}" cy="${(40 + j * 26) * u}" r="${4 * u}" fill="${c}" opacity="${0.55 - i * 0.07}"/>`;
    }
    return s;
  },
  aros: ({ W, u }, [c = "#e8c872"]) => {
    let s = "";
    for (let i = 1; i <= 6; i++) s += `<circle cx="${W / 2}" cy="${-60 * u}" r="${(i * 150 + 120) * u}" fill="none" stroke="${c}" stroke-width="${2.5 * u}" opacity="${0.8 - i * 0.1}"/>`;
    return s;
  },
  ondas: ({ W, H, u }, [c = "#f2c46a"]) => {
    let s = "";
    for (let k = 0; k < 3; k++) {
      const y = (60 + k * 46) * u;
      s += `<path d="M0 ${y} C${W * 0.25} ${y - 80 * u} ${W * 0.5} ${y + 90 * u} ${W} ${y - 20 * u} L${W} 0 L0 0 Z" fill="${k === 1 ? c : lighten(c, 0.25 * k)}" opacity="${0.5 - k * 0.1}"/><path d="M0 ${y} C${W * 0.25} ${y - 80 * u} ${W * 0.5} ${y + 90 * u} ${W} ${y - 20 * u}" fill="none" stroke="${c}" stroke-width="${3 * u}" opacity="0.9"/>`;
    }
    return s + `<rect width="0" height="${H}"/>`;
  },
  brasas: ({ W, H, u, r }) => {
    let s = "";
    for (let i = 0; i < 46; i++) {
      const left = r() > 0.5;
      const x = left ? r() * W * 0.38 : W - r() * W * 0.38;
      const y = r() * H * 0.3;
      const k = (2 + r() * 6) * u;
      s += `<circle cx="${x}" cy="${y}" r="${k}" fill="${r() > 0.4 ? "#ff8a2a" : "#ffd24a"}" opacity="${0.6 + r() * 0.4}" filter="url(#bl3)"/>`;
    }
    for (let i = 0; i < 6; i++) s += `<ellipse cx="${i % 2 ? W - r() * 160 * u : r() * 160 * u}" cy="${60 * u + r() * 200 * u}" rx="${40 * u}" ry="${24 * u}" fill="#ff5a14" opacity="0.5" filter="url(#bl)"/>`;
    return s;
  },
  seda: ({ W, H, u }, [c = "#ffffff"]) => {
    let s = "";
    for (const side of [0, 1]) {
      const p = (x: number) => (side ? W - x : x);
      s += `<path d="M${p(0)} 0 H${p(W * 0.46)} C${p(W * 0.32)} ${H * 0.07} ${p(W * 0.1)} ${H * 0.14} ${p(0)} ${H * 0.34} Z" fill="${c}" opacity="0.22"/>` +
        `<path d="M${p(0)} 0 H${p(W * 0.3)} C${p(W * 0.2)} ${H * 0.05} ${p(W * 0.06)} ${H * 0.1} ${p(0)} ${H * 0.22} Z" fill="${c}" opacity="0.26"/>` +
        `<path d="M${p(W * 0.46)} 0 C${p(W * 0.32)} ${H * 0.07} ${p(W * 0.1)} ${H * 0.14} ${p(0)} ${H * 0.34}" fill="none" stroke="${c}" stroke-width="${3 * u}" opacity="0.7"/>` +
        `<path d="M${p(W * 0.36)} 0 C${p(W * 0.24)} ${H * 0.06} ${p(W * 0.08)} ${H * 0.12} ${p(0)} ${H * 0.27}" fill="none" stroke="${c}" stroke-width="${2 * u}" opacity="0.45"/>`;
    }
    return s;
  },
  brilhos: ({ W, H, u, r }, [c = "#ffe8a0"]) => {
    let s = "";
    for (let i = 0; i < 26; i++) {
      const left = r() > 0.5;
      const x = left ? r() * W * 0.34 : W - r() * W * 0.34;
      const y = r() * H * 0.34;
      const k = (3 + r() * 12) * u;
      s += `<path transform="translate(${x} ${y})" d="M0 ${-k} L${k * 0.2} ${-k * 0.2} L${k} 0 L${k * 0.2} ${k * 0.2} L0 ${k} L${-k * 0.2} ${k * 0.2} L${-k} 0 L${-k * 0.2} ${-k * 0.2} Z" fill="${c}" opacity="${0.5 + r() * 0.5}"/>`;
    }
    return s;
  },
  holofotes: ({ W, H, u }) => `<polygon points="${W * 0.22},0 ${W * 0.78},0 ${W * 0.95},${H * 0.8} ${W * 0.05},${H * 0.8}" fill="url(#cone)" opacity="0.55"/><circle cx="${W * 0.25}" cy="${14 * u}" r="${22 * u}" fill="#fff" opacity="0.85" filter="url(#bl3)"/><circle cx="${W * 0.75}" cy="${14 * u}" r="${22 * u}" fill="#fff" opacity="0.85" filter="url(#bl3)"/>`,
  cortinaPalco: ({ W, H, u }, [c = "#d9a441"]) => {
    let s = "";
    for (const side of [0, 1]) {
      const p = (x: number) => (side ? W - x : x);
      s += `<path d="M${p(0)} 0 H${p(W * 0.13)} C${p(W * 0.02)} ${H * 0.25} ${p(W * 0.18)} ${H * 0.55} ${p(W * 0.1)} ${H * 0.8} H${p(0)} Z" fill="#000" opacity="0.28"/><path d="M${p(W * 0.13)} 0 C${p(W * 0.02)} ${H * 0.25} ${p(W * 0.18)} ${H * 0.55} ${p(W * 0.1)} ${H * 0.8}" fill="none" stroke="${c}" stroke-width="${4 * u}" opacity="0.9"/><path d="M${p(W * 0.09)} 0 C${p(0)} ${H * 0.24} ${p(W * 0.13)} ${H * 0.55} ${p(W * 0.06)} ${H * 0.8}" fill="none" stroke="${c}" stroke-width="${2 * u}" opacity="0.6"/>`;
    }
    return s;
  },
  linhasOuro: ({ W, H, u }) => {
    let s = "";
    for (const side of [0, 1]) {
      const p = (x: number) => (side ? W - x : x);
      for (let k = 0; k < 3; k++) s += `<path d="M${p(0)} ${(60 + k * 26) * u} C${p(W * 0.3)} ${H * 0.2 + k * 20 * u} ${p(W * 0.45)} ${H * 0.55} ${p(W * 0.6)} ${H * 0.82}" fill="none" stroke="#d9b45a" stroke-width="${(3 - k * 0.6) * u}" opacity="${0.9 - k * 0.2}"/>`;
    }
    return s;
  },
  toldo: ({ W, u }, [c1 = "#1f5a35", c2 = "#ffffff"]) => {
    const n = 8;
    const sw = W / n;
    const bh = 120 * u;
    let s = "";
    for (let i = 0; i < n; i++) s += `<path d="M${i * sw} 0 H${(i + 1) * sw} V${bh} A${sw / 2} ${sw / 2} 0 0 1 ${i * sw} ${bh} Z" fill="${i % 2 ? c2 : c1}"/>`;
    for (let i = 0; i < n; i++) s += `<circle cx="${(i + 0.5) * sw}" cy="${bh + sw * 0.5 + 14 * u}" r="${10 * u}" fill="#fff6c0"/><circle cx="${(i + 0.5) * sw}" cy="${bh + sw * 0.5 + 14 * u}" r="${34 * u}" fill="#ffe488" opacity="0.4" filter="url(#bl3)"/>`;
    return s;
  },
  jeans: ({ W, H, u }) => {
    let s = "";
    for (const side of [0, 1]) {
      const p = (x: number) => (side ? W - x : x);
      s += `<path d="M${p(0)} 0 H${p(W * 0.28)} C${p(W * 0.18)} ${H * 0.08} ${p(W * 0.06)} ${H * 0.1} ${p(0)} ${H * 0.16} Z" fill="#2f5a9a"/><path d="M${p(W * 0.27)} 0 C${p(W * 0.18)} ${H * 0.07} ${p(W * 0.06)} ${H * 0.09} ${p(0)} ${H * 0.15}" fill="none" stroke="#e8d4a0" stroke-width="${3 * u}" stroke-dasharray="${10 * u} ${7 * u}"/>`;
    }
    return s;
  },
  ripas: ({ W, H, u, r }) => {
    let s = "";
    const n = 12;
    for (let i = 0; i < n; i++) {
      const y = (i / n) * H;
      s += `<rect x="0" y="${y}" width="${W}" height="${H / n}" fill="${i % 2 ? "#000" : "#fff"}" opacity="0.05"/><rect x="0" y="${y}" width="${W}" height="${2 * u}" fill="#000" opacity="0.35"/>`;
      for (let g = 0; g < 4; g++) s += `<path d="M${r() * W} ${y + r() * (H / n)} h${(60 + r() * 220) * u}" stroke="#000" stroke-opacity="0.12" stroke-width="${1.5 * u}"/>`;
    }
    return s;
  },
  luzes: ({ W, u }) => {
    let s = `<path d="M0 ${40 * u} Q${W * 0.25} ${150 * u} ${W * 0.5} ${60 * u} T${W} ${40 * u}" fill="none" stroke="#2a2a22" stroke-width="${3 * u}"/>`;
    const pts = 14;
    for (let i = 0; i <= pts; i++) {
      const t = i / pts;
      const x = t * W;
      const y = (t < 0.5 ? 40 + 110 * Math.sin(t * Math.PI) * 0.0 : 0) + 40 * u + Math.sin(t * Math.PI * 2) * 40 * u + (0.5 - Math.abs(t - 0.5)) * 120 * u;
      s += `<circle cx="${x}" cy="${y + 8 * u}" r="${7 * u}" fill="#ffe488"/><circle cx="${x}" cy="${y + 8 * u}" r="${26 * u}" fill="#ffd060" opacity="0.4" filter="url(#bl3)"/>`;
    }
    return s;
  },
  pinheiro: ({ W, H, u, r }) => {
    let s = "";
    for (const [bx, by, dir] of [[0, H * 0.84, 1], [W, H * 0.84, -1]] as [number, number, number][]) {
      for (let i = 0; i < 10; i++) {
        const len = (110 + r() * 120) * u;
        const ang = -20 - r() * 60;
        s += `<g transform="translate(${bx} ${by - i * 8 * u}) scale(${dir} 1) rotate(${ang})"><path d="M0 0 L${len} 0" stroke="#0a3a1e" stroke-width="${4 * u}"/>`;
        for (let k = 1; k < 12; k++) s += `<path d="M${(k * len) / 12} 0 l${6 * u} ${-18 * u} M${(k * len) / 12} 0 l${6 * u} ${18 * u}" stroke="#1a7a3e" stroke-width="${3 * u}" stroke-linecap="round"/>`;
        s += `</g>`;
      }
    }
    return s;
  },
  fogos: ({ W, H, u, r }) => {
    let s = "";
    for (const [fx, fy] of [[W * 0.18, H * 0.1], [W * 0.84, H * 0.12], [W * 0.5, H * 0.04]]) {
      const R = (80 + r() * 60) * u;
      for (let k = 0; k < 18; k++) {
        const a = (k / 18) * Math.PI * 2;
        s += `<path d="M${fx + Math.cos(a) * R * 0.3} ${fy + Math.sin(a) * R * 0.3} L${fx + Math.cos(a) * R} ${fy + Math.sin(a) * R}" stroke="#ffd870" stroke-width="${3 * u}" stroke-linecap="round" opacity="0.9"/><circle cx="${fx + Math.cos(a) * R * 1.12}" cy="${fy + Math.sin(a) * R * 1.12}" r="${3 * u}" fill="#fff0b0"/>`;
      }
    }
    return s;
  },
  bandeirinhas: ({ W, u }) => {
    const cols = ["#e8362a", "#ffd02a", "#2a9a4a", "#2a6ad8", "#f08a2a"];
    let s = `<path d="M0 ${30 * u} Q${W / 2} ${110 * u} ${W} ${30 * u}" fill="none" stroke="#6a4a2a" stroke-width="${3 * u}"/>`;
    const n = 14;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const x = t * W;
      const y = 30 * u + 80 * u * 2 * t * (1 - t) * 1.0;
      s += `<polygon points="${x - 28 * u},${y} ${x + 28 * u},${y} ${x},${y + 56 * u}" fill="${cols[i % cols.length]}"/>`;
    }
    return s;
  },
  pop: ({ W, H, u }) => {
    let s = "";
    for (const side of [0, 1]) {
      const p = (x: number) => (side ? W - x : x);
      for (let k = 0; k < 7; k++) s += `<polygon points="${p(0)},${k * 52 * u} ${p((300 - k * 20) * u)},${(k * 52 + 20) * u} ${p(0)},${(k * 52 + 52) * u}" fill="${k % 2 ? "#ffd02a" : "#fff08a"}"/>`;
      for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) s += `<circle cx="${p((330 + i * 16) * u)}" cy="${(30 + j * 16) * u}" r="${(1 + (8 - i) * 0.2) * u}" fill="#ffd02a" opacity="0.7"/>`;
    }
    return s + `<rect width="${W}" height="0" y="${H}"/>`;
  },
  sol: ({ W, H, u, r }) => {
    let s = `<circle cx="${W / 2}" cy="${H * 0.1}" r="${60 * u}" fill="#fff4b8"/><circle cx="${W / 2}" cy="${H * 0.1}" r="${190 * u}" fill="#ffe08a" opacity="0.5" filter="url(#bl)"/>`;
    for (let i = 0; i < 9; i++) s += `<ellipse cx="${r() * W}" cy="${(40 + r() * 180) * u}" rx="${(110 + r() * 160) * u}" ry="${(24 + r() * 28) * u}" fill="${r() > 0.5 ? "#ff7a5a" : "#ffb070"}" opacity="0.7" filter="url(#bl3)"/>`;
    return s;
  },
  raios: ({ W, H, u }) => {
    let s = "";
    const px = W / 2;
    const n = 24;
    const R = Math.hypot(W, H);
    for (let i = 0; i < n; i += 2) {
      const a0 = (i / n) * Math.PI;
      const a1 = ((i + 1) / n) * Math.PI;
      s += `<path d="M${px} 0 L${px + Math.cos(a0) * R} ${Math.sin(a0) * R} L${px + Math.cos(a1) * R} ${Math.sin(a1) * R} Z" fill="#ffd24a" opacity="0.5"/>`;
    }
    return s + `<circle cx="${px}" cy="0" r="${140 * u}" fill="#ffe08a" opacity="0.7" filter="url(#bl)"/>`;
  },
  raiosAgua: ({ W, H, u, r }) => {
    let s = "";
    for (let i = 0; i < 9; i++) {
      const x = r() * W;
      s += `<polygon points="${x},0 ${x + 36 * u},0 ${x + 160 * u},${H * 0.7} ${x - 90 * u},${H * 0.7}" fill="#fff" opacity="0.07"/>`;
    }
    for (let i = 0; i < 40; i++) s += `<path d="M${r() * W} ${r() * 260 * u} q${30 * u} ${-20 * u} ${60 * u} 0" stroke="#fff" stroke-width="${2 * u}" fill="none" opacity="${0.15 + r() * 0.3}"/>`;
    return s;
  },

  raiosSol: ({ W, H, u, r }) => {
    let s = `<defs><radialGradient id="sg" cx="0.5" cy="0" r="0.6"><stop offset="0" stop-color="#fff8c0" stop-opacity="0.95"/><stop offset="1" stop-color="#fff8c0" stop-opacity="0"/></radialGradient></defs><ellipse cx="${W / 2}" cy="0" rx="${W * 0.34}" ry="${H * 0.2}" fill="url(#sg)"/>`;
    const n = 14;
    for (let i = 0; i < n; i++) {
      const a = (0.12 + (i / (n - 1)) * 0.76) * Math.PI;
      const L = H * (0.35 + r() * 0.3);
      const a2 = a + 0.03;
      s += `<polygon points="${W / 2},0 ${W / 2 + Math.cos(a) * L},${Math.sin(a) * L} ${W / 2 + Math.cos(a2) * L},${Math.sin(a2) * L}" fill="#fff6b8" opacity="${0.1 + r() * 0.12}" filter="url(#bl3)"/>`;
    }
    for (let i = 0; i < 26; i++) s += `<circle cx="${W * 0.15 + r() * W * 0.7}" cy="${r() * H * 0.2}" r="${(6 + r() * 26) * u}" fill="#fff4b0" opacity="${0.15 + r() * 0.3}" filter="url(#bl2)"/>`;
    return s;
  },
  ramo: ({ W, H, u, r }, [c1 = "#8ad63a", c2 = "#2f7a22", tipo = "folha"]) => {
    let s = "";
    const folha = (x: number, y: number, len: number, ang: number, desf: boolean) => {
      const w = tipo === "ervas" ? len * 0.42 : tipo === "oliva" ? len * 0.16 : len * 0.34;
      const tom = r() > 0.5 ? c1 : mix(c1, c2, 0.55);
      const f = desf ? ` filter="url(#bl2)"` : "";
      s += `<g transform="translate(${x} ${y}) rotate(${ang})"${f}><path d="M0 0 C${w} ${-len * 0.25} ${w} ${-len * 0.75} 0 ${-len} C${-w} ${-len * 0.75} ${-w} ${-len * 0.25} 0 0 Z" fill="${tom}"/><path d="M0 0 C${w} ${-len * 0.25} ${w} ${-len * 0.75} 0 ${-len} L0 0 Z" fill="${lighten(tom, 0.3)}" opacity="0.65"/><path d="M0 0 L0 ${-len * 0.95}" stroke="${darken(tom, 0.35)}" stroke-width="${len * 0.02}" opacity="0.7"/></g>`;
    };
    for (const side of [0, 1]) {
      const dir = side ? -1 : 1;
      for (let b = 0; b < 6; b++) {
        const sx = side ? W + 10 * u : -10 * u;
        const sy = (10 + b * 48 + r() * 40) * u;
        const base = 25 + b * 15 + r() * 30;
        const L = (240 + r() * 220) * u;
        const ca = (base * Math.PI) / 180;
        const ex = sx + dir * Math.cos(ca) * L;
        const ey = sy + Math.sin(ca) * L;
        s += `<path d="M${sx} ${sy} Q${(sx + ex) / 2 + dir * 20 * u} ${(sy + ey) / 2 - 24 * u} ${ex} ${ey}" stroke="${darken(c2, 0.3)}" stroke-width="${3 * u}" fill="none" opacity="0.85"/>`;
        const k = 10;
        for (let i = 1; i <= k; i++) {
          const t = i / k;
          const x = sx + (ex - sx) * t;
          const y = sy + (ey - sy) * t;
          const len = (60 + r() * 55) * u * (tipo === "oliva" ? 1.1 : 1);
          const ang = (side ? -1 : 1) * (35 + r() * 70) * (i % 2 ? 1 : -1) + (side ? 0 : 0);
          folha(x, y, len, ang * (side ? 1 : 1), b > 2 && r() > 0.5);
        }
      }
    }
    return s;
  },
  terra: ({ W, H, u, r }) => {
    const y0 = H * 0.835;
    let d = `M0 ${y0}`;
    for (let i = 1; i <= 24; i++) d += ` L${(i / 24) * W} ${y0 + (r() - 0.5) * 26 * u}`;
    let s = `<path d="${d} V${H} H0 Z" fill="#6a3a1a"/>`;
    for (let i = 0; i < 520; i++) {
      const x = r() * W;
      const y = y0 + r() * (H - y0);
      s += `<ellipse cx="${x}" cy="${y}" rx="${(4 + r() * 14) * u}" ry="${(3 + r() * 9) * u}" fill="${r() > 0.5 ? "#8a5428" : "#3e200c"}" opacity="${0.5 + r() * 0.5}"/>`;
    }
    return s + `<rect y="${y0 - 8 * u}" width="${W}" height="${16 * u}" fill="#6a3a1a" opacity="0.35" filter="url(#bl3)"/>`;
  },
  ondaPiso: ({ W, H, u }, [c = "#ffffff"]) => `<path d="M0 ${H * 0.865} C${W * 0.25} ${H * 0.845} ${W * 0.55} ${H * 0.9} ${W} ${H * 0.86}" fill="none" stroke="${c}" stroke-width="${3 * u}" opacity="0.7"/><path d="M0 ${H * 0.865} C${W * 0.25} ${H * 0.845} ${W * 0.55} ${H * 0.9} ${W} ${H * 0.86}" fill="none" stroke="${c}" stroke-width="${12 * u}" opacity="0.18" filter="url(#bl3)"/>`,
  espuma: ({ W, H, u, r }) => {
    let s = "";
    for (const side of [0, 1]) {
      for (let i = 0; i < 38; i++) {
        const x = side ? W - r() * W * 0.34 : r() * W * 0.34;
        const y = r() * H * (0.1 + 0.1 * (1 - Math.abs((side ? W - x : x) / (W * 0.34) - 0.3)));
        const rr = (4 + r() * 22) * u;
        s += `<circle cx="${x}" cy="${y}" r="${rr}" fill="#fff" opacity="${0.55 + r() * 0.4}"/><circle cx="${x}" cy="${y}" r="${rr}" fill="none" stroke="#7ad0ff" stroke-width="${1.2 * u}" opacity="0.6"/>`;
      }
      s += `<path d="M${side ? W : 0} 0 Q${side ? W * 0.7 : W * 0.3} ${H * 0.04} ${side ? W * 0.62 : W * 0.38} ${H * 0.13}" stroke="#fff" stroke-width="${10 * u}" fill="none" opacity="0.6" stroke-linecap="round"/>`;
    }
    return s;
  },
  caustica: ({ W, H, u, r }) => {
    let s = "";
    for (let i = 0; i < 90; i++) {
      const x = r() * W;
      const y = r() * H * 0.42;
      const l = (30 + r() * 80) * u;
      s += `<path d="M${x} ${y} q${l * 0.5} ${-l * 0.4} ${l} ${(r() - 0.5) * l * 0.6}" stroke="#fff" stroke-width="${(1 + r() * 2.5) * u}" fill="none" opacity="${0.2 + r() * 0.4}" stroke-linecap="round"/>`;
    }
    return s;
  },
  geo: ({ W, H, u }, [c1 = "#1a2640", c2 = "#d9895a"]) => {
    let s = "";
    for (const side of [0, 1]) {
      const p = (x: number) => (side ? W - x : x);
      s += `<polygon points="${p(0)},0 ${p(W * 0.26)},0 ${p(0)},${H * 0.22}" fill="${c1}" opacity="0.92"/><polygon points="${p(W * 0.26)},0 ${p(W * 0.34)},0 ${p(0)},${H * 0.3} ${p(0)},${H * 0.22}" fill="${c1}" opacity="0.6"/><path d="M${p(W * 0.26)} 0 L${p(0)} ${H * 0.22}" stroke="${c2}" stroke-width="${4 * u}"/><path d="M${p(W * 0.34)} 0 L${p(0)} ${H * 0.3}" stroke="${c2}" stroke-width="${2 * u}" opacity="0.8"/><path d="M${p(W * 0.02)} ${H * 0.28} L${p(W * 0.04)} ${H * 0.82}" stroke="${c2}" stroke-width="${2 * u}" opacity="0.35"/>`;
    }
    return s;
  },
  rasgadoCanto: ({ W, H, u, r }, [papel = "#f6ecd6", base = "#a8161c"]) => {
    let s = "";
    for (const side of [0, 1]) {
      const p = (x: number) => (side ? W - x : x);
      const pts: [number, number][] = [];
      const n = 26;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        // curva do canto: de (0, 0.30H) até (0.34W, 0)
        const x = (1 - t) * (1 - t) * 0 + 2 * (1 - t) * t * W * 0.06 + t * t * W * 0.34;
        const y = (1 - t) * (1 - t) * H * 0.3 + 2 * (1 - t) * t * H * 0.12;
        pts.push([x + (r() - 0.5) * 12 * u, y + (r() - 0.5) * 12 * u]);
      }
      const edge = pts.map(([x, y], i) => `${i ? "L" : "M"}${p(x)} ${y}`).join(" ");
      s += `<path d="${edge} L${p(W * 0.34)} 0 L${p(0)} 0 Z" fill="${base}"/><path d="${edge}" fill="none" stroke="${papel}" stroke-width="${16 * u}" stroke-linejoin="round" opacity="0.95"/><path d="${edge}" fill="none" stroke="#d9a85a" stroke-width="${2 * u}" opacity="0.8" transform="translate(${side ? 14 * u : -14 * u} ${-10 * u})"/>`;
    }
    return s;
  },
  luzLado: ({ W, H, u }, [c = "#ffb85a"]) => {
    let s = "";
    for (const side of [0, 1]) {
      const p = (x: number) => (side ? W - x : x);
      s += `<path d="M${p(W * 0.01)} 0 C${p(W * 0.03)} ${H * 0.2} ${p(W * 0.05)} ${H * 0.5} ${p(W * 0.02)} ${H * 0.82}" stroke="${c}" stroke-width="${6 * u}" fill="none" opacity="0.55" filter="url(#bl3)"/><path d="M${p(W * 0.12)} 0 C${p(W * 0.02)} ${H * 0.06} ${p(W * 0.02)} ${H * 0.12} ${p(0)} ${H * 0.16}" stroke="${c}" stroke-width="${4 * u}" fill="none" opacity="0.8"/>`;
    }
    return s;
  },
  folhaCanto: ({ W, H, u }, [c1 = "#f26a3a", c2 = "#7ab03a"]) => {
    let s = `<path d="M${W} 0 H${W * 0.66} C${W * 0.78} ${H * 0.04} ${W * 0.9} ${H * 0.1} ${W} ${H * 0.2} Z" fill="${c1}" opacity="0.9"/><path d="M${W} 0 H${W * 0.8} C${W * 0.88} ${H * 0.05} ${W * 0.95} ${H * 0.1} ${W} ${H * 0.15} Z" fill="${c2}"/><path d="M0 0 H${W * 0.2} C${W * 0.1} ${H * 0.05} ${W * 0.04} ${H * 0.1} 0 ${H * 0.16} Z" fill="${c2}" opacity="0.9"/><path d="M${W} ${H * 0.1} C${W * 0.94} ${H * 0.2} ${W * 0.93} ${H * 0.3} ${W} ${H * 0.4} Z" fill="${c1}" opacity="0.8"/>`;
    s += `<path d="M${W * 0.7} 0 C${W * 0.82} ${H * 0.05} ${W * 0.92} ${H * 0.12} ${W} ${H * 0.22}" stroke="#fff" stroke-width="${3 * u}" fill="none" opacity="0.5"/>`;
    return s;
  },
  cristais: ({ W, H, u, r }, [c = "#b898f0"]) => {
    let s = "";
    for (const side of [0, 1]) {
      const p = (x: number) => (side ? W - x : x);
      for (let i = 0; i < 9; i++) {
        const x = r() * W * 0.22;
        const y = r() * H * 0.14;
        const k = (30 + r() * 70) * u;
        s += `<polygon points="${p(x)},${y} ${p(x + k * 0.5)},${y + k * 0.35} ${p(x + k * 0.3)},${y + k} ${p(x - k * 0.3)},${y + k * 0.7}" fill="${lighten(c, 0.3 + r() * 0.3)}" opacity="${0.5 + r() * 0.4}" stroke="#fff" stroke-width="${1.5 * u}"/>`;
      }
    }
    return s;
  },
  curvasLado: ({ W, H, u }, [c = "#e8b0c0"]) => {
    let s = "";
    for (const side of [0, 1]) {
      const p = (x: number) => (side ? W - x : x);
      for (let k = 0; k < 2; k++) s += `<path d="M${p(W * (0.01 + k * 0.02))} ${H * 0.22} C${p(W * (0.05 + k * 0.02))} ${H * 0.45} ${p(W * (0.07 + k * 0.03))} ${H * 0.62} ${p(W * (0.14 + k * 0.04))} ${H * 0.8}" stroke="${c}" stroke-width="${(3 - k) * u}" fill="none" opacity="${0.8 - k * 0.3}"/>`;
    }
    return s;
  },
  flores: ({ W, H, u, r }, [c1 = "#e8a0b8", c2 = "#fbe0e8"]) => {
    let s = "";
    for (const side of [0, 1]) {
      const cx = side ? W * 0.9 : W * 0.1;
      for (let f = 0; f < 3; f++) {
        const x = cx + (side ? -1 : 1) * (f * 60 - 20) * u + (r() - 0.5) * 30 * u;
        const y = (30 + f * 36 + r() * 30) * u;
        const R = (70 - f * 12) * u;
        for (let k = 0; k < 8; k++) s += `<ellipse cx="${x}" cy="${y - R * 0.55}" rx="${R * 0.38}" ry="${R * 0.62}" fill="${k % 2 ? c2 : mix(c1, c2, 0.5)}" transform="rotate(${k * 45} ${x} ${y})" opacity="0.92"/>`;
        s += `<circle cx="${x}" cy="${y}" r="${R * 0.2}" fill="${darken(c1, 0.1)}"/>`;
      }
      s += `<path d="M${side ? W : 0} ${H * 0.02} Q${side ? W * 0.84 : W * 0.16} ${H * 0.1} ${side ? W * 0.94 : W * 0.06} ${H * 0.26}" stroke="#8ab070" stroke-width="${4 * u}" fill="none" opacity="0.6"/>`;
    }
    return s;
  },
  bolasCanto: ({ W, H, u }, [c1 = "#e8174f", c2 = "#ffd02a"]) => {
    let s = "";
    for (const side of [0, 1]) {
      const p = (x: number) => (side ? W - x : x);
      s += `<path d="M${p(0)} 0 H${p(W * 0.3)} C${p(W * 0.2)} ${H * 0.03} ${p(W * 0.08)} ${H * 0.06} ${p(0)} ${H * 0.2} Z" fill="${side ? c2 : c1}"/><circle cx="${p(W * 0.07)}" cy="${H * 0.1}" r="${22 * u}" fill="${side ? c1 : c2}"/><circle cx="${p(W * 0.13)}" cy="${H * 0.07}" r="${14 * u}" fill="${c2}"/><circle cx="${p(W * 0.04)}" cy="${H * 0.16}" r="${12 * u}" fill="${c1}"/>`;
    }
    return s;
  },
  pontosLaranja: ({ W, H, u }) => {
    let s = `<path d="M0 0 H${W * 0.25} C${W * 0.14} ${H * 0.05} ${W * 0.05} ${H * 0.1} 0 ${H * 0.2} Z" fill="#ff7a14"/><path d="M${W} 0 H${W * 0.75} C${W * 0.86} ${H * 0.05} ${W * 0.95} ${H * 0.1} ${W} ${H * 0.2} Z" fill="#ff7a14"/>`;
    for (const side of [0, 1]) for (let i = 0; i < 9; i++) for (let j = 0; j < 7; j++) s += `<circle cx="${side ? W - (14 + i * 20) * u : (14 + i * 20) * u}" cy="${(14 + j * 20) * u}" r="${3 * u}" fill="#ffb060" opacity="0.7"/>`;
    return s + `<path d="M0 ${H * 0.2} C${W * 0.04} ${H * 0.4} ${W * 0.06} ${H * 0.6} ${W * 0.12} ${H * 0.8}" stroke="#6a8a3a" stroke-width="${9 * u}" fill="none" opacity="0.8"/><path d="M${W} ${H * 0.2} C${W * 0.96} ${H * 0.4} ${W * 0.94} ${H * 0.6} ${W * 0.88} ${H * 0.8}" stroke="#6a8a3a" stroke-width="${9 * u}" fill="none" opacity="0.8"/>`;
  },
  cantosOuro: ({ W, H, u }) => {
    let s = "";
    for (const [cx, cy, sx, sy] of [[0, 0, 1, 1], [W, 0, -1, 1], [0, H * 0.86, 1, -1], [W, H * 0.86, -1, -1]] as [number, number, number, number][]) {
      for (let k = 0; k < 3; k++) {
        const o = (14 + k * 14) * u;
        const L = (170 - k * 40) * u;
        s += `<path d="M${cx + sx * o} ${cy + sy * (o + L)} V${cy + sy * o} H${cx + sx * (o + L)}" stroke="#d9b45a" stroke-width="${(3 - k * 0.7) * u}" fill="none" opacity="${0.85 - k * 0.2}"/>`;
      }
    }
    return s + `<path d="M${W * 0.2} ${H * 0.07} Q${W / 2} ${H * 0.0} ${W * 0.8} ${H * 0.07}" stroke="#f0d28a" stroke-width="${3 * u}" fill="none" opacity="0.7"/>`;
  },
  origami: ({ W, H, u }, [c1 = "#1f4fe0", c2 = "#ff7a4a"]) => {
    let s = "";
    for (const side of [0, 1]) {
      const p = (x: number) => (side ? W - x : x);
      s += `<polygon points="${p(W * 0.02)},0 ${p(W * 0.24)},0 ${p(W * 0.12)},${H * 0.12}" fill="${c1}"/><polygon points="${p(W * 0.12)},${H * 0.12} ${p(W * 0.24)},0 ${p(W * 0.2)},${H * 0.17}" fill="${darken(c1, 0.25)}"/><polygon points="${p(0)},${H * 0.1} ${p(W * 0.06)},${H * 0.2} ${p(0)},${H * 0.24}" fill="${c2}"/><polygon points="${p(W * 0.2)},${H * 0.17} ${p(W * 0.24)},0 ${p(W * 0.26)},${H * 0.1}" fill="${c2}" opacity="0.85"/>`;
    }
    return s;
  },
  diagonaisPapel: () => "",
  frutas: ({ W, u }) =>
    `<circle cx="${W * 0.05}" cy="${50 * u}" r="${75 * u}" fill="#ff9a1a"/><circle cx="${W * 0.05}" cy="${50 * u}" r="${60 * u}" fill="none" stroke="#ffc460" stroke-width="${4 * u}" opacity="0.7"/><circle cx="${W * 0.95}" cy="${46 * u}" r="${62 * u}" fill="#e02a2a"/><ellipse cx="${W * 0.93}" cy="${26 * u}" rx="${16 * u}" ry="${8 * u}" fill="#fff" opacity="0.4"/>`,
  graos: ({ W, u, r }) => {
    let s = "";
    for (let i = 0; i < 46; i++) {
      const left = r() > 0.5;
      const x = left ? r() * W * 0.3 : W - r() * W * 0.3;
      const y = r() * 260 * u;
      s += `<ellipse cx="${x}" cy="${y}" rx="${(10 + r() * 6) * u}" ry="${(6 + r() * 4) * u}" fill="${left ? "#e8d4a0" : "#5a2a14"}" transform="rotate(${r() * 180} ${x} ${y})" opacity="0.92"/>`;
    }
    return s;
  },
  gelo: ({ W, u }) => {
    let s = "";
    for (const [x, y, k] of [[W * 0.06, 60 * u, 90 * u], [W * 0.92, 50 * u, 80 * u]]) {
      s += `<rect x="${x - k / 2}" y="${y - k / 2}" width="${k}" height="${k}" rx="${k * 0.2}" fill="#d8f6ff" opacity="0.65" transform="rotate(${x < W / 2 ? -14 : 16} ${x} ${y})" stroke="#fff" stroke-width="${2 * u}"/>`;
    }
    return s;
  },
  perolas: ({ W, u, r }) => {
    let s = "";
    for (let i = 0; i < 12; i++) {
      const left = r() > 0.5;
      const x = left ? r() * W * 0.28 : W - r() * W * 0.28;
      const y = (30 + r() * 220) * u;
      const k = (10 + r() * 22) * u;
      s += `<circle cx="${x}" cy="${y}" r="${k}" fill="url(#pl)"/><circle cx="${x - k * 0.3}" cy="${y - k * 0.35}" r="${k * 0.22}" fill="#fff" opacity="0.85"/>`;
    }
    return s;
  },
  patas: ({ W, u }) => {
    let s = "";
    for (const [x, y, a] of [[W * 0.08, 90 * u, -18], [W * 0.92, 80 * u, 18]] as [number, number, number][]) {
      s += `<g transform="translate(${x} ${y}) rotate(${a})" fill="#d0802a" opacity="0.8"><ellipse cx="0" cy="${14 * u}" rx="${26 * u}" ry="${21 * u}"/><ellipse cx="${-30 * u}" cy="${-8 * u}" rx="${9 * u}" ry="${13 * u}"/><ellipse cx="${-11 * u}" cy="${-24 * u}" rx="${9 * u}" ry="${13 * u}"/><ellipse cx="${11 * u}" cy="${-24 * u}" rx="${9 * u}" ry="${13 * u}"/><ellipse cx="${30 * u}" cy="${-8 * u}" rx="${9 * u}" ry="${13 * u}"/></g>`;
    }
    return s;
  },
  nuvens: ({ W, u }) => {
    let s = "";
    for (const [x, y, c] of [[W * 0.04, 70 * u, "#bfe8d8"], [W * 0.12, 170 * u, "#fdd0b0"], [W * 0.95, 90 * u, "#fbd0e0"], [W * 0.88, 40 * u, "#bfe8d8"]] as [number, number, string][]) {
      s += `<g fill="${c}" opacity="0.9"><circle cx="${x}" cy="${y}" r="${46 * u}"/><circle cx="${x + 44 * u}" cy="${y + 8 * u}" r="${36 * u}"/><circle cx="${x - 40 * u}" cy="${y + 10 * u}" r="${32 * u}"/></g>`;
    }
    return s;
  },
  cestos: ({ W, u }) => {
    let s = "";
    for (const [x, y, k] of [[W * 0.05, 50 * u, 70 * u], [W * 0.95, 60 * u, 80 * u]] as [number, number, number][]) {
      s += `<circle cx="${x}" cy="${y}" r="${k}" fill="#e8b078" opacity="0.8"/><circle cx="${x}" cy="${y}" r="${k * 0.66}" fill="none" stroke="#b8501a" stroke-width="${3 * u}" opacity="0.6"/><circle cx="${x}" cy="${y}" r="${k * 0.33}" fill="none" stroke="#b8501a" stroke-width="${3 * u}" opacity="0.6"/>`;
    }
    return s;
  },
};

// ---------------------------------------------------------------- composição
export function cenarioSvg(W: number, H: number, id: string): string | null {
  const def = CENARIO_POR_ID[id];
  if (!def) return null;
  const u = W / 1080;
  const r = rng(hash(id));
  const [c0, c1, c2] = def.c;
  const ctx: Ctx = { W, H, u, r, def, n: 0 };
  const escuro = lum(c1) < 0.35;
  const piso = def.banda ?? darken(c2, escuro ? 0.1 : 0.15);
  const fam = def.fam;

  // camadas por família
  let base = "";
  let frente = "";
  if (fam === "palco") {
    const y0 = H * 0.8;
    base = `<rect width="${W}" height="${H}" fill="url(#g)"/><rect width="${W}" height="${H}" fill="url(#spot)"/>`;
    frente = `<rect y="${y0}" width="${W}" height="${H - y0}" fill="${piso}"/><rect y="${y0}" width="${W}" height="${H - y0}" fill="url(#floor)"/><rect y="${y0}" width="${W}" height="${3 * u}" fill="#fff" opacity="0.22"/><ellipse cx="${W / 2}" cy="${y0 + 50 * u}" rx="${W * 0.42}" ry="${40 * u}" fill="#fff" opacity="0.13" filter="url(#bl)"/>`;
  } else if (fam === "papel") {
    const y0 = H * 0.8;
    base = `<rect width="${W}" height="${H}" fill="url(#g)"/><rect width="${W}" height="${H}" fill="url(#spot)"/>`;
    frente = `<rect y="${y0}" width="${W}" height="${H - y0}" fill="${piso}"/><rect y="${y0}" width="${W}" height="${H - y0}" fill="url(#floor)"/><rect y="${y0}" width="${W}" height="${2 * u}" fill="#fff" opacity="0.28"/>`;
  } else if (fam === "cortina") {
    base = `<rect width="${W}" height="${H}" fill="url(#g)"/><rect width="${W}" height="${H}" fill="url(#spot)"/>`;
    const yb = H * 0.82;
    frente = `<path d="M0 ${yb} Q${W / 2} ${yb - 70 * u} ${W} ${yb} V${H} H0 Z" fill="${darken(c2, 0.12)}"/><path d="M0 ${yb} Q${W / 2} ${yb - 70 * u} ${W} ${yb}" fill="none" stroke="#fff" stroke-width="${2.5 * u}" opacity="0.4"/><path d="M0 ${yb + 30 * u} Q${W / 2} ${yb - 30 * u} ${W} ${yb + 30 * u} V${H} H0 Z" fill="#000" opacity="0.22"/>`;
  } else if (fam === "malha") {
    const m = MALHAS.find((x) => x[0] === def.id)![2];
    const px = (cx: number, cy: number, k: number) => parseInt(m.slice((cy * MALHA_COLS + cx) * 6 + k * 2, (cy * MALHA_COLS + cx) * 6 + k * 2 + 2), 16);
    // amostra bilinear da malha em coordenadas 0..1
    const amostra = (u0: number, v0: number) => {
      const fx = Math.min(MALHA_COLS - 1.001, Math.max(0, u0 * (MALHA_COLS - 1)));
      const fy = Math.min(MALHA_ROWS - 1.001, Math.max(0, v0 * (MALHA_ROWS - 1)));
      const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      const c = [0, 1, 2].map((k) => Math.round((px(x0, y0, k) * (1 - tx) + px(x0 + 1, y0, k) * tx) * (1 - ty) + (px(x0, y0 + 1, k) * (1 - tx) + px(x0 + 1, y0 + 1, k) * tx) * ty));
      return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
    };
    const N = 2 * (MALHA_COLS - 1) + 1;
    const M = 2 * (MALHA_ROWS - 1) + 1;
    const cw = W / (N - 1);
    const ch = H / (M - 1);
    let fino = "";
    for (let ry = -1; ry <= M; ry++) {
      for (let rx = -1; rx <= N; rx++) {
        const u0 = Math.min(1, Math.max(0, rx / (N - 1)));
        const v0 = Math.min(1, Math.max(0, ry / (M - 1)));
        fino += `<rect x="${(rx * cw - cw / 2).toFixed(1)}" y="${(ry * ch - ch / 2).toFixed(1)}" width="${(cw + 1).toFixed(1)}" height="${(ch + 1).toFixed(1)}" fill="${amostra(u0, v0)}"/>`;
      }
    }
    const pis = ["dp07", "dp13", "dp16"].includes(def.id) ? null : PISOS[def.id];
    if (pis) {
      const med = [...pis.ys].sort((a, b) => a - b)[4];
      const lim = pis.ys.map((v) => (Math.abs(v - med) > 0.04 ? med : v));
      const ys = lim.map((v, i) => (lim[Math.max(0, i - 1)] + v * 2 + lim[Math.min(lim.length - 1, i + 1)]) / 4);
      const pts = [[0, ys[0]], ...ys.map((v, i) => [((i + 0.5) / ys.length) * W, v]), [W, ys[ys.length - 1]]].map(([x, v]) => [x, v * H]);
      let d = `M${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length - 1; i++) d += ` Q${pts[i][0]} ${pts[i][1]} ${(pts[i][0] + pts[i + 1][0]) / 2} ${(pts[i][1] + pts[i + 1][1]) / 2}`;
      d += ` L${W} ${pts[pts.length - 1][1]}`;
      const y0 = Math.min(...ys) * H;
      frente = `<defs><linearGradient id="pg" gradientUnits="userSpaceOnUse" x1="0" y1="${y0}" x2="0" y2="${H}"><stop offset="0" stop-color="${pis.top}"/><stop offset="1" stop-color="${pis.bot}"/></linearGradient></defs><path d="${d} V${H} H0 Z" fill="url(#pg)"/><path d="${d}" fill="none" stroke="#fff" stroke-width="${2.5 * u}" opacity="0.4"/>`;
    }
    base = `<defs><g id="mf">${fino}</g></defs><use href="#mf"/><use href="#mf" filter="url(#mb)"/>`;
  } else if (fam === "depto") {
    const yb = H * 0.8;
    base = `<rect width="${W}" height="${H}" fill="url(#gr)"/>`;
    frente = `<path d="M0 ${yb} Q${W / 2} ${yb - 120 * u} ${W} ${yb} V${H} H0 Z" fill="${lighten(piso, 0.22)}" opacity="0.8"/><path d="M0 ${yb + 36 * u} Q${W / 2} ${yb - 74 * u} ${W} ${yb + 36 * u} V${H} H0 Z" fill="${piso}"/><path d="M0 ${yb + 36 * u} Q${W / 2} ${yb - 74 * u} ${W} ${yb + 36 * u}" fill="none" stroke="#fff" stroke-width="${2.5 * u}" opacity="0.4"/>`;
  } else {
    // festa: degradê, luz no topo e piso suave
    base = `<rect width="${W}" height="${H}" fill="url(#g)"/><rect width="${W}" height="${H}" fill="url(#spot)"/>`;
    frente = `<rect y="${H * 0.84}" width="${W}" height="${H * 0.16}" fill="${darken(c2, 0.18)}" opacity="0.8"/><rect y="${H * 0.84}" width="${W}" height="${2 * u}" fill="#fff" opacity="0.25"/>`;
  }

  const motivos = (def.mot ?? []).map(([nome, ...args]) => (MOT[nome] ? MOT[nome](ctx, args) : "")).join("");
  const luzOp = escuro ? 0.5 : 0.7;
  const grad =
    fam === "festa" && def.id === "fs37"
      ? `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a5a"/><stop offset="0.2" stop-color="#ffc26a"/><stop offset="0.34" stop-color="#3ad6d8"/><stop offset="1" stop-color="${c2}"/></linearGradient>`
      : fam === "festa" && def.id === "fs32"
        ? `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c0}"/><stop offset="0.7" stop-color="${c1}"/><stop offset="0.82" stop-color="#7acfff"/><stop offset="1" stop-color="${c2}"/></linearGradient>`
        : `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c0}"/><stop offset="0.5" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${grad}` +
    `<radialGradient id="gr" cx="0.5" cy="0.38" r="0.75"><stop offset="0" stop-color="${lighten(c0, 0.25)}"/><stop offset="0.55" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient>` +
    `<radialGradient id="spot" cx="0.5" cy="0.02" r="0.7"><stop offset="0" stop-color="#fff" stop-opacity="${luzOp}"/><stop offset="0.5" stop-color="#fff" stop-opacity="${luzOp * 0.22}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.12"/><stop offset="1" stop-color="#000" stop-opacity="0.4"/></linearGradient>` +
    `<linearGradient id="cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<radialGradient id="vg" cx="0.5" cy="0.45" r="0.78"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${escuro ? 0.5 : 0.3}"/></radialGradient>` +
    `<radialGradient id="bb" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="0.7" stop-color="#bfe6ff" stop-opacity="0.12"/><stop offset="1" stop-color="#fff" stop-opacity="0.3"/></radialGradient>` +
    `<radialGradient id="gt" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="#fff" stop-opacity="0.7"/><stop offset="1" stop-color="#9fe0ff" stop-opacity="0.25"/></radialGradient>` +
    `<radialGradient id="pl" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#e8b8c8"/></radialGradient>` +
    `<filter id="mb" filterUnits="userSpaceOnUse" x="${-W * 0.3}" y="${-H * 0.3}" width="${W * 1.6}" height="${H * 1.6}"><feGaussianBlur stdDeviation="${(W / (2 * MALHA_COLS)) * 0.7}"/></filter><filter id="bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${22 * u}"/></filter>` +
    `<filter id="bl2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${8 * u}"/></filter>` +
    `<filter id="bl3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${3.5 * u}"/></filter>` +
    `</defs>${base}${motivos}${frente}${fam === "malha" ? "" : `<rect width="${W}" height="${H}" fill="url(#vg)"/>`}</svg>`
  );
}
