# SIHCE Dashboard Web

Migracion del dashboard "Modulos SIHCE Implementados" (originalmente en Power BI)
a un aplicativo web. Permite ver, por provincia e IPRESS, que modulos del SIHCE
estan implementados, filtrando por periodo, categoria e IPRESS.

Los datos se pueden cargar de dos formas intercambiables:

- **Excel**: se sube un `.xlsx` desde `/settings` y se guarda en una base SQLite local.
- **SQL Server**: el dashboard consulta en vivo una tabla/vista de tu base de datos.

## Stack

- [Next.js 14](https://nextjs.org/) (App Router) + TypeScript + React
- Tailwind CSS para estilos
- `better-sqlite3` para la base local (cache de Excel y configuracion)
- `mssql` para conectarse a SQL Server
- `exceljs` para leer los archivos Excel subidos

## Requisitos

- Node.js 18 o superior
- (Opcional) Acceso a una instancia de SQL Server si vas a usar esa fuente

## Instalacion

```bash
npm install
cp .env.example .env
npm run dev
```

Abre `http://localhost:3000`. La primera vez no habra datos: entra a
`http://localhost:3000/settings` y sube un archivo Excel, o cambia la fuente
a "SQL Server" y configura la conexion por variables de entorno.

## Modelo de datos

El dashboard trabaja con una fila por **IPRESS + periodo**, con columnas de
dimension (`provincia`, `distrito`, `categoria`, `cod_ipress`, `ipress`,
`periodo`, ...) y columnas de modulo `mod_x` con valor 0/1 (implementado o no).
La lista completa de modulos y sus alias de columna esta en
[`src/lib/modules.ts`](src/lib/modules.ts) — si tu Excel o tu vista de SQL
Server usan otros nombres de columna, agrega el alias ahi en
`EXCEL_HEADER_ALIASES` (para Excel) o crea una vista de compatibilidad para
SQL Server (ver [`sql/create_view_example.sql`](sql/create_view_example.sql)).

El dashboard agrega los datos asi:

- Se filtra por `periodo` (obligatorio), y opcionalmente `categoria` e `ipress`.
- Se agrupa por `provincia`; cada fila de provincia se puede expandir para ver
  el detalle por IPRESS.
- Cada columna de modulo es la suma de los flags 0/1 de las filas incluidas.
- "Modulos SIHCE" es la suma de todos los modulos de esa fila/grupo.

## Conectar a SQL Server

1. Crea una vista en tu base de datos con las columnas esperadas (ver
   `sql/create_view_example.sql`).
2. Completa las variables `MSSQL_*` en `.env`.
3. En `/settings`, cambia la fuente de datos a "SQL Server" y usa "Probar
   conexion" para verificar.

## Cargar datos desde Excel

1. Entra a `/settings`.
2. Selecciona el archivo `.xlsx` (debe tener una hoja con columnas `ipress` y
   `periodo`, como las hojas `BASE` / `BASE_INICIO_IMPL` del Excel original).
3. Cada carga reemplaza por completo los datos anteriores (no es incremental).

## Estructura del proyecto

```
src/
  app/
    page.tsx              Dashboard principal
    settings/page.tsx     Configuracion (fuente de datos + carga de Excel)
    api/
      modules-summary/    Datos agregados para la tabla
      filters/            Listas de periodos/categorias/ipress
      upload/             Carga de Excel
      data-source/        Get/Set del modo de fuente de datos
      test-connection/    Prueba de conexion a SQL Server
  lib/
    modules.ts             Definicion canonica de los 17 modulos SIHCE
    types.ts                Tipos compartidos
    db/sqlite.ts            Conexion y esquema SQLite local
    db/sqlserver.ts         Pool de conexion a SQL Server
    services/
      excelImport.ts        Parseo e importacion de Excel
      modulesService.ts     Agregacion de datos (SQLite o SQL Server)
      config.ts              Persistencia del modo de fuente de datos
  components/               UI del dashboard y configuracion
sql/create_view_example.sql Plantilla de vista SQL Server compatible
```

## Pendientes / siguientes pasos sugeridos

- Autenticacion (hoy el acceso es libre, como se definio para este MVP).
- Replicar las otras secciones del sistema original (Modulos en General,
  Consulta Externa, Estrategias) reutilizando el mismo patron de
  filtros + tabla jerarquica.
- Exportar la tabla a Excel/PDF desde el propio dashboard.
