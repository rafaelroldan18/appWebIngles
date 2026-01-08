# ✅ PASO 2 COMPLETADO - Contrato de mission_config

## 📋 Resumen de Implementación

Se ha definido e implementado el **contrato estándar de `mission_config`** que será usado por todos los juegos del sistema.

---

## 🎯 Archivos Creados/Modificados

### 1. **Tipos TypeScript** - `src/types/game.types.ts`
✅ **Agregado**: `MissionConfig` interface  
✅ **Agregado**: `GameSessionDetails` interface  
✅ **Actualizado**: `GameAvailability` con campos `mission_title`, `mission_instructions`, `mission_config`  
✅ **Actualizado**: `GameSession.details` ahora usa `GameSessionDetails` en lugar de `any`

### 2. **Helpers y Utilidades** - `src/lib/missionConfigHelpers.ts`
✅ Valores por defecto para `mission_config`  
✅ Función `getMissionConfig()` - merge con defaults  
✅ Helpers para extraer valores específicos (`getItemsCount`, `getTimeLimit`, etc.)  
✅ Función `buildSessionDetails()` - construir detalles de sesión  
✅ Función `generateReview()` - generar recomendaciones automáticas  
✅ Validadores para `MissionConfig` y `GameSessionDetails`

### 3. **Presets por Juego** - `src/lib/gamePresets.ts`
✅ Configuraciones predefinidas para cada juego (easy, medium, hard)  
✅ Helper `getPresetConfig()` para obtener config por juego y dificultad  
✅ Constantes con nombres y descripciones de juegos

### 4. **Documentación** - `docs/MISSION_CONFIG_CONTRACT.md`
✅ Especificación completa del contrato  
✅ Ejemplos de uso por cada juego  
✅ Reglas de implementación  
✅ Ejemplos de `game_sessions.details`

---

## 📊 Estructura del Contrato

### `MissionConfig` (almacenado en `game_availability.mission_config`)

```typescript
interface MissionConfig {
    time_limit_seconds?: number;
    content_constraints?: {
        items?: number;
        distractors_percent?: number;
    };
    asset_pack?: string;
    hud_help_enabled?: boolean;
    [key: string]: any; // Extensible
}
```

### `GameSessionDetails` (almacenado en `game_sessions.details`)

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

---

## 🔧 Ejemplo de Uso

### En el Backend (API)

```typescript
import { getMissionConfig, getItemsCount } from '@/lib/missionConfigHelpers';

// Obtener configuración con defaults
const config = getMissionConfig(gameAvailability.mission_config);

// Cargar ítems según configuración
const itemsToLoad = getItemsCount(config);
const { data: gameContent } = await supabase
    .from('game_content')
    .select('*')
    .eq('topic_id', topicId)
    .limit(itemsToLoad);
```

### En Phaser (Frontend)

```typescript
import { getTimeLimit, getAssetPack } from '@/lib/missionConfigHelpers';

class GameScene extends Phaser.Scene {
    init(data: { missionConfig: MissionConfig }) {
        this.timeLimit = getTimeLimit(data.missionConfig);
        this.assetPack = getAssetPack(data.missionConfig);
    }
}
```

### Guardar Sesión con Detalles

```typescript
import { buildSessionDetails } from '@/lib/missionConfigHelpers';

const itemsBreakdown = [
    {
        item_id: 'word-123',
        content_text: 'apple',
        is_correct: true,
        student_answer: 'apple',
        time_spent_seconds: 4,
        attempts: 1,
    },
    // ... más ítems
];

const sessionDetails = buildSessionDetails(
    itemsBreakdown,
    58, // tiempo total
    { falling_speed_avg: 2.5 } // datos específicos del juego
);

await supabase.from('game_sessions').insert({
    student_id,
    topic_id,
    game_type_id,
    score: sessionDetails.summary.accuracy_percent,
    correct_count: sessionDetails.summary.correct_items,
    wrong_count: sessionDetails.summary.wrong_items,
    duration_seconds: sessionDetails.summary.time_spent_seconds,
    details: sessionDetails,
    completed: true,
});
```

---

## 🎮 Configuraciones Predefinidas

Cada juego tiene 3 niveles de dificultad:

### WordCatcher
- **Easy**: 90s, 10 items, 20% distractors, slow speed
- **Medium**: 60s, 15 items, 30% distractors, medium speed
- **Hard**: 45s, 20 items, 40% distractors, fast speed

### GrammarRun
- **Easy**: 120s, 12 items, 25% distractors, no obstacles
- **Medium**: 90s, 18 items, 35% distractors, with obstacles
- **Hard**: 60s, 25 items, 45% distractors, with obstacles

### ImageMatch
- **Easy**: 180s, 8 items, 20% distractors, 3x3 grid, hints
- **Medium**: 120s, 12 items, 30% distractors, 4x4 grid
- **Hard**: 90s, 16 items, 40% distractors, 5x5 grid

### SentenceBuilder
- **Easy**: 240s, 6 items, 20% distractors, word hints
- **Medium**: 180s, 10 items, 30% distractors
- **Hard**: 120s, 15 items, 40% distractors

### CityExplorer
- **Easy**: 360s, 8 items, minimap + hints
- **Medium**: 300s, 12 items, minimap only
- **Hard**: 240s, 16 items, no minimap

---

## ✅ Beneficios Implementados

1. **Type Safety**: TypeScript completo con interfaces bien definidas
2. **Flexibilidad**: Configuración dinámica por misión sin cambiar código
3. **Consistencia**: Contrato estándar para todos los juegos
4. **Extensibilidad**: Fácil agregar campos personalizados
5. **Defaults Inteligentes**: Valores por defecto para todos los campos
6. **Validación**: Funciones de validación para evitar datos inválidos
7. **Análisis**: Estructura estandarizada para reportes detallados
8. **Recomendaciones Automáticas**: Generación de feedback basado en desempeño

---

## 📝 Próximos Pasos

- ⏳ **Paso 3**: Ejecutar migración SQL en Supabase
- ⏳ **Paso 4**: Crear componente de Briefing (pantalla de inicio)
- ⏳ **Paso 5**: Adaptar juegos Phaser para usar `mission_config`
- ⏳ **Paso 6**: Crear pantalla de resultados con revisión detallada
- ⏳ **Paso 7**: Actualizar APIs para manejar nuevos campos
- ⏳ **Paso 8**: Actualizar componente de creación de misiones (docente)

---

## 🚀 Estado Actual

**PASO 2: ✅ COMPLETADO**

El contrato está definido, documentado y listo para ser usado. Los tipos TypeScript garantizan consistencia en toda la aplicación.
