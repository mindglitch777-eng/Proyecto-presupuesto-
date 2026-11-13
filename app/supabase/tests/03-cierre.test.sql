-- Fase 3: guardar_cierre.
\set ON_ERROR_STOP on
\pset tuples_only on
\pset format unaligned
create or replace function pg_temp.igual(p_real numeric, p_esperado numeric, p_que text) returns void language plpgsql as $$
begin
  if p_real is distinct from p_esperado then raise exception 'FALLÓ: % (esperado %, dio %)', p_que, p_esperado, p_real; end if;
  raise notice 'ok  %', p_que;
end $$;
create or replace function pg_temp.debe_fallar(p_sql text, p_que text) returns void language plpgsql as $$
begin
  begin execute p_sql; exception when others then return; end;
  raise exception 'DEBÍA FALLAR y no falló: %', p_que;
end $$;

insert into auth.users (id, email) values ('d0000000-0000-0000-0000-000000000001', 'cierre@ejemplo.com'), ('d0000000-0000-0000-0000-000000000002', 'otro@ejemplo.com');
update public.businesses set card_fee_pct = 6 where owner_id = 'd0000000-0000-0000-0000-000000000001';
insert into public.products (id, business_id, name, price, cost) values
  ('d1000000-0000-0000-0000-000000000001', (select id from public.businesses where owner_id = 'd0000000-0000-0000-0000-000000000001'), 'Gaseosa', 2160, 1500),
  ('d1000000-0000-0000-0000-000000000002', (select id from public.businesses where owner_id = 'd0000000-0000-0000-0000-000000000002'), 'Ajeno', 100, 50);

select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-000000000001","role":"authenticated"}', false);
set role authenticated;
select public.guardar_cierre((now() at time zone 'America/Argentina/Buenos_Aires')::date, 120000, 80000,
  '[{"categoria":"proveedor","monto":60000},{"categoria":"flete","monto":5000},{"categoria":"otros","monto":0}]'::jsonb,
  array['d1000000-0000-0000-0000-000000000001']::uuid[], 'voz');
select pg_temp.igual((select sales_total from public.daily_closes), 120000, 'guarda las ventas');
select pg_temp.igual((select count(*) from public.close_expenses), 3, 'guarda los gastos con monto (y no los de cero) + la comisión');
select pg_temp.igual((select amount from public.close_expenses where category = 'comision'), 4800, 'comisión de cobro = 6% de 80.000');
select pg_temp.igual((select count(*) from public.products where last_sold_at = (now() at time zone 'America/Argentina/Buenos_Aires')::date), 1, 'lo que se movió actualiza la última venta');
-- volver a guardar el mismo día reemplaza (no duplica)
select public.guardar_cierre((now() at time zone 'America/Argentina/Buenos_Aires')::date, 150000, 0, '[{"categoria":"vuelto","monto":2000}]'::jsonb, null, 'manual');
select pg_temp.igual((select count(*) from public.daily_closes), 1, 'un solo cierre por día');
select pg_temp.igual((select sales_total from public.daily_closes), 150000, 'el cierre se corrige');
select pg_temp.igual((select count(*) from public.close_expenses), 1, 'los gastos se reemplazan y sin tarjeta no hay comisión');
select pg_temp.debe_fallar($q$select public.guardar_cierre((now() at time zone 'America/Argentina/Buenos_Aires')::date + 1, 1, 0, '[]', null, 'manual')$q$, 'cierre de un día que todavía no pasó');
select pg_temp.debe_fallar($q$select public.guardar_cierre((now() at time zone 'America/Argentina/Buenos_Aires')::date, 100, 200, '[]', null, 'manual')$q$, 'más tarjeta que ventas');
select pg_temp.debe_fallar($q$select public.guardar_cierre((now() at time zone 'America/Argentina/Buenos_Aires')::date, 100, 0, '[{"categoria":"robo","monto":5}]', null, 'manual')$q$, 'categoría inventada');
select pg_temp.debe_fallar($q$select public.guardar_cierre((now() at time zone 'America/Argentina/Buenos_Aires')::date, 100, 0, '[]', array['d1000000-0000-0000-0000-000000000002']::uuid[], 'manual')$q$, 'marcar como vendido un producto de otro negocio');
reset role;
select pg_temp.igual((select count(*) from public.product_sale_days where product_id = 'd1000000-0000-0000-0000-000000000002'), 0, 'el producto ajeno quedó intacto');
-- vencida: no puede guardar
update public.subscriptions set trial_ends_at = now() - interval '1 hour' where user_id = 'd0000000-0000-0000-0000-000000000001';
set role authenticated;
select pg_temp.debe_fallar($q$select public.guardar_cierre((now() at time zone 'America/Argentina/Buenos_Aires')::date, 1, 0, '[]', null, 'manual')$q$, 'prueba vencida guarda un cierre');
reset role;
set role anon;
select pg_temp.debe_fallar($q$select public.guardar_cierre(current_date, 1, 0, '[]', null, 'manual')$q$, 'anon guarda un cierre');
reset role;
\echo
\echo TODO OK: cierre del día.
