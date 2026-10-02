-- Fase 1: o navegador só LÊ os dados do próprio mercado. Toda escrita
-- passa pelas rotas do servidor (service role), que checam o acesso em
-- lib/auth.ts. Antes as policies eram "for all", o que deixava o dono do
-- mercado inserir ou apagar linhas direto pela API do Supabase.
-- ---------------------------------------------------------------------
drop policy if exists "master gerencia mercados" on markets;
drop policy if exists "master vê tudo, mercado vê o próprio" on markets;
create policy "leitura: markets" on markets for select to authenticated
  using (private.current_profile_role() = 'master' or id = private.current_profile_market_id());

drop policy if exists "usuário vê o próprio perfil" on profiles;
create policy "leitura: profiles" on profiles for select to authenticated
  using (id = auth.uid() or private.current_profile_role() = 'master');

drop policy if exists "acesso por mercado: products" on products;
create policy "leitura: products" on products for select to authenticated
  using (private.current_profile_role() = 'master' or market_id = private.current_profile_market_id());

drop policy if exists "acesso por mercado: weekly_promotions" on weekly_promotions;
create policy "leitura: weekly_promotions" on weekly_promotions for select to authenticated
  using (private.current_profile_role() = 'master' or market_id = private.current_profile_market_id());

drop policy if exists "acesso por mercado: themes" on themes;
create policy "leitura: themes" on themes for select to authenticated
  using (market_id is null or private.current_profile_role() = 'master' or market_id = private.current_profile_market_id());

drop policy if exists "acesso por mercado: tabloids" on tabloids;
create policy "leitura: tabloids" on tabloids for select to authenticated
  using (private.current_profile_role() = 'master' or market_id = private.current_profile_market_id());

drop policy if exists "acesso por mercado: tabloid_products" on tabloid_products;
create policy "leitura: tabloid_products" on tabloid_products for select to authenticated
  using (exists (
    select 1 from tabloids t
     where t.id = tabloid_products.tabloid_id
       and (private.current_profile_role() = 'master' or t.market_id = private.current_profile_market_id())
  ));

drop policy if exists "acesso por mercado: ai_recommendations" on ai_recommendations;
create policy "leitura: ai_recommendations" on ai_recommendations for select to authenticated
  using (private.current_profile_role() = 'master' or market_id = private.current_profile_market_id());

