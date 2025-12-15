# 🔍 Script de Verificación de Datos - Gamificación

## Problema Actual
El dashboard muestra todo en 0:
- Total Points: 0
- Level: 1  
- Missions Completed: 0
- Activities Completed: 0

Esto significa que **NO HAY DATOS** en la base de datos para tu usuario.

---

## ✅ Paso 1: Identificar tu USER_ID

Primero necesitas saber cuál es tu `user_id`. Ejecuta esto en Supabase SQL Editor:

```sql
-- Reemplaza 'TU_EMAIL@ejemplo.com' con tu email real
SELECT 
  user_id,
  auth_user_id,
  email,
  first_name,
  last_name,
  role
FROM users 
WHERE email = 'TU_EMAIL@ejemplo.com';
```

**Copia el `user_id` que te devuelve** (será algo como: `abc-123-def-456`)

---

## ✅ Paso 2: Verificar si Existen Datos

Usa el `user_id` que copiaste en el paso anterior:

```sql
-- Reemplaza 'TU_USER_ID' con el user_id del paso 1
SELECT 
  'Mission Attempts' as tabla, 
  COUNT(*) as cantidad,
  COALESCE(SUM(points_earned), 0) as puntos
FROM gamification_mission_attempts 
WHERE user_id = 'TU_USER_ID'

UNION ALL

SELECT 
  'Activity Attempts', 
  COUNT(*),
  0
FROM gamification_activity_attempts 
WHERE user_id = 'TU_USER_ID'

UNION ALL

SELECT 
  'Points Transactions', 
  COUNT(*),
  COALESCE(SUM(points_change), 0)
FROM gamification_points_transactions 
WHERE user_id = 'TU_USER_ID'

UNION ALL

SELECT 
  'Badges', 
  COUNT(*),
  0
FROM gamification_user_badges 
WHERE user_id = 'TU_USER_ID';
```

### Resultado Esperado:

**Si NO has completado ninguna actividad:**
```
tabla                 | cantidad | puntos
---------------------|----------|--------
Mission Attempts     | 0        | 0
Activity Attempts    | 0        | 0
Points Transactions  | 0        | 0
Badges              | 0        | 0
```

**Si SÍ completaste actividades:**
```
tabla                 | cantidad | puntos
---------------------|----------|--------
Mission Attempts     | 1        | 45
Activity Attempts    | 3        | 0
Points Transactions  | 4        | 45
Badges              | 1        | 0
```

---

## ✅ Paso 3: Ver Detalles de Intentos (si existen)

```sql
-- Ver intentos de misiones
SELECT 
  mission_id,
  status,
  activities_completed,
  total_activities,
  points_earned,
  started_at,
  completed_at
FROM gamification_mission_attempts 
WHERE user_id = 'TU_USER_ID'
ORDER BY started_at DESC;

-- Ver intentos de actividades
SELECT 
  activity_id,
  mission_attempt_id,
  is_correct,
  score_percentage,
  points_earned,
  attempted_at
FROM gamification_activity_attempts 
WHERE user_id = 'TU_USER_ID'
ORDER BY attempted_at DESC
LIMIT 10;

-- Ver transacciones de puntos
SELECT 
  transaction_type,
  points_change,
  source_type,
  source_id,
  description,
  created_at
FROM gamification_points_transactions 
WHERE user_id = 'TU_USER_ID'
ORDER BY created_at DESC;
```

---

## 🎯 Solución Según el Resultado

### Caso A: NO HAY DATOS (todo en 0)

**Esto significa que:**
1. No has completado ninguna actividad todavía, O
2. Las actividades que completaste no se guardaron correctamente

**Solución:**
1. Ve a una misión: `/estudiante/gamification/missions`
2. Selecciona una misión
3. Completa UNA actividad
4. **Abre la consola del navegador (F12)** y verifica los logs
5. Deberías ver algo como:

```
✅ User authenticated: ...
✅ Student user_id: abc-123...
✅ Mission attempt created
✅ Activity attempt inserted
✅ Points transaction registered
```

6. Luego ejecuta de nuevo el SQL del Paso 2 para verificar que se guardó

### Caso B: SÍ HAY DATOS pero el Dashboard muestra 0

**Esto significa que:**
- El `user_id` en la sesión no coincide con el `user_id` en la base de datos

**Solución:**
1. Verifica en los logs del navegador cuál `user_id` está usando:
```
🎮 [StudentDashboard] Cargando progreso para user_id: ???
```

2. Compara con el `user_id` del Paso 1

3. Si NO coinciden, hay un problema de autenticación

---

## 🧪 Prueba Rápida: Insertar Datos Manualmente

Si quieres probar que el dashboard funciona, puedes insertar datos de prueba:

```sql
-- 1. Primero, obtén un mission_id válido
SELECT id, title FROM gamification_missions LIMIT 1;

-- 2. Copia el mission_id y úsalo aquí
-- Reemplaza 'TU_USER_ID' y 'MISSION_ID'
INSERT INTO gamification_mission_attempts (
  user_id,
  mission_id,
  status,
  total_activities,
  activities_completed,
  points_earned,
  score_percentage,
  time_spent_seconds,
  started_at,
  completed_at
) VALUES (
  'TU_USER_ID',
  'MISSION_ID',
  'completed',
  5,
  5,
  95,
  100,
  300,
  NOW() - INTERVAL '1 hour',
  NOW()
);

-- 3. Insertar transacciones de puntos
INSERT INTO gamification_points_transactions (
  user_id,
  points_change,
  transaction_type,
  source_type,
  source_id,
  description
) VALUES 
(
  'TU_USER_ID',
  75,
  'activity_complete',
  'mission',
  'MISSION_ID',
  'Puntos por actividades (5 x 15)'
),
(
  'TU_USER_ID',
  20,
  'mission_complete',
  'mission',
  'MISSION_ID',
  'Bonus por completar misión'
);
```

Luego refresca el dashboard y deberías ver:
- **Puntos:** 95
- **Nivel:** 1
- **Misiones:** 1
- **Actividades:** 5

---

## 📊 Verificar Logs del Servidor

Si estás corriendo el servidor en desarrollo, deberías ver en la terminal:

```bash
✅ User authenticated: auth-user-id-123
✅ Student user_id: abc-123-def-456
✅ Mission attempts found: 1
✅ Activity attempts found: 5
✅ Points transactions found: 2
✅ Badges found: 0
📊 Stats calculated: {
  totalPoints: 95,
  level: 1,
  missionsCompleted: 1,
  activitiesCompleted: 5,
  badgesCount: 0
}
```

Si ves `found: 0` en todos, confirma que NO HAY DATOS.

---

## 🚨 Problema Común: RLS (Row Level Security)

Si insertaste datos manualmente pero aún no aparecen, puede ser un problema de RLS.

**Verificar políticas RLS:**

```sql
-- Ver políticas de las tablas de gamificación
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename LIKE 'gamification%'
ORDER BY tablename, policyname;
```

**Deshabilitar RLS temporalmente (solo para pruebas):**

```sql
-- CUIDADO: Esto deshabilita la seguridad
ALTER TABLE gamification_mission_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_activity_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_points_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_user_badges DISABLE ROW LEVEL SECURITY;
```

Luego refresca el dashboard. Si ahora funciona, el problema es RLS.

**Volver a habilitar RLS:**

```sql
ALTER TABLE gamification_mission_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_activity_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_user_badges ENABLE ROW LEVEL SECURITY;
```

---

## 📝 Checklist de Verificación

- [ ] Ejecuté el Paso 1 y obtuve mi `user_id`
- [ ] Ejecuté el Paso 2 y verifiqué si hay datos
- [ ] Si NO hay datos: Completé una actividad nueva
- [ ] Si SÍ hay datos: Verifiqué que el `user_id` coincide
- [ ] Revisé los logs del navegador (F12)
- [ ] Revisé los logs del servidor (terminal)
- [ ] Refresqué el dashboard después de completar una actividad

---

## 🆘 Información para Reportar

Si después de seguir todos los pasos el problema persiste, copia y pega:

**1. Resultado del Paso 1 (tu user_id):**
```
[Pega aquí]
```

**2. Resultado del Paso 2 (verificación de datos):**
```
[Pega aquí]
```

**3. Logs del navegador al cargar el dashboard:**
```
[Pega aquí los logs que empiezan con 🎮]
```

**4. Logs del servidor (si los tienes):**
```
[Pega aquí los logs que empiezan con ✅ o ❌]
```

---

**Última Actualización:** 2025-12-13 20:38
**Estado:** Dashboard actualizado para usar endpoint correcto
**Siguiente Paso:** Verificar si hay datos en la base de datos
