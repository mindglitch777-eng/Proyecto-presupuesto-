-- Socios fundadores: los primeros 100 que se registran por el link /fundadores pagan $12.900 para siempre.
-- El cupo lo controla la base (no la página): aunque dos personas se registren en el mismo segundo, nunca pasan de 100.

-- Cupo total. Para cambiarlo, reemplazar esta función (create or replace) con otro número.
create or replace function public.cupo_fundadores()
returns integer
language sql
immutable
as $$ select 100 $$;

-- Lugares que quedan: cupo menos los que ya son fundadores. Lo puede ver cualquiera (es el contador de la página).
create or replace function public.lugares_fundadores()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select greatest(0, public.cupo_fundadores() - count(*)::integer) from public.subscriptions where plan = 'fundador';
$$;
revoke all on function public.lugares_fundadores() from public;
grant execute on function public.lugares_fundadores() to anon, authenticated, service_role;

-- Alta de cuenta: si viene por el link de fundadores y queda lugar, plan fundador a $12.900; si no, mensual a $19.900.
create or replace function public.crear_negocio_y_prueba()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  es_fundador boolean := false;
begin
  insert into public.businesses (owner_id, name, rubro, ciudad, utm_source, utm_content)
  values (
    new.id,
    coalesce(nullif(left(meta ->> 'negocio', 120), ''), 'Mi negocio'),
    case when meta ->> 'rubro' in ('kiosco', 'almacen', 'dietetica') then meta ->> 'rubro' end,
    nullif(left(meta ->> 'ciudad', 120), ''),
    nullif(left(meta ->> 'utm_source', 80), ''),
    nullif(left(meta ->> 'utm_content', 80), '')
  );
  if meta ->> 'fundador' = 'si' then
    -- De a uno por vez: así el lugar 100 no se lo dan a dos personas.
    perform pg_advisory_xact_lock(hashtext('enclaro_fundadores'));
    select count(*) < public.cupo_fundadores() into es_fundador from public.subscriptions where plan = 'fundador';
  end if;
  insert into public.subscriptions (user_id, status, plan, price, billing_method, trial_ends_at)
  values (new.id, 'trial', case when es_fundador then 'fundador' else 'mensual' end, case when es_fundador then 12900 else 19900 end, 'mp_suscripcion', now() + interval '14 days');
  return new;
end;
$$;
