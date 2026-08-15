-- ============================================================
--  BASE MAESTRA DE CATÁLOGOS — SETUP COMPLETO Y SEGURO
--  ------------------------------------------------------------
--  IDEMPOTENTE: puedes correrlo las veces que quieras. No rompe
--  nada si algo ya existe.
--
--  CÓMO USARLO en un catálogo NUEVO:
--   1. Crea un proyecto nuevo en supabase.com
--   2. Menú lateral -> SQL Editor -> New query
--   3. Pega TODO este archivo -> Run
--   4. Authentication -> Users -> Add user (tu correo + contraseña,
--      marca "Auto Confirm User"). Con eso entras al admin.
-- ============================================================

-- ============================================================
-- 1) TABLAS
-- ============================================================

-- Biblioteca de notas aromáticas (estilo Fragrantica, con imagen)
create table if not exists notas (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  imagen_url  text,
  created_at  timestamptz default now()
);

-- Productos del catálogo
create table if not exists productos (
  id             uuid primary key default gen_random_uuid(),
  marca          text,
  nombre         text not null,
  genero         text default 'Unisex',       -- 'Hombre' | 'Mujer' | 'Unisex'
  categoria      text default 'Diseñador',     -- 'Árabe' | 'Diseñador' | 'Nicho'
  descripcion    text,                          -- notas aromáticas en texto / detalle

  -- Pirámide olfativa (de Aromelle)
  notas_salida   text,
  notas_corazon  text,
  notas_fondo    text,

  -- Perfil (de Aromelle)
  longevidad     text,
  estela         text,
  ocasion        text,                          -- opcional (de DDS)

  -- Imágenes
  imagen_url     text,                          -- imagen principal (fallback)
  imagenes       jsonb default '[]'::jsonb,     -- galería: ["url1","url2"]

  -- Presentaciones: decants por ml Y sellado, en un solo array.
  -- Cada item: { "ml": "5", "precio": 32, "antes": 40, "activo": true }
  -- Para botella sellada usa  "ml": "Sellado".
  presentaciones jsonb default '[]'::jsonb,

  -- Stock: null = no controlar (ilimitado) · 0 = agotado · N = unidades
  stock          int,

  destacado      boolean default false,
  visible        boolean default true,          -- si false, no aparece en el catálogo
  orden          int default 0,
  created_at     timestamptz default now()
);

-- Relación producto <-> notas (muchos a muchos)
create table if not exists producto_notas (
  id           uuid primary key default gen_random_uuid(),
  producto_id  uuid references productos(id) on delete cascade,
  nota_id      uuid references notas(id)     on delete cascade,
  unique (producto_id, nota_id)
);

-- Promociones administrables (de Fragancias Urbanas)
--  tipo: 'producto' | 'cantidad' | 'combo' | 'general'
--  config (jsonb) según el tipo:
--    producto : { "productos":[ids], "mls":["5"], "pct":15 }
--    cantidad : { "productos":[ids], "mls":["5"], "min":2, "modo":"precio_fijo"|"pct", "valor":32 }
--    combo    : { "productos":[ids], "mls":["5"], "cantidad":2, "precio_total":30 }
--    general  : { "alcance":"todo"|"categoria", "categoria":"Árabe", "pct":10 }
create table if not exists promociones (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  tipo        text not null,
  activo      boolean default true,
  desde       date,
  hasta       date,
  config      jsonb default '{}'::jsonb,
  created_at  timestamptz default now()
);

-- ============================================================
-- 2) COLUMNAS NUEVAS (por si una tabla ya existía sin ellas)
-- ============================================================
alter table productos add column if not exists imagenes       jsonb default '[]'::jsonb;
alter table productos add column if not exists presentaciones jsonb default '[]'::jsonb;
alter table productos add column if not exists notas_salida   text;
alter table productos add column if not exists notas_corazon  text;
alter table productos add column if not exists notas_fondo    text;
alter table productos add column if not exists longevidad     text;
alter table productos add column if not exists estela         text;
alter table productos add column if not exists ocasion        text;
alter table productos add column if not exists visible        boolean default true;
alter table productos add column if not exists destacado      boolean default false;
alter table productos add column if not exists orden          int default 0;
alter table productos add column if not exists stock          int;

-- Registro de ventas (los datos que deja el cliente al hacer el pedido)
create table if not exists ventas (
  id                uuid primary key default gen_random_uuid(),
  cliente_nombre    text,
  cliente_telefono  text,
  cliente_direccion text,
  cliente_nota      text,
  items             jsonb default '[]'::jsonb,   -- [{nombre,marca,ml,qty,precio,total}]
  subtotal          numeric(10,2),
  descuento         numeric(10,2),
  total             numeric(10,2),
  metodo_pago       text,                         -- 'yape' | 'coordinar'
  yape_operacion    text,
  estado            text default 'nuevo',         -- nuevo | confirmado | entregado | cancelado
  notas_internas    text,
  stock_descontado  boolean default false,        -- si ya se restó del stock
  created_at        timestamptz default now()
);
-- (por si la tabla ventas ya existía sin estas columnas)
alter table ventas add column if not exists stock_descontado boolean default false;
alter table ventas add column if not exists cliente_nota     text;
alter table ventas add column if not exists yape_operacion   text;
alter table ventas add column if not exists notas_internas   text;

-- Ajustes editables desde el panel (una sola fila)
create table if not exists ajustes (
  id               text primary key default 'principal',
  hero_sub         text,   -- frase debajo del nombre en el catálogo
  mensaje_gracias  text,   -- mensaje del comprobante impreso
  updated_at       timestamptz default now()
);
insert into ajustes (id) values ('principal') on conflict (id) do nothing;

-- ============================================================
-- 3) SEGURIDAD (RLS): lectura pública + escritura solo con login
-- ============================================================
alter table notas          enable row level security;
alter table productos       enable row level security;
alter table producto_notas  enable row level security;
alter table promociones     enable row level security;
alter table ventas          enable row level security;
alter table ajustes         enable row level security;

-- Lectura pública
drop policy if exists "lectura publica notas"    on notas;
drop policy if exists "lectura publica productos" on productos;
drop policy if exists "lectura publica pn"        on producto_notas;
drop policy if exists "lectura publica promos"    on promociones;
create policy "lectura publica notas"    on notas          for select using (true);
create policy "lectura publica productos" on productos       for select using (true);
create policy "lectura publica pn"        on producto_notas  for select using (true);
create policy "lectura publica promos"    on promociones     for select using (true);

-- Escritura solo autenticados
drop policy if exists "escritura notas auth"    on notas;
drop policy if exists "escritura productos auth" on productos;
drop policy if exists "escritura pn auth"        on producto_notas;
drop policy if exists "escritura promos auth"    on promociones;
create policy "escritura notas auth"    on notas          for all to authenticated using (true) with check (true);
create policy "escritura productos auth" on productos       for all to authenticated using (true) with check (true);
create policy "escritura pn auth"        on producto_notas  for all to authenticated using (true) with check (true);
create policy "escritura promos auth"    on promociones     for all to authenticated using (true) with check (true);

-- VENTAS: cualquiera (cliente anónimo) puede REGISTRAR su compra (insert),
-- pero SOLO tú (con login) puedes ver, editar y borrar las ventas.
drop policy if exists "ventas registro publico" on ventas;
drop policy if exists "ventas lectura auth"     on ventas;
drop policy if exists "ventas editar auth"      on ventas;
drop policy if exists "ventas borrar auth"      on ventas;
create policy "ventas registro publico" on ventas for insert with check (true);
create policy "ventas lectura auth"     on ventas for select to authenticated using (true);
create policy "ventas editar auth"      on ventas for update to authenticated using (true) with check (true);
create policy "ventas borrar auth"      on ventas for delete to authenticated using (true);

-- AJUSTES: lectura pública (el catálogo los lee) · escritura solo con login
drop policy if exists "ajustes lectura publica" on ajustes;
drop policy if exists "ajustes escritura auth"  on ajustes;
create policy "ajustes lectura publica" on ajustes for select using (true);
create policy "ajustes escritura auth"  on ajustes for all to authenticated using (true) with check (true);

-- ============================================================
-- 4) STORAGE (bucket de imágenes)
--  El nombre del bucket debe COINCIDIR con CONFIG.BUCKET en config.js
--  (por defecto: 'catalogo', aquí: 'aromelle')
-- ============================================================
insert into storage.buckets (id, name, public)
values ('aromelle', 'aromelle', true)
on conflict (id) do nothing;

drop policy if exists "aromelle lectura publica" on storage.objects;
drop policy if exists "aromelle subir auth"      on storage.objects;
drop policy if exists "aromelle actualizar auth" on storage.objects;
drop policy if exists "aromelle borrar auth"     on storage.objects;
create policy "aromelle lectura publica" on storage.objects for select using (bucket_id = 'aromelle');
create policy "aromelle subir auth"      on storage.objects for insert to authenticated with check (bucket_id = 'aromelle');
create policy "aromelle actualizar auth" on storage.objects for update to authenticated using (bucket_id = 'aromelle');
create policy "aromelle borrar auth"     on storage.objects for delete to authenticated using (bucket_id = 'aromelle');

-- ============================================================
--  LISTO. Recuerda crear tu usuario admin en:
--  Authentication -> Users -> Add user (Auto Confirm User)
-- ============================================================
