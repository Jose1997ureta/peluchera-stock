-- Completa el perfil también con telefono y fecha_nacimiento al registrarse,
-- leyendo esos valores desde raw_user_meta_data (ver spec/auth y RegisterPage).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, apellido, telefono, fecha_nacimiento)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    coalesce(new.raw_user_meta_data ->> 'apellido', ''),
    new.raw_user_meta_data ->> 'telefono',
    nullif(new.raw_user_meta_data ->> 'fecha_nacimiento', '')::date
  );
  return new;
end;
$$;
