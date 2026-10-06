-- Calendário de pautas do mês, gerado pela IA por mercado.
create table if not exists public.content_plans (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (market_id, month)
);
alter table public.content_plans enable row level security;
