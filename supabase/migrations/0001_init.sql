-- Promia (Tabloide AI) - schema inicial
-- Multi-tenant: cada mercado é um "tenant" isolado por market_id + RLS.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- markets: o mercado/cliente, com sua identidade visual
-- ---------------------------------------------------------------------
create table if not exists markets (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  niche text, -- ex.: "supermercado de bairro", usado pra casar datas sazonais
  logo_url text,
  color_primary text default '#16a34a',
  color_secondary text default '#111827',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- profiles: usuários (time Promia = "master", dono/funcionário de mercado
-- = "mercado"). Espelha profiles + auth.users do padrão Nume Master.
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('master', 'mercado')),
  market_id uuid references markets(id) on delete set null,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- products: catálogo do mercado, vindo da planilha
-- ---------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references markets(id) on delete cascade,
  sku text not null,
  name text not null,
  brand text,
  category text,
  price numeric(10, 2),
  cost numeric(10, 2), -- opcional; quando ausente o gerente trabalha só com preço
  stock numeric(10, 2), -- opcional
  image_url text,
  image_status text not null default 'pendente' check (image_status in ('pendente', 'encontrada', 'nao_encontrada', 'revisar')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (market_id, sku)
);

create index if not exists products_market_id_idx on products (market_id);

-- ---------------------------------------------------------------------
-- weekly_promotions: promoções recorrentes por dia da semana, por mercado
-- ---------------------------------------------------------------------
create table if not exists weekly_promotions (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references markets(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = domingo
  name text not null,
  category_hint text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists weekly_promotions_market_id_idx on weekly_promotions (market_id);

-- ---------------------------------------------------------------------
-- themes: templates de tabloide/arte. market_id nulo = template global da
-- plataforma (disponível pra todo mundo); preenchido = específico de um
-- mercado (ex.: criado a partir de uma pesquisa livre de tema).
-- ---------------------------------------------------------------------
create table if not exists themes (
  id uuid primary key default gen_random_uuid(),
  market_id uuid references markets(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('sazonal', 'dia_da_semana', 'livre')),
  template_path text not null,
  source_seasonal_title text, -- quando kind = 'sazonal'
  source_weekday smallint,    -- quando kind = 'dia_da_semana'
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- tabloids: cada tabloide/arte montado pelo dono do mercado
-- ---------------------------------------------------------------------
create table if not exists tabloids (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references markets(id) on delete cascade,
  name text not null,
  category text,
  theme_id uuid references themes(id) on delete set null,
  status text not null default 'rascunho' check (status in ('rascunho', 'pronto', 'publicado')),
  valid_from date,
  valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tabloids_market_id_idx on tabloids (market_id);

-- produtos selecionados por tabloide (N:N)
create table if not exists tabloid_products (
  tabloid_id uuid not null references tabloids(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  position smallint not null default 0,
  primary key (tabloid_id, product_id)
);

-- ---------------------------------------------------------------------
-- ai_recommendations: saída do gerente inteligente, versionada por rodada
-- ---------------------------------------------------------------------
create table if not exists ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references markets(id) on delete cascade,
  type text not null check (type in ('destacar', 'promover', 'repor_estoque', 'revisar_preco', 'queimar_estoque')),
  target text not null,
  reason text not null,
  priority text not null check (priority in ('alta', 'média', 'baixa')),
  generated_at timestamptz not null default now(),
  dismissed boolean not null default false
);

create index if not exists ai_recommendations_market_id_idx on ai_recommendations (market_id);

-- ---------------------------------------------------------------------
-- RLS: cada mercado só enxerga seus próprios dados; o time master enxerga
-- tudo. Assume que profiles.role e profiles.market_id já refletem o login.
-- ---------------------------------------------------------------------
alter table markets enable row level security;
alter table profiles enable row level security;
alter table products enable row level security;
alter table weekly_promotions enable row level security;
alter table themes enable row level security;
alter table tabloids enable row level security;
alter table tabloid_products enable row level security;
alter table ai_recommendations enable row level security;

create or replace function current_profile_role() returns text
language sql security definer stable as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function current_profile_market_id() returns uuid
language sql security definer stable as $$
  select market_id from profiles where id = auth.uid();
$$;

create policy "master vê tudo, mercado vê o próprio" on markets
  for select using (current_profile_role() = 'master' or id = current_profile_market_id());

create policy "master gerencia mercados" on markets
  for all using (current_profile_role() = 'master');

create policy "usuário vê o próprio perfil" on profiles
  for select using (id = auth.uid() or current_profile_role() = 'master');

create policy "acesso por mercado: products" on products
  for all using (current_profile_role() = 'master' or market_id = current_profile_market_id());

create policy "acesso por mercado: weekly_promotions" on weekly_promotions
  for all using (current_profile_role() = 'master' or market_id = current_profile_market_id());

create policy "acesso por mercado: themes" on themes
  for select using (market_id is null or current_profile_role() = 'master' or market_id = current_profile_market_id());

create policy "acesso por mercado: tabloids" on tabloids
  for all using (current_profile_role() = 'master' or market_id = current_profile_market_id());

create policy "acesso por mercado: tabloid_products" on tabloid_products
  for all using (
    exists (
      select 1 from tabloids t
      where t.id = tabloid_products.tabloid_id
        and (current_profile_role() = 'master' or t.market_id = current_profile_market_id())
    )
  );

create policy "acesso por mercado: ai_recommendations" on ai_recommendations
  for all using (current_profile_role() = 'master' or market_id = current_profile_market_id());
