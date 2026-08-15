-- Peluchera Stock — esquema inicial
-- Ver AGENTS.md secciones 1, 3 y 6 para el modelo de negocio y las reglas de RLS.

-- =========================================================
-- Extensiones
-- =========================================================
create extension if not exists "pgcrypto";

-- =========================================================
-- Tabla: profiles
-- Datos de perfil que no viven en auth.users (nombre, apellido,
-- telefono, fecha de nacimiento, avatar). 1:1 con auth.users.
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null default '',
  apellido text not null default '',
  telefono text,
  fecha_nacimiento date,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, apellido)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    coalesce(new.raw_user_meta_data ->> 'apellido', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- Tabla: products
-- =========================================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(12, 2) not null check (price > 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_is_active_idx on public.products (is_active);

-- =========================================================
-- Tabla: cash_cuts
-- Registro histórico e inmutable de un corte de Caja Chica.
-- Se crea antes de `activities` porque esta última la referencia.
-- =========================================================
create table public.cash_cuts (
  id uuid primary key default gen_random_uuid(),
  closed_at timestamptz not null default now(),
  total_invested numeric(12, 2) not null,
  total_revenue numeric(12, 2) not null,
  total_profit numeric(12, 2) not null,
  activities_count integer not null,
  activity_ids uuid[] not null default '{}'
);

-- =========================================================
-- Tabla: activities
-- =========================================================
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'closed')),
  revenue numeric(12, 2),
  cut_id uuid references public.cash_cuts (id),
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  constraint revenue_only_when_closed check (
    (status = 'open' and revenue is null) or (status = 'closed')
  )
);

create index activities_status_idx on public.activities (status);
create index activities_cut_id_idx on public.activities (cut_id);

-- =========================================================
-- Tabla: activity_products
-- Línea de producto dentro de una actividad.
-- =========================================================
create table public.activity_products (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  product_id uuid not null references public.products (id),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  unit_cost numeric(12, 2) not null default 0 check (unit_cost >= 0),
  initial_qty integer not null check (initial_qty >= 1),
  sold_qty integer not null default 0 check (sold_qty >= 0),
  constraint sold_leq_initial check (sold_qty <= initial_qty)
);

create index activity_products_activity_id_idx on public.activity_products (activity_id);
create index activity_products_product_id_idx on public.activity_products (product_id);

-- =========================================================
-- updated_at automático
-- =========================================================
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- =========================================================
-- RLS: inventario compartido entre todos los usuarios autenticados
-- (ver AGENTS.md sección 6 — no hay `user_id` que aísle filas)
-- =========================================================
alter table public.products enable row level security;
alter table public.activities enable row level security;
alter table public.activity_products enable row level security;
alter table public.cash_cuts enable row level security;
alter table public.profiles enable row level security;

create policy "authenticated_full_access" on public.products
  for all to authenticated
  using (true)
  with check (true);

create policy "authenticated_full_access" on public.activities
  for all to authenticated
  using (true)
  with check (true);

create policy "authenticated_full_access" on public.activity_products
  for all to authenticated
  using (true)
  with check (true);

create policy "authenticated_full_access" on public.cash_cuts
  for all to authenticated
  using (true)
  with check (true);

-- profiles: cualquier autenticado puede leer (footer del sidebar necesita
-- mostrar el usuario logueado, no hay necesidad de ver perfiles ajenos hoy,
-- pero no hay filas privadas por dueño en este sistema), y solo puede
-- modificar su propia fila.
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated
  using (true);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- =========================================================
-- Storage: buckets para imágenes de producto y avatares
-- =========================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "product_images_public_read" on storage.objects
  for select to public
  using (bucket_id = 'product-images');

create policy "product_images_authenticated_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images');

create policy "product_images_authenticated_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

create policy "product_images_authenticated_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images');

create policy "avatars_public_read" on storage.objects
  for select to public
  using (bucket_id = 'avatars');

create policy "avatars_authenticated_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars');

create policy "avatars_authenticated_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars')
  with check (bucket_id = 'avatars');

create policy "avatars_authenticated_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars');

-- =========================================================
-- Función: create_activity
-- Crea una actividad + sus líneas, reservando (restando) el stock
-- de `initial_qty` de cada producto en la misma transacción.
-- p_lines: [{ "product_id": uuid, "initial_qty": int, "unit_cost": numeric }]
-- =========================================================
create or replace function public.create_activity(
  p_name text,
  p_description text,
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
  v_unit_cost numeric;
  v_unit_price numeric;
  v_stock integer;
begin
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'El nombre de la actividad es requerido';
  end if;

  if p_lines is null or jsonb_array_length(p_lines) < 1 then
    raise exception 'La actividad debe tener al menos un producto';
  end if;

  insert into public.activities (name, description, status)
  values (p_name, p_description, 'open')
  returning id into v_activity_id;

  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    v_product_id := (v_line ->> 'product_id')::uuid;
    v_initial_qty := (v_line ->> 'initial_qty')::integer;
    v_unit_cost := coalesce((v_line ->> 'unit_cost')::numeric, 0);

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
      activity_id, product_id, unit_price, unit_cost, initial_qty, sold_qty
    )
    values (v_activity_id, v_product_id, v_unit_price, v_unit_cost, v_initial_qty, 0);

    update public.products
    set stock = stock - v_initial_qty
    where id = v_product_id;
  end loop;

  return v_activity_id;
end;
$$;

-- =========================================================
-- Función: update_activity
-- Edita nombre/descripción y sincroniza las líneas de producto de una
-- actividad abierta, ajustando el stock por la diferencia en cada caso.
-- p_lines: [{ "line_id": uuid|null, "product_id": uuid,
--              "initial_qty": int, "unit_cost": numeric }]
-- line_id = null => línea nueva. Cualquier línea existente que no venga
-- en el payload se considera quitada y devuelve su stock reservado.
-- =========================================================
create or replace function public.update_activity(
  p_activity_id uuid,
  p_name text,
  p_description text,
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
  v_unit_cost numeric;
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
  set name = p_name, description = p_description
  where id = p_activity_id;

  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    v_line_id := nullif(v_line ->> 'line_id', '')::uuid;
    v_product_id := (v_line ->> 'product_id')::uuid;
    v_initial_qty := (v_line ->> 'initial_qty')::integer;
    v_unit_cost := coalesce((v_line ->> 'unit_cost')::numeric, 0);

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
        activity_id, product_id, unit_price, unit_cost, initial_qty, sold_qty
      )
      values (p_activity_id, v_product_id, v_unit_price, v_unit_cost, v_initial_qty, 0)
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
      set initial_qty = v_initial_qty, unit_cost = v_unit_cost
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

-- =========================================================
-- Función: close_activity
-- Cierre atómico: registra sold_qty por línea, devuelve al stock
-- exactamente lo no vendido (initial_qty - sold_qty), guarda revenue
-- y pasa la actividad a 'closed'. Ver AGENTS.md sección 3.
-- p_sold_lines: [{ "line_id": uuid, "sold_qty": int }]
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
begin
  if p_revenue is null or p_revenue <= 0 then
    raise exception 'Los ingresos deben ser mayores a 0';
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
  set status = 'closed', closed_at = now(), revenue = p_revenue
  where id = p_activity_id;
end;
$$;

-- =========================================================
-- Función: delete_activity
-- Si la actividad estaba abierta, devuelve toda la initial_qty
-- reservada de cada línea al stock antes de borrarla.
-- =========================================================
create or replace function public.delete_activity(p_activity_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_line record;
begin
  select status into v_status from public.activities where id = p_activity_id for update;

  if v_status is null then
    raise exception 'Actividad no encontrada';
  end if;

  if v_status = 'open' then
    for v_line in
      select product_id, initial_qty
      from public.activity_products
      where activity_id = p_activity_id
    loop
      update public.products
      set stock = stock + v_line.initial_qty
      where id = v_line.product_id;
    end loop;
  end if;

  delete from public.activities where id = p_activity_id;
end;
$$;

-- =========================================================
-- Función: create_cash_cut
-- Archiva todas las actividades cerradas sin corte asignado como un
-- nuevo registro histórico y las marca con el cut_id resultante.
-- Falla si no hay ninguna actividad pendiente (no se generan cortes vacíos).
-- =========================================================
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
  select count(*), coalesce(array_agg(id), '{}')
  into v_count, v_ids
  from public.activities
  where status = 'closed' and cut_id is null;

  if v_count = 0 then
    raise exception 'No hay actividades cerradas pendientes de corte';
  end if;

  select coalesce(sum(ap.unit_cost * ap.initial_qty), 0),
         coalesce(sum(ap.unit_price * ap.sold_qty), 0)
  into v_invested, v_revenue
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

grant execute on function public.create_activity(text, text, jsonb) to authenticated;
grant execute on function public.update_activity(uuid, text, text, jsonb) to authenticated;
grant execute on function public.close_activity(uuid, numeric, jsonb) to authenticated;
grant execute on function public.delete_activity(uuid) to authenticated;
grant execute on function public.create_cash_cut() to authenticated;
