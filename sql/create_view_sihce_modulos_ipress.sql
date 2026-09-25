-- Vista real para que sihce_dashboard consuma BD_SIHCE en modo "sqlserver".
--
-- Fuentes:
--   1) BD_SIHCE.dbo.SIHCE_MOD_HISMINSA          (137 IPRESS x periodo, ver 2026_ind_42.sql)
--   2) BDHIS_MINSA.dbo.NOMINAL_TRAMA_NUEVO_2025 / _2026  (data transaccional HIS MINSA)
--   3) BDHIS_MINSA.dbo.MAESTRO_HIS_SISTEMA      (catalogo de sistemas/lotes que alimentan HIS MINSA)
--
-- CORRECCION vs version anterior:
-- La primera version de esta vista confiaba 100% en SIHCE_MOD_HISMINSA, pero esa tabla
-- nunca calculo mod_laboratorio (queda fijo en 0) a pesar de que MAESTRO_HIS_SISTEMA SI
-- registra un sistema oficial "SIHCE - LABORATORIO" (Lote_General = SLB, Id_Sistema = 38).
-- El join correcto para saber de que sistema/modulo SIHCE viene un registro de HIS MINSA
-- es hm.Id_AplicacionOrigen = si.Id_Sistema (NO el campo Lote de NOMINAL_TRAMA, que es un
-- numero de lote de carga y no coincide con Lote_General del catalogo).
--
-- Verificado contra la data real (2026-09-25):
--   Id_Sistema 10 CAR  SIHCE - INMUNIZACION                -> tiene registros 2025 y 2026
--   Id_Sistema 11 CED  SIHCE - CRED                        -> tiene registros 2025 y 2026
--   Id_Sistema 12 WPA  WAWARED PARTOS                      -> sin registros aun (0 filas)
--   Id_Sistema 13 WPU  WAWARED PUERPERIO                   -> casi sin uso (53 en 2025, 7 en 2026)
--   Id_Sistema 14 WAT  SIHCE - WAWARED ATENCIONES          -> PRENATAL (confirmado por contenido:
--                       Z349/Z3491-93/Z3591-93 control gestante, ATENCION PRENATAL, PLAN DE PARTO,
--                       perfil obstetrico, suplementacion, etc.) -> mapeado a mod_prenatal
--   Id_Sistema 17 CX1  SIHCE - CONSULTA EXTERNA 1er NIVEL   -> tiene registros 2025 y 2026
--   Id_Sistema 18 CX2  SIHCE - CONSULTA EXTERNA 2do NIVEL   -> sin registros aun (0 filas)
--   Id_Sistema 33 SSB  SIHCE - SALUD BUCAL                  -> tiene registros 2025 y 2026
--   Id_Sistema 34 SNU  SIHCE - NUTRICION                    -> tiene registros 2025 y 2026
--   Id_Sistema 35 SSM  SIHCE - SALUD MENTAL                 -> tiene registros 2025 y 2026
--   Id_Sistema 38 SLB  SIHCE - LABORATORIO                  -> sin registros aun (0 filas)
--   Id_Sistema 15 WPF  WAWARED PLANIFICACION FAMILIAR       -> tiene registros 2025 y 2026
--   Id_Sistema 36 SSS  Servicio social / 37 SIM Imagenes    -> sin columna mod_ equivalente, se ignoran
--
-- Es decir: mod_laboratorio (y mod_parto, mas abajo) siguen saliendo 0 HOY porque
-- realmente no hay ni un solo registro con ese Id_AplicacionOrigen en HIS MINSA (2025 y
-- 2026), no porque la vista lo ignore. La diferencia es que ahora se calculan en vivo
-- desde la fuente oficial, asi que el dia que empiecen a enviar datos, esta vista lo
-- reflejara solo, sin tocar nada.
--
-- mod_parto y mod_puerperio NO son parte de las columnas que espera hoy el aplicativo
-- (ver src/lib/modules.ts), pero se dejan mapeadas y expuestas al final de la vista por
-- si se agregan a MODULE_KEYS mas adelante; el SELECT explicito de columnas que usa el
-- dashboard (modulesService.ts) las ignora sin problema mientras tanto.
--
-- Para los modulos que NO tienen un Id_Sistema propio en HIS MINSA (gestion, citas,
-- triaje, refcon, referencias, farmacia, fua_electronica, urgencias) se mantiene el
-- valor ya calculado en SIHCE_MOD_HISMINSA (se completan por otras fuentes: tbl_gestion,
-- tbl_modulos_ce_*, tbl_modulos_refcon_*, reportes de FUA, etc).
--
-- ADVERTENCIA DE RENDIMIENTO: NOMINAL_TRAMA_NUEVO_2025/2026 no tienen indices (son
-- heaps de ~11.4M y ~6.6M filas respectivamente), por lo que el GROUP BY de abajo hace
-- table scan completo. Para un dashboard de uso frecuente conviene:
--   a) crear un indice tipo:
--        CREATE INDEX IX_nominal_origen_ipress ON dbo.NOMINAL_TRAMA_NUEVO_2026 (Id_AplicacionOrigen, renipress) INCLUDE (Anio, Mes);
--      (y su equivalente en _2025), o
--   b) materializar el resultado de la CTE his_flags en una tabla fisica que se
--      refresque 1 vez al dia (job/SP), y que esta vista simplemente lea.
-- Se deja como vista por simplicidad; si el dashboard se siente lento, avisar para
-- migrar a la opcion (b).
--
-- El aplicativo espera EXACTAMENTE estas columnas (ver src/lib/modules.ts).

USE BD_SIHCE;
GO

CREATE OR ALTER VIEW dbo.vw_sihce_modulos_ipress AS
WITH his_raw AS (
    SELECT
        renipress            AS cod_ipress,
        CAST(CONCAT(Anio, RIGHT(CONCAT('0', Mes), 2)) AS INT) AS periodo,
        Id_AplicacionOrigen
    FROM BDHIS_MINSA.dbo.NOMINAL_TRAMA_NUEVO_2025
    WHERE Id_AplicacionOrigen IN ('10','11','12','13','14','17','18','33','34','35','38','15')

    UNION ALL

    SELECT
        renipress,
        CAST(CONCAT(Anio, RIGHT(CONCAT('0', Mes), 2)) AS INT),
        Id_AplicacionOrigen
    FROM BDHIS_MINSA.dbo.NOMINAL_TRAMA_NUEVO_2026
    WHERE Id_AplicacionOrigen IN ('10','11','12','13','14','17','18','33','34','35','38','15')
),
his_flags AS (
    SELECT
        cod_ipress,
        periodo,
        MAX(CASE WHEN Id_AplicacionOrigen = '10'            THEN 1 ELSE 0 END) AS his_inmunizaciones,
        MAX(CASE WHEN Id_AplicacionOrigen = '11'            THEN 1 ELSE 0 END) AS his_cred,
        MAX(CASE WHEN Id_AplicacionOrigen = '12'            THEN 1 ELSE 0 END) AS his_parto,
        MAX(CASE WHEN Id_AplicacionOrigen = '13'            THEN 1 ELSE 0 END) AS his_puerperio,
        MAX(CASE WHEN Id_AplicacionOrigen = '14'            THEN 1 ELSE 0 END) AS his_prenatal,
        MAX(CASE WHEN Id_AplicacionOrigen IN ('17','18')    THEN 1 ELSE 0 END) AS his_medicina,
        MAX(CASE WHEN Id_AplicacionOrigen = '33'            THEN 1 ELSE 0 END) AS his_odontologia,
        MAX(CASE WHEN Id_AplicacionOrigen = '34'            THEN 1 ELSE 0 END) AS his_nutricion,
        MAX(CASE WHEN Id_AplicacionOrigen = '35'            THEN 1 ELSE 0 END) AS his_psicologia,
        MAX(CASE WHEN Id_AplicacionOrigen = '38'            THEN 1 ELSE 0 END) AS his_laboratorio,
        MAX(CASE WHEN Id_AplicacionOrigen = '15'            THEN 1 ELSE 0 END) AS his_planificacion
    FROM his_raw
    GROUP BY cod_ipress, periodo
)
SELECT
    h.periodo,
    h.nom_mes,
    h.departamento,
    h.disa,
    h.provincia,
    h.distrito,
    h.categoria,
    h.tipo_eess,
    h.cod_ipress,
    h.ipress,

    -- Modulos Administrativo (sin Id_Sistema propio en HIS MINSA -> se toman tal cual de SIHCE_MOD_HISMINSA)
    CASE WHEN ISNULL(h.mod_refcon, 0)       > 0 THEN 1 ELSE 0 END AS mod_refcon,
    0                                                           AS mod_referencias,  -- se deja en 0 por decision funcional
    CASE WHEN ISNULL(h.mod_gestion, 0)      > 0 THEN 1 ELSE 0 END AS mod_gestion,
    CASE WHEN ISNULL(h.mod_citas, 0)        > 0 THEN 1 ELSE 0 END AS mod_citas,
    CASE WHEN ISNULL(h.mod_triaje, 0)       > 0 THEN 1 ELSE 0 END AS mod_triaje,

    -- Modulos Asistenciales -> OR entre lo ya calculado en SIHCE_MOD_HISMINSA y la
    -- evidencia en vivo de HIS MINSA (por Id_Sistema). Nunca resta un 1 que ya existiera.
    CASE WHEN ISNULL(h.mod_inmuni, 0)      > 0 OR ISNULL(f.his_inmunizaciones, 0) = 1 THEN 1 ELSE 0 END AS mod_inmunizaciones,
    CASE WHEN ISNULL(h.mod_cred, 0)        > 0 OR ISNULL(f.his_cred, 0)         = 1 THEN 1 ELSE 0 END AS mod_cred,
    CASE WHEN ISNULL(h.mod_ce_med, 0)      > 0 OR ISNULL(f.his_medicina, 0)     = 1 THEN 1 ELSE 0 END AS mod_medicina,
    CASE WHEN ISNULL(h.mod_bucal, 0)       > 0 OR ISNULL(f.his_odontologia, 0)  = 1 THEN 1 ELSE 0 END AS mod_odontologia,
    CASE WHEN ISNULL(h.mod_psicologia, 0)  > 0 OR ISNULL(f.his_psicologia, 0)   = 1 THEN 1 ELSE 0 END AS mod_psicologia,
    CASE WHEN ISNULL(h.mod_nutricion, 0)   > 0 OR ISNULL(f.his_nutricion, 0)    = 1 THEN 1 ELSE 0 END AS mod_nutricion,
    CASE WHEN ISNULL(h.mod_prenatal, 0)    > 0 OR ISNULL(f.his_prenatal, 0)     = 1 THEN 1 ELSE 0 END AS mod_prenatal,
    CASE WHEN ISNULL(h.mod_plan_fam, 0)    > 0 OR ISNULL(f.his_planificacion, 0) = 1 THEN 1 ELSE 0 END AS mod_planificacion,
    CASE WHEN ISNULL(h.mod_laboratorio, 0) > 0 OR ISNULL(f.his_laboratorio, 0)  = 1 THEN 1 ELSE 0 END AS mod_laboratorio,
    CASE WHEN ISNULL(h.mod_farmacia, 0)    > 0 THEN 1 ELSE 0 END AS mod_farmacia,
    CASE WHEN ISNULL(h.mod_fua, 0)         > 0 THEN 1 ELSE 0 END AS mod_fua_electronica,
    CASE WHEN ISNULL(h.mod_urgencias, 0)   > 0 THEN 1 ELSE 0 END AS mod_urgencias_emergencias,

    -- Extra: no forman parte de las 17 columnas mod_ requeridas por el dashboard hoy,
    -- pero se dejan calculadas/mapeadas para uso futuro (ver nota arriba).
    CASE WHEN ISNULL(h.mod_parto, 0)       > 0 OR ISNULL(f.his_parto, 0)       = 1 THEN 1 ELSE 0 END AS mod_parto,
    CASE WHEN ISNULL(h.mod_puerperio, 0)   > 0 OR ISNULL(f.his_puerperio, 0)   = 1 THEN 1 ELSE 0 END AS mod_puerperio
FROM dbo.SIHCE_MOD_HISMINSA h
LEFT JOIN his_flags f
    ON f.cod_ipress = h.cod_ipress
   AND f.periodo = h.periodo;
GO
