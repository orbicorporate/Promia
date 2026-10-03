# Promia (Tabloide AI)

SaaS pra supermercados montarem tabloides e artes promocionais no tema que quiserem, com um gerente inteligente de produto, preço, promoção e estoque. Stack e padrões herdados do Nume Calendar (orbicorporate/nume-master): Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Supabase (auth, banco e Storage) e SDK da Anthropic.

## O que está no ar

- **Auth e multi-tenant**: `lib/auth.ts` é o ponto único de acesso; papéis `master` (time Promia) e `mercado`. Painel master em `/master` cria mercados e o login do responsável.
- **Início** (`/[slug]`): próximas ocasiões (datas do varejo e promoções fixas da semana) com atalho para o encarte, gerente inteligente, lista do que falta para o mercado ficar pronto.
- **Encartes** (`/[slug]/encartes`): montagem com prévia ao vivo (`/novo`, aceita `?tema`, `?titulo`, `?de`, `?ate`, `?produtos`, `?copiar`), visualizador com páginas, baixar PNG e PDF, compartilhar, editar, duplicar e apagar.
- **Motor do encarte** (`lib/encarte/*`): desenhado no servidor com next/og. Formatos Feed, Story, Quadrado e A4; layouts grade, destaque e lista; 15 temas como dados em `themes.ts`. Rotas `GET /api/encartes/{id}/imagem?pagina=N`, `GET /api/encartes/{id}/pdf`, `POST /api/encartes/previa`.
- **Produtos** (`/[slug]/produtos`): busca, filtros, edição rápida, envio de planilha (`?importar=1`) e revisão de fotos (`?fotos=1`) com opções, link colado ou câmera.
- **Fotos** (`lib/server/photos.ts`): banco próprio por código de barras, Open Food Facts, depois busca na web com IA, que lê a foto declarada pela página do produto (JSON-LD e og:image). Imagens copiadas para o Storage `midia`.
- **Mercado** (`/[slug]/mercado`): logo com cores extraídas, contatos do rodapé, promoções fixas e aviso legal.
- **Interface**: vidro sobre fundo vivo, Bricolage Grotesque e Instrument Sans, componentes em `components/ui`, navegação em `components/shell`. Movimento com `motion`, sempre respeitando reduzir movimento.

## Fase 1 (base segura), concluída

- Acesso: `lib/auth.ts` é o ponto único de identidade. Toda rota confere se o usuário pode mexer no mercado informado; as rotas do dono do mercado ficam em `/api/produtos`, `/api/encartes`, `/api/mercado` e `/api/ia`.
- Importação (`lib/products.ts`): CSV com ponto e vírgula ou vírgula, acentos em Windows-1252, cabeçalho em qualquer uma das 20 primeiras linhas, colunas com nomes livres, células com fórmula, número brasileiro, código de barras, custo e unidade. Código repetido e linha sem nome viram aviso, não erro. Reimportar não apaga fotos.
- Fotos: fila no banco (`claim_pending_images`) sem processar o mesmo produto duas vezes, 5 buscas em paralelo, modelo rápido com reserva.
- Gerente: saída estruturada por ferramenta (sem JSON quebrado), recebe as promoções fixas, recomendações agrupadas por rodada.
- Limite diário de IA por mercado (`lib/ai/usage.ts`).
- Banco: migrations 0004 (aplicada) e 0005 (políticas somente leitura, aplicar no SQL Editor), histórico de preço, registro de importações, tipos gerados em `lib/supabase/database.types.ts`.
- Testes (`npm test`) e CI no GitHub (tipos, lint, testes).

## Fase 2 (encarte vendável), concluída

Migration 0006 (formato, layout, tema, preço de/por, selo, banco de fotos, bucket `midia`), motor de encarte no servidor, interface nova. Removidos o renderizador HTML antigo e o html2canvas.

## Próximas fases

Ver o plano "Promia: diagnóstico e plano para virar produto": gerente e autonomia, escala e receita.

## Rodando localmente

```bash
npm install
cp .env.example .env.local # preencha as chaves do Supabase e da Anthropic
npm run dev
```

Depois de configurar `.env.local` com um projeto Supabase real, rode as migrações em `supabase/migrations/` em ordem (via CLI do Supabase, ou colando o SQL no SQL Editor do painel) antes do primeiro uso. Testes: `npm test`.

## Deploy

Vercel, conectado a este repositório. Configure as mesmas variáveis de ambiente do `.env.example` no painel do projeto.
