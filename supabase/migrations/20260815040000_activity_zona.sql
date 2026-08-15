-- Saca `description` de `activities` (ya no se pide en crear/editar/rellenar)
-- y agrega `zona_id`: por ahora solo 1 = Tienda, 2 = Colegio (estático en el
-- cliente, ver ZONE_OPTIONS en activity.schema.ts). Más adelante se reemplaza
-- por una tabla `zonas` real — se elige `zona_id` como nombre de columna
-- (en vez de `zona`) para que esa migración futura sea un simple `references`.

alter table public.activities add column zona_id integer not null default 1;
alter table public.activities alter column zona_id drop default;
alter table public.activities drop column description;

-- =========================================================
-- Función: create_activity — sin description, con zona_id.
-- =========================================================
create or replace function public.create_activity(
  p_name text,
  p_zona_id integer,
  p_lines jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_activity_id uuid;
  v_line jsonb;
  v_product_id uuid;
  v_initial_qty integer;
  v_unit_price numeric;
  v_stock integer;
begin
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'El nombre de la actividad es requerido';
  end if;

  if p_zona_id is null then
    raise exception 'La zona de la actividad es requerida';
  end if;

  if p_lines is null or jsonb_array_length(p_lines) < 1 then
    raise exception 'La actividad debe tener al menos un producto';
  end if;

  insert into public.activities (name, zona_id, status)
  values (p_name, p_zona_id, 'open')
  returning id into v_activity_id;

  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    v_product_id := (v_line ->> 'product_id')::uuid;
    v_initial_qty := (v_line ->> 'initial_qty')::integer;

    select price, stock into v_unit_price, v_stock
    from public.products
    where id = v_product_id
    for update;

    if v_unit_price is null then
      raise exception 'Producto % no existe', v_product_id;
    end if;

    if v_initial_qty is null or v_initial_qty < 1 or v_initial_qty > v_stock then
      raise exception 'Cantidad inválida para el producto % (stock disponible: %)', v_product_id, v_stock;
    end if;

    insert into public.activity_products (
      activity_id, product_id, unit_price, initial_qty, sold_qty
    )
    values (v_activity_id, v_product_id, v_unit_price, v_initial_qty, 0);

    update public.products
    set stock = stock - v_initial_qty
    where id = v_product_id;
  end loop;

  return v_activity_id;
end;
$$;

-- =========================================================
-- Función: update_activity — sin description, con zona_id.
-- =========================================================
create or replace function public.update_activity(
  p_activity_id uuid,
  p_name text,
  p_zona_id integer,
  p_lines jsonb
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
  v_product_id uuid;
  v_initial_qty integer;
  v_unit_price numeric;
  v_stock integer;
  v_old_qty integer;
  v_old_product_id uuid;
  v_diff integer;
  v_keep_ids uuid[] := '{}';
  v_removed record;
begin
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'El nombre de la actividad es requerido';
  end if;

  if p_zona_id is null then
    raise exception 'La zona de la actividad es requerida';
  end if;

  if p_lines is null or jsonb_array_length(p_lines) < 1 then
    raise exception 'La actividad debe tener al menos un producto';
  end if;

  select status into v_status from public.activities where id = p_activity_id for update;

  if v_status is null then
    raise exception 'Actividad no encontrada';
  end if;

  if v_status <> 'open' then
    raise exception 'Solo se puede editar una actividad abierta';
  end if;

  update public.activities
  set name = p_name, zona_id = p_zona_id
  where id = p_activity_id;

  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    v_line_id := nullif(v_line ->> 'line_id', '')::uuid;
    v_product_id := (v_line ->> 'product_id')::uuid;
    v_initial_qty := (v_line ->> 'initial_qty')::integer;

    if v_line_id is null then
      select price, stock into v_unit_price, v_stock
      from public.products
      where id = v_product_id
      for update;

      if v_unit_price is null then
        raise exception 'Producto % no existe', v_product_id;
      end if;

      if v_initial_qty is null or v_initial_qty < 1 or v_initial_qty > v_stock then
        raise exception 'Cantidad inválida para el producto % (stock disponible: %)', v_product_id, v_stock;
      end if;

      insert into public.activity_products (
        activity_id, product_id, unit_price, initial_qty, sold_qty
      )
      values (p_activity_id, v_product_id, v_unit_price, v_initial_qty, 0)
      returning id into v_line_id;

      update public.products set stock = stock - v_initial_qty where id = v_product_id;
    else
      select initial_qty, product_id into v_old_qty, v_old_product_id
      from public.activity_products
      where id = v_line_id and activity_id = p_activity_id;

      if v_old_qty is null then
        raise exception 'La línea % no pertenece a esta actividad', v_line_id;
      end if;

      select stock into v_stock from public.products where id = v_old_product_id for update;

      v_diff := v_initial_qty - v_old_qty;

      if v_diff > 0 and v_diff > v_stock then
        raise exception 'Stock insuficiente para el producto % (disponible: %)', v_old_product_id, v_stock;
      end if;

      if v_initial_qty is null or v_initial_qty < 1 then
        raise exception 'Cantidad inválida para el producto %', v_old_product_id;
      end if;

      update public.products set stock = stock - v_diff where id = v_old_product_id;

      update public.activity_products
      set initial_qty = v_initial_qty
      where id = v_line_id;
    end if;

    v_keep_ids := v_keep_ids || v_line_id;
  end loop;

  for v_removed in
    select id, product_id, initial_qty
    from public.activity_products
    where activity_id = p_activity_id and not (id = any(v_keep_ids))
  loop
    update public.products
    set stock = stock + v_removed.initial_qty
    where id = v_removed.product_id;

    delete from public.activity_products where id = v_removed.id;
  end loop;
end;
$$;
