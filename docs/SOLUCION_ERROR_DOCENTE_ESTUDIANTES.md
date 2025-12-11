# Solución: Error al Obtener Estudiantes en Vista de Docente

## Problema Identificado
Error al consultar la tabla `usuarios` desde la vista de docente:
```
❌ [TeacherProgress] Error al obtener estudiantes: {}
```

## Causa Probable
**Row Level Security (RLS)** en Supabase está bloqueando la consulta porque el docente no tiene permisos para leer la tabla `usuarios`.

---

## Solución 1: Verificar Políticas RLS en Supabase

### Paso 1: Ir a Supabase Dashboard
1. Abre https://supabase.com
2. Selecciona tu proyecto
3. Ve a **Authentication** > **Policies**
4. Busca la tabla `usuarios`

### Paso 2: Verificar Política de Lectura
Debe existir una política que permita a los docentes leer la tabla `usuarios`.

**Política Recomendada:**
```sql
-- Nombre: Docentes pueden ver estudiantes
-- Tabla: usuarios
-- Operación: SELECT
-- Política:

CREATE POLICY "Docentes pueden ver estudiantes"
ON usuarios
FOR SELECT
TO authenticated
USING (
  -- El usuario autenticado es docente o administrador
  auth.uid() IN (
    SELECT id_usuario 
    FROM usuarios 
    WHERE id_usuario = auth.uid() 
    AND rol IN ('docente', 'administrador')
  )
  -- Y puede ver estudiantes
  OR rol = 'estudiante'
);
```

### Paso 3: Aplicar la Política
1. En Supabase Dashboard, ve a **SQL Editor**
2. Ejecuta el siguiente SQL:

```sql
-- Eliminar política existente si hay conflicto
DROP POLICY IF EXISTS "Docentes pueden ver estudiantes" ON usuarios;

-- Crear nueva política
CREATE POLICY "Docentes pueden ver estudiantes"
ON usuarios
FOR SELECT
TO authenticated
USING (
  -- Permitir a docentes y administradores ver todos los usuarios
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE id_usuario = auth.uid()
    AND rol IN ('docente', 'administrador')
  )
  -- O el usuario está viendo su propio perfil
  OR id_usuario = auth.uid()
);
```

---

## Solución 2: Política Más Permisiva (Temporal para Testing)

Si necesitas una solución rápida para testing:

```sql
-- SOLO PARA DESARROLLO - Permitir a usuarios autenticados ver la tabla usuarios
CREATE POLICY "Usuarios autenticados pueden ver usuarios"
ON usuarios
FOR SELECT
TO authenticated
USING (true);
```

⚠️ **ADVERTENCIA:** Esta política es muy permisiva. Úsala solo para desarrollo.

---

## Solución 3: Verificar RLS está Habilitado

```sql
-- Verificar si RLS está habilitado en la tabla usuarios
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'usuarios';

-- Si rowsecurity es false, habilitar RLS:
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
```

---

## Solución 4: Ver Políticas Actuales

```sql
-- Ver todas las políticas de la tabla usuarios
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'usuarios';
```

---

## Verificación Después de Aplicar

1. **Recargar la página** `/docente/gamification/student-progress`
2. **Abrir consola** (F12)
3. **Verificar logs:**

### ✅ Logs Esperados (Éxito):
```
👨‍🏫 [TeacherProgress] Cargando progreso de estudiantes...
👨‍🏫 [TeacherProgress] Usuario autenticado: abc123-def456-...
👨‍🏫 [TeacherProgress] Estudiantes encontrados: 3
👨‍🏫 [TeacherProgress] Datos de estudiantes: [...]
```

### ⚠️ Si Aparece Consulta Alternativa:
```
⚠️ [TeacherProgress] Intentando consulta alternativa...
👨‍🏫 [TeacherProgress] Consulta alternativa - Usuarios encontrados: X
👨‍🏫 [TeacherProgress] Consulta alternativa - Datos: [...]
```

Esto significa que la consulta sin filtros funciona, confirmando que es un problema de RLS.

---

## Política Recomendada para Producción

```sql
-- Política completa y segura para la tabla usuarios
CREATE POLICY "usuarios_select_policy"
ON usuarios
FOR SELECT
TO authenticated
USING (
  CASE
    -- Administradores pueden ver todo
    WHEN EXISTS (
      SELECT 1 FROM usuarios
      WHERE id_usuario = auth.uid() AND rol = 'administrador'
    ) THEN true
    
    -- Docentes pueden ver estudiantes y su propio perfil
    WHEN EXISTS (
      SELECT 1 FROM usuarios
      WHERE id_usuario = auth.uid() AND rol = 'docente'
    ) THEN (rol = 'estudiante' OR id_usuario = auth.uid())
    
    -- Estudiantes solo pueden ver su propio perfil
    WHEN EXISTS (
      SELECT 1 FROM usuarios
      WHERE id_usuario = auth.uid() AND rol = 'estudiante'
    ) THEN id_usuario = auth.uid()
    
    -- Por defecto, denegar
    ELSE false
  END
);
```

---

## Comandos SQL Completos

```sql
-- 1. Habilitar RLS si no está habilitado
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas antiguas (opcional)
DROP POLICY IF EXISTS "usuarios_select_policy" ON usuarios;
DROP POLICY IF EXISTS "Docentes pueden ver estudiantes" ON usuarios;

-- 3. Crear política nueva
CREATE POLICY "usuarios_select_policy"
ON usuarios
FOR SELECT
TO authenticated
USING (
  -- Administradores ven todo
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE id_usuario = auth.uid() AND rol = 'administrador'
  )
  -- Docentes ven estudiantes
  OR (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id_usuario = auth.uid() AND rol = 'docente'
    )
    AND (rol = 'estudiante' OR id_usuario = auth.uid())
  )
  -- Usuarios ven su propio perfil
  OR id_usuario = auth.uid()
);

-- 4. Verificar que la política se creó
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'usuarios';
```

---

## Próximos Pasos

1. ✅ Ejecutar los comandos SQL en Supabase
2. ✅ Recargar la página del docente
3. ✅ Verificar los logs en la consola
4. ✅ Confirmar que se muestran los estudiantes

Si después de aplicar las políticas sigue sin funcionar, comparte los nuevos logs que aparezcan en la consola.
