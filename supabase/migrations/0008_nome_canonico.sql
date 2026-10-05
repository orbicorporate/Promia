-- Nome do produto como a IA o entende ("Refrigerante Coca-Cola Original
-- 2L"), usado como chave da memória de fotos entre mercados.
alter table public.products add column if not exists canonical_name text;
