# 🔍 Guía de Debugging - Sistema de Gamificación

## Problema Actual
Los datos no se están obteniendo correctamente desde la base de datos.

## ✅ Correcciones Aplicadas

### 1. Endpoint `/api/users/stats/student`
**Cambio Principal:** Ahora usa **Service Role Client** para bypasear RLS (Row Level Security)

```typescript
// ANTES (con RLS - podía fallar)
const { data } = await supabase.from('gamification_mission_attempts')...

// AHORA (sin RLS - siempre funciona)
const service = createServiceRoleClient();
const { data } = await service.from('gamification_mission_attempts')...
```

### 2. Logs Agregados
Ahora puedes ver exactamente qué está pasando en cada paso.

---

## 📋 Cómo Verificar que Funciona

### Paso 1: Abrir la Consola del Navegador
1. Presiona `F12` en tu navegador
2. Ve a la pestaña **Console**
3. Refresca la página del dashboard del estudiante

### Paso 2: Verificar Logs del Frontend
Deberías ver algo como esto:

```
🔄 Cargando estadísticas para usuario: abc-123-def-456
📥 Respuesta del API: {
  success: true,
  user: { id: "abc-123-def-456", ... },
  stats: {
    total_points: 45,
    level: 1,
    missions_completed: 1,
    activities_completed: 3,
    badges_count: 1
  }
}
✅ Datos adaptados: {
  progress: {
    nivel_actual: 1,
    puntaje_total: 45,
    actividades_completadas: 3
  },
  badges: [{}]
}
```

### Paso 3: Verificar Logs del Backend
Si estás corriendo el servidor en desarrollo, verás en la terminal:

```
✅ User authenticated: auth-user-id-123
✅ Student user_id: abc-123-def-456
✅ Mission attempts found: 1
✅ Activity attempts found: 3
✅ Points transactions found: 4
✅ Badges found: 1
📊 Stats calculated: {
  totalPoints: 45,
  level: 1,
  missionsCompleted: 1,
  activitiesCompleted: 3,
  badgesCount: 1
}
```

---

## 🚨 Posibles Errores y Soluciones

### Error 1: "No autenticado"
**Síntoma:** Ves `❌ Auth error` en la consola

**Solución:**
1. Verifica que estés logueado
2. Refresca la página
3. Si persiste, cierra sesión y vuelve a entrar

### Error 2: "Usuario no encontrado"
**Síntoma:** Ves `❌ User not found or not student`

**Solución:**
1. Verifica que tu usuario tenga rol `estudiante` en la base de datos:
```sql
SELECT user_id, email, role FROM users WHERE auth_user_id = 'TU_AUTH_ID';
```

### Error 3: Datos en 0
**Síntoma:** El dashboard muestra todo en 0 pero no hay errores

**Causas Posibles:**
1. **No has completado ninguna actividad todavía**
   - Solución: Completa una actividad en una misión

2. **Las transacciones no se registraron**
   - Verifica en la consola del backend si dice "Points transactions found: 0"
   - Si es 0, significa que no se registraron las transacciones
   - Completa una nueva actividad y verifica los logs

3. **El user_id no coincide**
   - Verifica en los logs: `✅ Student user_id: ...`
   - Compara con la base de datos

---

## 🔧 Verificación Manual en Base de Datos

### 1. Verificar que existen datos
```sql
-- Reemplaza 'TU_USER_ID' con tu user_id real
SELECT 'Mission Attempts' as tabla, COUNT(*) as cantidad
FROM gamification_mission_attempts 
WHERE user_id = 'TU_USER_ID'

UNION ALL

SELECT 'Activity Attempts', COUNT(*)
FROM gamification_activity_attempts 
WHERE user_id = 'TU_USER_ID'

UNION ALL

SELECT 'Points Transactions', COUNT(*)
FROM gamification_points_transactions 
WHERE user_id = 'TU_USER_ID'

UNION ALL

SELECT 'Badges', COUNT(*)
FROM gamification_user_badges 
WHERE user_id = 'TU_USER_ID';
```

### 2. Ver puntos totales
```sql
SELECT 
  SUM(points_change) as total_points,
  COUNT(*) as num_transactions
FROM gamification_points_transactions 
WHERE user_id = 'TU_USER_ID';
```

### 3. Ver misiones completadas
```sql
SELECT 
  mission_id,
  status,
  activities_completed,
  total_activities,
  points_earned,
  completed_at
FROM gamification_mission_attempts 
WHERE user_id = 'TU_USER_ID'
ORDER BY started_at DESC;
```

---

## 🎯 Prueba Completa del Sistema

### Paso 1: Completar una Actividad Nueva
1. Ve a una misión que no hayas completado
2. Completa una actividad
3. Observa los logs en la consola del navegador

**Deberías ver en el backend:**
```
✅ User authenticated: ...
✅ Student user_id: ...
✅ Mission attempt created/found
✅ Activity attempt inserted
✅ Points transaction registered
```

### Paso 2: Verificar el Dashboard
1. Vuelve al dashboard
2. Refresca la página (F5)
3. Verifica que los puntos se actualizaron

**Deberías ver:**
- Puntos incrementados (+10 o +15 si fue perfecto)
- Actividades completadas +1
- Si completaste la misión: +20 puntos extra

### Paso 3: Verificar en Base de Datos
```sql
-- Ver la última transacción
SELECT * FROM gamification_points_transactions 
WHERE user_id = 'TU_USER_ID'
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 📊 Ejemplo de Flujo Completo

### Situación Inicial:
- Puntos: 0
- Nivel: 1
- Actividades: 0
- Misiones: 0

### Acción: Completar 1 actividad con 100%
**Backend registra:**
```
✅ Activity attempt inserted
✅ Points transaction: +15 (10 base + 5 perfect)
```

**Dashboard muestra:**
- Puntos: 15
- Nivel: 1
- Actividades: 1
- Misiones: 0

### Acción: Completar las 4 actividades restantes (todas perfectas)
**Backend registra:**
```
✅ 4 more activity attempts
✅ 4 points transactions: +15 each = +60
✅ Mission completed!
✅ Mission bonus transaction: +20
```

**Dashboard muestra:**
- Puntos: 95 (15 + 60 + 20)
- Nivel: 1
- Actividades: 5
- Misiones: 1

---

## 🆘 Si Nada Funciona

### Opción 1: Limpiar y Empezar de Nuevo
```sql
-- CUIDADO: Esto borra TODOS tus datos de gamificación
DELETE FROM gamification_points_transactions WHERE user_id = 'TU_USER_ID';
DELETE FROM gamification_activity_attempts WHERE user_id = 'TU_USER_ID';
DELETE FROM gamification_mission_attempts WHERE user_id = 'TU_USER_ID';
DELETE FROM gamification_user_badges WHERE user_id = 'TU_USER_ID';
```

Luego completa una actividad nueva y verifica los logs.

### Opción 2: Verificar Permisos RLS
El Service Role Client debería bypasear RLS, pero verifica que existe:

```sql
-- Ver políticas RLS en las tablas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename LIKE 'gamification%';
```

### Opción 3: Insertar Datos Manualmente para Probar
```sql
-- Insertar una transacción de prueba
INSERT INTO gamification_points_transactions (
  user_id, 
  points_change, 
  transaction_type, 
  source_type, 
  description
) VALUES (
  'TU_USER_ID',
  50,
  'bonus',
  'manual',
  'Prueba manual'
);
```

Luego refresca el dashboard y verifica si aparecen los 50 puntos.

---

## 📞 Información para Reportar

Si el problema persiste, copia y pega esta información:

**1. Logs del Frontend (Consola del Navegador):**
```
[Pega aquí los logs que ves en la consola]
```

**2. Logs del Backend (Terminal del Servidor):**
```
[Pega aquí los logs del servidor]
```

**3. Query de Verificación:**
```sql
SELECT 
  (SELECT COUNT(*) FROM gamification_mission_attempts WHERE user_id = 'TU_USER_ID') as missions,
  (SELECT COUNT(*) FROM gamification_activity_attempts WHERE user_id = 'TU_USER_ID') as activities,
  (SELECT COUNT(*) FROM gamification_points_transactions WHERE user_id = 'TU_USER_ID') as transactions,
  (SELECT SUM(points_change) FROM gamification_points_transactions WHERE user_id = 'TU_USER_ID') as total_points;
```

**Resultado:**
```
[Pega aquí el resultado de la query]
```

---

**Última Actualización:** 2025-12-13 20:36
**Estado:** Sistema con logs de debugging habilitados
