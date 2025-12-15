# 🔧 Script de Migración Completo - Gamificación

## Problema Identificado

Basándome en el esquema de la base de datos:
- ✅ Tienes 13 misiones completadas
- ✅ Tienes 41 actividades completadas
- ❌ **0 puntos** porque no hay transacciones registradas
- ❌ `student_progress` puede estar desactualizado

---

## 📋 Script de Migración Completo

Ejecuta estos scripts en orden en Supabase SQL Editor:

### Paso 1: Migrar Puntos de Misiones a Transacciones

```sql
-- Migrar puntos de misiones completadas a transacciones
INSERT INTO gamification_points_transactions (
  user_id,
  points_change,
  transaction_type,
  source_type,
  source_id,
  description,
  created_at
)
SELECT 
  user_id,
  points_earned,
  'mission_complete',
  'mission',
  mission_id,
  'Migración de puntos históricos - Misión completada',
  COALESCE(completed_at, started_at, NOW())
FROM gamification_mission_attempts
WHERE user_id = '3fff2ba6-6f9f-4997-a9b0-0956fe6aedbe'
  AND status = 'completed'
  AND points_earned > 0
  AND NOT EXISTS (
    SELECT 1 FROM gamification_points_transactions
    WHERE user_id = gamification_mission_attempts.user_id
      AND source_id = gamification_mission_attempts.mission_id
      AND transaction_type = 'mission_complete'
  );
```

### Paso 2: Verificar Transacciones Creadas

```sql
SELECT 
  COUNT(*) as transacciones_creadas,
  SUM(points_change) as puntos_totales
FROM gamification_points_transactions
WHERE user_id = '3fff2ba6-6f9f-4997-a9b0-0956fe6aedbe';
```

**Resultado esperado:**
```
transacciones_creadas | puntos_totales
---------------------|---------------
13                   | ~585
```

### Paso 3: Actualizar student_progress

```sql
-- Actualizar o crear registro en student_progress
INSERT INTO student_progress (
  student_id,
  activities_completed,
  total_score,
  current_level,
  last_updated_at
)
SELECT 
  user_id,
  (SELECT COUNT(DISTINCT activity_id) 
   FROM gamification_activity_attempts 
   WHERE user_id = '3fff2ba6-6f9f-4997-a9b0-0956fe6aedbe'),
  (SELECT COALESCE(SUM(points_change), 0) 
   FROM gamification_points_transactions 
   WHERE user_id = '3fff2ba6-6f9f-4997-a9b0-0956fe6aedbe'),
  (SELECT FLOOR(COALESCE(SUM(points_change), 0) / 100) + 1 
   FROM gamification_points_transactions 
   WHERE user_id = '3fff2ba6-6f9f-4997-a9b0-0956fe6aedbe'),
  NOW()
FROM users
WHERE user_id = '3fff2ba6-6f9f-4997-a9b0-0956fe6aedbe'
ON CONFLICT (student_id) 
DO UPDATE SET
  activities_completed = (
    SELECT COUNT(DISTINCT activity_id) 
    FROM gamification_activity_attempts 
    WHERE user_id = '3fff2ba6-6f9f-4997-a9b0-0956fe6aedbe'
  ),
  total_score = (
    SELECT COALESCE(SUM(points_change), 0) 
    FROM gamification_points_transactions 
    WHERE user_id = '3fff2ba6-6f9f-4997-a9b0-0956fe6aedbe'
  ),
  current_level = (
    SELECT FLOOR(COALESCE(SUM(points_change), 0) / 100) + 1 
    FROM gamification_points_transactions 
    WHERE user_id = '3fff2ba6-6f9f-4997-a9b0-0956fe6aedbe'
  ),
  last_updated_at = NOW();
```

### Paso 4: Verificar student_progress

```sql
SELECT 
  student_id,
  activities_completed,
  total_score,
  current_level,
  last_updated_at
FROM student_progress
WHERE student_id = '3fff2ba6-6f9f-4997-a9b0-0956fe6aedbe';
```

**Resultado esperado:**
```
student_id                            | activities_completed | total_score | current_level | last_updated_at
--------------------------------------|---------------------|-------------|---------------|------------------
3fff2ba6-6f9f-4997-a9b0-0956fe6aedbe | 41                  | 585         | 6             | 2025-12-13 ...
```

---

## 🔄 Crear Trigger para Mantener student_progress Actualizado

Para que `student_progress` se actualice automáticamente en el futuro:

```sql
-- Función para actualizar student_progress
CREATE OR REPLACE FUNCTION update_student_progress()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO student_progress (
    student_id,
    activities_completed,
    total_score,
    current_level,
    last_updated_at
  )
  SELECT 
    NEW.user_id,
    (SELECT COUNT(DISTINCT activity_id) 
     FROM gamification_activity_attempts 
     WHERE user_id = NEW.user_id),
    (SELECT COALESCE(SUM(points_change), 0) 
     FROM gamification_points_transactions 
     WHERE user_id = NEW.user_id),
    (SELECT FLOOR(COALESCE(SUM(points_change), 0) / 100) + 1 
     FROM gamification_points_transactions 
     WHERE user_id = NEW.user_id),
    NOW()
  ON CONFLICT (student_id) 
  DO UPDATE SET
    activities_completed = (
      SELECT COUNT(DISTINCT activity_id) 
      FROM gamification_activity_attempts 
      WHERE user_id = NEW.user_id
    ),
    total_score = (
      SELECT COALESCE(SUM(points_change), 0) 
      FROM gamification_points_transactions 
      WHERE user_id = NEW.user_id
    ),
    current_level = (
      SELECT FLOOR(COALESCE(SUM(points_change), 0) / 100) + 1 
      FROM gamification_points_transactions 
      WHERE user_id = NEW.user_id
    ),
    last_updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger en gamification_points_transactions
DROP TRIGGER IF EXISTS trigger_update_student_progress ON gamification_points_transactions;
CREATE TRIGGER trigger_update_student_progress
AFTER INSERT ON gamification_points_transactions
FOR EACH ROW
EXECUTE FUNCTION update_student_progress();
```

---

## 📊 Verificación Final

Después de ejecutar todos los scripts:

```sql
-- Ver resumen completo del estudiante
SELECT 
  u.user_id,
  u.first_name,
  u.last_name,
  u.email,
  sp.activities_completed,
  sp.total_score,
  sp.current_level,
  (SELECT COUNT(*) FROM gamification_mission_attempts 
   WHERE user_id = u.user_id AND status = 'completed') as missions_completed,
  (SELECT COUNT(*) FROM gamification_user_badges 
   WHERE user_id = u.user_id) as badges_count,
  (SELECT COUNT(*) FROM gamification_points_transactions 
   WHERE user_id = u.user_id) as transactions_count
FROM users u
LEFT JOIN student_progress sp ON sp.student_id = u.user_id
WHERE u.user_id = '3fff2ba6-6f9f-4997-a9b0-0956fe6aedbe';
```

**Resultado esperado:**
```
user_id      | first_name | activities | total_score | level | missions | badges | transactions
-------------|------------|------------|-------------|-------|----------|--------|-------------
3fff2ba6-... | [nombre]   | 41         | 585         | 6     | 13       | 4      | 13
```

---

## 🎯 Refrescar Dashboard

Después de ejecutar la migración:

1. **Refresca el navegador** (F5)
2. **Verifica los logs en la consola:**
   ```
   ✅ [StudentDashboard] Progreso procesado: {
     totalPoints: 585,
     level: 6,
     missionsCompleted: 13,
     activitiesCompleted: 41,
     ...
   }
   ```
3. **El dashboard debería mostrar:**
   - Nivel: 6
   - Puntos Totales: 585
   - Misiones: 13
   - Actividades: 41
   - Insignias: 4

---

## 🚀 Para Todos los Estudiantes

Si quieres migrar los datos de TODOS los estudiantes:

```sql
-- Migrar puntos de TODOS los estudiantes
INSERT INTO gamification_points_transactions (
  user_id,
  points_change,
  transaction_type,
  source_type,
  source_id,
  description,
  created_at
)
SELECT 
  user_id,
  points_earned,
  'mission_complete',
  'mission',
  mission_id,
  'Migración de puntos históricos',
  COALESCE(completed_at, started_at, NOW())
FROM gamification_mission_attempts
WHERE status = 'completed'
  AND points_earned > 0
  AND NOT EXISTS (
    SELECT 1 FROM gamification_points_transactions
    WHERE user_id = gamification_mission_attempts.user_id
      AND source_id = gamification_mission_attempts.mission_id
      AND transaction_type = 'mission_complete'
  );

-- Actualizar student_progress para TODOS
INSERT INTO student_progress (
  student_id,
  activities_completed,
  total_score,
  current_level,
  last_updated_at
)
SELECT 
  u.user_id,
  COALESCE(act.activities_completed, 0),
  COALESCE(pts.total_score, 0),
  FLOOR(COALESCE(pts.total_score, 0) / 100) + 1,
  NOW()
FROM users u
LEFT JOIN (
  SELECT user_id, COUNT(DISTINCT activity_id) as activities_completed
  FROM gamification_activity_attempts
  GROUP BY user_id
) act ON act.user_id = u.user_id
LEFT JOIN (
  SELECT user_id, SUM(points_change) as total_score
  FROM gamification_points_transactions
  GROUP BY user_id
) pts ON pts.user_id = u.user_id
WHERE u.role = 'estudiante'
ON CONFLICT (student_id) 
DO UPDATE SET
  activities_completed = EXCLUDED.activities_completed,
  total_score = EXCLUDED.total_score,
  current_level = EXCLUDED.current_level,
  last_updated_at = EXCLUDED.last_updated_at;
```

---

## ✅ Checklist

- [ ] Ejecuté Paso 1: Migrar puntos a transacciones
- [ ] Ejecuté Paso 2: Verificar transacciones creadas
- [ ] Ejecuté Paso 3: Actualizar student_progress
- [ ] Ejecuté Paso 4: Verificar student_progress
- [ ] Creé el trigger para actualizaciones automáticas
- [ ] Refresqué el dashboard
- [ ] Verifiqué que los puntos se muestran correctamente

---

**Ejecuta los scripts en orden y dime si funciona!** 🚀
