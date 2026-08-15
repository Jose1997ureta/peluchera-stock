-- Caja Chica pasa a acumular dos cosas separadas por actividad cerrada:
-- - "Ingresos reales" (la caja) = Σ unit_price * sold_qty de sus líneas — el
--   valor a precio de catálogo de lo efectivamente vendido, no el `revenue`
--   ingresado a mano.
-- - "Ganancia" = Σ (revenue - subtotal_real) de cada actividad — la fila
--   "Monto ganado" de `ActivityFillModal` acumulada.
create or replace function public.create_cash_cut()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cut_id uuid;
  v_revenue numeric;
  v_profit numeric;
  v_count integer;
  v_ids uuid[];
begin
  select count(*), coalesce(array_agg(a.id), '{}')
  into v_count, v_ids
  from public.activities a
  where a.status = 'closed' and a.cut_id is null;

  if v_count = 0 then
    raise exception 'No hay actividades cerradas pendientes de corte';
  end if;

  -- Se pre-agrupa el subtotal real por actividad en `lines` antes de unir con
  -- `activities`: sumar a.revenue directo contra un join sin agrupar duplicaría
  -- el revenue de cada actividad una vez por cada línea de producto que tenga.
  with lines as (
    select ap.activity_id, sum(ap.unit_price * ap.sold_qty) as subtotal_real
    from public.activity_products ap
    where ap.activity_id = any(v_ids)
    group by ap.activity_id
  )
  select
    coalesce(sum(l.subtotal_real), 0),
    coalesce(sum(a.revenue), 0) - coalesce(sum(l.subtotal_real), 0)
  into v_revenue, v_profit
  from public.activities a
  left join lines l on l.activity_id = a.id
  where a.id = any(v_ids);

  insert into public.cash_cuts (
    closed_at, total_revenue, total_profit, activities_count, activity_ids
  )
  values (now(), v_revenue, v_profit, v_count, v_ids)
  returning id into v_cut_id;

  update public.activities set cut_id = v_cut_id where id = any(v_ids);

  return v_cut_id;
end;
$$;
