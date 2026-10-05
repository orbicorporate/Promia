// Troca de tela: entra subindo um pouco com desfoque, só em CSS. Nada de
// transform ou filter fica no bloco depois da entrada, para não prender as
// barras fixas e as janelas que vivem dentro da página.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="surgir">{children}</div>;
}
