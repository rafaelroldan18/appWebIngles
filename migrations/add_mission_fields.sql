-- ========================================
-- MIGRACIÓN: Agregar campos de misión a game_availability
-- Fecha: 2026-01-07
-- Descripción: Agrega mission_title, mission_instructions y mission_config
-- ========================================

-- 1. Agregar columnas a game_availability
ALTER TABLE public.game_availability
ADD COLUMN IF NOT EXISTS mission_title text,
ADD COLUMN IF NOT EXISTS mission_instructions text,
ADD COLUMN IF NOT EXISTS mission_config jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. Actualizar registros existentes con valores por defecto
-- Esto evita que las misiones viejas tengan valores nulos
UPDATE public.game_availability
SET 
    mission_title = COALESCE(mission_title, 'Misión sin título'),
    mission_instructions = COALESCE(mission_instructions, 'Sigue las instrucciones del docente.'),
    mission_config = COALESCE(mission_config, '{}'::jsonb)
WHERE 
    mission_title IS NULL 
    OR mission_instructions IS NULL 
    OR mission_config IS NULL;

-- 3. Crear índice para optimizar queries de misiones activas por paralelo
CREATE INDEX IF NOT EXISTS idx_game_availability_active_parallel
ON public.game_availability (parallel_id, is_active, available_from, available_until);

-- 4. Agregar comentarios a las columnas para documentación
COMMENT ON COLUMN public.game_availability.mission_title IS 
'Título de la misión definido por el docente';

COMMENT ON COLUMN public.game_availability.mission_instructions IS 
'Instrucciones específicas de la misión que el estudiante verá en el briefing';

COMMENT ON COLUMN public.game_availability.mission_config IS 
'Configuración dinámica de la misión en formato JSON. Incluye: time_limit_seconds, content_constraints (items, distractors_percent), asset_pack, hud_help_enabled, y campos personalizados por juego';

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Verificar que las columnas se crearon correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'game_availability'
AND column_name IN ('mission_title', 'mission_instructions', 'mission_config');

-- Verificar que el índice se creó correctamente
SELECT 
    indexname, 
    indexdef
FROM pg_indexes
WHERE tablename = 'game_availability'
AND indexname = 'idx_game_availability_active_parallel';

-- ========================================
-- EJEMPLO DE DATOS
-- ========================================

-- Ejemplo de cómo se vería un registro actualizado
-- (Solo para referencia, NO ejecutar)
/*
SELECT 
    availability_id,
    mission_title,
    mission_instructions,
    mission_config
FROM public.game_availability
LIMIT 1;

-- Resultado esperado:
-- availability_id | mission_title              | mission_instructions                    | mission_config
-- ----------------|----------------------------|----------------------------------------|------------------
-- uuid-123        | Atrapa verbos en presente  | Atrapa solo los verbos en presente...  | {"time_limit_seconds": 60, ...}
*/

-- ========================================
-- ROLLBACK (En caso de necesitar revertir)
-- ========================================

-- SOLO ejecutar si necesitas revertir la migración
/*
-- Eliminar índice
DROP INDEX IF EXISTS public.idx_game_availability_active_parallel;

-- Eliminar columnas
ALTER TABLE public.game_availability
DROP COLUMN IF EXISTS mission_title,
DROP COLUMN IF EXISTS mission_instructions,
DROP COLUMN IF EXISTS mission_config;
*/
