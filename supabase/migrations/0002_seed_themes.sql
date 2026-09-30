-- Seed de temas globais (disponíveis pra qualquer mercado desde o início).
-- market_id nulo = template da plataforma. Os arquivos ficam em
-- lib/tabloidTemplates/*.html e são lidos pelo motor de renderização
-- (ver lib/renderTabloid.ts e app/api/tabloides/[id]/render).

create unique index if not exists themes_global_template_path_idx
  on themes (template_path)
  where market_id is null;

insert into themes (name, kind, template_path)
values
  ('Grade Clássica', 'livre', 'grade-classica.html'),
  ('Faixa Promocional', 'livre', 'faixa-promocional.html')
on conflict (template_path) where market_id is null do nothing;
