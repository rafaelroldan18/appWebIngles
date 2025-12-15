# Plan de Refactorización: Migración a Arquitectura REST

## Problema Actual
El frontend está haciendo consultas directas a Supabase desde archivos en `/src`, violando la arquitectura REST. Todas las consultas a la base de datos deben estar en endpoints API (`/app/api`).

## Archivos que Necesitan Refactorización

### 1. `src/lib/gamification/gamificationApi.ts` (26 consultas)
**Funciones que hacen consultas directas:**
- `getMissionsWithProgress()` - Ya tiene endpoint `/api/gamification/progress/missions` ✅
- `getActivityById()`
- `getActivitiesByMission()`
- `getMissionById()`
- `getUserProgress()`
- `getStudentStats()`
- `getBadges()`
- `getUserBadges()`
- `getLeaderboard()`
- `createMission()`
- `updateMission()`
- `deleteMission()`
- `createActivity()`
- `updateActivity()`
- `deleteActivity()`
- `assignMissionToStudents()`
- `getMissionAssignments()`
- `removeMissionAssignment()`

**Acción:** Convertir cada función para que llame a un endpoint API en lugar de consultar directamente.

### 2. `src/services/gamification-progress.service.ts` (5 consultas)
**Funciones:**
- `getStudentProgress()`
- `getMissionProgress()`
- `getActivityProgress()`
- `updateProgress()`
- `completeActivity()`

**Acción:** Migrar a endpoints API.

### 3. `src/lib/gamification/achievement-validator.ts` (6 consultas)
**Funciones:**
- `calculateBadgeProgress()`
- `checkBadgeCriteria()`
- `getUserActivitiesCount()`
- `getUserPerfectActivitiesCount()`
- `getUserMissionsCompleted()`

**Acción:** Estas funciones deben ejecutarse en el BACKEND, no en el frontend.

### 4. `src/lib/gamification/badge-assignment.ts` (2 consultas)
**Funciones:**
- `assignBadgeToUser()`
- `checkAndAssignBadges()`

**Acción:** Mover completamente al backend.

## Endpoints API Necesarios

### Ya Existentes ✅
- `POST /api/gamification/progress/activities/complete`
- `GET /api/gamification/progress/missions`
- `GET /api/gamification/achievements`
- `GET /api/gamification/student-progress`
- `GET /api/gamification/progress/student/[id]`

### Por Crear 🔨

#### Actividades
- `GET /api/gamification/activities/[id]` - Obtener actividad por ID
- `GET /api/gamification/activities?mission_id=xxx` - Obtener actividades de una misión
- `POST /api/gamification/activities` - Crear actividad
- `PUT /api/gamification/activities/[id]` - Actualizar actividad
- `DELETE /api/gamification/activities/[id]` - Eliminar actividad

#### Misiones
- `GET /api/gamification/missions/[id]` - Obtener misión por ID
- `POST /api/gamification/missions` - Crear misión
- `PUT /api/gamification/missions/[id]` - Actualizar misión
- `DELETE /api/gamification/missions/[id]` - Eliminar misión
- `POST /api/gamification/missions/[id]/assign` - Asignar misión a estudiantes
- `GET /api/gamification/missions/[id]/assignments` - Obtener asignaciones
- `DELETE /api/gamification/missions/[id]/assignments/[studentId]` - Eliminar asignación

#### Progreso
- `GET /api/users/stats/student` - Ya existe ✅
- `GET /api/gamification/leaderboard` - Obtener tabla de clasificación

#### Badges
- `GET /api/gamification/achievements` - Ya existe ✅
- `GET /api/gamification/achievements/user` - Obtener badges del usuario actual
- `POST /api/gamification/achievements/check` - Verificar y asignar badges (backend)

## Pasos de Implementación

### Fase 1: Crear Endpoints Faltantes (Prioridad Alta)
1. Crear endpoints CRUD para actividades
2. Crear endpoints CRUD para misiones
3. Crear endpoint de leaderboard
4. Crear endpoint de badges del usuario

### Fase 2: Refactorizar Frontend
1. Modificar `gamificationApi.ts` para que todas las funciones llamen a endpoints
2. Eliminar todas las importaciones de `createClient` del frontend
3. Actualizar componentes que usan estas funciones

### Fase 3: Mover Lógica de Badges al Backend
1. Mover `achievement-validator.ts` a `/app/api/gamification/lib/`
2. Mover `badge-assignment.ts` a `/app/api/gamification/lib/`
3. Integrar en el endpoint de completar actividad

### Fase 4: Testing y Limpieza
1. Probar todos los endpoints
2. Eliminar código muerto del frontend
3. Verificar que no queden consultas directas a Supabase en `/src`

## Beneficios de la Refactorización

✅ **Seguridad:** El frontend no tiene acceso directo a la base de datos
✅ **Escalabilidad:** Más fácil cambiar el backend sin afectar el frontend
✅ **Mantenibilidad:** Lógica de negocio centralizada en el backend
✅ **Testing:** Más fácil probar endpoints API
✅ **Performance:** Posibilidad de cachear respuestas en el backend
✅ **Consistencia:** Todos los accesos a datos pasan por la misma capa

## Prioridad Inmediata

Para resolver el problema actual de las misiones que no se marcan como completadas:

1. ✅ Ya corregimos `/api/gamification/progress/activities/complete`
2. ✅ Ya corregimos `/api/gamification/progress/missions`
3. 🔨 Necesitamos verificar que `getMissionsWithProgress()` use el endpoint correcto

## Nota Importante

La función `getMissionsWithProgress()` en `gamificationApi.ts` YA está llamando al endpoint `/api/gamification/progress/missions`, pero TAMBIÉN hace consultas directas para obtener actividades. Necesitamos limpiar eso.
