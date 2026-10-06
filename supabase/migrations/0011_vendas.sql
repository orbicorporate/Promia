-- Fase 2 (gerente de marketing): vendas importadas do relatório do caixa,
-- por período, ligadas ao catálogo quando o código ou o nome casam.
create table if not exists public.sales_imports (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  file_name text,
  period_start date not null,
  period_end date not null,
  rows integer not null default 0,
  matched integer not null default 0,
  created_by uuid,
  created_at timestamptz not null default now(),
  check (period_end >= period_start)
);
create index if not exists sales_imports_market_idx on public.sales_imports (market_id, period_end desc);

create table if not exists public.sales_records (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  import_id uuid not null references public.sales_imports(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  sku text,
  name text not null,
  category text,
  period_start date not null,
  period_end date not null,
  qty numeric not null default 0,
  revenue numeric not null default 0,
  cost numeric,
  created_at timestamptz not null default now()
);
create index if not exists sales_records_market_period_idx on public.sales_records (market_id, period_end desc);
create index if not exists sales_records_product_idx on public.sales_records (product_id);

alter table public.sales_imports enable row level security;
alter table public.sales_records enable row level security;
