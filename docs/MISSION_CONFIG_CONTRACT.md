# Mission Config - Contrato Estándar

## Descripción General

El `mission_config` es un objeto JSONB almacenado en `game_availability` que define la configuración específica de cada misión. Este contrato es **estándar para todos los juegos**, pero cada juego usa solo los campos que necesita.

---

## Estructura del Contrato

```typescript
interface MissionConfig {
    time_limit_seconds?: number;
    content_constraints?: {
        items?: number;
        distractors_percent?: number;
    };
    asset_pack?: string;
    hud_help_enabled?: boolean;
    [key: string]: any; // Extensible para configuraciones específicas
}
```

---

## Campos Estándar

### `time_limit_seconds` (opcional)
- **Tipo**: `number`
- **Descripción**: Tiempo límite en segundos para completar la misión
- **Ejemplo**: `60` (1 minuto), `120` (2 minutos)
- **Usado por**: Todos los juegos que requieren límite de tiempo

### `content_constraints` (opcional)
Objeto que define restricciones sobre el contenido del juego.

#### `content_constraints.items`
- **Tipo**: `number`
- **Descripción**: Cantidad de ítems a cargar desde `game_content`
- **Ejemplo**: `12` (cargar 12 palabras/oraciones/imágenes)
- **Usado por**: Todos los juegos

#### `content_constraints.distractors_percent`
- **Tipo**: `number` (0-100)
- **Descripción**: Porcentaje de distractores (respuestas incorrectas)
- **Ejemplo**: `30` (30% de distractores, 70% correctos)
- **Usado por**: WordCatcher, ImageMatch, SentenceBuilder

### `asset_pack` (opcional)
- **Tipo**: `string`
- **Descripción**: Identificador del pack de assets visuales a usar
- **Ejemplo**: `"kenney-ui-1"`, `"pixel-art-pack"`, `"modern-ui"`
- **Usado por**: Todos los juegos (para personalización visual)

### `hud_help_enabled` (opcional)
- **Tipo**: `boolean`
- **Descripción**: Habilitar ayuda contextual en el HUD
- **Ejemplo**: `true` (mostrar ayuda), `false` (ocultar ayuda)
- **Usado por**: Todos los juegos

---

## Ejemplos por Juego

### WordCatcher
```json
{
  "time_limit_seconds": 60,
  "content_constraints": {
    "items": 15,
    "distractors_percent": 25
  },
  "asset_pack": "kenney-ui-1",
  "hud_help_enabled": true,
  "falling_speed": "medium"
}
```

### GrammarRun
```json
{
  "time_limit_seconds": 90,
  "content_constraints": {
    "items": 20,
    "distractors_percent": 40
  },
  "asset_pack": "pixel-art-pack",
  "hud_help_enabled": false,
  "obstacles_enabled": true,
  "difficulty": "hard"
}
```

### ImageMatch
```json
{
  "time_limit_seconds": 120,
  "content_constraints": {
    "items": 10,
    "distractors_percent": 20
  },
  "asset_pack": "modern-ui",
  "hud_help_enabled": true,
  "show_hints": true
}
```

### SentenceBuilder
```json
{
  "time_limit_seconds": 180,
  "content_constraints": {
    "items": 8,
    "distractors_percent": 30
  },
  "asset_pack": "kenney-ui-1",
  "hud_help_enabled": true,
  "shuffle_words": true
}
```

### CityExplorer
```json
{
  "time_limit_seconds": 300,
  "content_constraints": {
    "items": 12
  },
  "asset_pack": "city-pack-1",
  "hud_help_enabled": true,
  "map_style": "cartoon",
  "show_minimap": true
}
```

---

## Reglas de Uso

### ✅ Reglas Generales

1. **Todos los campos son opcionales**: Si un campo no está presente, el juego usa valores por defecto.

2. **Cada juego ignora lo que no usa**: Si un juego no usa `distractors_percent`, simplemente lo ignora.

3. **Extensibilidad**: Puedes agregar campos específicos del juego (ej: `falling_speed`, `obstacles_enabled`) sin romper el contrato.

4. **Valores por defecto**: Si `mission_config` es `{}` o `null`, el juego usa configuración por defecto.

### 🎯 Uso de `content_constraints.items`

Este campo define **cuántos ítems cargar desde `game_content`**:

```typescript
// En el backend (API)
const itemsToLoad = missionConfig.content_constraints?.items || 10;

const { data: gameContent } = await supabase
  .from('game_content')
  .select('*')
  .eq('topic_id', topicId)
  .limit(itemsToLoad);
```

### 🎨 Uso de `asset_pack`

Define qué pack visual usar en Phaser:

```typescript
// En Phaser
const assetPack = missionConfig.asset_pack || 'default';
this.load.setPath(`/assets/${assetPack}/`);
```

---

## Contrato de `game_sessions.details`

Además del `mission_config`, también estandarizamos el campo `details` en `game_sessions`:

```typescript
interface GameSessionDetails {
    summary: {
        total_items: number;
        correct_items: number;
        wrong_items: number;
        accuracy_percent: number;
        time_spent_seconds: number;
    };
    items_breakdown: Array<{
        item_id: string;
        content_text: string;
        is_correct: boolean;
        student_answer?: string | boolean;
        time_spent_seconds?: number;
        attempts?: number;
    }>;
    review?: {
        strengths?: string[];
        areas_to_improve?: string[];
        recommendations?: string[];
    };
    game_specific?: Record<string, any>;
}
```

### Ejemplo de `details` guardado:

```json
{
  "summary": {
    "total_items": 12,
    "correct_items": 9,
    "wrong_items": 3,
    "accuracy_percent": 75,
    "time_spent_seconds": 58
  },
  "items_breakdown": [
    {
      "item_id": "word-123",
      "content_text": "apple",
      "is_correct": true,
      "student_answer": "apple",
      "time_spent_seconds": 4,
      "attempts": 1
    },
    {
      "item_id": "word-124",
      "content_text": "banana",
      "is_correct": false,
      "student_answer": "bannana",
      "time_spent_seconds": 6,
      "attempts": 2
    }
  ],
  "review": {
    "strengths": ["Buena velocidad de respuesta", "Alta precisión en palabras cortas"],
    "areas_to_improve": ["Ortografía de palabras largas", "Atención a detalles"],
    "recommendations": ["Practicar palabras con doble consonante"]
  },
  "game_specific": {
    "falling_speed_avg": 2.5,
    "missed_words": 1
  }
}
```

---

## Migración SQL

Para agregar estos campos a la base de datos:

```sql
-- Agregar columnas a game_availability
ALTER TABLE public.game_availability
ADD COLUMN mission_title text,
ADD COLUMN mission_instructions text,
ADD COLUMN mission_config jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Valores por defecto para misiones existentes
UPDATE public.game_availability
SET mission_title = COALESCE(mission_title, 'Misión sin título'),
    mission_instructions = COALESCE(mission_instructions, 'Sigue las instrucciones del docente.'),
    mission_config = COALESCE(mission_config, '{}'::jsonb);

-- Índice para optimizar queries
CREATE INDEX IF NOT EXISTS idx_game_availability_active_parallel
ON public.game_availability (parallel_id, is_active, available_from, available_until);
```

---

## Beneficios

✅ **Flexibilidad**: Configuración dinámica por misión sin cambiar código  
✅ **Consistencia**: Contrato estándar para todos los juegos  
✅ **Escalabilidad**: Fácil agregar nuevos campos sin romper compatibilidad  
✅ **Análisis**: Datos estructurados en `details` permiten reportes detallados  
✅ **Simplicidad**: No requiere nuevas tablas, solo campos JSONB  

---

## Próximos Pasos

1. ✅ **Paso 1**: Migración SQL (completado)
2. ✅ **Paso 2**: Definir contrato TypeScript (completado)
3. ⏳ **Paso 3**: Crear componente de Briefing
4. ⏳ **Paso 4**: Adaptar juegos Phaser para usar `mission_config`
5. ⏳ **Paso 5**: Crear pantalla de resultados con `sessionId`
6. ⏳ **Paso 6**: Actualizar APIs para manejar nuevos campos
