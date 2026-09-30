# Promia (Tabloide AI)

SaaS pra supermercados montarem tabloides e artes promocionais no tema que quiserem, com um gerente inteligente de produto, preço, promoção e estoque. Stack e padrões herdados do Nume Calendar (orbicorporate/nume-master): Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Supabase (auth, banco e Storage) e SDK da Anthropic.

## O que já está montado

- **Auth e multi-tenant**: login simples (Supabase Auth), tabela `profiles` com papel (`master` = time Promia, `mercado` = dono do mercado) e `market_id`, RLS isolando os dados de cada mercado.
- **Painel master** (`/master`): cria mercados e já gera o primeiro login do responsável.
- **Painel do mercado** (`/[slug]`): mostra a contagem de produtos e o gerente inteligente.
- **Upload de planilha de produtos**: `lib/products.ts` normaliza colunas em português livre (nome de coluna varia, preço em formatos diferentes) e as rotas `app/api/master/import-products/{parse,create}` seguem o padrão upload → Storage → processa no servidor → revisão → grava.
- **Motor de temas**: `lib/seasonalDates.ts` (portado quase direto do Nume Calendar, datas comemorativas brasileiras calculadas por ano) + `lib/weeklyPromotions.ts` (novo, promoções recorrentes por dia da semana tipo "toda terça é dia da carne") combinados em `lib/themes.ts`, que sugere temas automaticamente pra uma data/mercado.
- **Gerente inteligente**: `lib/ai/gerente.ts` + `app/api/ia/gerente`, no mesmo desenho em duas etapas da Orbi (análise livre do catálogo, depois estruturação em JSON), com prompts próprios de gerente de produto/preço/promoção/estoque.
- **Schema do banco**: `supabase/migrations/0001_init.sql` (markets, profiles, products, weekly_promotions, themes, tabloids, tabloid_products, ai_recommendations, com RLS).

## O que ainda falta (próximos passos)

1. Rodar a migração no projeto Supabase real e configurar as variáveis de ambiente (veja `.env.example`).
2. Tela de upload de planilha no painel do mercado (as rotas de API já existem, falta a UI de upload + revisão antes de confirmar).
3. Busca automática de imagem de produto (fila de revisão já modelada em `products.image_status`).
4. Motor de renderização do tabloide: preencher um template HTML com tokens (ver `lib/themes.ts`, `THEME_MARKET_TOKENS`/`THEME_PRODUCT_TOKENS`) com os produtos selecionados e virar imagem (html2canvas-pro no navegador, no mesmo esquema do `template.html` do Nume Calendar: nada de classe Tailwind pra cor, só style inline com hex/rgba puro).
5. Os primeiros 5 a 10 templates de tabloide de verdade (hoje só existe a estrutura de tokens, não os designs).
6. Tela de montagem de tabloide (escolher nome, categoria, tema sugerido ou livre, selecionar produtos).

## Rodando localmente

```bash
npm install
cp .env.example .env.local # preencha as chaves do Supabase e da Anthropic
npm run dev
```

## Deploy

Vercel, conectado a este repositório. Configure as mesmas variáveis de ambiente do `.env.example` no painel do projeto.
