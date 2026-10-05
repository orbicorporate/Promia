-- Fase 2.1: memória de fotos por nome normalizado, compartilhada entre
-- mercados (complementa photo_bank, que é por código de barras). Só o
-- servidor (service role) lê e grava; sem política para o navegador.
create table if not exists public.photo_name_bank (
  key text primary key,
  label text not null,
  image_url text not null,
  storage_path text,
  source text not null default 'aprovada',
  approvals integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.photo_name_bank enable row level security;
