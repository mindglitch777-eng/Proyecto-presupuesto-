-- Pruebas de seguridad de la base. Cada bloque falla con un mensaje claro si algo está mal.
-- Se corren con: npm run test:db
\set ON_ERROR_STOP on
\pset tuples_only on
\pset format unaligned

-- helper: actuar como una persona (rol authenticated con su token)
create or replace function pg_temp.como(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, false);
  execute 'set role authenticated';
end $$;
create or replace function pg_temp.volver() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', false);
end $$;
create or replace function pg_temp.debe_fallar(p_sql text, p_que text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    return;
  end;
  raise exception 'DEBÍA FALLAR y no falló: %', p_que;
end $$;
create or replace function pg_temp.igual(p_real bigint, p_esperado bigint, p_que text) returns void language plpgsql as $$
begin
  if p_real is distinct from p_esperado then
    raise exception 'FALLÓ: % (esperado %, dio %)', p_que, p_esperado, p_real;
  end if;
  raise notice 'ok  %', p_que;
end $$;

-- Dos personas se registran
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@ejemplo.com', '{"negocio":"Kiosco de Ana","rubro":"kiosco","ciudad":"Santo Tomé","utm_source":"tiktok","utm_content":"v5-02"}'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'b@ejemplo.com', '{"rubro":"hackeo"}');

select pg_temp.igual((select count(*) from public.businesses), 2, 'el alta crea un negocio por persona');
select pg_temp.igual((select count(*) from public.subscriptions where status = 'trial' and trial_ends_at between now() + interval '13 days 23 hours' and now() + interval '14 days 1 hour'), 2, 'el alta crea una prueba de 14 días');
select pg_temp.igual((select count(*) from public.businesses where name = 'Kiosco de Ana' and rubro = 'kiosco' and utm_content = 'v5-02'), 1, 'el negocio nace con lo que vino del registro (UTM incluido)');
select pg_temp.igual((select count(*) from public.businesses where name = 'Mi negocio' and rubro is null), 1, 'un rubro inventado se descarta');
select pg_temp.igual((select count(*) from public.subscription_events where reason = 'alta'), 2, 'queda el evento de alta');

-- Cada una carga lo suyo
select pg_temp.como('aaaaaaaa-0000-0000-0000-000000000001');
insert into public.fixed_costs (business_id, concept, monthly_amount) values ((select public.my_business_id()), 'Alquiler', 450000);
insert into public.daily_closes (id, business_id, date, sales_total) values ('a1000000-0000-0000-0000-000000000001', (select public.my_business_id()), current_date, 120000);
insert into public.close_expenses (business_id, close_id, category, amount) values ((select public.my_business_id()), 'a1000000-0000-0000-0000-000000000001', 'proveedor', 66000);
insert into public.products (id, business_id, name, price, cost) values ('a2000000-0000-0000-0000-000000000001', (select public.my_business_id()), 'Gaseosa 500', 2160, 1500);
insert into public.customers (id, business_id, name) values ('a3000000-0000-0000-0000-000000000001', (select public.my_business_id()), 'Doña Marta');
insert into public.credit_movements (business_id, customer_id, type, amount, date) values
  ((select public.my_business_id()), 'a3000000-0000-0000-0000-000000000001', 'fio', 18000, current_date - 40),
  ((select public.my_business_id()), 'a3000000-0000-0000-0000-000000000001', 'pago', 3000, current_date - 10);
insert into public.product_sale_days (product_id, business_id, date) values ('a2000000-0000-0000-0000-000000000001', (select public.my_business_id()), current_date - 3);
select pg_temp.volver();

select pg_temp.como('bbbbbbbb-0000-0000-0000-000000000002');
insert into public.fixed_costs (business_id, concept, monthly_amount) values ((select public.my_business_id()), 'Luz', 140000);
insert into public.customers (id, business_id, name) values ('b3000000-0000-0000-0000-000000000001', (select public.my_business_id()), 'Juan');
insert into public.products (id, business_id, name) values ('b2000000-0000-0000-0000-000000000001', (select public.my_business_id()), 'Yerba');
select pg_temp.volver();

-- 1) A no ve datos de B (y al revés)
select pg_temp.como('aaaaaaaa-0000-0000-0000-000000000001');
select pg_temp.igual((select count(*) from public.fixed_costs), 1, 'A ve solo sus gastos fijos');
select pg_temp.igual((select count(*) from public.customers), 1, 'A ve solo sus clientes');
select pg_temp.igual((select count(*) from public.customers where id = 'b3000000-0000-0000-0000-000000000001'), 0, 'A no puede pedir un cliente de B por su id');
select pg_temp.igual((select count(*) from public.products where id = 'b2000000-0000-0000-0000-000000000001'), 0, 'A no ve productos de B');
select pg_temp.igual((select count(*) from public.businesses), 1, 'A ve solo su negocio');
select pg_temp.igual((select count(*) from public.subscriptions), 1, 'A ve solo su suscripción');
select pg_temp.igual((select balance from public.customer_balances where customer_id = 'a3000000-0000-0000-0000-000000000001')::bigint, 15000, 'el saldo del fiado es 18.000 − 3.000');
select pg_temp.igual((select count(*) from public.customer_balances), 1, 'la vista de saldos también respeta la RLS');
-- A no puede escribir en el negocio de B ni colgarse de sus datos
select pg_temp.debe_fallar($q$insert into public.fixed_costs (business_id, concept) values ((select id from public.businesses where owner_id = 'bbbbbbbb-0000-0000-0000-000000000002'), 'intruso')$q$, 'A escribe en el negocio de B');
select pg_temp.debe_fallar($q$insert into public.credit_movements (business_id, customer_id, type, amount) values ((select public.my_business_id()), 'b3000000-0000-0000-0000-000000000001', 'fio', 1)$q$, 'A cuelga un fiado de un cliente de B');
select pg_temp.debe_fallar($q$insert into public.product_sale_days (product_id, business_id, date) values ('b2000000-0000-0000-0000-000000000001', (select public.my_business_id()), current_date)$q$, 'A anota ventas de un producto de B');
select pg_temp.volver();
-- UPDATE y DELETE sobre filas ajenas no tocan nada
select pg_temp.como('aaaaaaaa-0000-0000-0000-000000000001');
update public.customers set name = 'hackeado' where id = 'b3000000-0000-0000-0000-000000000001';
delete from public.fixed_costs where concept = 'Luz';
select pg_temp.volver();
select pg_temp.igual((select count(*) from public.customers where name = 'Juan'), 1, 'A no pudo modificar a un cliente de B');
select pg_temp.igual((select count(*) from public.fixed_costs where concept = 'Luz'), 1, 'A no pudo borrar gastos de B');

-- 2) Permisos: nadie se cambia su suscripción ni escribe pagos
select pg_temp.como('aaaaaaaa-0000-0000-0000-000000000001');
select pg_temp.debe_fallar($q$update public.subscriptions set status = 'active', current_period_end = now() + interval '1 year'$q$, 'una persona se activa su propia suscripción');
select pg_temp.debe_fallar($q$insert into public.payments (user_id, mp_payment_id, amount, status) values ('aaaaaaaa-0000-0000-0000-000000000001', 'x', 1, 'approved')$q$, 'una persona se inventa un pago');
select pg_temp.debe_fallar($q$update public.businesses set utm_content = 'otro'$q$, 'una persona cambia el origen del registro');
select pg_temp.debe_fallar($q$insert into public.ai_calls (business_id, kind) values ((select public.my_business_id()), 'voz')$q$, 'una persona escribe su propio gasto de IA');
select pg_temp.volver();

-- 3) Sin sesión (anon) no se lee nada
set role anon;
select pg_temp.debe_fallar('select count(*) from public.products', 'anon lee productos');
select pg_temp.debe_fallar('select count(*) from public.businesses', 'anon lee negocios');
select pg_temp.debe_fallar('select public.has_access()', 'anon llama a has_access');
reset role;

-- 4) Trigger de "última venta" y evento de suscripción
select pg_temp.igual((select count(*) from public.products where id = 'a2000000-0000-0000-0000-000000000001' and last_sold_at = current_date - 3), 1, 'anotar una venta actualiza last_sold_at');

-- 5) Prueba vencida: cero filas en todo, y el resumen en solo lectura sigue funcionando
update public.subscriptions set trial_ends_at = now() - interval '1 hour' where user_id = 'aaaaaaaa-0000-0000-0000-000000000001';
select pg_temp.como('aaaaaaaa-0000-0000-0000-000000000001');
select pg_temp.igual((select public.has_access()::int), 0, 'con la prueba vencida has_access da falso');
select pg_temp.igual((select count(*) from public.businesses), 0, 'prueba vencida: 0 negocios');
select pg_temp.igual((select count(*) from public.fixed_costs), 0, 'prueba vencida: 0 gastos fijos');
select pg_temp.igual((select count(*) from public.daily_closes), 0, 'prueba vencida: 0 cierres');
select pg_temp.igual((select count(*) from public.close_expenses), 0, 'prueba vencida: 0 gastos del cierre');
select pg_temp.igual((select count(*) from public.products), 0, 'prueba vencida: 0 productos');
select pg_temp.igual((select count(*) from public.product_sale_days), 0, 'prueba vencida: 0 días de venta');
select pg_temp.igual((select count(*) from public.customers), 0, 'prueba vencida: 0 clientes');
select pg_temp.igual((select count(*) from public.credit_movements), 0, 'prueba vencida: 0 movimientos de fiado');
select pg_temp.igual((select count(*) from public.customer_balances), 0, 'prueba vencida: 0 saldos');
select pg_temp.debe_fallar($q$insert into public.fixed_costs (business_id, concept) values ((select id from public.businesses limit 1), 'x')$q$, 'prueba vencida: no se puede cargar nada');
select pg_temp.igual((select count(*) from public.resumen_bloqueado where negocio = 'Kiosco de Ana' and cierres = 1 and productos = 1 and fiados_pendientes = 15000 and gastos_fijos_mes = 450000), 1, 'el resumen en solo lectura muestra sus datos guardados');
select pg_temp.igual((select count(*) from public.subscriptions), 1, 'igual puede ver su suscripción para poder renovarla');
select pg_temp.igual((select (public.mi_estado() = 'expired')::int), 1, 'mi_estado dice expired');
select pg_temp.volver();
-- B sigue normal
select pg_temp.como('bbbbbbbb-0000-0000-0000-000000000002');
select pg_temp.igual((select count(*) from public.fixed_costs), 1, 'B sigue viendo lo suyo mientras A está vencida');
select pg_temp.volver();

-- 6) Reglas de acceso: gracia de 3 días, bloqueo y cancelada
update public.subscriptions set status = 'active', current_period_end = now() - interval '2 days' where user_id = 'aaaaaaaa-0000-0000-0000-000000000001';
select pg_temp.como('aaaaaaaa-0000-0000-0000-000000000001');
select pg_temp.igual((select count(*) from public.fixed_costs), 1, 'activa y vencida hace 2 días: todavía tiene acceso (gracia de 3)');
select pg_temp.volver();
update public.subscriptions set current_period_end = now() - interval '4 days' where user_id = 'aaaaaaaa-0000-0000-0000-000000000001';
select pg_temp.como('aaaaaaaa-0000-0000-0000-000000000001');
select pg_temp.igual((select count(*) from public.fixed_costs), 0, 'activa y vencida hace 4 días: sin acceso');
select pg_temp.volver();
update public.subscriptions set status = 'past_due', current_period_end = now() - interval '1 day' where user_id = 'aaaaaaaa-0000-0000-0000-000000000001';
select pg_temp.como('aaaaaaaa-0000-0000-0000-000000000001');
select pg_temp.igual((select count(*) from public.fixed_costs), 1, 'con pago atrasado hace 1 día todavía tiene acceso');
select pg_temp.volver();
update public.subscriptions set blocked_at = now() where user_id = 'aaaaaaaa-0000-0000-0000-000000000001';
select pg_temp.como('aaaaaaaa-0000-0000-0000-000000000001');
select pg_temp.igual((select count(*) from public.fixed_costs), 0, 'bloqueada por el admin: sin acceso aunque haya pagado');
select pg_temp.volver();
update public.subscriptions set blocked_at = null, status = 'cancelled' where user_id = 'aaaaaaaa-0000-0000-0000-000000000001';
select pg_temp.como('aaaaaaaa-0000-0000-0000-000000000001');
select pg_temp.igual((select count(*) from public.fixed_costs), 0, 'cancelada: sin acceso');
select pg_temp.volver();
select pg_temp.igual((select count(*) from public.subscription_events where user_id = 'aaaaaaaa-0000-0000-0000-000000000001' and reason in ('cambio', 'bloqueo', 'desbloqueo')), 4, 'cada cambio dejó su evento');

-- 7) Token hook
update public.subscriptions set status = 'trial', trial_ends_at = now() + interval '5 days' where user_id = 'aaaaaaaa-0000-0000-0000-000000000001';
select pg_temp.igual((select (public.custom_access_token_hook('{"user_id":"aaaaaaaa-0000-0000-0000-000000000001","claims":{"sub":"x"}}'::jsonb) #>> '{claims,account_status}' = 'trial')::int), 1, 'el hook agrega account_status = trial');
update public.subscriptions set trial_ends_at = now() - interval '1 day' where user_id = 'aaaaaaaa-0000-0000-0000-000000000001';
select pg_temp.igual((select (public.custom_access_token_hook('{"user_id":"aaaaaaaa-0000-0000-0000-000000000001","claims":{"sub":"x"}}'::jsonb) #>> '{claims,account_status}' = 'expired')::int), 1, 'el hook agrega account_status = expired');
select pg_temp.igual((select (public.custom_access_token_hook('{"user_id":"cccccccc-0000-0000-0000-000000000009","claims":{}}'::jsonb) #>> '{claims,account_status}' = 'none')::int), 1, 'sin suscripción: none');
set role authenticated;
select pg_temp.debe_fallar($q$select public.custom_access_token_hook('{}'::jsonb)$q$, 'una persona llama al hook');
reset role;
set role supabase_auth_admin;
select pg_temp.igual((select (public.custom_access_token_hook('{"user_id":"bbbbbbbb-0000-0000-0000-000000000002","claims":{}}'::jsonb) #>> '{claims,account_status}' = 'trial')::int), 1, 'supabase_auth_admin puede ejecutar el hook');
reset role;

-- 8) La lista de espera sigue cerrada
set role authenticated;
select pg_temp.debe_fallar('select count(*) from public.waitlist', 'una persona logueada lee la lista de espera');
reset role;

\echo
\echo TODO OK: la base separa los datos y respeta el acceso.
