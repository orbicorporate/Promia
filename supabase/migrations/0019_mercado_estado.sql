-- Estado (UF) do mercado: deixa as buscas de bairro, mapa e preços na cidade certa.
alter table markets add column if not exists state text;
