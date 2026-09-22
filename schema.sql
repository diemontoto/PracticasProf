-- Esquema para el sistema de Prácticas Profesionalizantes
-- Ejecutar este archivo completo en Supabase: Proyecto > SQL Editor > New query > pegar > Run

create table if not exists cohortes (
  id uuid primary key default gen_random_uuid(),
  specialty text not null,
  year int not null,
  horas_objetivo int default 200,
  created_at timestamptz default now()
);

create table if not exists practicas (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid references cohortes(id) on delete set null,
  alumno text not null,
  dni text,
  email text,
  celular text,
  oferente text,
  rotacion text default 'Primera',
  estado text default 'Entrevista Realizada',
  fecha_inicio date,
  fecha_fin date,
  entrada time,
  salida time,
  turno text,
  dias text,
  horas_realizadas numeric default 0,
  horas_objetivo numeric,
  calificacion text,
  autorizacion boolean default true,
  encuesta_final boolean default false,
  disposiciones text,
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Seguridad: solo usuarios que iniciaron sesión (creados por vos en Authentication > Users)
-- pueden leer y escribir. La clave "anon" que va en config.js es pública a propósito:
-- estas políticas son las que realmente protegen los datos.

alter table cohortes enable row level security;
alter table practicas enable row level security;

create policy "cohortes_autenticados" on cohortes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "practicas_autenticados" on practicas
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Opcional: para que los cambios se vean en vivo entre usuarios sin recargar,
-- ir a Database > Replication y activar "cohortes" y "practicas".
