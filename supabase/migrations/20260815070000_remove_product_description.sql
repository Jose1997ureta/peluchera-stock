-- Elimina el campo description de productos, ya no se utiliza.

alter table public.products drop column description;
