-- En Claro · fase 3: cierre del día (manual o por voz), cobros con tarjeta/QR y su comisión, y lo que se movió.

alter table public.daily_closes add column card_sales numeric(14, 2) not null default 0 check (card_sales >= 0);
alter table public.daily_closes add column updated_at timestamptz not null default now();
create trigger tocar_daily_closes before update on public.daily_closes for each row execute function public.tocar_updated_at();

-- La comisión de cobro se guarda como un gasto más del día.
alter table public.close_expenses drop constraint close_expenses_category_check;
alter table public.close_expenses add constraint close_expenses_category_check check (category in ('proveedor', 'flete', 'vuelto', 'otros', 'comision'));

-- Guarda (o reemplaza) el cierre de un día de una sola vez. Corre con los permisos de quien llama: la RLS aplica.
-- p_gastos: [{"categoria":"proveedor","monto":60000,"concepto":"..."}]   p_productos: ids de lo que se movió ese día.
create function public.guardar_cierre(
  p_fecha date,
  p_ventas numeric,
  p_tarjeta numeric,
  p_gastos jsonb,
  p_productos uuid[],
  p_fuente text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  negocio uuid := public.my_business_id();
  comision_pct numeric;
  cierre uuid;
  g jsonb;
begin
  if negocio is null or not public.has_access() then
    raise exception 'sin acceso' using errcode = '42501';
  end if;
  if p_fecha > (now() at time zone 'America/Argentina/Buenos_Aires')::date or p_fecha < (now() at time zone 'America/Argentina/Buenos_Aires')::date - 60 then
    raise exception 'fecha fuera de rango' using errcode = '22023';
  end if;
  if p_tarjeta > p_ventas then
    raise exception 'lo cobrado con tarjeta no puede superar lo vendido' using errcode = '22023';
  end if;

  insert into public.daily_closes (business_id, date, sales_total, card_sales, source)
  values (negocio, p_fecha, p_ventas, coalesce(p_tarjeta, 0), coalesce(p_fuente, 'manual'))
  on conflict (business_id, date) do update
    set sales_total = excluded.sales_total, card_sales = excluded.card_sales, source = excluded.source
  returning id into cierre;

  delete from public.close_expenses where close_id = cierre and business_id = negocio;
  for g in select * from jsonb_array_elements(coalesce(p_gastos, '[]'::jsonb)) loop
    if coalesce((g ->> 'monto')::numeric, 0) > 0 then
      insert into public.close_expenses (business_id, close_id, category, concept, amount)
      values (negocio, cierre, g ->> 'categoria', nullif(left(g ->> 'concepto', 120), ''), (g ->> 'monto')::numeric);
    end if;
  end loop;

  select card_fee_pct into comision_pct from public.businesses where id = negocio;
  if coalesce(comision_pct, 0) > 0 and coalesce(p_tarjeta, 0) > 0 then
    insert into public.close_expenses (business_id, close_id, category, concept, amount)
    values (negocio, cierre, 'comision', 'Comisiones de cobro', round(p_tarjeta * comision_pct / 100, 2));
  end if;

  insert into public.product_sale_days (product_id, business_id, date)
  select pid, negocio, p_fecha from unnest(coalesce(p_productos, '{}'::uuid[])) as pid
  on conflict do nothing;

  return cierre;
end;
$$;

revoke all on function public.guardar_cierre(date, numeric, numeric, jsonb, uuid[], text) from public, anon;
grant execute on function public.guardar_cierre(date, numeric, numeric, jsonb, uuid[], text) to authenticated;

-- "Vendí hoy" desde la ficha del producto no puede repetir el día (se ignora en silencio).
-- El trigger de última venta ya existe (fase 1).

-- Uso de la voz y de la foto por día (para los límites). Lo consulta y lo escribe el servidor con la clave de servicio.
create index if not exists ai_calls_por_dia on public.ai_calls (business_id, kind, created_at);
