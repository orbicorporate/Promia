-- Fase 3: concorrentes da região, encartes deles lidos por foto e preços.
create table if not exists public.competitors (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  name text not null,
  address text,
  latitude double precision,
  longitude double precision,
  rating numeric,
  reviews integer,
  phone text,
  website text,
  category text,
  source text not null default 'busca',
  tracked boolean not null default true,
  created_at timestamptz not null default now(),
  unique (market_id, name, address)
);
create table if not exists public.competitor_flyers (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  competitor_id uuid references public.competitors(id) on delete set null,
  competitor_name text not null,
  observed_on date not null default current_date,
  valid_until date,
  items integer not null default 0,
  created_by uuid,
  created_at timestamptz not null default now()
);
create table if not exists public.competitor_prices (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  flyer_id uuid references public.competitor_flyers(id) on delete cascade,
  competitor_id uuid references public.competitors(id) on delete set null,
  competitor_name text not null,
  product_name text not null,
  product_id uuid references public.products(id) on delete set null,
  match_score numeric,
  price numeric not null,
  old_price numeric,
  observed_on date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists competitor_prices_market_idx on public.competitor_prices (market_id, observed_on desc);
alter table public.competitors enable row level security;
alter table public.competitor_flyers enable row level security;
alter table public.competitor_prices enable row level security;
