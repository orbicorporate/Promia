-- Fase 4: análises do mercado (perfil do bairro, públicos, setores, gôndolas).
create table if not exists public.market_insights (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  kind text not null check (kind in ('bairro')),
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (market_id, kind)
);
alter table public.market_insights enable row level security;
