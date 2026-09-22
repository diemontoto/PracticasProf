# Prácticas Profesionalizantes

Sistema para cargar, administrar y filtrar los datos de las prácticas de los
alumnos (alumno, cohorte, oferente, estado, horas, fechas, etc.).

La página es estática (se aloja gratis en GitHub Pages) y los datos viven en
**Supabase** (una base de datos Postgres real y gratuita), para que todo el
equipo vea siempre la misma información actualizada.

## 1. Crear el proyecto en Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá una cuenta gratis.
2. Creá un nuevo proyecto (elegí una contraseña de base de datos y guardala).
3. Esperá 1-2 minutos a que termine de aprovisionarse.

## 2. Crear las tablas

1. En el menú lateral, abrí **SQL Editor**.
2. Abrí el archivo `supabase/schema.sql` de esta carpeta, copiá todo su
   contenido y pegalo en el editor.
3. Apretá **Run**. Esto crea las tablas `cohortes` y `practicas`, y las
   políticas de seguridad que exigen estar logueado para leer o escribir.

## 3. Conectar la página con tu proyecto

1. En Supabase, ir a **Project Settings > API**.
2. Copiar el **Project URL** y la **anon public key**.
3. Abrir `config.js` en esta carpeta y pegarlos:

```js
export const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
export const SUPABASE_ANON_KEY = "TU-ANON-KEY";
```

> La "anon key" está pensada para ser pública (queda visible en el código del
> navegador). Lo que realmente protege los datos son las políticas de
> seguridad del paso 2. Nunca uses la "service_role key" acá.

## 4. Crear los usuarios del equipo

La app tiene un login simple, pero no tiene pantalla de registro: los
usuarios los creás vos como administrador.

1. En Supabase, ir a **Authentication > Users**.
2. **Add user** por cada persona del equipo (email + contraseña).
3. Compartiles esas credenciales.

## 5. (Opcional) Ver los cambios en vivo entre usuarios

1. Ir a **Database > Replication**.
2. Activar la replicación para las tablas `cohortes` y `practicas`.

Sin este paso, cada usuario ve los datos actualizados al recargar la página;
con este paso, se actualizan solos en la pantalla de todos.

## 6. Subir a GitHub y publicar con GitHub Pages

1. Creá un repositorio nuevo en GitHub y subí todos los archivos de esta
   carpeta (`index.html`, `app.js`, `styles.css`, `config.js`, `supabase/`).
2. En el repositorio: **Settings > Pages**.
3. En "Build and deployment", elegí **Deploy from a branch**, rama `main`,
   carpeta `/ (root)`. Guardar.
4. Esperá un minuto y GitHub te va a dar una URL tipo
   `https://tu-usuario.github.io/tu-repo/`. Esa es la app.

## Estructura del proyecto

```
index.html          → estructura de la página (login + pestañas)
app.js               → toda la lógica: login, alta/baja/edición, filtros
styles.css           → estilos
config.js            → credenciales de Supabase (URL + anon key)
supabase/schema.sql  → crea las tablas y la seguridad en Supabase
```

## Qué incluye

- **Prácticas**: alta, edición y baja de cada alumno en práctica, con
  cohorte, oferente, rotación, estado (con etiqueta de color), horas
  realizadas vs. horas objetivo (barra de progreso), fechas, turno, días,
  calificación, autorización, encuesta final y disposiciones. Filtro por
  nombre, cohorte y estado. Exportación a CSV.
- **Cohortes**: alta de grupos por especialidad + año (igual que las hojas
  de la planilla original), con horas objetivo por defecto.
- **Resumen**: totales generales y desglose por cohorte.

## Siguientes pasos posibles

- Restringir cada cohorte a un grupo de usuarios (hoy cualquier usuario
  logueado ve todas las cohortes).
- Agregar recuperación de contraseña con el flujo de Supabase Auth.
- Agregar un historial de cambios (quién editó qué y cuándo).
