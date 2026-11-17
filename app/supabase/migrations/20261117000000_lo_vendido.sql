-- En Claro · lo vendido en cada cierre (por rubro o por producto) y descuento de stock.
-- "Vendí 250 mil de carne, 20 en cerveza" o "10 cocas y 5 alfajores": una fila por cada cosa.

create table public.close_sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  close_id uuid not null,
  product_id uuid,
  rubro text not null check (char_length(rubro) between 1 and 40),
  descripcion text check (char_length(descripcion) <= 120),
  amount numeric(14, 2) check (amount >= 0),
  units numeric(14, 2) check (units >= 0),
  stock_descontado numeric(14, 2) not null default 0,
  foreign key (close_id, business_id) references public.daily_closes (id, business_id) on delete cascade,
  foreign key (product_id, business_id) references public.products (id, business_id) on delete set null (product_id)
);
create index close_sales_por_cierre on public.close_sales (business_id, close_id);

alter table public.close_sales enable row level security;
create policy dueno_total on public.close_sales for all to authenticated
  using (business_id = (select public.my_business_id()) and (select public.has_access()))
  with check (business_id = (select public.my_business_id()) and (select public.has_access()));
grant select, insert, update, delete on public.close_sales to authenticated;

-- Reemplaza lo vendido de un día. Si se corrige el cierre, primero devuelve al stock lo que se había descontado.
-- p_items: [{"rubro":"bebidas","descripcion":"coca","monto":null,"unidades":10,"producto_id":"…","descontar":10}]
create function public.guardar_ventas_cierre(p_fecha date, p_items jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  negocio uuid := public.my_business_id();
  cierre uuid;
  it jsonb;
  pid uuid;
  pedir numeric;
  hay numeric;
  quitar numeric;
begin
  if negocio is null or not public.has_access() then
    raise exception 'sin acceso' using errcode = '42501';
  end if;
  select id into cierre from public.daily_closes where business_id = negocio and date = p_fecha;
  if cierre is null then
    raise exception 'no hay cierre ese día' using errcode = '22023';
  end if;

  update public.products p set stock = p.stock + s.total
  from (
    select product_id, sum(stock_descontado) as total
    from public.close_sales
    where close_id = cierre and business_id = negocio and product_id is not null
    group by product_id
  ) s
  where p.id = s.product_id and p.business_id = negocio and p.stock is not null;
  delete from public.close_sales where close_id = cierre and business_id = negocio;

  for it in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    pid := nullif(it ->> 'producto_id', '')::uuid;
    pedir := greatest(coalesce(nullif(it ->> 'descontar', '')::numeric, 0), 0);
    quitar := 0;
    if pid is not null and pedir > 0 then
      select stock into hay from public.products where id = pid and business_id = negocio;
      if hay is not null then
        quitar := least(greatest(hay, 0), pedir);
        update public.products set stock = stock - quitar where id = pid and business_id = negocio;
      end if;
    end if;
    insert into public.close_sales (business_id, close_id, product_id, rubro, descripcion, amount, units, stock_descontado)
    values (negocio, cierre, pid, left(coalesce(nullif(it ->> 'rubro', ''), 'varios'), 40), nullif(left(it ->> 'descripcion', 120), ''),
            nullif(it ->> 'monto', '')::numeric, nullif(it ->> 'unidades', '')::numeric, quitar);
    if pid is not null then
      insert into public.product_sale_days (product_id, business_id, date) values (pid, negocio, p_fecha) on conflict do nothing;
    end if;
  end loop;
end;
$$;

revoke all on function public.guardar_ventas_cierre(date, jsonb) from public, anon;
grant execute on function public.guardar_ventas_cierre(date, jsonb) to authenticated;
