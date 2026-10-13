import sharp from "sharp";

// Quando um produto não tem foto, o encarte mostra uma ilustração do tipo
// dele (fruta, carne, leite, limpeza...) em vez de uma letra. É um quebra
// galho bonito, não a foto do produto: o dono vê o aviso "sem foto" no
// construtor e pode enviar a foto de verdade.

type Kind =
  | "fruta" | "verdura" | "carne" | "frango" | "peixe" | "pao" | "leite" | "queijo" | "ovos"
  | "garrafa" | "lata" | "cafe" | "graos" | "limpeza" | "higiene" | "doce" | "sacola";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const REGRAS: [Kind, RegExp][] = [
  ["lata", /\b(cerveja|lata|energetico|refrigerante lata|chopp)\b/],
  ["garrafa", /\b(refrigerante|coca|pepsi|guarana|fanta|sprite|kuat|tonica|suco|agua|vinho|vodka|whisky|cachaca|espumante|oleo|azeite|vinagre|molho|ketchup|maionese|detergente liquido|garrafa|bebida)\b/],
  ["leite", /\b(leite|iogurte|requeijao|creme de leite|manteiga|margarina|bebida lactea|danone|nata)\b/],
  ["queijo", /\b(queijo|mussarela|muçarela|presunto|mortadela|frios?|salame|parmesao)\b/],
  ["ovos", /\b(ovo|ovos)\b/],
  ["frango", /\b(frango|coxa|sobrecoxa|peito de|asa|galinha|peru|chester)\b/],
  ["peixe", /\b(peixe|tilapia|salmao|sardinha|atum|camarao|bacalhau|merluza|pescada|file de peixe)\b/],
  ["carne", /\b(carne|bife|contra ?file|alcatra|picanha|acem|patinho|musculo|costela|linguica|bovin[oa]|suin[oa]|maminha|fraldinha|hamburguer|lagarto|cupim|file mignon|salsicha|bacon)\b/],
  ["pao", /\b(pao|paes|bolo|biscoito|bolacha|torrada|broa|croissant|rosca|massa|macarrao|farinha)\b/],
  ["cafe", /\b(cafe|achocolatado|cappuccino|cha|mate)\b/],
  ["graos", /\b(arroz|feijao|lentilha|grao|milho|aveia|acucar|sal|farofa|fuba|trigo|granola|soja|ervilha|tapioca)\b/],
  ["limpeza", /\b(sabao|detergente|amaciante|desinfetante|agua sanitaria|alvejante|limpa|esponja|lava|multiuso|saco de lixo|papel toalha|inseticida)\b/],
  ["higiene", /\b(shampoo|condicionador|sabonete|creme dental|pasta de dente|escova|desodorante|papel higienico|fralda|absorvente|cotonete|fio dental|hidratante|protetor|barbeador)\b/],
  ["doce", /\b(chocolate|bombom|doce|sorvete|pirulito|bala|goma|sobremesa|gelatina|pudim|paçoca|pacoca)\b/],
  ["verdura", /\b(alface|couve|rucula|brocolis|repolho|cenoura|cebola|batata|tomate|pepino|abobrinha|pimentao|beterraba|mandioca|aipim|espinafre|agriao|cheiro verde|salsa|coentro|verdura|legume|alho|chuchu|abobora|berinjela|quiabo|milho verde)\b/],
  ["fruta", /\b(banana|maca|laranja|limao|uva|melancia|melao|mamao|manga|abacaxi|morango|pera|kiwi|abacate|goiaba|maracuja|tangerina|mexerica|ameixa|fruta|pessego|caqui|coco)\b/],
];

export function tipoDeProduto(name: string): Kind {
  const n = norm(name);
  for (const [k, re] of REGRAS) if (re.test(n)) return k;
  return "sacola";
}

const g = (id: string, a: string, b: string, c: string) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`;
const sombra = `<ellipse cx="200" cy="372" rx="120" ry="14" fill="#000" opacity=".16"/>`;
const brilho = (x: number, y: number, rx: number, ry: number, rot = -25) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".4" transform="rotate(${rot} ${x} ${y})"/>`;
const folha = (x: number, y: number, s = 1, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0 0 C25 -45 75 -45 95 -8 C62 10 28 14 0 0Z" fill="#4c9a35" stroke="#2f6a22" stroke-width="3"/><path d="M6 0 C35 -12 60 -14 88 -8" stroke="#2f6a22" stroke-width="2.5" fill="none"/></g>`;

const ART: Record<Kind, string> = {
  fruta: `<defs>${g("a", "#ff8a7a", "#dc2a1f", "#8a0e0a")}</defs>${sombra}<path d="M200 125 C130 78 48 118 56 228 C64 322 130 370 200 346 C270 370 336 322 344 228 C352 118 270 78 200 125Z" fill="url(#a)" stroke="#6a0c0a" stroke-width="5"/>${brilho(138, 215, 28, 52, 18)}<path d="M200 125 C204 92 214 68 232 50" stroke="#5a3a14" stroke-width="10" fill="none" stroke-linecap="round"/>${folha(214, 80, 0.8, -20)}`,
  verdura: `<defs>${g("a", "#9be05a", "#4fa62f", "#1f6a1c")}</defs>${sombra}<path d="M200 350 C70 330 40 200 110 130 C150 90 190 110 200 60 C210 110 250 90 290 130 C360 200 330 330 200 350Z" fill="url(#a)" stroke="#1b5a18" stroke-width="5"/><path d="M200 350 C200 250 200 160 200 70 M200 300 C150 260 120 210 112 150 M200 300 C250 260 280 210 288 150 M200 230 C165 205 145 175 140 140 M200 230 C235 205 255 175 260 140" stroke="#bff08a" stroke-width="5" fill="none" opacity=".75" stroke-linecap="round"/>`,
  carne: `<defs>${g("a", "#ff8f86", "#c9302c", "#6e1010")}</defs>${sombra}<path d="M60 215 C48 130 130 80 215 90 C310 100 358 165 340 255 C322 340 230 366 150 346 C90 332 66 280 60 215Z" fill="url(#a)" stroke="#5a0a0a" stroke-width="5"/><path d="M95 230 C150 190 200 250 262 205 M130 290 C180 262 236 300 300 255 M120 160 C170 140 220 170 280 140" stroke="#ffd6cf" stroke-width="9" fill="none" stroke-linecap="round" opacity=".7"/><ellipse cx="258" cy="188" rx="30" ry="22" fill="#f3d0c6" stroke="#8a2a24" stroke-width="3"/>`,
  frango: `<defs>${g("a", "#ffd79a", "#e29a3a", "#a05a10")}</defs>${sombra}<path d="M96 120 C120 60 230 60 262 130 C292 196 250 250 214 290 L196 336 C190 352 168 352 162 336 L156 292 C112 262 80 188 96 120Z" fill="url(#a)" stroke="#6a3a08" stroke-width="5"/><rect x="152" y="318" width="26" height="40" rx="12" fill="#f4e4c8" stroke="#6a3a08" stroke-width="4"/><circle cx="150" cy="362" r="16" fill="#f4e4c8" stroke="#6a3a08" stroke-width="4"/><circle cx="192" cy="362" r="16" fill="#f4e4c8" stroke="#6a3a08" stroke-width="4"/>${brilho(160, 130, 26, 44, 20)}`,
  peixe: `<defs>${g("a", "#bfe6ff", "#4aa0d8", "#1c5a8a")}</defs>${sombra}<path d="M52 205 C100 108 220 100 292 175 L356 120 L346 205 L356 290 L292 235 C220 308 100 302 52 205Z" fill="url(#a)" stroke="#143f63" stroke-width="5"/><circle cx="128" cy="190" r="12" fill="#fff" stroke="#143f63" stroke-width="3"/><circle cx="131" cy="190" r="5" fill="#143f63"/><path d="M196 140 C212 175 212 235 196 270 M232 150 C246 180 246 230 232 260" stroke="#e8f6ff" stroke-width="5" fill="none" opacity=".6"/>`,
  pao: `<defs>${g("a", "#ffdca0", "#d9953a", "#8f5410")}</defs>${sombra}<path d="M50 245 C32 150 110 92 200 92 C290 92 368 150 350 245 C346 300 310 346 200 346 C90 346 54 300 50 245Z" fill="url(#a)" stroke="#6a3a08" stroke-width="5"/><path d="M110 150 C124 190 118 220 100 246 M175 130 C192 180 188 225 166 262 M245 130 C262 180 258 225 236 262 M300 160 C312 196 306 224 290 244" stroke="#fff1d0" stroke-width="10" fill="none" stroke-linecap="round" opacity=".8"/>`,
  leite: `<defs>${g("a", "#ffffff", "#e8f1fb", "#b8cde4")}</defs>${sombra}<path d="M112 130 L140 60 H260 L288 130 V330 C288 346 276 356 262 356 H138 C124 356 112 346 112 330Z" fill="url(#a)" stroke="#3a5a80" stroke-width="5"/><path d="M112 130 H288" stroke="#3a5a80" stroke-width="4"/><path d="M140 60 L200 38 L260 60" fill="#cfe0f2" stroke="#3a5a80" stroke-width="4"/><circle cx="200" cy="238" r="52" fill="#3b82c4"/><path d="M178 258 C190 214 210 214 222 258 Z M200 206 C206 220 212 224 212 236 C212 246 188 246 188 236 C188 224 196 220 200 206Z" fill="#fff"/>`,
  queijo: `<defs>${g("a", "#ffe58a", "#f3b928", "#b87d08")}</defs>${sombra}<path d="M48 290 L350 168 L350 290 C350 318 336 336 308 336 H90 C64 336 48 318 48 290Z" fill="url(#a)" stroke="#6a4604" stroke-width="5"/><path d="M48 290 L350 168 L350 222 L48 306Z" fill="#fff0a8" opacity=".55"/><circle cx="130" cy="296" r="20" fill="#d99a14" stroke="#6a4604" stroke-width="3"/><circle cx="238" cy="268" r="26" fill="#d99a14" stroke="#6a4604" stroke-width="3"/><circle cx="300" cy="306" r="14" fill="#d99a14" stroke="#6a4604" stroke-width="3"/>`,
  ovos: `<defs>${g("a", "#fff4e0", "#f0d3a2", "#c49a5a")}</defs>${sombra}<ellipse cx="130" cy="240" rx="62" ry="82" fill="url(#a)" stroke="#7a5a28" stroke-width="5"/><ellipse cx="270" cy="240" rx="62" ry="82" fill="url(#a)" stroke="#7a5a28" stroke-width="5"/><ellipse cx="200" cy="222" rx="66" ry="88" fill="url(#a)" stroke="#7a5a28" stroke-width="5"/>${brilho(176, 186, 14, 34, 18)}`,
  garrafa: `<defs>${g("a", "#ffe27a", "#f2b01c", "#b27400")}</defs>${sombra}<rect x="168" y="42" width="64" height="30" rx="8" fill="#d33a2c" stroke="#7a1a12" stroke-width="4"/><path d="M174 72 H226 V120 C226 150 290 160 290 220 V334 C290 350 278 358 264 358 H136 C122 358 110 350 110 334 V220 C110 160 174 150 174 120Z" fill="url(#a)" stroke="#6a4604" stroke-width="5"/><rect x="122" y="214" width="156" height="96" rx="10" fill="#fff" stroke="#6a4604" stroke-width="4"/><path d="M142 246 H258 M142 272 H230" stroke="#d33a2c" stroke-width="10" stroke-linecap="round"/>${brilho(146, 170, 8, 36, 10)}`,
  lata: `<defs>${g("a", "#ffd45a", "#e9a312", "#9a6406")}</defs>${sombra}<path d="M120 90 C120 70 280 70 280 90 V330 C280 352 120 352 120 330Z" fill="url(#a)" stroke="#6a4604" stroke-width="5"/><ellipse cx="200" cy="90" rx="80" ry="16" fill="#f4f1ea" stroke="#6a4604" stroke-width="4"/><ellipse cx="200" cy="88" rx="26" ry="6" fill="#cfc8b8"/><rect x="120" y="170" width="160" height="90" fill="#fff" opacity=".9"/><path d="M146 200 H254 M146 228 H222" stroke="#c7261b" stroke-width="10" stroke-linecap="round"/>${brilho(146, 200, 7, 80, 0)}`,
  cafe: `<defs>${g("a", "#c98a5a", "#7a4a26", "#3e2210")}</defs>${sombra}<path d="M96 120 H304 L322 340 C323 352 314 358 302 358 H98 C86 358 77 352 78 340Z" fill="url(#a)" stroke="#2a1608" stroke-width="5"/><path d="M96 120 L112 74 H288 L304 120" fill="#e0b88a" stroke="#2a1608" stroke-width="5"/><ellipse cx="200" cy="248" rx="50" ry="64" fill="#f6e6c8" stroke="#2a1608" stroke-width="4"/><path d="M200 190 C168 230 232 266 200 306" stroke="#7a4a26" stroke-width="9" fill="none" stroke-linecap="round"/>`,
  graos: `<defs>${g("a", "#fff7e0", "#ecd9a8", "#b9955a")}</defs>${sombra}<path d="M88 100 H312 L330 338 C331 352 320 358 306 358 H94 C80 358 69 352 70 338Z" fill="url(#a)" stroke="#6a5028" stroke-width="5"/><path d="M88 100 C130 70 270 70 312 100" fill="#e6cf98" stroke="#6a5028" stroke-width="5"/><circle cx="200" cy="232" r="64" fill="#fff" stroke="#6a5028" stroke-width="4"/><path d="M200 182 C214 206 214 222 200 240 C186 222 186 206 200 182Z M200 244 C216 262 216 276 200 292 C184 276 184 262 200 244Z" fill="#c8963c" stroke="#6a5028" stroke-width="2"/>`,
  limpeza: `<defs>${g("a", "#9be3ff", "#2ea0e0", "#126aa0")}</defs>${sombra}<rect x="150" y="40" width="100" height="44" rx="10" fill="#f26a2a" stroke="#8a3208" stroke-width="4"/><rect x="176" y="84" width="48" height="28" fill="#e7edf2" stroke="#4a6a80" stroke-width="4"/><path d="M130 112 H270 C292 112 300 130 300 150 V334 C300 350 288 358 274 358 H126 C112 358 100 350 100 334 V150 C100 130 108 112 130 112Z" fill="url(#a)" stroke="#0e4a70" stroke-width="5"/><rect x="118" y="196" width="164" height="100" rx="12" fill="#fff" stroke="#0e4a70" stroke-width="4"/><path d="M140 228 H260 M140 258 H230" stroke="#2ea0e0" stroke-width="10" stroke-linecap="round"/>${brilho(134, 170, 8, 30, 0)}`,
  higiene: `<defs>${g("a", "#ffd0ec", "#ec6fb4", "#a82d78")}</defs>${sombra}<path d="M138 64 H262 L270 118 H130Z" fill="#f4f1ea" stroke="#6a2a52" stroke-width="5"/><path d="M130 118 H270 L282 330 C283 350 270 358 254 358 H146 C130 358 117 350 118 330Z" fill="url(#a)" stroke="#6a2a52" stroke-width="5"/><ellipse cx="200" cy="244" rx="50" ry="62" fill="#fff" opacity=".92" stroke="#6a2a52" stroke-width="3"/><path d="M200 196 C214 226 214 250 200 276 C186 250 186 226 200 196Z" fill="#ec6fb4"/>`,
  doce: `<defs>${g("a", "#a8683a", "#6a3a1e", "#341a0a")}</defs>${sombra}<rect x="78" y="86" width="244" height="268" rx="18" fill="url(#a)" stroke="#2a1408" stroke-width="5"/><path d="M78 160 H322 M78 232 H322 M78 304 H322 M160 86 V354 M240 86 V354" stroke="#9a5a30" stroke-width="5" opacity=".7"/><path d="M78 86 H322 V132 C300 122 270 142 244 128 C216 114 190 140 160 128 C130 116 104 138 78 126Z" fill="#fff0d6" opacity=".9"/>${brilho(112, 118, 18, 8, 0)}`,
  sacola: `<defs>${g("a", "#ffe08a", "#f0a52a", "#b06a08")}</defs>${sombra}<path d="M138 120 C138 40 262 40 262 120" stroke="#7a4604" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M82 120 H318 L340 338 C342 354 330 360 314 360 H86 C70 360 58 354 60 338Z" fill="url(#a)" stroke="#7a4604" stroke-width="5"/><path d="M200 196 C168 160 128 200 200 262 C272 200 232 160 200 196Z" fill="#fff" opacity=".92"/>`,
};

const cache = new Map<Kind, Promise<string>>();

// data URI PNG da ilustração do tipo do produto
export function ilustracaoUri(name: string): Promise<string> {
  const kind = tipoDeProduto(name);
  let p = cache.get(kind);
  if (!p) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">${ART[kind]}</svg>`;
    p = sharp(Buffer.from(svg))
      .png()
      .toBuffer()
      .then((b) => `data:image/png;base64,${b.toString("base64")}`);
    cache.set(kind, p);
  }
  return p;
}
