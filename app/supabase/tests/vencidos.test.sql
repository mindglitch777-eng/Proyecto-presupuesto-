-- Fase 2: vencimiento automático y comisión de cobro.
\set ON_ERROR_STOP on
\pset tuples_only on
\pset format unaligned

create or replace function pg_temp.igual(p_real bigint, p_esperado bigint, p_que text) returns void language plpgsql as $$
begin
  if p_real is distinct from p_esperado then raise exception 'FALLÓ: % (esperado %, dio %)', p_que, p_esperado, p_real; end if;
  raise notice 'ok  %', p_que;
end $$;
create or replace function pg_temp.debe_fallar(p_sql text, p_que text) returns void language plpgsql as $$
begin
  begin execute p_sql; exception when others then return; end;
  raise exception 'DEBÍA FALLAR y no falló: %', p_que;
end $$;

insert into auth.users (id, email) values
  ('c0000000-0000-0000-0000-000000000001', 'prueba-vencida@ejemplo.com'),
  ('c0000000-0000-0000-0000-000000000002', 'prueba-vigente@ejemplo.com'),
  ('c0000000-0000-0000-0000-000000000003', 'atrasado-4-dias@ejemplo.com'),
  ('c0000000-0000-0000-0000-000000000004', 'atrasado-1-dia@ejemplo.com'),
  ('c0000000-0000-0000-0000-000000000005', 'activo@ejemplo.com');
update public.subscriptions set trial_ends_at = now() - interval '1 minute' where user_id = 'c0000000-0000-0000-0000-000000000001';
update public.subscriptions set status = 'past_due', current_period_end = now() - interval '4 days' where user_id = 'c0000000-0000-0000-0000-000000000003';
update public.subscriptions set status = 'past_due', current_period_end = now() - interval '1 day' where user_id = 'c0000000-0000-0000-0000-000000000004';
update public.subscriptions set status = 'active', current_period_end = now() + interval '20 days' where user_id = 'c0000000-0000-0000-0000-000000000005';

select pg_temp.igual(public.expirar_suscripciones(), 2 + (select count(*) from public.subscriptions where user_id not in (select id from auth.users where email like '%@ejemplo.com' and id::text like 'c%') and ((status = 'trial' and trial_ends_at <= now()) or (status = 'past_due' and current_period_end + interval '3 days' <= now()))), 'vence exactamente las pruebas vencidas y los atrasados de más de 3 días');
select pg_temp.igual((select count(*) from public.subscriptions where user_id = 'c0000000-0000-0000-0000-000000000001' and status = 'expired'), 1, 'prueba vencida → expired');
select pg_temp.igual((select count(*) from public.subscriptions where user_id = 'c0000000-0000-0000-0000-000000000002' and status = 'trial'), 1, 'prueba vigente sigue en trial');
select pg_temp.igual((select count(*) from public.subscriptions where user_id = 'c0000000-0000-0000-0000-000000000003' and status = 'expired'), 1, 'atrasado hace 4 días → expired');
select pg_temp.igual((select count(*) from public.subscriptions where user_id = 'c0000000-0000-0000-0000-000000000004' and status = 'past_due'), 1, 'atrasado hace 1 día sigue con gracia');
select pg_temp.igual((select count(*) from public.subscriptions where user_id = 'c0000000-0000-0000-0000-000000000005' and status = 'active'), 1, 'activo no se toca');
select pg_temp.igual((select count(*) from public.subscription_events where reason = 'vencimiento automático' and user_id in ('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003')), 2, 'cada vencimiento deja su evento con el motivo');
select pg_temp.igual(public.expirar_suscripciones(), 0, 'correrlo dos veces no hace nada nuevo');

-- Nadie lo puede correr desde la app
set role authenticated;
select pg_temp.debe_fallar('select public.expirar_suscripciones()', 'una persona corre el vencimiento');
reset role;

-- Comisión de cobro: la puede cargar el dueño, con límites
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-000000000002","role":"authenticated"}', false);
set role authenticated;
update public.businesses set card_fee_pct = 6.5;
select pg_temp.debe_fallar('update public.businesses set card_fee_pct = 50', 'comisión de 50%');
reset role;
select pg_temp.igual((select count(*) from public.businesses where owner_id = 'c0000000-0000-0000-0000-000000000002' and card_fee_pct = 6.5), 1, 'el dueño carga su comisión de cobro');

\echo
\echo TODO OK: vencimientos y comisión.
