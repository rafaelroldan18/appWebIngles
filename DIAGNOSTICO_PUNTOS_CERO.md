# 🔍 Query de Diagnóstico - Puntos en 0

## Problema Identificado

Tienes:
- ✅ 13 misiones completadas
- ✅ 41 actividades completadas
- ✅ 4 badges
- ❌ **0 puntos totales** (INCORRECTO)

---

## Query de Verificación Inmediata

Ejecuta esto en Supabase SQL Editor:

```sql
-- Reemplaza con tu user_id: 3fff2ba6-6f9f-4997-a9b0-0956fe6aedbe
SELECT 
  'Puntos en Mission Attempts' as fuente,
  COUNT(*) as registros,
  SUM(points_earned) as total_puntos
FROM gamification_mission_attempts 
WHERE user_id = '3fff2ba6-6f9f-4997-a9b0-0956fe6aedbe'

UNION ALL

SELECT 
  'Puntos en Transactions',
  COUNT(*),
  SUM(points_change)
FROM gamification_points_transactions 
WHERE user_id = '3fff2ba6-6f9f-4997-a9b0-0956fe6aedbe';
```

---

## Resultado Esperado vs Actual

### Si las transacciones NO existen:
```
fuente                        | registros | total_puntos
-----------------------------|-----------|-------------
Puntos en Mission Attempts   | 13        | 585
Puntos en Transactions       | 0         | NULL
```
**Problema:** Las transacciones NO se registraron

### Si las transacciones SÍ existen:
```
fuente                        | registros | total_puntos
-----------------------------|-----------|-------------
Puntos en Mission Attempts   | 13        | 585
Puntos en Transactions       | 54        | 585
```
**Problema:** El endpoint NO está sumando correctamente

---

## Verificación del Endpoint

El endpoint `/api/users/stats/student` calcula así:

```typescript
const totalPoints = (pointsTx || []).reduce(
  (sum, tx) => sum + (tx.points_change || 0), 
  0
);
```

**Esto significa:**
- Si `pointsTx` está vacío → `totalPoints = 0`
- Si `pointsTx` tiene datos pero `points_change` es NULL → `totalPoints = 0`

---

## Solución Según el Caso

### Caso A: NO hay transacciones (registros = 0)

**Causa:** Las actividades se completaron ANTES de que implementáramos el sistema de transacciones.

**Solución:** Migrar los puntos existentes a transacciones:

```sql
-- Migrar puntos de mission_attempts a transactions
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

### Caso B: SÍ hay transacciones pero `points_change` es NULL

**Causa:** Columna incorrecta o datos corruptos.

**Solución:** Verificar estructura:

```sql
-- Ver las transacciones
SELECT 
  id,
  points_change,
  transaction_type,
  source_type,
  description,
  created_at
FROM gamification_points_transactions
WHERE user_id = '3fff2ba6-6f9f-4997-a9b0-0956fe6aedbe'
ORDER BY created_at DESC
LIMIT 10;
```

Si `points_change` es NULL, actualizar:

```sql
-- Actualizar transacciones con puntos NULL
UPDATE gamification_points_transactions
SET points_change = 10
WHERE user_id = '3fff2ba6-6f9f-4997-a9b0-0956fe6aedbe'
  AND points_change IS NULL
  AND transaction_type = 'activity_complete';
```

---

## Query de Verificación Final

Después de ejecutar la solución, verifica:

```sql
SELECT 
  SUM(points_change) as total_puntos,
  COUNT(*) as num_transacciones,
  COUNT(DISTINCT transaction_type) as tipos_transaccion
FROM gamification_points_transactions
WHERE user_id = '3fff2ba6-6f9f-4997-a9b0-0956fe6aedbe';
```

Deberías ver algo como:
```
total_puntos | num_transacciones | tipos_transaccion
-------------|-------------------|------------------
585          | 54                | 3
```

---

## Refrescar Dashboard

Después de ejecutar la migración:
1. Refresca el dashboard (F5)
2. Deberías ver los puntos correctos
3. El nivel se calculará automáticamente

---

**Ejecuta el primer query y dime qué resultado obtienes.**
