-- Por que um produto ficou sem foto ou só com palpite (texto curto, em português, mostrado na tela).
alter table public.products add column if not exists image_note text;
