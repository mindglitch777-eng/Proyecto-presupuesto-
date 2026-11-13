-- En Claro · fase 1: esquema completo, acceso por suscripción (has_access), RLS, triggers y token hook.
-- Un usuario = un negocio. Todo dato lleva business_id y la barrera real es esta base, no la interfaz.
-- Se corre una sola vez en el SQL Editor de Supabase (después de 20261113000000_lista_espera.sql).

-- ---------------------------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------------------------

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null default 'Mi negocio' check (char_length(name) between 1 and 120),
  rubro text check (rubro in ('kiosco', 'almacen', 'dietetica')),
  ciudad text check (char_length(ciudad) <= 120),
  margin_alert_pct numeric(5, 2) not null default 15 check (margin_alert_pct between 0 and 100),
  dormant_days integer not null default 30 check (dormant_days between 7 and 365),
  price_rounding integer not null default 10 check (price_rounding in (1, 5, 10, 50, 100)),
  onboarding_completed_at timestamptz,
  utm_source text check (char_length(utm_source) <= 80),
  utm_content text check (char_length(utm_content) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);

create table public.fixed_costs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  concept text not null check (char_length(concept) between 1 and 80),
  monthly_amount numeric(14, 2) not null default 0 check (monthly_amount >= 0)
);

create table public.daily_closes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  date date not null,
  sales_total numeric(14, 2) not null check (sales_total >= 0),
  source text not null default 'manual' check (source in ('voz', 'manual')),
  created_at timestamptz not null default now(),
  unique (business_id, date),
  unique (id, business_id)
);

-- Las tablas hijas llevan también business_id y una clave compuesta hacia su padre:
-- así ningún dato puede colgarse del negocio de otra persona y la política de RLS es la misma en todas.
create table public.close_expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  close_id uuid not null,
  category text not null check (category in ('proveedor', 'flete', 'vuelto', 'otros')),
  concept text check (char_length(concept) <= 120),
  amount numeric(14, 2) not null check (amount >= 0),
  foreign key (close_id, business_id) references public.daily_closes (id, business_id) on delete cascade
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  price numeric(14, 2) check (price >= 0),
  cost numeric(14, 2) check (cost >= 0),
  stock numeric(14, 2),
  price_updated_at timestamptz,
  last_sold_at date,
  dormant_action text check (dormant_action in ('no_reponer', 'liquidar', 'mantener')),
  dormant_snoozed_until date,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, business_id)
);

create table public.product_sale_days (
  product_id uuid not null,
  business_id uuid not null,
  date date not null,
  primary key (product_id, date),
  foreign key (product_id, business_id) references public.products (id, business_id) on delete cascade
);

create table public.price_changes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  product_id uuid not null,
  old_cost numeric(14, 2),
  new_cost numeric(14, 2),
  old_price numeric(14, 2),
  new_price numeric(14, 2),
  source text not null check (source in ('factura', 'manual')),
  created_at timestamptz not null default now(),
  foreign key (product_id, business_id) references public.products (id, business_id) on delete cascade
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  phone text check (char_length(phone) <= 30),
  pay_day integer check (pay_day between 1 and 31),
  note text check (char_length(note) <= 500),
  last_reminded_at timestamptz,
  reminders_unpaid integer not null default 0 check (reminders_unpaid >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, business_id)
);

create table public.credit_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  customer_id uuid not null,
  type text not null check (type in ('fio', 'pago')),
  amount numeric(14, 2) not null check (amount > 0),
  date date not null default current_date,
  note text check (char_length(note) <= 300),
  created_at timestamptz not null default now(),
  foreign key (customer_id, business_id) references public.customers (id, business_id) on delete cascade
);

create table public.ai_calls (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  kind text not null check (kind in ('voz', 'factura')),
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  cost_usd numeric(10, 6) not null default 0,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  status text not null default 'trial' check (status in ('trial', 'active', 'past_due', 'expired', 'cancelled')),
  plan text not null default 'mensual' check (plan in ('fundador', 'mensual', 'anual')),
  price numeric(14, 2) not null default 19900 check (price >= 0),
  billing_method text not null default 'mp_suscripcion' check (billing_method in ('mp_suscripcion', 'mp_pago_unico', 'manual')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  mp_preapproval_id text,
  mp_payer_id text,
  blocked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  from_status text,
  to_status text not null,
  reason text,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mp_payment_id text not null unique,
  amount numeric(14, 2) not null,
  status text not null,
  paid_at timestamptz,
  raw jsonb
);

create index on public.fixed_costs (business_id);
create index on public.close_expenses (business_id, close_id);
create index on public.daily_closes (business_id, date desc);
create index on public.products (business_id) where archived_at is null;
create index on public.price_changes (business_id, product_id, created_at desc);
create index on public.customers (business_id);
create index on public.credit_movements (business_id, customer_id, date desc);
create index on public.ai_calls (business_id, created_at desc);
create index on public.subscription_events (user_id, created_at desc);
create index on public.payments (user_id);

-- ---------------------------------------------------------------------------------------------
-- Acceso: la barrera real
-- ---------------------------------------------------------------------------------------------

-- Estado de cuenta de una persona en este momento. Solo lo usan has_access y el token hook.
create function public.estado_de(p_user uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select case
       when s.blocked_at is not null then 'blocked'
       when s.status = 'trial' and s.trial_ends_at > now() then 'trial'
       when s.status in ('active', 'past_due') and s.current_period_end + interval '3 days' > now() then s.status
       when s.status = 'cancelled' then 'cancelled'
       else 'expired'
     end
     from public.subscriptions s
     where s.user_id = p_user),
    'none'
  );
$$;

-- ¿Puede esta persona ver y cargar datos ahora? Mira la suscripción en el momento, no el token.
create function public.has_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.estado_de((select auth.uid())) in ('trial', 'active', 'past_due');
$$;

create function public.my_business_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select b.id from public.businesses b where b.owner_id = (select auth.uid());
$$;

-- Estado para mostrar en la interfaz (no es seguridad).
create function public.mi_estado()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select public.estado_de((select auth.uid()));
$$;

-- ---------------------------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------------------------

create function public.tocar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger tocar_businesses before update on public.businesses for each row execute function public.tocar_updated_at();
create trigger tocar_products before update on public.products for each row execute function public.tocar_updated_at();
create trigger tocar_customers before update on public.customers for each row execute function public.tocar_updated_at();
create trigger tocar_subscriptions before update on public.subscriptions for each row execute function public.tocar_updated_at();

-- Alta: al crearse un usuario nacen su negocio y su prueba de 14 días.
create function public.crear_negocio_y_prueba()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
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
  insert into public.subscriptions (user_id, status, plan, price, billing_method, trial_ends_at)
  values (new.id, 'trial', 'mensual', 19900, 'mp_suscripcion', now() + interval '14 days');
  return new;
end;
$$;

create trigger al_crear_usuario after insert on auth.users for each row execute function public.crear_negocio_y_prueba();

-- Cada cambio de estado de una suscripción deja su registro (para el admin y el churn).
create function public.registrar_evento_suscripcion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  motivo text := nullif(current_setting('enclaro.motivo', true), '');
begin
  if tg_op = 'INSERT' then
    insert into public.subscription_events (user_id, from_status, to_status, reason)
    values (new.user_id, null, new.status, coalesce(motivo, 'alta'));
  elsif old.status is distinct from new.status then
    insert into public.subscription_events (user_id, from_status, to_status, reason)
    values (new.user_id, old.status, new.status, coalesce(motivo, 'cambio'));
  elsif old.blocked_at is distinct from new.blocked_at then
    insert into public.subscription_events (user_id, from_status, to_status, reason)
    values (new.user_id, old.status, new.status, coalesce(motivo, case when new.blocked_at is null then 'desbloqueo' else 'bloqueo' end));
  end if;
  return new;
end;
$$;

create trigger registrar_evento after insert or update on public.subscriptions for each row execute function public.registrar_evento_suscripcion();

-- Cuando se anota que un producto se vendió un día, se actualiza su "última venta" (plata dormida).
create function public.actualizar_ultima_venta()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.products
     set last_sold_at = greatest(coalesce(last_sold_at, new.date), new.date)
   where id = new.product_id and business_id = new.business_id;
  return new;
end;
$$;

create trigger al_vender after insert on public.product_sale_days for each row execute function public.actualizar_ultima_venta();

-- ---------------------------------------------------------------------------------------------
-- Vistas
-- ---------------------------------------------------------------------------------------------

-- Cuánto debe cada cliente. Respeta la RLS de quien consulta.
create view public.customer_balances with (security_invoker = true) as
select
  c.id as customer_id,
  c.business_id,
  coalesce(sum(case m.type when 'fio' then m.amount else -m.amount end), 0)::numeric(14, 2) as balance,
  min(m.date) filter (where m.type = 'fio') as first_fio_date,
  max(m.date) filter (where m.type = 'fio') as last_fio_date,
  max(m.date) filter (where m.type = 'pago') as last_payment_date
from public.customers c
left join public.credit_movements m on m.customer_id = c.id
group by c.id, c.business_id;

-- Resumen en solo lectura para quien tiene la prueba vencida: "Tu prueba terminó. Tus datos están guardados."
-- A propósito corre con los permisos del dueño de la vista (se saltea la RLS) y solo devuelve filas del usuario actual.
create view public.resumen_bloqueado as
select
  b.name as negocio,
  b.rubro,
  b.ciudad,
  (select coalesce(sum(f.monthly_amount), 0) from public.fixed_costs f where f.business_id = b.id)::numeric(14, 2) as gastos_fijos_mes,
  (select count(*) from public.daily_closes c where c.business_id = b.id)::integer as cierres,
  (select max(c.date) from public.daily_closes c where c.business_id = b.id) as ultimo_cierre,
  (select count(*) from public.products p where p.business_id = b.id and p.archived_at is null)::integer as productos,
  (select coalesce(sum(case m.type when 'fio' then m.amount else -m.amount end), 0)
     from public.credit_movements m where m.business_id = b.id)::numeric(14, 2) as fiados_pendientes
from public.businesses b
where b.owner_id = (select auth.uid());

-- ---------------------------------------------------------------------------------------------
-- RLS: cada persona ve solo lo suyo, y solo mientras tenga acceso
-- ---------------------------------------------------------------------------------------------

alter table public.businesses enable row level security;
alter table public.fixed_costs enable row level security;
alter table public.daily_closes enable row level security;
alter table public.close_expenses enable row level security;
alter table public.products enable row level security;
alter table public.product_sale_days enable row level security;
alter table public.price_changes enable row level security;
alter table public.customers enable row level security;
alter table public.credit_movements enable row level security;
alter table public.ai_calls enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_events enable row level security;
alter table public.payments enable row level security;

-- El negocio: solo el dueño y con acceso. No se crea ni se borra desde la app (lo hace el alta).
create policy negocio_ver on public.businesses for select to authenticated
  using (owner_id = (select auth.uid()) and (select public.has_access()));
create policy negocio_editar on public.businesses for update to authenticated
  using (owner_id = (select auth.uid()) and (select public.has_access()))
  with check (owner_id = (select auth.uid()) and (select public.has_access()));

-- Tablas de datos: todas con la misma regla.
do $$
declare
  t text;
begin
  foreach t in array array['fixed_costs', 'daily_closes', 'close_expenses', 'products', 'product_sale_days', 'price_changes', 'customers', 'credit_movements']
  loop
    execute format(
      'create policy dueno_total on public.%I for all to authenticated
         using (business_id = (select public.my_business_id()) and (select public.has_access()))
         with check (business_id = (select public.my_business_id()) and (select public.has_access()))', t);
  end loop;
end $$;

-- Solo lectura de lo propio. Las altas y cambios los hace el servidor con la clave de servicio.
create policy ia_ver on public.ai_calls for select to authenticated
  using (business_id = (select public.my_business_id()) and (select public.has_access()));
create policy suscripcion_ver on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()));
create policy eventos_ver on public.subscription_events for select to authenticated
  using (user_id = (select auth.uid()));
create policy pagos_ver on public.payments for select to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------------------------
-- Permisos (la RLS filtra filas; esto decide qué se puede intentar)
-- ---------------------------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;

grant select, insert, update, delete on
  public.fixed_costs, public.daily_closes, public.close_expenses, public.products,
  public.product_sale_days, public.price_changes, public.customers, public.credit_movements
  to authenticated;
grant select on public.businesses to authenticated;
grant update (name, rubro, ciudad, margin_alert_pct, dormant_days, price_rounding, onboarding_completed_at) on public.businesses to authenticated;
grant select on public.ai_calls, public.subscriptions, public.subscription_events, public.payments to authenticated;
grant select on public.customer_balances, public.resumen_bloqueado to authenticated;

revoke all on function
  public.estado_de(uuid), public.has_access(), public.my_business_id(), public.mi_estado(),
  public.tocar_updated_at(), public.crear_negocio_y_prueba(), public.registrar_evento_suscripcion(), public.actualizar_ultima_venta()
  from public, anon, authenticated;
grant execute on function public.has_access(), public.my_business_id(), public.mi_estado() to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Token hook: agrega account_status al JWT para que la interfaz redirija. No es seguridad.
-- Se activa en Supabase: Authentication → Hooks → Custom Access Token → public.custom_access_token_hook
-- ---------------------------------------------------------------------------------------------

create function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  claims jsonb := coalesce(event -> 'claims', '{}'::jsonb);
begin
  claims := jsonb_set(claims, '{account_status}', to_jsonb(public.estado_de((event ->> 'user_id')::uuid)));
  return jsonb_set(event, '{claims}', claims);
end;
$$;

revoke all on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant execute on function public.estado_de(uuid) to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;
