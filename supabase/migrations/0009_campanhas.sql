-- Fase 3 (gerente de marketing): campanha completa por encarte e novos tipos
-- de uso de IA para o limite diário por mercado.
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  tabloid_id uuid not null unique references public.tabloids(id) on delete cascade,
  content jsonb not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists campaigns_market_idx on public.campaigns (market_id, updated_at desc);
alter table public.campaigns enable row level security;

alter table public.ai_usage drop constraint if exists ai_usage_kind_check;
alter table public.ai_usage add constraint ai_usage_kind_check
  check (kind in ('gerente', 'busca_imagem', 'campanha', 'pautas', 'concorrencia', 'bairro', 'vendas'));
