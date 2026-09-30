-- Guarda a página de referência quando a busca de imagem só achou uma
-- página relevante (não um link direto de imagem), pra revisão manual.
alter table products add column if not exists image_source_url text;
