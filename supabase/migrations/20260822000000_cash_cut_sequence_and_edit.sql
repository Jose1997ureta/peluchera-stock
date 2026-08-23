-- Historial de cajas ahora es una tabla paginada con 1-2 filas derivadas por
-- caja (apertura + cierre), identificadas por un N° de caja correlativo, y
-- permite editar el monto inicial de una caja mientras siga abierta.

alter table public.cash_cuts
  add column sequence_number integer;

-- Backfill: se numera por orden de apertura (las cajas viejas ya tenían
-- opened_at heredado de closed_at, ver 20260817000000_cash_cut_open_close.sql).
with numbered as (
  select id, row_number() over (order by opened_at asc, id asc) as rn
  from public.cash_cuts
)
update public.cash_cuts c
set sequence_number = numbered.rn
from numbered
where numbered.id = c.id;

alter table public.cash_cuts
  alter column sequence_number set not null,
  add constraint cash_cuts_sequence_number_key unique (sequence_number);

create sequence if not exists public.cash_cuts_sequence_number_seq
  owned by public.cash_cuts.sequence_number;

select setval(
  'public.cash_cuts_sequence_number_seq',
  coalesce((select max(sequence_number) from public.cash_cuts), 0)
);

alter table public.cash_cuts
  alter column sequence_number set default nextval('public.cash_cuts_sequence_number_seq');

-- open_cash_cut ahora también asigna el N° de caja (vía el default de la
-- columna, sin cambios de firma ni de comportamiento existente).
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
-- Función: update_cash_cut_initial_amount
-- Corrige el monto inicial de la caja abierta actual. Falla si la caja ya
-- no está abierta o si el monto es inválido. No toca opened_at ni totales.
-- =========================================================
create or replace function public.update_cash_cut_initial_amount(
  p_cash_cut_id uuid,
  p_new_amount numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  if p_new_amount is null or p_new_amount < 0 then
    raise exception 'El monto inicial debe ser mayor o igual a 0';
  end if;

  select status into v_status from public.cash_cuts where id = p_cash_cut_id for update;

  if v_status is null then
    raise exception 'Caja no encontrada';
  end if;

  if v_status <> 'open' then
    raise exception 'Solo se puede editar el monto inicial de una caja abierta';
  end if;

  update public.cash_cuts
  set initial_amount = p_new_amount
  where id = p_cash_cut_id;
end;
$$;

grant execute on function public.update_cash_cut_initial_amount(uuid, numeric) to authenticated;
