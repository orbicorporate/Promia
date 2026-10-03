-- Fase 2: encarte vendável, identidade do mercado e banco de fotos por EAN.

-- ---------------------------------------------------------------------
-- Mercado: contatos e identidade que aparecem no rodapé do encarte
-- ---------------------------------------------------------------------
alter table markets add column if not exists tagline text;
alter table markets add column if not exists address text;
alter table markets add column if not exists city text;
alter table markets add column if not exists whatsapp text;
alter table markets add column if not exists phone text;
alter table markets add column if not exists instagram text;
alter table markets add column if not exists opening_hours text;
alter table markets add column if not exists legal_note text;
alter table markets add column if not exists onboarded_at timestamptz;

-- ---------------------------------------------------------------------
-- Encarte: formato, layout, tema (por chave, definido em código) e textos
-- ---------------------------------------------------------------------
alter table tabloids add column if not exists format text not null default 'feed'
  check (format in ('feed', 'story', 'quadrado', 'a4'));
alter table tabloids add column if not exists layout text not null default 'grade'
  check (layout in ('grade', 'destaque', 'lista'));
alter table tabloids add column if not exists theme_key text not null default 'ofertas';
alter table tabloids add column if not exists headline text;
alter table tabloids add column if not exists subheadline text;
alter table tabloids add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table tabloids alter column theme_id drop not null;

-- itens do encarte: preço de oferta, preço "de", destaque e limite
alter table tabloid_products add column if not exists promo_price numeric(10, 2);
alter table tabloid_products add column if not exists old_price numeric(10, 2);
alter table tabloid_products add column if not exists highlight boolean not null default false;
alter table tabloid_products add column if not exists limit_qty smallint;
alter table tabloid_products add column if not exists label text;

-- ---------------------------------------------------------------------
-- Fotos: candidatas da busca e origem da foto escolhida
-- ---------------------------------------------------------------------
alter table products add column if not exists image_candidates jsonb;
alter table products add column if not exists image_origin text
  check (image_origin in ('banco', 'catalogo', 'web', 'upload', 'url'));

-- Banco de fotos compartilhado entre mercados, por código de barras. Toda
-- foto aprovada por um mercado serve para o mesmo EAN em todos os outros.
create table if not exists photo_bank (
  ean text primary key,
  image_url text not null,
  storage_path text,
  source text not null default 'web',
  approvals integer not null default 1,
  updated_at timestamptz not null default now()
);
alter table photo_bank enable row level security;
-- só o servidor lê e escreve (sem policy)

-- ---------------------------------------------------------------------
-- Storage: bucket público de mídia (logos e fotos de produto copiadas).
-- Escrita só pelo servidor (URL assinada ou service role).
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('midia', 'midia', true, 8388608, array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'])
on conflict (id) do update set public = true, file_size_limit = 8388608,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'];
