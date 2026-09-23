-- Ejemplo de vista de compatibilidad para que el dashboard pueda leer
-- directamente de tu base SQL Server (modo "sqlserver").
--
-- El aplicativo espera EXACTAMENTE estas columnas (ver src/lib/modules.ts).
-- Ajusta el FROM/JOIN y los nombres reales de tus columnas de origen; lo
-- unico que debe respetarse es el nombre final de cada columna del SELECT.

CREATE OR ALTER VIEW dbo.vw_sihce_modulos_ipress AS
SELECT
    periodo,
    nom_mes,
    departamento,
    disa,
    provincia,
    distrito,
    categoria,
    tipo_eess,
    cod_ipress,
    ipress,

    -- Modulos Administrativo
    mod_refcon,
    mod_referencias,
    mod_gestion,
    mod_citas,
    mod_triaje,

    -- Modulos Asistenciales
    mod_inmunizaciones,
    mod_cred,
    mod_medicina,
    mod_odontologia,
    mod_psicologia,
    mod_nutricion,
    mod_prenatal,
    mod_planificacion,
    mod_laboratorio,
    mod_farmacia,
    mod_fua_electronica,
    mod_urgencias_emergencias
FROM dbo.TU_TABLA_ORIGEN; -- <-- reemplaza por tu tabla/consulta real
