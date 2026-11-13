-- Fase 0: lista de espera de socios fundadores.
-- Se corre una sola vez en Supabase → SQL Editor → New query → pegar todo → Run.
-- Nadie entra a estas tablas con la clave pública: solo el servidor (clave de servicio) llama a las funciones.

create table if not exists public.waitlist (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (char_length(name) between 2 and 80),
  whatsapp        text not null unique check (whatsapp ~ '^549[1-9][0-9]{9}$'),
  rubro           text not null check (rubro in ('kiosco', 'almacen', 'dietetica')),
  ciudad          text,
  numero_del_dia  numeric(14, 2),
  utm_source      text,
  utm_content     text,
  founder_number  integer not null unique,
  created_at      timestamptz not null default now()
);

create sequence if not exists public.waitlist_founder_seq;

-- Bajas: guardan solo el número de trámite, sin datos personales.
create table if not exists public.waitlist_bajas (
  id          uuid primary key default gen_random_uuid(),
  tramite     text not null unique,
  created_at  timestamptz not null default now()
);

-- RLS prendida y sin políticas: con la clave pública no se puede leer ni escribir nada.
alter table public.waitlist enable row level security;
alter table public.waitlist_bajas enable row level security;
revoke all on public.waitlist, public.waitlist_bajas from anon, authenticated;

-- Anotarse: atómico. Si el WhatsApp ya estaba, devuelve el mismo número de socio.
create or replace function public.anotarse_lista_espera(
  p_name text, p_whatsapp text, p_rubro text, p_ciudad text,
  p_numero_del_dia numeric, p_utm_source text, p_utm_content text
)
returns table (numero integer, ya_estaba boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_num integer;
begin
  select w.founder_number into v_num from public.waitlist w where w.whatsapp = p_whatsapp;
  if found then
    return query select v_num, true;
    return;
  end if;

  insert into public.waitlist (name, whatsapp, rubro, ciudad, numero_del_dia, utm_source, utm_content, founder_number)
  values (p_name, p_whatsapp, p_rubro, p_ciudad, p_numero_del_dia, p_utm_source, p_utm_content,
          nextval('public.waitlist_founder_seq')::integer)
  on conflict (whatsapp) do nothing
  returning public.waitlist.founder_number into v_num;

  if v_num is null then
    -- otra persona (o el mismo doble toque) se anotó justo antes
    select w.founder_number into v_num from public.waitlist w where w.whatsapp = p_whatsapp;
    return query select v_num, true;
  else
    return query select v_num, false;
  end if;
end;
$$;

-- Lugares de socio fundador que quedan (de 100).
create or replace function public.lugares_fundadores()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select greatest(0, 100 - count(*)::integer) from public.waitlist;
$$;

-- Darme de baja: borra el registro y devuelve un número de trámite (o null si no estaba).
create or replace function public.baja_lista_espera(p_whatsapp text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tramite text;
begin
  delete from public.waitlist where whatsapp = p_whatsapp;
  if not found then
    return null;
  end if;
  v_tramite := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.waitlist_bajas (tramite) values (v_tramite);
  return v_tramite;
end;
$$;

-- Solo el servidor (clave de servicio) puede llamarlas.
revoke all on function public.anotarse_lista_espera(text, text, text, text, numeric, text, text) from public, anon, authenticated;
revoke all on function public.lugares_fundadores() from public, anon, authenticated;
revoke all on function public.baja_lista_espera(text) from public, anon, authenticated;
grant execute on function public.anotarse_lista_espera(text, text, text, text, numeric, text, text) to service_role;
grant execute on function public.lugares_fundadores() to service_role;
grant execute on function public.baja_lista_espera(text) to service_role;
