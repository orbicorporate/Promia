-- Fundo da arte nos modelos brilhantes (raios, bokeh, kraft etc.). Nulo = o
-- fundo padrao do modelo. Validado em codigo (ENCARTE_FUNDOS).
alter table tabloids add column if not exists fundo text;
