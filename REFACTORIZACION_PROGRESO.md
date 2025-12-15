# Refactorización de gamificationApi.ts - Progreso

## ✅ Endpoints API Creados

### Actividades
- `GET /api/gamification/activities` - Listar actividades (con filtro por mission_id)
- `POST /api/gamification/activities` - Crear actividad
- `GET /api/gamification/activities/[id]` - Obtener actividad por ID
- `PUT /api/gamification/activities/[id]` - Actualizar actividad
- `DELETE /api/gamification/activities/[id]` - Eliminar actividad

### Misiones
- `GET /api/gamification/missions` - Listar misiones
- `POST /api/gamification/missions` - Crear misión
- `GET /api/gamification/missions/[id]` - Obtener misión por ID
- `PUT /api/gamification/missions/[id]` - Actualizar misión
- `DELETE /api/gamification/missions/[id]` - Eliminar misión

### Otros
- `GET /api/gamification/leaderboard` - Tabla de clasificación
- `GET /api/gamification/achievements/user` - Badges del usuario actual

## 🔨 Siguiente Paso

El archivo `gamificationApi.ts` es muy grande (838 líneas). En lugar de refactorizarlo todo de una vez, voy a crear un NUEVO archivo que use solo endpoints API y luego migrar componente por componente.

## Estrategia Recomendada

1. **Crear nuevo archivo:** `src/lib/gamification/gamificationApiRest.ts`
2. **Implementar funciones que usen endpoints API**
3. **Migrar componentes uno por uno** para usar el nuevo archivo
4. **Eliminar el archivo antiguo** cuando todos los componentes estén migrados

Esto es más seguro y permite probar gradualmente.

## Funciones Prioritarias a Migrar

1. ✅ `getMissionsWithProgress()` - Ya usa endpoint
2. ✅ `getActivityById()` - Nuevo endpoint creado
3. ✅ `getActivitiesByMission()` - Nuevo endpoint creado
4. ✅ `getMissionById()` - Nuevo endpoint creado
5. ✅ `getActiveMissions()` - Nuevo endpoint creado
6. 🔨 `getUserBadges()` - Nuevo endpoint creado
7. 🔨 `getLeaderboard()` - Nuevo endpoint creado
8. 🔨 `createMission()` - Nuevo endpoint creado
9. 🔨 `updateMission()` - Nuevo endpoint creado
10. 🔨 `deleteMission()` - Nuevo endpoint creado
11. 🔨 `createActivity()` - Nuevo endpoint creado
12. 🔨 `updateActivity()` - Nuevo endpoint creado
13. 🔨 `deleteActivity()` - Nuevo endpoint creado
