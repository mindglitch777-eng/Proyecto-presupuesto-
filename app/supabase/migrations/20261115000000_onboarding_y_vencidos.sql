-- En Claro · fase 2: datos del primer uso y vencimiento automático de pruebas y pagos atrasados.

-- Comisión que le cobra al dueño su medio de cobro (tarjeta o QR), en %. La pone él; sin valor inventado.
alter table public.businesses add column card_fee_pct numeric(5, 2) check (card_fee_pct between 0 and 20);
grant update (card_fee_pct) on public.businesses to authenticated;

-- Todas las noches: pasa a "expired" las pruebas vencidas y los pagos atrasados de más de 3 días.
-- (has_access ya corta el acceso en el momento; esto deja el estado al día para el admin y el churn.)
create function public.expirar_suscripciones()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  perform set_config('enclaro.motivo', 'vencimiento automático', true);
  update public.subscriptions
     set status = 'expired'
   where (status = 'trial' and trial_ends_at <= now())
      or (status = 'past_due' and current_period_end + interval '3 days' <= now());
  get diagnostics n = row_count;
  perform set_config('enclaro.motivo', '', true);
  return n;
end;
$$;

revoke all on function public.expirar_suscripciones() from public, anon, authenticated;

-- Programarlo a las 03:00 de Argentina (06:00 UTC) con pg_cron, si está disponible en el proyecto.
do $$
begin
  begin
    create extension if not exists pg_cron with schema pg_catalog;
  exception when others then
    raise notice 'pg_cron no está disponible: activalo en Database → Extensions y volvé a correr este bloque.';
    return;
  end;
  perform cron.unschedule(jobid) from cron.job where jobname = 'expirar-suscripciones';
  perform cron.schedule('expirar-suscripciones', '0 6 * * *', 'select public.expirar_suscripciones()');
end $$;
