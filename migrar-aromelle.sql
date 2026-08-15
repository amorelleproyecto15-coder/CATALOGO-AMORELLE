-- ============================================================
--  MIGRACIÓN AROMELLE  —  del catálogo VIEJO al NUEVO
--  ------------------------------------------------------------
--  Copia tus datos actuales de las tablas viejas a las nuevas:
--    perfumes       ->  productos      (activo  ->  visible)
--    perfume_notas  ->  producto_notas (perfume_id -> producto_id)
--
--  · Conserva los MISMOS id, así las notas siguen enlazadas.
--  · Conserva imágenes, presentaciones, pirámide, perfil, orden, etc.
--  · Es SEGURO correrlo varias veces (no duplica nada).
--  · NO borra tus tablas viejas (quedan intactas por si acaso).
--
--  ORDEN CORRECTO:
--    1º  corre  supabase-setup.sql   (crea las tablas nuevas)
--    2º  corre  ESTE archivo         (copia tus datos)
--    3º  (opcional) más abajo hay un bloque para borrar lo viejo
--        cuando ya verificaste que todo está bien.
-- ============================================================

do $$
begin
  -- Solo migra si existe la tabla vieja "perfumes"
  if to_regclass('public.perfumes') is not null then

    -- 1) Productos (mapea activo -> visible; stock queda NULL = sin control)
    insert into productos (
      id, marca, nombre, genero, categoria, descripcion,
      imagenes, imagen_url, presentaciones,
      notas_salida, notas_corazon, notas_fondo,
      longevidad, estela,
      destacado, visible, orden, created_at
    )
    select
      p.id, p.marca, p.nombre,
      coalesce(p.genero,'Unisex'),
      coalesce(p.categoria,'Diseñador'),
      p.descripcion,
      coalesce(p.imagenes, '[]'::jsonb),
      p.imagen_url,
      coalesce(p.presentaciones, '[]'::jsonb),
      p.notas_salida, p.notas_corazon, p.notas_fondo,
      p.longevidad, p.estela,
      coalesce(p.destacado, false),
      coalesce(p.activo, true),          -- activo (viejo) -> visible (nuevo)
      coalesce(p.orden, 0),
      coalesce(p.created_at, now())
    from perfumes p
    on conflict (id) do nothing;         -- no re-inserta si ya migraste

    raise notice 'Productos migrados.';
  else
    raise notice 'No existe la tabla "perfumes": nada que migrar (base nueva).';
  end if;

  -- 2) Relación producto <-> notas
  if to_regclass('public.perfume_notas') is not null then
    insert into producto_notas (producto_id, nota_id)
    select pn.perfume_id, pn.nota_id
    from perfume_notas pn
    -- por si alguna fila apunta a algo que no existe, la ignoramos
    where exists (select 1 from productos pr where pr.id = pn.perfume_id)
      and exists (select 1 from notas    n  where n.id  = pn.nota_id)
    on conflict (producto_id, nota_id) do nothing;

    raise notice 'Relaciones de notas migradas.';
  end if;
end $$;

-- ============================================================
--  VERIFICACIÓN  (mira los números después de correr)
-- ============================================================
select
  (select count(*) from perfumes)       as perfumes_viejos,
  (select count(*) from productos)       as productos_nuevos,
  (select count(*) from perfume_notas)   as relaciones_viejas,
  (select count(*) from producto_notas)  as relaciones_nuevas;
-- Los pares (viejos vs nuevos) deben coincidir.

-- ============================================================
--  LIMPIEZA OPCIONAL  —  ¡SOLO cuando ya verificaste que todo
--  se ve bien en tu catálogo nuevo!
--  Quita los guiones "--" del inicio de estas 2 líneas y corre:
-- ============================================================
-- drop table if exists perfume_notas;
-- drop table if exists perfumes;
