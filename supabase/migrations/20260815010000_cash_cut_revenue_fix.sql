-- Corrige create_cash_cut: "Ingresos reales" del corte usa el campo `revenue`
-- (ingresado a mano al cerrar cada actividad, ver close_activity/ActivityFillModal),
-- no Σ unit_price * sold_qty — ese último es "monto real vendido" (valor de
-- catálogo), una métrica distinta que ya se muestra en el listado de actividades.
-- Mantiene el mismo criterio que ya usa la ganancia por actividad individual.
create or replace function public.create_cash_cut()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cut_id uuid;
  v_invested numeric;
  v_revenue numeric;
  v_count integer;
  v_ids uuid[];
begin
  select count(*), coalesce(array_agg(id), '{}'), coalesce(sum(revenue), 0)
  into v_count, v_ids, v_revenue
  from public.activities
  where status = 'closed' and cut_id is null;

  if v_count = 0 then
    raise exception 'No hay actividades cerradas pendientes de corte';
  end if;

  select coalesce(sum(ap.unit_cost * ap.initial_qty), 0)
  into v_invested
  from public.activity_products ap
  where ap.activity_id = any(v_ids);

  insert into public.cash_cuts (
    closed_at, total_invested, total_revenue, total_profit, activities_count, activity_ids
  )
  values (now(), v_invested, v_revenue, v_revenue - v_invested, v_count, v_ids)
  returning id into v_cut_id;

  update public.activities set cut_id = v_cut_id where id = any(v_ids);

  return v_cut_id;
end;
$$;
