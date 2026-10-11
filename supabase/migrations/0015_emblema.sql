-- Emblema da campanha no encarte: slug do catalogo em lib/emblemas/catalog.ts
-- (validado na entrada). Nulo = sem emblema (titulo em texto).
alter table tabloids add column if not exists emblema text;
