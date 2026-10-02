# Promia (Tabloide AI)

SaaS pra supermercados montarem tabloides e artes promocionais no tema que quiserem, com um gerente inteligente de produto, preço, promoção e estoque. Stack e padrões herdados do Nume Calendar (orbicorporate/nume-master): Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Supabase (auth, banco e Storage) e SDK da Anthropic.

## O que já está montado (ponta a ponta, funcional)

- **Auth e multi-tenant**: login simples (Supabase Auth), tabela `profiles` com papel (`master` = time Promia, `mercado` = dono do mercado) e `market_id`, RLS isolando os dados de cada mercado.
- **Painel master** (`/master`): cria mercados e já gera o primeiro login do responsável.
- **Painel do mercado** (`/[slug]`): produtos, busca de imagem, gerente inteligente e atalho pra montar um tabloide novo.
- **Upload e revisão de planilha de produtos**: `lib/products.ts` normaliza colunas em português livre (nome de coluna varia, preço em formatos diferentes) e a UI em `app/[slug]/import-products.tsx` deixa revisar/editar antes de confirmar, seguindo o padrão upload direto pro Storage (URL assinada) → processa no servidor → revisão → grava.
- **Busca automática de imagem de produto**: `lib/ai/imageSearch.ts` usa a busca na web da Anthropic pra achar uma foto de cada produto. Só marca como "encontrada" quando a URL aponta direto pra um arquivo de imagem (evita link inventado); o resto cai em "revisar" (com a página de referência salva) ou "não encontrada". Roda em lote pelo botão no painel (`app/[slug]/find-images-button.tsx` + `app/api/master/products/find-images`).
- **Motor de temas**: `lib/seasonalDates.ts` (portado do Nume Calendar, datas comemorativas brasileiras calculadas por ano) + `lib/weeklyPromotions.ts` (promoções recorrentes por dia da semana, tipo "toda terça é dia da carne") combinados em `lib/themes.ts`, que sugere temas automaticamente pros próximos dias.
- **Gerente inteligente**: `lib/ai/gerente.ts` + `app/api/ia/gerente`, no mesmo desenho em duas etapas da Orbi (análise livre do catálogo, depois estruturação em JSON), com prompts próprios de gerente de produto/preço/promoção/estoque.
- **Motor de renderização do tabloide**: `lib/renderTabloid.ts` preenche um template HTML (tokens tipo `%%NOME_MERCADO%%`, bloco repetido de produto entre `<!--PRODUTOS_INICIO-->`/`<!--PRODUTOS_FIM-->`) com os dados do mercado e os produtos escolhidos; a captura em imagem final é feita no navegador com `html2canvas-pro`, no mesmo espírito do `template.html` do Nume Calendar (só style inline com hex/rgba puro, nada de classe Tailwind pra cor).
- **2 templates de tabloide reais**: `lib/tabloidTemplates/grade-classica.html` e `faixa-promocional.html` (ponto de partida; ainda não são os ~40 da visão final).
- **Tela de montagem de tabloide** (`/[slug]/tabloides/novo`): mostra sugestões de tema pros próximos dias, escolhe nome/categoria/tema/vigência, seleciona produtos com busca, gera o tabloide e baixa a imagem.
- **Schema do banco**: `supabase/migrations/` (markets, profiles, products, weekly_promotions, themes, tabloids, tabloid_products, ai_recommendations, com RLS, mais o seed dos 2 temas globais).

## Fase 1 (base segura), concluída

- Acesso: `lib/auth.ts` é o ponto único de identidade. Toda rota confere se o usuário pode mexer no mercado informado; as rotas do dono do mercado saíram de `/api/master` e ficam em `/api/produtos`, `/api/tabloides` e `/api/ia`.
- Importação (`lib/products.ts`): CSV com ponto e vírgula ou vírgula, acentos em Windows-1252, cabeçalho em qualquer uma das 20 primeiras linhas, colunas com nomes livres, células com fórmula, número brasileiro, código de barras, custo e unidade. Código repetido e linha sem nome viram aviso, não erro. Reimportar não apaga fotos.
- Fotos: fila no banco (`claim_pending_images`) sem processar o mesmo produto duas vezes, 5 buscas em paralelo, modelo rápido com reserva.
- Gerente: saída estruturada por ferramenta (sem JSON quebrado), recebe as promoções fixas, recomendações agrupadas por rodada.
- Limite diário de IA por mercado (`lib/ai/usage.ts`).
- Tabloide: produtos e tema conferidos no servidor, render com escape de texto, URL e cor, rascunho até a arte dar certo, compartilhar no celular.
- Banco: migrations 0004 (aplicada) e 0005 (políticas somente leitura, aplicar no SQL Editor), histórico de preço, registro de importações, tipos gerados em `lib/supabase/database.types.ts`.
- Testes (`npm test`) e CI no GitHub (tipos, lint, testes).

## Próximas fases

Ver o plano "Promia: diagnóstico e plano para virar produto": encarte vendável (formatos, preço de/por, fotos por EAN), gerente e autonomia, escala e receita.

## Rodando localmente

```bash
npm install
cp .env.example .env.local # preencha as chaves do Supabase e da Anthropic
npm run dev
```

Depois de configurar `.env.local` com um projeto Supabase real, rode as migrações em `supabase/migrations/` em ordem (via CLI do Supabase, ou colando o SQL no SQL Editor do painel) antes do primeiro uso. Testes: `npm test`.

## Deploy

Vercel, conectado a este repositório. Configure as mesmas variáveis de ambiente do `.env.example` no painel do projeto.
