-- Fase 1 (base segura): alinha o repositório com a produção e fecha as
-- brechas de acesso. Idempotente: pode rodar num banco novo (depois da 0001
-- a 0003) ou no banco de produção, que já tinha parte disso aplicada à mão.

-- ---------------------------------------------------------------------
-- 1. Funções de permissão no schema private (fora da API do PostgREST)
-- ---------------------------------------------------------------------
create schema if not exists private;
grant usage on schema private to anon, authenticated;

do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'current_profile_role') then
    alter function public.current_profile_role() set schema private;
  end if;
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'current_profile_market_id') then
    alter function public.current_profile_market_id() set schema private;
  end if;
end $$;

create or replace function private.current_profile_role() returns text
language sql security definer stable set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function private.current_profile_market_id() returns uuid
language sql security definer stable set search_path = public as $$
  select market_id from profiles where id = auth.uid();
$$;

create or replace function private.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 2. Produtos: EAN, unidade, ativo, reserva da fila de imagem e updated_at real
-- ---------------------------------------------------------------------
alter table products add column if not exists ean text;
alter table products add column if not exists unit text;
alter table products add column if not exists active boolean not null default true;

-- reserva da fila de busca de imagem (ver claim_pending_images)
alter table products add column if not exists image_claimed_at timestamptz;

create index if not exists products_market_ean_idx on products (market_id, ean) where ean is not null;
create index if not exists products_market_image_status_idx on products (market_id, image_status);

drop trigger if exists products_updated_at on products;
create trigger products_updated_at before update on products
  for each row execute function private.set_updated_at();

drop trigger if exists tabloids_updated_at on tabloids;
create trigger tabloids_updated_at before update on tabloids
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------
-- 3. Histórico de preço (alimentado por gatilho, sem depender do app)
-- ---------------------------------------------------------------------
create table if not exists product_price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  market_id uuid not null references markets(id) on delete cascade,
  old_price numeric(10, 2),
  new_price numeric(10, 2),
  changed_at timestamptz not null default now()
);
create index if not exists product_price_history_product_idx on product_price_history (product_id, changed_at desc);
create index if not exists product_price_history_market_idx on product_price_history (market_id);

create or replace function private.log_price_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.price is distinct from old.price then
    insert into product_price_history (product_id, market_id, old_price, new_price)
    values (new.id, new.market_id, old.price, new.price);
  end if;
  return new;
end $$;

drop trigger if exists products_price_history on products;
create trigger products_price_history after update of price on products
  for each row execute function private.log_price_change();

-- ---------------------------------------------------------------------
-- 4. Registro de importações (quem subiu o quê, quando, o que foi ignorado)
-- ---------------------------------------------------------------------
create table if not exists product_imports (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references markets(id) on delete cascade,
  imported_by uuid references auth.users(id) on delete set null,
  file_name text,
  rows_imported integer not null default 0,
  rows_skipped integer not null default 0,
  skipped jsonb,
  columns jsonb,
  created_at timestamptz not null default now()
);
create index if not exists product_imports_market_idx on product_imports (market_id, created_at desc);

-- ---------------------------------------------------------------------
-- 5. Gerente: agrupar recomendações por rodada
-- ---------------------------------------------------------------------
alter table ai_recommendations add column if not exists run_id uuid;
create index if not exists ai_recommendations_market_run_idx on ai_recommendations (market_id, generated_at desc);

-- ---------------------------------------------------------------------
-- 6. Uso de IA por mercado (limite diário e controle de custo)
-- ---------------------------------------------------------------------
create table if not exists ai_usage (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references markets(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('gerente', 'busca_imagem')),
  units integer not null default 1,
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_market_kind_idx on ai_usage (market_id, kind, created_at desc);

-- ---------------------------------------------------------------------
-- 7. Fila de busca de imagem sem processar o mesmo produto duas vezes
--    (duas abas abertas, ou um clique repetido). Só o servidor chama.
-- ---------------------------------------------------------------------
create or replace function public.claim_pending_images(p_market uuid, p_limit integer)
returns table (id uuid, name text, brand text, ean text)
language sql security definer set search_path = public as $$
  update products p
     set image_claimed_at = now()
   where p.id in (
     select q.id from products q
      where q.market_id = p_market
        and q.image_status = 'pendente'
        and (q.image_claimed_at is null or q.image_claimed_at < now() - interval '10 minutes')
      order by q.created_at
      limit greatest(1, least(p_limit, 50))
      for update skip locked
   )
  returning p.id, p.name, p.brand, p.ean;
$$;
revoke all on function public.claim_pending_images(uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_pending_images(uuid, integer) to service_role;

-- ---------------------------------------------------------------------
-- 8. RLS das tabelas novas (as antigas são endurecidas na 0005)
-- ---------------------------------------------------------------------
alter table product_price_history enable row level security;
drop policy if exists "leitura: product_price_history" on product_price_history;
create policy "leitura: product_price_history" on product_price_history for select to authenticated
  using (private.current_profile_role() = 'master' or market_id = private.current_profile_market_id());

alter table product_imports enable row level security;
drop policy if exists "leitura: product_imports" on product_imports;
create policy "leitura: product_imports" on product_imports for select to authenticated
  using (private.current_profile_role() = 'master' or market_id = private.current_profile_market_id());

-- uso de IA: só o servidor lê e escreve (RLS ligado, sem policy)
alter table ai_usage enable row level security;

-- ---------------------------------------------------------------------
-- 9. Storage: bucket privado das planilhas, com limite de 20 MB
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('imports', 'imports', false, 20971520)
on conflict (id) do update set public = false, file_size_limit = 20971520;
