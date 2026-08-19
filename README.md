# Osobuco — Marcador de Truco

App web para llevar el marcador de partidas de truco 3 vs 3 entre un grupo de amigos, con el conteo de puntos dibujado como fósforos (como en una mesa de bar real) en vez de números o barras.

## Reglas que respeta

- Partido a 30 puntos, sin opción de configurarlo.
- **Pica-pica**: desde el partido activo se puede abrir, en cualquier momento, una pantalla con 3 duelos 1 contra 1 simultáneos (una pareja por equipo). Al cerrar la ronda, la diferencia de puntos se suma automáticamente al equipo que corresponda. Se puede entrar más de una vez por partido; solo se guarda el acumulado total de pica-pica del partido, no el detalle ronda por ronda.
- Al llegar un equipo a 30, se muestra un resumen con el resultado final.

## Pantallas

- **Partido**: armado (buscar e invitar jugadores registrados, nombrar equipos, definir parejas de pica-pica), marcador en vivo, pica-pica y resumen final.
- **Historial**: partidos jugados por el usuario logueado, con fecha, equipos, resultado y el acumulado de pica-pica si se jugó.
- **Perfil**: nombre de la cuenta actual y botón para cambiar de usuario.

Se conservan: deshacer el último punto, indicador de mano con botón para pasarla, y revancha rápida con los mismos equipos y parejas.

## Usuarios, sin contraseña

Al abrir la app por primera vez en un dispositivo, pide un nombre. Si ese nombre no existe todavía, crea la cuenta; si ya existe, entra directo a ella (no hay contraseña — pensado para un grupo de confianza). Ese nombre queda disponible para que cualquiera lo busque e invite al armar un partido, y el historial de cada cuenta se puede ver desde cualquier dispositivo donde se entre con ese mismo nombre.

## Datos

- El partido en curso vive en `localStorage` del dispositivo (para no perderlo si se cierra la app a mitad de partida).
- Los usuarios y los partidos terminados viven en una base de datos Postgres de **Supabase**, servida por funciones de Vercel (`/api`).

Las tablas se crean solas la primera vez que la app hace una consulta — no hace falta correr `schema.sql` a mano (queda en el repo solo como referencia de la estructura).

## Configurar la base de datos (una sola vez)

1. Creá una cuenta en **supabase.com** (gratis) y un proyecto nuevo (elegí una región, poné una contraseña para la base — guardala, la vas a necesitar en el paso 2).
2. Dentro del proyecto de Supabase, andá a **Project Settings** (ícono de engranaje) → **Database** → sección **Connection string**. Elegí el modo **Transaction pooler** (puerto 6543) y copiá esa URL — reemplazá `[YOUR-PASSWORD]` por la contraseña que pusiste al crear el proyecto.
3. En el dashboard de **Vercel**, dentro del proyecto → **Settings** → **Environment Variables**. Agregá una variable nueva:
   - Name: `DATABASE_URL`
   - Value: la connection string que copiaste en el paso 2.
   - Aplicala a **Production** (y a Preview/Development si querés probar desde ahí también).
4. Guardá, y hacé un **Redeploy** del proyecto (Deployments → los tres puntitos del último deploy → Redeploy) para que las funciones tomen la variable nueva.

Con eso alcanza — al primer login o búsqueda de jugador, la app crea las tablas sola.

## Modo administrador

Desde Perfil → Modo administrador se puede renombrar o borrar cualquier usuario registrado (útil para limpiar cuentas de prueba). Para habilitarlo:

1. En Vercel → el proyecto → **Settings** → **Environment Variables**, agregá otra variable:
   - Name: `ADMIN_CODE`
   - Value: un código que elijas vos (una palabra o PIN, lo que quieras — es la "contraseña" del modo administrador).
   - Aplicala a **Production**.
2. Redeploy.
3. En la app, entrá a Perfil → Modo administrador, y poné ese código una vez. A partir de ahí tu cuenta queda marcada como administrador para siempre (no hace falta volver a ingresarlo).

## Desarrollo

```bash
npm install
npm run dev      # entorno de desarrollo (el frontend; las rutas /api necesitan Vercel + DATABASE_URL)
npm run build    # build de producción (tsc + vite build)
```

Stack: React 19 + TypeScript + Vite + Tailwind CSS v4 + funciones serverless de Vercel + Postgres (Supabase) vía `pg`.
