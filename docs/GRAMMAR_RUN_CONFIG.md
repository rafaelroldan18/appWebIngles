# GrammarRun - Mission Config Reference

## 📋 Paso 1 Completado: mission_config Final

El `mission_config` de **GrammarRun** sigue el mismo patrón "paso a paso cerrado" que ImageMatch. Todo el comportamiento del juego está controlado por este JSON en `game_availability.mission_config`.

---

## 🎯 Ejemplo Recomendado (Dificultad "medio")

```json
{
  "time_limit_seconds": 90,
  "difficulty": "medio",
  "lives": 3,
  "scoring": {
    "points_correct": 10,
    "points_wrong": -5,
    "streak_bonus": true
  },
  "pacing": {
    "speed_base": 1.0,
    "speed_increment": 0.08,
    "spawn_rate": 1.2
  },
  "ui": {
    "show_timer": true,
    "show_lives": true,
    "show_streak": true,
    "show_progress": true,
    "show_hint_button": false
  },
  "grammar_run": {
    "mode": "choose_correct",
    "items_limit": 12,
    "randomize_items": true,
    "obstacle_penalty_life": 1,
    "wrong_penalty_life": 0
  }
}
```

---

## 🔧 Estructura Completa del mission_config

### 1. **Configuración General**

| Campo | Tipo | Default | Límites | Descripción |
|-------|------|---------|---------|-------------|
| `time_limit_seconds` | number | 90 | 30-600 | Tiempo total del juego en segundos |
| `difficulty` | string | "medio" | "fácil", "medio", "difícil" | Preset de dificultad |
| `lives` | number | 3 | 1-10 | Vidas iniciales del jugador |
| `hud_help_enabled` | boolean | true | - | Mostrar botón de ayuda |

### 2. **scoring** (Puntuación)

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `points_correct` | number | 10 | Puntos por pasar por la puerta correcta |
| `points_wrong` | number | -5 | Penalización por puerta incorrecta |
| `streak_bonus` | boolean | true | Activar bonos por racha |

### 3. **pacing** (Ritmo del Juego)

| Campo | Tipo | Default | Límites | Descripción |
|-------|------|---------|---------|-------------|
| `speed_base` | number | 1.0 | 0.5-2.0 | Velocidad base del corredor (multiplicador) |
| `speed_increment` | number | 0.08 | 0.0-0.2 | Incremento de velocidad cada 10 segundos |
| `spawn_rate` | number | 1.2 | 0.5-3.0 | Frecuencia de aparición de puertas (segundos) |

### 4. **ui** (Interfaz de Usuario)

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `show_timer` | boolean | true | Mostrar temporizador |
| `show_lives` | boolean | true | Mostrar vidas restantes |
| `show_streak` | boolean | true | Mostrar racha actual |
| `show_progress` | boolean | true | Mostrar progreso (preguntas respondidas) |
| `show_hint_button` | boolean | false | Mostrar botón de pista |

### 5. **grammar_run** (Específico del Juego)

| Campo | Tipo | Default | Límites | Descripción |
|-------|------|---------|---------|-------------|
| `mode` | string | "choose_correct" | "choose_correct", "avoid_wrong" | Modo de juego |
| `items_limit` | number | 12 | 5-50 | Número máximo de preguntas |
| `randomize_items` | boolean | true | - | Aleatorizar orden de preguntas |
| `obstacle_penalty_life` | number | 1 | 0-3 | Vidas perdidas por chocar con obstáculo |
| `wrong_penalty_life` | number | 0 | 0-2 | Vidas perdidas por puerta incorrecta |

---

## 🎮 Presets por Dificultad

### **Fácil**
```json
{
  "difficulty": "fácil",
  "time_limit_seconds": 120,
  "lives": 5,
  "scoring": {
    "points_correct": 10,
    "points_wrong": -3
  },
  "pacing": {
    "speed_base": 0.8,
    "speed_increment": 0.05,
    "spawn_rate": 1.5
  },
  "grammar_run": {
    "items_limit": 8,
    "obstacle_penalty_life": 0,
    "wrong_penalty_life": 0
  }
}
```

### **Medio** (Recomendado)
```json
{
  "difficulty": "medio",
  "time_limit_seconds": 90,
  "lives": 3,
  "scoring": {
    "points_correct": 10,
    "points_wrong": -5
  },
  "pacing": {
    "speed_base": 1.0,
    "speed_increment": 0.08,
    "spawn_rate": 1.2
  },
  "grammar_run": {
    "items_limit": 12,
    "obstacle_penalty_life": 1,
    "wrong_penalty_life": 0
  }
}
```

### **Difícil**
```json
{
  "difficulty": "difícil",
  "time_limit_seconds": 60,
  "lives": 2,
  "scoring": {
    "points_correct": 15,
    "points_wrong": -8
  },
  "pacing": {
    "speed_base": 1.2,
    "speed_increment": 0.12,
    "spawn_rate": 1.0
  },
  "grammar_run": {
    "items_limit": 15,
    "obstacle_penalty_life": 1,
    "wrong_penalty_life": 1
  }
}
```

---

## 📌 Reglas Claras

### **items_limit**
- Controla cuántas preguntas se jugarán (además del tiempo)
- Si el jugador completa `items_limit` preguntas antes del tiempo, el juego termina
- Rango: 5-50 preguntas

### **wrong_penalty_life**
- Si es `0`: Equivocarse solo resta puntos, no vidas
- Si es `1`: Equivocarse resta 1 vida
- Si es `2`: Equivocarse resta 2 vidas (muy difícil)

### **obstacle_penalty_life**
- Si es `0`: Los obstáculos no quitan vidas (solo ralentizan)
- Si es `1`: Chocar con obstáculo resta 1 vida
- Si es `2` o `3`: Muy punitivo

### **pacing** (Sensación de "Correr")
- `speed_base`: Velocidad inicial (1.0 = normal, 0.8 = lento, 1.2 = rápido)
- `speed_increment`: Cuánto aumenta la velocidad cada 10 segundos
- `spawn_rate`: Cada cuántos segundos aparece una nueva puerta (menor = más frecuente)

### **mode**
- `"choose_correct"`: El jugador debe pasar por la puerta correcta
- `"avoid_wrong"`: El jugador debe evitar las puertas incorrectas (futuro)

---

## 🔍 Validación Automática

El sistema valida automáticamente todos los valores y aplica **clamps** (límites):

```typescript
// Ejemplo: Si el docente pone time_limit_seconds = 1000
// El sistema lo ajustará automáticamente a 600 (máximo permitido)

// Si pone speed_base = 5.0
// El sistema lo ajustará a 2.0 (máximo permitido)
```

**Warnings en consola:**
```
[GrammarRun] speed_base clamped from 5 to 2
[GrammarRun] items_limit clamped from 100 to 50
```

---

## 🎯 Uso en la Base de Datos

### Tabla: `game_availability`

```sql
INSERT INTO game_availability (
  game_type,
  mission_config,
  -- ... otros campos
) VALUES (
  'grammar-run',
  '{
    "time_limit_seconds": 90,
    "difficulty": "medio",
    "lives": 3,
    "scoring": {
      "points_correct": 10,
      "points_wrong": -5,
      "streak_bonus": true
    },
    "pacing": {
      "speed_base": 1.0,
      "speed_increment": 0.08,
      "spawn_rate": 1.2
    },
    "ui": {
      "show_timer": true,
      "show_lives": true,
      "show_streak": true,
      "show_progress": true,
      "show_hint_button": false
    },
    "grammar_run": {
      "mode": "choose_correct",
      "items_limit": 12,
      "randomize_items": true,
      "obstacle_penalty_life": 1,
      "wrong_penalty_life": 0
    }
  }'::jsonb
);
```

---

## ✅ Próximos Pasos

- ✅ **Paso 1**: mission_config definido (COMPLETADO)
- ⏳ **Paso 2**: Actualizar GrammarRunScene para usar resolveGrammarRunConfig()
- ⏳ **Paso 3**: Implementar sistema de vidas y UI
- ⏳ **Paso 4**: Implementar sistema de pacing (velocidad progresiva)
- ⏳ **Paso 5**: Implementar límite de items y progreso
- ⏳ **Paso 6**: Testing completo

---

## 🔗 Archivos Relacionados

- **Config**: `src/lib/games/grammarRun.config.ts`
- **Scene**: `src/lib/games/GrammarRunScene.ts`
- **Types**: `src/types/game.types.ts`
