# ✅ PASO 3 COMPLETADO - Backend APIs Actualizadas

## 📋 Resumen de Implementación

Se han actualizado los endpoints del backend para manejar los nuevos campos de misión: `mission_title`, `mission_instructions` y `mission_config`.

---

## 🎯 Endpoints Actualizados

### 3.1. **POST `/api/games/availability`** - Crear Misión

#### Validaciones Implementadas:

✅ **`mission_title`**
- Requerido o autogenerado
- Si no se proporciona, se genera automáticamente: `"{GameType} - {Topic}"`
- Ejemplo: `"Word Catcher - Present Simple"`

✅ **`mission_instructions`**
- **Requerido**
- Mínimo 10 caracteres
- Error 400 si no cumple

✅ **`mission_config`**
- Debe ser JSON válido (objeto)
- Si se envía como string, se parsea automáticamente
- No puede ser array
- Default: `{}`

#### Ejemplo de Request:

```json
POST /api/games/availability
{
  "game_type_id": "uuid-game-type",
  "topic_id": "uuid-topic",
  "parallel_id": "uuid-parallel",
  "available_from": "2026-01-08T00:00:00Z",
  "available_until": "2026-01-15T23:59:59Z",
  "max_attempts": 3,
  "show_theory": true,
  "is_active": true,
  
  "mission_title": "Atrapa las palabras del Present Simple",
  "mission_instructions": "Atrapa solo las palabras que estén en tiempo presente simple. Evita las palabras en otros tiempos verbales.",
  "mission_config": {
    "time_limit_seconds": 60,
    "content_constraints": {
      "items": 15,
      "distractors_percent": 30
    },
    "asset_pack": "kenney-ui-1",
    "hud_help_enabled": true
  }
}
```

#### Ejemplo de Response:

```json
{
  "availability_id": "uuid-availability",
  "game_type_id": "uuid-game-type",
  "topic_id": "uuid-topic",
  "parallel_id": "uuid-parallel",
  "available_from": "2026-01-08T00:00:00Z",
  "available_until": "2026-01-15T23:59:59Z",
  "max_attempts": 3,
  "show_theory": true,
  "is_active": true,
  "activated_at": "2026-01-07T20:30:00Z",
  "created_at": "2026-01-07T20:30:00Z",
  
  "mission_title": "Atrapa las palabras del Present Simple",
  "mission_instructions": "Atrapa solo las palabras que estén en tiempo presente simple...",
  "mission_config": {
    "time_limit_seconds": 60,
    "content_constraints": {
      "items": 15,
      "distractors_percent": 30
    },
    "asset_pack": "kenney-ui-1",
    "hud_help_enabled": true
  }
}
```

---

### 3.2. **PUT `/api/games/availability/[availabilityId]`** - Editar Misión

#### Validaciones Implementadas:

✅ **`mission_title`** (opcional en update)
- Si se proporciona, no puede estar vacío
- Error 400 si está vacío

✅ **`mission_instructions`** (opcional en update)
- Si se proporciona, mínimo 10 caracteres
- Error 400 si no cumple

✅ **`mission_config`** (opcional en update)
- Si se proporciona, debe ser JSON válido
- Si se envía como string, se parsea automáticamente
- No puede ser array

#### Ejemplo de Request:

```json
PUT /api/games/availability/{availabilityId}
{
  "mission_title": "Nuevo título de la misión",
  "mission_instructions": "Nuevas instrucciones más detalladas para los estudiantes.",
  "mission_config": {
    "time_limit_seconds": 90,
    "content_constraints": {
      "items": 20,
      "distractors_percent": 40
    }
  }
}
```

**Nota**: Solo se actualizan los campos proporcionados. Los campos omitidos mantienen su valor actual.

---

### 3.3. **GET `/api/games/availability?parallelId=X&activeOnly=true`** - Listar Misiones

#### Cambios Implementados:

✅ **Incluye automáticamente**:
- `mission_title`
- `mission_instructions`
- `mission_config`
- Joins con `game_types` (name, description)
- Joins con `topics` (title, description)

#### Ejemplo de Response:

```json
[
  {
    "availability_id": "uuid-1",
    "game_type_id": "uuid-game",
    "topic_id": "uuid-topic",
    "parallel_id": "uuid-parallel",
    "available_from": "2026-01-08T00:00:00Z",
    "available_until": "2026-01-15T23:59:59Z",
    "max_attempts": 3,
    "show_theory": true,
    "is_active": true,
    "activated_at": "2026-01-07T20:00:00Z",
    "created_at": "2026-01-07T19:00:00Z",
    
    "mission_title": "Atrapa las palabras del Present Simple",
    "mission_instructions": "Atrapa solo las palabras que estén en tiempo presente simple...",
    "mission_config": {
      "time_limit_seconds": 60,
      "content_constraints": {
        "items": 15,
        "distractors_percent": 30
      },
      "asset_pack": "kenney-ui-1",
      "hud_help_enabled": true
    },
    
    "game_types": {
      "name": "Word Catcher",
      "description": "Atrapa palabras mientras caen"
    },
    "topics": {
      "title": "Present Simple",
      "description": "Tiempo presente simple en inglés"
    }
  }
]
```

---

### 3.4. **GET `/api/missions/validate`** - Validar Misión

#### Cambios Implementados:

✅ **Devuelve `availability` completo** con:
- Todos los campos de `game_availability`
- `mission_title`, `mission_instructions`, `mission_config`
- Join con `game_types` (game_type_id, name, description)
- Join con `topics` (topic_id, title, description)

✅ **Evita consultas adicionales** en el frontend

#### Query Parameters:

- `studentId` (requerido)
- `topicId` (requerido)
- `gameTypeId` (requerido)
- `parallelId` (requerido)

#### Ejemplo de Request:

```
GET /api/missions/validate?studentId=uuid-student&topicId=uuid-topic&gameTypeId=uuid-game&parallelId=uuid-parallel
```

#### Ejemplo de Response (Puede jugar):

```json
{
  "isValid": true,
  "canPlay": true,
  "attemptsRemaining": 2,
  "attemptsUsed": 1,
  "maxAttempts": 3,
  "message": "Tienes 2 intentos restantes",
  
  "availabilityData": {
    "availability_id": "uuid-availability",
    "game_type_id": "uuid-game",
    "topic_id": "uuid-topic",
    "parallel_id": "uuid-parallel",
    "available_from": "2026-01-08T00:00:00Z",
    "available_until": "2026-01-15T23:59:59Z",
    "max_attempts": 3,
    "show_theory": true,
    "is_active": true,
    "activated_at": "2026-01-07T20:00:00Z",
    "created_at": "2026-01-07T19:00:00Z",
    
    "mission_title": "Atrapa las palabras del Present Simple",
    "mission_instructions": "Atrapa solo las palabras que estén en tiempo presente simple. Evita las palabras en otros tiempos verbales.",
    "mission_config": {
      "time_limit_seconds": 60,
      "content_constraints": {
        "items": 15,
        "distractors_percent": 30
      },
      "asset_pack": "kenney-ui-1",
      "hud_help_enabled": true
    },
    
    "game_types": {
      "game_type_id": "uuid-game",
      "name": "Word Catcher",
      "description": "Atrapa palabras mientras caen"
    },
    "topics": {
      "topic_id": "uuid-topic",
      "title": "Present Simple",
      "description": "Tiempo presente simple en inglés"
    }
  }
}
```

#### Ejemplo de Response (No puede jugar - Sin intentos):

```json
{
  "isValid": true,
  "canPlay": false,
  "reason": "Has agotado todos tus intentos para esta misión",
  "attemptsRemaining": 0,
  "availabilityData": { /* ... datos completos ... */ }
}
```

#### Ejemplo de Response (No puede jugar - Fuera de fecha):

```json
{
  "isValid": true,
  "canPlay": false,
  "reason": "Esta misión estará disponible desde 08/01/2026",
  "availabilityData": { /* ... datos completos ... */ }
}
```

---

## 🔧 Uso en el Frontend

### Componente StudentGames

```typescript
// Obtener misiones disponibles
const response = await fetch(`/api/games/availability?parallelId=${parallelId}&activeOnly=true`);
const missions = await response.json();

// Ahora missions incluye mission_title, mission_instructions, mission_config
missions.forEach(mission => {
  console.log(mission.mission_title); // "Atrapa las palabras del Present Simple"
  console.log(mission.mission_config); // { time_limit_seconds: 60, ... }
});
```

### Componente GamePlay (Briefing)

```typescript
// Validar antes de jugar
const response = await fetch(
  `/api/missions/validate?studentId=${studentId}&topicId=${topicId}&gameTypeId=${gameTypeId}&parallelId=${parallelId}`
);
const validation = await response.json();

if (validation.canPlay) {
  // Mostrar briefing con:
  const { mission_title, mission_instructions, mission_config } = validation.availabilityData;
  
  // Renderizar pantalla de briefing
  showBriefing({
    title: mission_title,
    instructions: mission_instructions,
    timeLimit: mission_config.time_limit_seconds,
    attemptsRemaining: validation.attemptsRemaining
  });
} else {
  // Mostrar razón por la que no puede jugar
  showError(validation.reason);
}
```

---

## ✅ Validaciones Implementadas

### Validaciones en POST (Crear):
1. ✅ `mission_title` requerido o autogenerado
2. ✅ `mission_instructions` requerido (min 10 caracteres)
3. ✅ `mission_config` debe ser JSON válido (objeto)
4. ✅ Parsing automático si se envía como string
5. ✅ Error 400 con mensaje descriptivo si falla validación

### Validaciones en PUT (Actualizar):
1. ✅ `mission_title` no puede estar vacío si se proporciona
2. ✅ `mission_instructions` min 10 caracteres si se proporciona
3. ✅ `mission_config` debe ser JSON válido si se proporciona
4. ✅ Parsing automático si se envía como string
5. ✅ Solo actualiza campos proporcionados

### Validaciones en GET:
1. ✅ Incluye automáticamente todos los campos nuevos
2. ✅ Joins con game_types y topics
3. ✅ Filtrado por `parallelId` y `activeOnly`

---

## 📝 Archivos Modificados

1. ✅ `app/api/games/availability/route.ts` (POST)
2. ✅ `app/api/games/availability/[availabilityId]/route.ts` (PUT)
3. ✅ `app/api/missions/validate/route.ts` (GET)

---

## 🚀 Próximos Pasos

- ⏳ **Paso 4**: Ejecutar migración SQL en Supabase
- ⏳ **Paso 5**: Crear componente de Briefing (pantalla de inicio)
- ⏳ **Paso 6**: Adaptar juegos Phaser para usar `mission_config`
- ⏳ **Paso 7**: Crear pantalla de resultados con revisión detallada
- ⏳ **Paso 8**: Actualizar componente de creación de misiones (docente)

---

## 📊 Estado Actual

**PASO 3: ✅ COMPLETADO**

Los endpoints del backend están listos para manejar los nuevos campos de misión con validaciones robustas.
