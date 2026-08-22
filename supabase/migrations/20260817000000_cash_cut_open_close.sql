-- Caja Chica pasa de "corte retroactivo" (Iniciar corte agarraba de una todas
-- las actividades cerradas pendientes) a un ciclo de vida explícito de caja:
-- se abre con un monto inicial, acumula sola mientras está abierta (cada
-- actividad que se cierra queda atada a la caja abierta en ese momento vía
-- `cut_id`), y se cierra sin pedir nada más (los totales ya se calcularon).
-- Se reutiliza la tabla `cash_cuts` (no se renombra) para no tocar RLS,
-- índices, FKs y tipos generados en el resto de la app.

alter table public.cash_cuts
  add column status text not null default 'closed' check (status in ('open', 'closed')),
  add column initial_amount numeric not null default 0,
  add column opened_at timestamptz;

-- Los cortes históricos ya existentes quedan como cajas cerradas válidas,
-- con `opened_at` heredado de su propio `closed_at` (no hay forma de saber
-- cuándo "abrieron" retroactivamente) y `initial_amount = 0` (default).
update public.cash_cuts set opened_at = closed_at where opened_at is null;

alter table public.cash_cuts
  alter column closed_at drop not null;

-- Garantiza a nivel de base de datos que nunca haya dos cajas abiertas a la vez.
create unique index cash_cuts_single_open_idx on public.cash_cuts (status) where status = 'open';

-- =========================================================
-- Función: open_cash_cut
-- Abre una caja nueva con un monto inicial. Falla si ya hay una abierta.
-- =========================================================
create or replace function public.open_cash_cut(p_initial_amount numeric)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cut_id uuid;
begin
  if p_initial_amount is null or p_initial_amount < 0 then
    raise exception 'El monto inicial debe ser mayor o igual a 0';
  end if;

  if exists (select 1 from public.cash_cuts where status = 'open') then
    raise exception 'Ya hay una caja abierta';
  end if;

  insert into public.cash_cuts (
    status, initial_amount, opened_at, closed_at,
    total_revenue, total_profit, activities_count, activity_ids
  )
  values ('open', p_initial_amount, now(), null, 0, 0, 0, '{}')
  returning id into v_cut_id;

  return v_cut_id;
end;
$$;

-- =========================================================
-- Función: close_cash_cut
-- Cierra la caja abierta actual: agrega el subtotal real y la ganancia de
-- las actividades que quedaron atadas a ella (ver close_activity) y fija
-- esos totales como registro histórico. No recibe ningún monto manual.
-- =========================================================
create or replace function public.close_cash_cut()
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
  select id into v_cut_id from public.cash_cuts where status = 'open' for update;

  if v_cut_id is null then
    raise exception 'No hay ninguna caja abierta';
  end if;

  select count(*), coalesce(array_agg(a.id), '{}')
  into v_count, v_ids
  from public.activities a
  where a.cut_id = v_cut_id;

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

  update public.cash_cuts
  set status = 'closed',
      closed_at = now(),
      total_revenue = v_revenue,
      total_profit = v_profit,
      activities_count = v_count,
      activity_ids = v_ids
  where id = v_cut_id;

  return v_cut_id;
end;
$$;

grant execute on function public.open_cash_cut(numeric) to authenticated;
grant execute on function public.close_cash_cut() to authenticated;

-- El corte retroactivo "todo o nada" queda reemplazado por open/close_cash_cut.
drop function if exists public.create_cash_cut();

-- =========================================================
-- Función: close_activity
-- Igual que antes, pero ahora exige que haya una caja abierta y ata la
-- actividad a esa caja (`cut_id`) en el mismo momento en que se cierra —
-- antes `cut_id` se completaba recién al ejecutar "Iniciar corte".
-- =========================================================
create or replace function public.close_activity(
  p_activity_id uuid,
  p_revenue numeric,
  p_sold_lines jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_line jsonb;
  v_line_id uuid;
  v_sold_qty integer;
  v_initial_qty integer;
  v_product_id uuid;
  v_seen_ids uuid[] := '{}';
  v_line_count integer;
  v_open_cut_id uuid;
begin
  if p_revenue is null or p_revenue <= 0 then
    raise exception 'Los ingresos deben ser mayores a 0';
  end if;

  select id into v_open_cut_id from public.cash_cuts where status = 'open';

  if v_open_cut_id is null then
    raise exception 'No hay una caja abierta. Abrí la caja antes de cerrar la actividad.';
  end if;

  select status into v_status from public.activities where id = p_activity_id for update;

  if v_status is null then
    raise exception 'Actividad no encontrada';
  end if;

  if v_status <> 'open' then
    raise exception 'La actividad ya está cerrada';
  end if;

  select count(*) into v_line_count from public.activity_products where activity_id = p_activity_id;

  if p_sold_lines is null or jsonb_array_length(p_sold_lines) <> v_line_count then
    raise exception 'Debe informarse la cantidad vendida de cada línea de la actividad';
  end if;

  for v_line in select * from jsonb_array_elements(p_sold_lines)
  loop
    v_line_id := (v_line ->> 'line_id')::uuid;
    v_sold_qty := (v_line ->> 'sold_qty')::integer;

    select initial_qty, product_id into v_initial_qty, v_product_id
    from public.activity_products
    where id = v_line_id and activity_id = p_activity_id;

    if v_initial_qty is null then
      raise exception 'La línea % no pertenece a esta actividad', v_line_id;
    end if;

    if v_sold_qty is null or v_sold_qty < 0 or v_sold_qty > v_initial_qty then
      raise exception 'Cantidad vendida inválida para la línea % (máximo: %)', v_line_id, v_initial_qty;
    end if;

    update public.activity_products set sold_qty = v_sold_qty where id = v_line_id;

    update public.products
    set stock = stock + (v_initial_qty - v_sold_qty)
    where id = v_product_id;

    v_seen_ids := v_seen_ids || v_line_id;
  end loop;

  update public.activities
  set status = 'closed', closed_at = now(), revenue = p_revenue, cut_id = v_open_cut_id
  where id = p_activity_id;
end;
$$;
