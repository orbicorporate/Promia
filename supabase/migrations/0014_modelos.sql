-- Modelo de arte do encarte (família visual: Feira, Selos etc.). Nulo é o
-- estilo Clássico, que usa o layout (grade, destaque, lista). A lista de
-- modelos válidos fica em código (lib/encarte/modelos/index.ts) e a
-- validação na entrada; aqui só o texto livre curto, sem check, para novos
-- modelos não exigirem migração.
alter table tabloids add column if not exists modelo text;
