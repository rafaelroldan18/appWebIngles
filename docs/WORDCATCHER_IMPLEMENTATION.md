# WordCatcher - Implementación Completa (Pasos 4-6)

Este documento resume la implementación completa de la mecánica de juego de WordCatcher, incluyendo carga de datos, assets, y sistema de juego.

## 📊 Paso 4: GameLoader - Dataset Final

### Archivo: `src/lib/games/gameLoader.utils.ts`

**Funcionalidad:**
- Construcción de dataset mezclando ítems correctos y distractores
- Validación de contenido disponible
- Shuffle (barajado) aleatorio
- Manejo de casos edge (sin distractores, contenido insuficiente)

**Funciones Principales:**

```typescript
buildGameDataset(content: GameContent[], missionConfig: MissionConfig): GameDataset
```
- Separa ítems correctos y distractores
- Calcula cantidades según `distractors_percent`
- Rellena con correctos si faltan distractores
- Baraja el resultado final

```typescript
validateGameContent(content: GameContent[], missionConfig: MissionConfig)
```
- Verifica que haya contenido disponible
- Valida que haya al menos un ítem correcto
- Confirma cantidad mínima de ítems

**Ejemplo de Uso:**

```typescript
const dataset = buildGameDataset(gameContent, {
    difficulty: 'medio',
    time_limit_seconds: 60,
    content_constraints: {
        items: 12,
        distractors_percent: 30
    },
    // ...
});

// Resultado:
// dataset.items = 12 ítems mezclados
// dataset.correctCount = 9 (70%)
// dataset.distractorCount = 3 (30%)
```

### Reglas de Construcción

1. **Cálculo de cantidades:**
   ```
   targetDistractorCount = floor(items * (distractors_percent / 100))
   targetCorrectCount = items - targetDistractorCount
   ```

2. **Si no hay suficientes distractores:**
   - Usa todos los distractores disponibles
   - Rellena con ítems correctos adicionales

3. **Si no hay distractores:**
   - Usa solo ítems correctos
   - Log warning en consola

4. **Shuffle final:**
   - Fisher-Yates algorithm
   - Garantiza distribución aleatoria

---

## 🎯 Paso 5: WordCatcherScene - Assets y UI

### Archivo: `src/lib/games/WordCatcherScene.new.ts`

### 5.1 Preload - Carga de Assets

```typescript
preload() {
    const assetPack = this.missionConfig?.asset_pack || 'kenney-ui-1';
    preloadWordCatcherAssets(this, assetPack);
    this.load.image('spark', '/assets/common/ui/star.png');
}
```

**Assets Cargados:**

| Asset Key | Ruta | Uso |
|-----------|------|-----|
| `wc-bg` | `/assets/games/word-catcher/backgrounds/bg_1.png` | Fondo del juego |
| `wc-token` | `/assets/games/word-catcher/sprites/token.png` | Token correcto (verde) |
| `wc-token-bad` | `/assets/games/word-catcher/sprites/token-bad.png` | Token incorrecto (rojo) |
| `wc-particle` | `/assets/games/word-catcher/sprites/particle.png` | Partículas de efectos |
| `ui-panel` | `/assets/games/common/ui/kenney-ui-1/panel.png` | Panel UI |
| `ui-button` | `/assets/games/common/ui/kenney-ui-1/button.png` | Botón normal |
| `ui-button-hover` | `/assets/games/common/ui/kenney-ui-1/button-hover.png` | Botón hover |
| `ui-icon-pause` | `/assets/games/common/ui/kenney-ui-1/icon-pause.png` | Icono pausa |
| `ui-icon-help` | `/assets/games/common/ui/kenney-ui-1/icon-help.png` | Icono ayuda |

### 5.2 Create - Construcción de UI

**Elementos del HUD:**

1. **Banner Superior** (70px altura)
   - Fondo semi-transparente (#0f172a, 95% opacidad)
   - Borde azul (#3b82f6)

2. **Score** (izquierda)
   - Icono: ⭐
   - Texto: "SCORE: 0"
   - Color: `config.scoreColor`

3. **Timer** (centro)
   - Icono: ⏱️
   - Texto: Segundos restantes
   - Color: `config.timerColor`
   - Cambia a rojo cuando ≤ 10 segundos

4. **Caught Counter** (derecha)
   - Icono: 🎯
   - Texto: "CAUGHT: 0"
   - Color: `config.correctCountColor`

5. **Botón Pausa** (esquina superior derecha)
   - Sprite: `ui-icon-pause`
   - Hover effect: escala 1.1x

6. **Botón Ayuda** (si `hud_help_enabled=true`)
   - Sprite: `ui-icon-help`
   - Muestra `mission_instructions` en panel

7. **Mission Title** (debajo del banner)
   - Texto: Título de la misión
   - Formato: "🎮 [TÍTULO] 🎮"

### 5.3 Sistema de Pausa

**Overlay de Pausa:**
- Fondo oscuro semi-transparente (bloquea interacción)
- Panel Kenney UI
- Título "PAUSED"
- Botón "RESUME"

**Funcionalidad:**
- Pausa todos los timers
- Pausa todas las animaciones (tweens)
- Tecla 'P' para pausar/reanudar
- Click en botón de pausa

### 5.4 Panel de Ayuda

**Trigger:**
- Click en botón "?" (si habilitado)

**Contenido:**
- Título: "MISSION INSTRUCTIONS"
- Texto: `missionInstructions` de la misión
- Botón: "GOT IT"

**Comportamiento:**
- Pausa el juego automáticamente
- Reanuda al cerrar (si no estaba pausado antes)

---

## 🎮 Paso 6: Mecánica de Juego

### 6.1 Spawner - Generación de Palabras

**Configuración:**

```typescript
const spawnRate = missionConfig?.word_catcher?.spawn_rate_ms 
    ?? WORD_CATCHER_CONFIG.defaults.spawn_rate_ms; // 900ms

this.spawnTimer = this.time.addEvent({
    delay: spawnRate,
    callback: this.spawnWord,
    loop: true
});
```

**Proceso de Spawn:**

1. Obtener siguiente ítem del dataset (circular)
2. Posición X aleatoria (100 a width-100)
3. Crear container en Y = -70 (fuera de pantalla)
4. Agregar sprite (token correcto o incorrecto)
5. Agregar texto de la palabra
6. Configurar interactividad
7. Iniciar animación de caída

**Velocidad de Caída:**

```typescript
const fallSpeed = missionConfig?.word_catcher?.fall_speed 
    ?? WORD_CATCHER_CONFIG.defaults.fall_speed; // 220 px/s

const fallDuration = (height + 100) / (fallSpeed / 1000);
```

### 6.2 Click - Manejo de Interacción

**Handler Principal:**

```typescript
private onWordClicked(pointer, gameObject) {
    const sprite = gameObject as WordSprite;
    if (sprite.isClicked) return; // Evitar doble click
    
    sprite.isClicked = true;
    const position = { x: container.x, y: container.y };
    
    if (sprite.wordData.is_correct) {
        this.handleCorrectCatch(sprite, position);
    } else {
        this.handleWrongCatch(sprite, position);
    }
}
```

**Captura Correcta:**

1. Sumar puntos: `+10` (configurable)
2. Registrar en AnswerTracker:
   ```typescript
   answerTracker.recordCatch(
       item_id,
       text,
       true, // is_correct
       position
   );
   ```
3. Registrar en SessionManager
4. Efectos visuales:
   - Partículas verdes
   - Texto flotante "+10"
   - Animación de desaparición (escala + fade)
5. Actualizar UI

**Captura Incorrecta:**

1. Restar puntos: `-5` (configurable)
2. Registrar en AnswerTracker:
   ```typescript
   answerTracker.recordCatch(
       item_id,
       text,
       false, // is_correct
       position
   );
   ```
3. Registrar en SessionManager
4. Efectos visuales:
   - Shake de cámara
   - Partículas rojas
   - Texto flotante "-5"
   - Animación de rechazo (shake + fade)
5. Actualizar UI

### 6.3 Missed Words - Palabras Perdidas

**Trigger:**
- Palabra sale de pantalla (Y > height + 100)
- No fue clickeada (`!sprite.isClicked`)

**Lógica:**

```typescript
private onWordMissed(sprite: WordSprite) {
    if (sprite.isClicked) return;
    
    if (sprite.wordData.is_correct) {
        // Palabra correcta perdida
        const penaltyEnabled = missionConfig?.word_catcher?.miss_penalty_enabled 
            ?? WORD_CATCHER_CONFIG.defaults.miss_penalty_enabled;
        
        if (penaltyEnabled) {
            const points = -2; // Penalización
            this.score += points;
            this.showFloatingText(x, y, 'MISSED!', '#ff0000');
        }
        
        // Registrar como missed
        answerTracker.recordMissedWord(item_id, text, position);
        
    } else {
        // Distractor evitado correctamente
        answerTracker.recordAvoidedDistractor(item_id, text, position);
    }
}
```

**Registro en AnswerTracker:**

Palabra correcta perdida:
```typescript
{
    item_id: "...",
    prompt: "word",
    student_answer: "missed",
    correct_answer: "catch",
    is_correct: false,
    meta: {
        timestamp: 1234567890,
        action_time_ms: 5000,
        missed: true,
        position: { x: 400, y: 650 }
    }
}
```

Distractor evitado:
```typescript
{
    item_id: "...",
    prompt: "word",
    student_answer: "avoided",
    correct_answer: "avoid",
    is_correct: true, // ¡Correcto evitar un distractor!
    meta: {
        timestamp: 1234567890,
        action_time_ms: 5000,
        missed: false,
        position: { x: 400, y: 650 }
    }
}
```

---

## 📝 Answer Tracker - Sistema de Registro

### Archivo: `src/lib/games/answerTracker.ts`

**Clase:** `AnswerTracker`

**Métodos Principales:**

```typescript
recordCatch(itemId, text, isCorrect, position)
recordMissedWord(itemId, text, position)
recordAvoidedDistractor(itemId, text, position)
getAnswers(): AnswerRecord[]
getStats(): { total, correct, wrong, missed, caught, accuracy }
getDuration(): number
```

**Estructura de AnswerRecord:**

```typescript
interface AnswerRecord {
    item_id?: string;
    prompt: string;
    student_answer: string;      // 'caught', 'missed', 'avoided'
    correct_answer: string;       // 'catch', 'avoid'
    is_correct: boolean;
    meta?: {
        timestamp?: number;
        action_time_ms?: number;  // Tiempo desde inicio del juego
        missed?: boolean;
        position?: { x: number; y: number };
    };
}
```

**Estadísticas Generadas:**

```typescript
{
    total: 15,           // Total de acciones
    correct: 10,         // Acciones correctas
    wrong: 5,            // Acciones incorrectas
    missed: 2,           // Palabras correctas perdidas
    caught: 13,          // Palabras atrapadas
    accuracy: 66.67      // Porcentaje de acierto
}
```

---

## 🎯 Configuración de Mission

### Ejemplo Completo:

```json
{
    "time_limit_seconds": 60,
    "difficulty": "medio",
    "content_constraints": {
        "items": 12,
        "distractors_percent": 30
    },
    "word_catcher": {
        "fall_speed": 220,
        "spawn_rate_ms": 900,
        "miss_penalty_enabled": true
    },
    "hud_help_enabled": true,
    "asset_pack": "kenney-ui-1"
}
```

### Valores por Defecto:

Si `word_catcher` no está presente:

```typescript
{
    fall_speed: 220,              // px/segundo
    spawn_rate_ms: 900,           // milisegundos
    miss_penalty_enabled: true    // penalizar palabras perdidas
}
```

---

## 🔄 Flujo Completo del Juego

1. **Inicialización** (`init()`)
   - Recibir datos de la misión
   - Construir dataset con `buildGameDataset()`
   - Inicializar `AnswerTracker`
   - Configurar tiempo límite

2. **Precarga** (`preload()`)
   - Cargar assets según `asset_pack`
   - Usar `preloadWordCatcherAssets()`

3. **Creación** (`create()`)
   - Renderizar fondo
   - Crear HUD estandarizado
   - Crear overlay de pausa
   - Configurar inputs

4. **Cuenta Regresiva** (`startCountdown()`)
   - Mostrar 3, 2, 1, GO!
   - Animaciones visuales

5. **Gameplay** (`startGameplay()`)
   - Iniciar timer de juego (1 segundo)
   - Iniciar spawner (según `spawn_rate_ms`)
   - Spawn inicial

6. **Loop de Juego**
   - Spawn de palabras cada `spawn_rate_ms`
   - Caída a velocidad `fall_speed`
   - Detección de clicks
   - Registro de acciones
   - Actualización de UI

7. **Fin de Juego** (`endGame()`)
   - Detener timers
   - Destruir palabras activas
   - Mostrar panel de resultados
   - Emitir evento `gameOver` con:
     - Score final
     - Estadísticas
     - Respuestas detalladas

---

## 📊 Datos de Salida

### Evento `gameOver`:

```typescript
{
    scoreRaw: 85,
    correctCount: 10,
    wrongCount: 5,
    durationSeconds: 60,
    answers: [
        {
            item_id: "abc123",
            prompt: "apple",
            student_answer: "caught",
            correct_answer: "catch",
            is_correct: true,
            meta: {
                timestamp: 1234567890,
                action_time_ms: 5000,
                missed: false,
                position: { x: 400, y: 300 }
            }
        },
        // ... más respuestas
    ]
}
```

Estos datos se usan para:
- Calcular score final
- Generar reporte pedagógico
- Actualizar progreso del estudiante
- Mostrar página de resultados detallada

---

## ✅ Checklist de Implementación

- [x] GameLoader con dataset balanceado
- [x] Validación de contenido
- [x] Shuffle aleatorio
- [x] Precarga de assets centralizada
- [x] HUD estandarizado
- [x] Timer con `time_limit_seconds`
- [x] Spawner con `spawn_rate_ms`
- [x] Caída con `fall_speed`
- [x] Click handler con registro
- [x] Missed words con penalización configurable
- [x] AnswerTracker completo
- [x] Botón de pausa funcional
- [x] Panel de ayuda (si habilitado)
- [x] Efectos visuales (partículas, animaciones)
- [x] Evento gameOver con datos completos

---

## 🚀 Próximos Pasos

1. Reemplazar `WordCatcherScene.ts` con `WordCatcherScene.new.ts`
2. Probar con diferentes configuraciones de misión
3. Validar registro de respuestas
4. Implementar página de resultados detallada
5. Agregar más asset packs (kenney-red, modern-neon, etc.)
