-- Pesquisa de preços online (sites e redes sociais). Separada dos preços de
-- encarte: é referência de campo, não preço confirmado de loja.
create table if not exists public.price_research (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  term text not null,
  product_name text not null,
  product_id uuid references public.products(id) on delete set null,
  price numeric not null,
  source_kind text not null check (source_kind in ('site', 'rede_social', 'loja_online')),
  source_name text not null,
  source_url text,
  scope text not null check (scope in ('cidade', 'estado', 'brasil')),
  region text,
  snippet text,
  observed_on date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists price_research_market_idx on public.price_research (market_id, observed_on desc);
alter table public.price_research enable row level security;
